const axios = require('axios');
const crypto = require('crypto');

class EtsyService {
  constructor() {
    this.baseURL = 'https://openapi.etsy.com/v3';
    this.apiKey = process.env.ETSY_API_KEY;
    this.sharedSecret = process.env.ETSY_SHARED_SECRET;
    this.accessToken = process.env.ETSY_ACCESS_TOKEN;
    this.refreshToken = process.env.ETSY_REFRESH_TOKEN;
    this.shopId = process.env.ETSY_SHOP_ID;
  }

  // Generate OAuth signature for Etsy API requests
  generateSignature(method, url, params = {}) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');

    const signatureParams = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: this.accessToken,
      oauth_version: '1.0',
      ...params
    };

    // Sort parameters alphabetically
    const sortedParams = Object.keys(signatureParams)
      .sort()
      .map(key => `${key}=${encodeURIComponent(signatureParams[key])}`)
      .join('&');

    const signatureBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
    const signingKey = `${encodeURIComponent(this.sharedSecret)}&${encodeURIComponent(this.refreshToken || '')}`;

    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');

    return {
      ...signatureParams,
      oauth_signature: signature
    };
  }

  // Make authenticated request to Etsy API
  async makeAPIRequest(endpoint, method = 'GET', data = null, params = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey
    };

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
        params
      });

      return response.data;
    } catch (error) {
      console.error('Etsy API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get shop listings
  async getListings(limit = 100, offset = 0) {
    try {
      const endpoint = `/application/shops/${this.shopId}/listings`;
      const params = {
        limit,
        offset,
        includes: 'Images,Inventory'
      };

      const listings = await this.makeAPIRequest(endpoint, 'GET', null, params);
      return listings.results;
    } catch (error) {
      console.error('Error fetching Etsy listings:', error);
      throw new Error('Failed to fetch Etsy listings');
    }
  }

  // Get specific listing details
  async getListing(listingId) {
    try {
      const endpoint = `/application/listings/${listingId}`;
      const params = {
        includes: 'Images,Inventory,ShippingInfo'
      };

      const listing = await this.makeAPIRequest(endpoint, 'GET', null, params);
      return listing;
    } catch (error) {
      console.error('Error fetching Etsy listing:', error);
      throw new Error('Failed to fetch Etsy listing');
    }
  }

  // Update listing inventory
  async updateInventory(listingId, products) {
    try {
      const endpoint = `/application/listings/${listingId}/inventory`;

      const inventoryData = {
        products: products.map(product => ({
          sku: product.sku,
          property_values: product.property_values || [],
          offerings: product.offerings || [{
            price: product.price,
            quantity: product.quantity,
            is_enabled: product.is_enabled !== false
          }]
        }))
      };

      const result = await this.makeAPIRequest(endpoint, 'PUT', inventoryData);
      return result;
    } catch (error) {
      console.error('Error updating Etsy inventory:', error);
      throw new Error('Failed to update Etsy inventory');
    }
  }

  // Create new listing
  async createListing(listingData) {
    try {
      const endpoint = `/application/shops/${this.shopId}/listings`;

      const result = await this.makeAPIRequest(endpoint, 'POST', listingData);
      return result;
    } catch (error) {
      console.error('Error creating Etsy listing:', error);
      throw new Error('Failed to create Etsy listing');
    }
  }

  // Update listing
  async updateListing(listingId, updateData) {
    try {
      const endpoint = `/application/listings/${listingId}`;

      const result = await this.makeAPIRequest(endpoint, 'PATCH', updateData);
      return result;
    } catch (error) {
      console.error('Error updating Etsy listing:', error);
      throw new Error('Failed to update Etsy listing');
    }
  }

  // Get shop orders
  async getOrders(limit = 100, offset = 0) {
    try {
      const endpoint = `/application/shops/${this.shopId}/receipts`;
      const params = {
        limit,
        offset,
        includes: 'Listings,Transactions'
      };

      const orders = await this.makeAPIRequest(endpoint, 'GET', null, params);
      return orders.results;
    } catch (error) {
      console.error('Error fetching Etsy orders:', error);
      throw new Error('Failed to fetch Etsy orders');
    }
  }

  // Get specific order details
  async getOrder(receiptId) {
    try {
      const endpoint = `/application/shops/${this.shopId}/receipts/${receiptId}`;
      const params = {
        includes: 'Listings,Transactions,Buyer'
      };

      const order = await this.makeAPIRequest(endpoint, 'GET', null, params);
      return order;
    } catch (error) {
      console.error('Error fetching Etsy order:', error);
      throw new Error('Failed to fetch Etsy order');
    }
  }

  // Update order status
  async updateOrderStatus(receiptId, status) {
    try {
      const endpoint = `/application/shops/${this.shopId}/receipts/${receiptId}`;

      const updateData = {
        was_paid: status === 'paid',
        was_shipped: status === 'shipped'
      };

      const result = await this.makeAPIRequest(endpoint, 'PUT', updateData);
      return result;
    } catch (error) {
      console.error('Error updating Etsy order status:', error);
      throw new Error('Failed to update Etsy order status');
    }
  }

  // Get shop reviews
  async getReviews(limit = 100, offset = 0) {
    try {
      const endpoint = `/application/shops/${this.shopId}/reviews`;
      const params = {
        limit,
        offset
      };

      const reviews = await this.makeAPIRequest(endpoint, 'GET', null, params);
      return reviews.results;
    } catch (error) {
      console.error('Error fetching Etsy reviews:', error);
      throw new Error('Failed to fetch Etsy reviews');
    }
  }

  // Sync inventory levels
  async syncInventoryLevels(localProducts) {
    try {
      const etsyListings = await this.getListings();

      const updates = [];

      for (const listing of etsyListings) {
        const localProduct = localProducts.find(p => p.sku === listing.sku);

        if (localProduct) {
          const etsyInventory = listing.inventory?.products?.[0]?.offerings?.[0]?.quantity || 0;
          const localStock = localProduct.stock_quantity;

          if (etsyInventory !== localStock) {
            updates.push({
              listingId: listing.listing_id,
              sku: listing.sku,
              etsyStock: etsyInventory,
              localStock: localStock,
              needsSync: true
            });
          }
        }
      }

      return updates;
    } catch (error) {
      console.error('Error syncing Etsy inventory levels:', error);
      throw new Error('Failed to sync Etsy inventory levels');
    }
  }

  // Get shop statistics
  async getShopStats() {
    try {
      const endpoint = `/application/shops/${this.shopId}`;

      const shop = await this.makeAPIRequest(endpoint);
      return {
        shop_name: shop.shop_name,
        sale_count: shop.transaction_sold_count,
        review_count: shop.review_count,
        favorite_count: shop.favorite_count,
        listing_count: shop.listing_count
      };
    } catch (error) {
      console.error('Error fetching Etsy shop stats:', error);
      throw new Error('Failed to fetch Etsy shop stats');
    }
  }

  // Webhook verification for Etsy
  verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.sharedSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }
}

module.exports = new EtsyService();