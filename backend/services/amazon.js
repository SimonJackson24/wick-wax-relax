const axios = require('axios');
const crypto = require('crypto');

class AmazonSPAPIService {
  constructor() {
    this.baseURL = 'https://sellingpartnerapi-na.amazon.com'; // US marketplace
    this.clientId = process.env.AMAZON_CLIENT_ID;
    this.clientSecret = process.env.AMAZON_CLIENT_SECRET;
    this.refreshToken = process.env.AMAZON_REFRESH_TOKEN;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Generate AWS signature for SP-API requests
  generateSignature(stringToSign, secretKey) {
    return crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign, 'utf8')
      .digest('base64');
  }

  // Get access token using refresh token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Amazon access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Amazon SP-API');
    }
  }

  // Make authenticated request to SP-API
  async makeSPAPIRequest(endpoint, method = 'GET', data = null) {
    const accessToken = await this.getAccessToken();

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
      'host': 'sellingpartnerapi-na.amazon.com'
    };

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers,
        data
      });

      return response.data;
    } catch (error) {
      console.error('SP-API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get inventory data from Amazon
  async getInventory(skus = []) {
    try {
      const endpoint = '/fba/inventory/v1/summaries';
      const params = new URLSearchParams({
        details: true,
        marketplaceIds: 'ATVPDKIKX0DER' // US marketplace ID
      });

      if (skus.length > 0) {
        params.append('sellerSkus', skus.join(','));
      }

      const response = await this.makeSPAPIRequest(`${endpoint}?${params}`);
      return response.payload;
    } catch (error) {
      console.error('Error fetching Amazon inventory:', error);
      throw new Error('Failed to fetch Amazon inventory');
    }
  }

  // Get orders from Amazon
  async getOrders(createdAfter = null, orderStatuses = []) {
    try {
      const endpoint = '/orders/v0/orders';
      const params = new URLSearchParams({
        MarketplaceIds: 'ATVPDKIKX0DER'
      });

      if (createdAfter) {
        params.append('CreatedAfter', createdAfter);
      }

      if (orderStatuses.length > 0) {
        params.append('OrderStatuses', orderStatuses.join(','));
      }

      const response = await this.makeSPAPIRequest(`${endpoint}?${params}`);
      return response.payload.Orders;
    } catch (error) {
      console.error('Error fetching Amazon orders:', error);
      throw new Error('Failed to fetch Amazon orders');
    }
  }

  // Update product pricing on Amazon
  async updatePricing(skus, prices) {
    try {
      const endpoint = '/products/pricing/v0/price';

      const pricingUpdates = skus.map((sku, index) => ({
        sellerSKU: sku,
        standardPrice: {
          currencyCode: 'USD',
          amount: prices[index]
        }
      }));

      const response = await this.makeSPAPIRequest(endpoint, 'POST', {
        pricing: pricingUpdates
      });

      return response;
    } catch (error) {
      console.error('Error updating Amazon pricing:', error);
      throw new Error('Failed to update Amazon pricing');
    }
  }

  // Sync product catalog from Amazon
  async syncProductCatalog() {
    try {
      const endpoint = '/catalog/v0/items';
      const params = new URLSearchParams({
        MarketplaceId: 'ATVPDKIKX0DER',
        includedData: 'summaries,attributes'
      });

      const response = await this.makeSPAPIRequest(`${endpoint}?${params}`);
      return response.payload.Items;
    } catch (error) {
      console.error('Error syncing Amazon catalog:', error);
      throw new Error('Failed to sync Amazon catalog');
    }
  }

  // Get sales reports
  async getSalesReports(reportType = 'GET_FLAT_FILE_SALES_AND_TRAFFIC_REPORT', startDate, endDate) {
    try {
      // First, request report generation
      const createReportEndpoint = '/reports/2021-06-30/reports';
      const reportRequest = {
        reportType: reportType,
        dataStartTime: startDate,
        dataEndTime: endDate,
        marketplaceIds: ['ATVPDKIKX0DER']
      };

      const createResponse = await this.makeSPAPIRequest(createReportEndpoint, 'POST', reportRequest);
      const reportId = createResponse.reportId;

      // Wait for report to be ready (in production, implement proper polling)
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Get report document
      const documentEndpoint = `/reports/2021-06-30/reports/${reportId}`;
      const documentResponse = await this.makeSPAPIRequest(documentEndpoint);

      // Download report document
      const reportDocument = await axios.get(documentResponse.reportDocumentId, {
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`
        }
      });

      return reportDocument.data;
    } catch (error) {
      console.error('Error fetching Amazon sales reports:', error);
      throw new Error('Failed to fetch Amazon sales reports');
    }
  }

  // Sync inventory levels
  async syncInventoryLevels(localProducts) {
    try {
      const amazonInventory = await this.getInventory();

      const updates = [];

      for (const amazonItem of amazonInventory) {
        const localProduct = localProducts.find(p => p.sku === amazonItem.sellerSku);

        if (localProduct) {
          const amazonStock = amazonItem.inventoryDetails?.fulfillableQuantity?.value || 0;
          const localStock = localProduct.stock_quantity;

          if (amazonStock !== localStock) {
            updates.push({
              sku: amazonItem.sellerSku,
              amazonStock: amazonStock,
              localStock: localStock,
              needsSync: true
            });
          }
        }
      }

      return updates;
    } catch (error) {
      console.error('Error syncing inventory levels:', error);
      throw new Error('Failed to sync inventory levels');
    }
  }
}

module.exports = new AmazonSPAPIService();