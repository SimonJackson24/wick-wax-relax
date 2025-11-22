const { query, getClient } = require('../config/database');
const amazonService = require('./amazon');
const etsyService = require('./etsy');
const inventoryService = require('./inventory');
const orderService = require('./order');

class ChannelSyncService {
  constructor() {
    this.channels = {
      AMAZON: amazonService,
      ETSY: etsyService,
      PWA: null // PWA is our local system
    };
    this.syncHistory = [];
    this.isRunning = false;
  }

  /**
   * Get all products with their channel-specific data
   */
  async getProductsForSync() {
    try {
      const products = await query(`
        SELECT
          p.id,
          p.name,
          p.description,
          p.scent_profile,
          p.base_price,
          pv.id as variant_id,
          pv.sku,
          pv.name as variant_name,
          pv.price,
          pv.inventory_quantity,
          pv.attributes
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id
        WHERE pv.inventory_quantity > 0
        ORDER BY p.name, pv.name
      `);

      // Get channel-specific pricing and inventory
      for (const product of products.rows) {
        // Get Amazon pricing
        const amazonPricing = await query(`
          SELECT price FROM channel_pricing
          WHERE variant_id = ? AND channel_id = (SELECT id FROM channels WHERE name = 'AMAZON')
        `, [product.variant_id]);

        // Get Etsy pricing
        const etsyPricing = await query(`
          SELECT price FROM channel_pricing
          WHERE variant_id = ? AND channel_id = (SELECT id FROM channels WHERE name = 'ETSY')
        `, [product.variant_id]);

        product.channelPricing = {
          AMAZON: amazonPricing.rows[0]?.price || product.price,
          ETSY: etsyPricing.rows[0]?.price || product.price,
          PWA: product.price
        };

        // Get channel-specific inventory
        const channelInventory = await query(`
          SELECT
            c.name as channel_name,
            i.quantity,
            i.last_synced
          FROM inventory i
          JOIN channels c ON i.channel_id = c.id
          WHERE i.product_id = ?
        `, [product.variant_id]);

        product.channelInventory = {};
        channelInventory.rows.forEach(inv => {
          product.channelInventory[inv.channel_name] = {
            quantity: inv.quantity,
            lastSynced: inv.last_synced
          };
        });
      }

      return products.rows;
    } catch (error) {
      console.error('Error getting products for sync:', error);
      throw new Error('Failed to get products for synchronization');
    }
  }

  /**
   * Sync inventory across all channels
   */
  async syncInventory(options = {}) {
    if (this.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.isRunning = true;
    const syncId = `sync_${Date.now()}`;
    const startTime = new Date();

    try {
      console.log(`Starting inventory sync: ${syncId}`);

      const products = await this.getProductsForSync();
      const results = {
        syncId,
        startTime,
        channels: {},
        totalProducts: products.length,
        discrepancies: [],
        errors: []
      };

      // Sync each channel
      for (const [channelName, service] of Object.entries(this.channels)) {
        if (!service) continue; // Skip PWA (local system)

        try {
          console.log(`Syncing ${channelName} inventory...`);
          const channelResults = await this.syncChannelInventory(channelName, service, products);
          results.channels[channelName] = channelResults;

          // Log discrepancies
          if (channelResults.discrepancies.length > 0) {
            results.discrepancies.push(...channelResults.discrepancies.map(d => ({
              ...d,
              channel: channelName
            })));
          }
        } catch (error) {
          console.error(`Error syncing ${channelName}:`, error);
          results.errors.push({
            channel: channelName,
            error: error.message
          });
        }
      }

      // Update sync history
      results.endTime = new Date();
      results.duration = results.endTime - startTime;
      this.syncHistory.unshift(results);

      // Keep only last 100 sync records
      if (this.syncHistory.length > 100) {
        this.syncHistory = this.syncHistory.slice(0, 100);
      }

      console.log(`Inventory sync completed: ${syncId}`);
      return results;

    } catch (error) {
      console.error('Inventory sync failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync inventory for a specific channel
   */
  async syncChannelInventory(channelName, service, products) {
    const results = {
      synced: 0,
      skipped: 0,
      errors: 0,
      discrepancies: []
    };

    try {
      // Get channel inventory from external service
      let externalInventory = [];

      if (channelName === 'AMAZON') {
        const amazonInventory = await service.getInventory();
        externalInventory = amazonInventory.map(item => ({
          sku: item.sellerSku,
          quantity: item.inventoryDetails?.fulfillableQuantity?.value || 0,
          externalId: item.sellerSku
        }));
      } else if (channelName === 'ETSY') {
        const etsyListings = await service.getListings(100, 0);
        externalInventory = etsyListings.map(listing => ({
          sku: listing.sku,
          quantity: listing.inventory?.products?.[0]?.offerings?.[0]?.quantity || 0,
          externalId: listing.listing_id
        }));
      }

      // Compare and sync
      for (const product of products) {
        const externalItem = externalInventory.find(item => item.sku === product.sku);

        if (!externalItem) {
          // Product not found on external channel
          results.discrepancies.push({
            sku: product.sku,
            productName: product.name,
            localQuantity: product.inventory_quantity,
            externalQuantity: null,
            issue: 'Product not found on external channel'
          });
          continue;
        }

        const localQuantity = product.inventory_quantity;
        const externalQuantity = externalItem.quantity;

        if (localQuantity !== externalQuantity) {
          results.discrepancies.push({
            sku: product.sku,
            productName: product.name,
            localQuantity,
            externalQuantity,
            issue: 'Quantity mismatch'
          });

          // Auto-sync if option is enabled
          if (options.autoSync) {
            try {
              await this.syncProductQuantity(channelName, service, product, externalQuantity);
              results.synced++;
            } catch (syncError) {
              console.error(`Failed to sync ${product.sku}:`, syncError);
              results.errors++;
            }
          }
        } else {
          results.skipped++;
        }
      }

      return results;

    } catch (error) {
      console.error(`Error syncing ${channelName} inventory:`, error);
      throw error;
    }
  }

  /**
   * Sync a single product's quantity to a channel
   */
  async syncProductQuantity(channelName, service, product, targetQuantity) {
    try {
      if (channelName === 'AMAZON') {
        // Update Amazon inventory
        // Note: Amazon SP-API inventory updates are complex and may require specific endpoints
        console.log(`Would update Amazon inventory for ${product.sku} to ${targetQuantity}`);
      } else if (channelName === 'ETSY') {
        // Update Etsy inventory
        const products = [{
          sku: product.sku,
          price: product.channelPricing.ETSY,
          quantity: targetQuantity,
          is_enabled: targetQuantity > 0
        }];

        // Find listing ID for this SKU
        const listings = await service.getListings(100, 0);
        const listing = listings.find(l => l.sku === product.sku);

        if (listing) {
          await service.updateInventory(listing.listing_id, products);
        }
      }

      // Update local inventory record
      await this.updateLocalInventoryRecord(channelName, product.variant_id, targetQuantity);

    } catch (error) {
      console.error(`Error syncing product quantity for ${channelName}:`, error);
      throw error;
    }
  }

  /**
   * Update local inventory record after successful sync
   */
  async updateLocalInventoryRecord(channelName, variantId, quantity) {
    const client = await getClient();

    try {
      await client.begin();

      // Get channel ID
      const channelResult = await client.query(
        'SELECT id FROM channels WHERE name = ?',
        [channelName]
      );

      if (channelResult.rows.length === 0) {
        throw new Error(`Channel ${channelName} not found`);
      }

      const channelId = channelResult.rows[0].id;

      // Update or insert inventory record
      await client.query(`
        INSERT OR REPLACE INTO inventory (product_id, channel_id, quantity, last_synced)
        VALUES (?, ?, ?, datetime('now'))
      `, [variantId, channelId, quantity]);

      await client.commit();

    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  /**
   * Sync orders from external channels
   */
  async syncOrders(options = {}) {
    const results = {
      synced: 0,
      skipped: 0,
      errors: 0,
      orders: []
    };

    try {
      // Sync from Amazon
      if (this.channels.AMAZON) {
        const amazonOrders = await this.syncAmazonOrders(options);
        results.orders.push(...amazonOrders);
      }

      // Sync from Etsy
      if (this.channels.ETSY) {
        const etsyOrders = await this.syncEtsyOrders(options);
        results.orders.push(...etsyOrders);
      }

      return results;

    } catch (error) {
      console.error('Order sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync orders from Amazon
   */
  async syncAmazonOrders(options) {
    try {
      const createdAfter = options.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
      const orders = await this.channels.AMAZON.getOrders(createdAfter);

      const syncedOrders = [];

      for (const amazonOrder of orders) {
        try {
          // Check if order already exists
          const existingOrder = await query(
            'SELECT id FROM orders WHERE external_id = ? AND channel_id = (SELECT id FROM channels WHERE name = "AMAZON")',
            [amazonOrder.AmazonOrderId]
          );

          if (existingOrder.rows.length > 0) {
            continue; // Order already synced
          }

          // Convert Amazon order to internal format and create
          const internalOrder = this.convertAmazonOrderToInternal(amazonOrder);
          await this.createOrderFromExternal(internalOrder);

          syncedOrders.push({
            externalId: amazonOrder.AmazonOrderId,
            internalId: internalOrder.id,
            channel: 'AMAZON'
          });

        } catch (error) {
          console.error(`Error syncing Amazon order ${amazonOrder.AmazonOrderId}:`, error);
        }
      }

      return syncedOrders;

    } catch (error) {
      console.error('Error syncing Amazon orders:', error);
      throw error;
    }
  }

  /**
   * Sync orders from Etsy
   */
  async syncEtsyOrders(options) {
    try {
      const orders = await this.channels.ETSY.getOrders(100, 0);

      const syncedOrders = [];

      for (const etsyOrder of orders) {
        try {
          // Check if order already exists
          const existingOrder = await query(
            'SELECT id FROM orders WHERE external_id = ? AND channel_id = (SELECT id FROM channels WHERE name = "ETSY")',
            [etsyOrder.receipt_id.toString()]
          );

          if (existingOrder.rows.length > 0) {
            continue; // Order already synced
          }

          // Convert Etsy order to internal format and create
          const internalOrder = this.convertEtsyOrderToInternal(etsyOrder);
          await this.createOrderFromExternal(internalOrder);

          syncedOrders.push({
            externalId: etsyOrder.receipt_id,
            internalId: internalOrder.id,
            channel: 'ETSY'
          });

        } catch (error) {
          console.error(`Error syncing Etsy order ${etsyOrder.receipt_id}:`, error);
        }
      }

      return syncedOrders;

    } catch (error) {
      console.error('Error syncing Etsy orders:', error);
      throw error;
    }
  }

  /**
   * Convert Amazon order to internal format
   */
  convertAmazonOrderToInternal(amazonOrder) {
    // Implementation would convert Amazon order format to internal order format
    return {
      channelId: 'AMAZON',
      externalId: amazonOrder.AmazonOrderId,
      status: this.mapAmazonStatus(amazonOrder.OrderStatus),
      total: parseFloat(amazonOrder.OrderTotal?.Amount || 0),
      orderDate: amazonOrder.PurchaseDate,
      items: amazonOrder.OrderItems?.map(item => ({
        sku: item.SellerSKU,
        quantity: parseInt(item.QuantityOrdered),
        price: parseFloat(item.ItemPrice?.Amount || 0)
      })) || []
    };
  }

  /**
   * Convert Etsy order to internal format
   */
  convertEtsyOrderToInternal(etsyOrder) {
    // Implementation would convert Etsy order format to internal order format
    return {
      channelId: 'ETSY',
      externalId: etsyOrder.receipt_id.toString(),
      status: this.mapEtsyStatus(etsyOrder),
      total: parseFloat(etsyOrder.total_price || 0),
      orderDate: etsyOrder.created_timestamp,
      items: etsyOrder.transactions?.map(transaction => ({
        sku: transaction.sku,
        quantity: parseInt(transaction.quantity),
        price: parseFloat(transaction.price)
      })) || []
    };
  }

  /**
   * Create order from external channel data
   */
  async createOrderFromExternal(orderData) {
    const client = await getClient();

    try {
      await client.begin();

      // Get channel ID
      const channelResult = await client.query(
        'SELECT id FROM channels WHERE name = ?',
        [orderData.channelId]
      );

      if (channelResult.rows.length === 0) {
        throw new Error(`Channel ${orderData.channelId} not found`);
      }

      const channelId = channelResult.rows[0].id;

      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (channel_id, external_id, status, total, order_date) VALUES (?, ?, ?, ?, ?) RETURNING id',
        [channelId, orderData.externalId, orderData.status, orderData.total, orderData.orderDate]
      );

      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of orderData.items) {
        // Find variant by SKU
        const variantResult = await client.query(
          'SELECT id, price FROM product_variants WHERE sku = ?',
          [item.sku]
        );

        if (variantResult.rows.length > 0) {
          const variant = variantResult.rows[0];
          await client.query(
            'INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            [orderId, variant.id, item.quantity, item.price, item.price * item.quantity]
          );
        }
      }

      await client.commit();
      return { id: orderId };

    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  /**
   * Map Amazon order status to internal status
   */
  mapAmazonStatus(amazonStatus) {
    const statusMap = {
      'Pending': 'PENDING',
      'Unshipped': 'PROCESSING',
      'Shipped': 'SHIPPED',
      'Delivered': 'DELIVERED',
      'Cancelled': 'CANCELLED'
    };
    return statusMap[amazonStatus] || 'PENDING';
  }

  /**
   * Map Etsy order status to internal status
   */
  mapEtsyStatus(etsyOrder) {
    if (etsyOrder.was_shipped) return 'SHIPPED';
    if (etsyOrder.was_paid) return 'PROCESSING';
    return 'PENDING';
  }

  /**
   * Get sync history
   */
  getSyncHistory(limit = 10) {
    return this.syncHistory.slice(0, limit);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.syncHistory[0] || null,
      totalSyncs: this.syncHistory.length
    };
  }

  /**
   * Schedule automatic sync
   */
  scheduleAutoSync(intervalMinutes = 60) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(async () => {
      try {
        if (!this.isRunning) {
          console.log('Running scheduled inventory sync...');
          await this.syncInventory({ autoSync: true });
        }
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`Auto-sync scheduled every ${intervalMinutes} minutes`);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('Auto-sync stopped');
    }
  }
}

module.exports = new ChannelSyncService();