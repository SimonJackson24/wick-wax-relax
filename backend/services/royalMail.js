const axios = require('axios');
const retryUtils = require('../utils/retryUtils');
const { query } = require('../config/database');
const logger = require('./logger');

class RoyalMailService {
  constructor() {
    this.baseUrl = process.env.ROYAL_MAIL_API_URL || 'https://api.royalmail.com';
    this.apiKey = process.env.ROYAL_MAIL_API_KEY;
    this.clientId = process.env.ROYAL_MAIL_CLIENT_ID;
    this.clientSecret = process.env.ROYAL_MAIL_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;

    // Create circuit breaker for authentication
    this.authenticateWithCircuitBreaker = retryUtils.createCircuitBreaker(
      this._authenticate.bind(this),
      { failureThreshold: 3, recoveryTimeout: 30000 }
    );
  }

  // Internal authenticate method for circuit breaker
  async _authenticate() {
    const response = await axios.post(
      `${this.baseUrl}/oauth/v2/token`,
      {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    return this.accessToken;
  }

  // Authenticate with Royal Mail API
  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      return await this.authenticateWithCircuitBreaker();
    } catch (error) {
      logger.error('Royal Mail authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Royal Mail API');
    }
  }

  // Get tracking information for a shipment with retry logic
  async getTrackingInfo(trackingNumber) {
    const trackingRequest = async () => {
      const token = await this.authenticate();

      const response = await axios.get(
        `${this.baseUrl}/mailpieces/v2/${trackingNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return this.formatTrackingResponse(response.data);
    };

    try {
      return await retryUtils.withRetry(trackingRequest, {
        maxRetries: 3,
        baseDelay: 1000,
        retryCondition: retryUtils.isRetryableError
      });
    } catch (error) {
      logger.error(`Royal Mail tracking failed for ${trackingNumber} after retries:`, error.message);

      // For development/demo purposes, return mock data if API is not available
      if (process.env.NODE_ENV === 'development' &&
          (error.response?.status === 401 || error.response?.status === 403 || error.code === 'ENOTFOUND')) {
        logger.info(`Returning mock data for ${trackingNumber} in development mode`);
        return this.getMockTrackingData(trackingNumber);
      }

      throw new Error(`Failed to get tracking info for ${trackingNumber}: ${error.message}`);
    }
  }

  // Format Royal Mail API response to standardized format
  formatTrackingResponse(data) {
    const events = data.events || [];
    const latestEvent = events[events.length - 1];

    return {
      trackingNumber: data.mailPieceId,
      status: this.mapStatus(latestEvent?.eventCode),
      statusDescription: latestEvent?.eventDescription || 'Unknown status',
      location: latestEvent?.location || 'Unknown location',
      timestamp: latestEvent?.eventDateTime,
      carrier: 'ROYAL_MAIL',
      events: events.map(event => ({
        status: this.mapStatus(event.eventCode),
        description: event.eventDescription,
        location: event.location,
        timestamp: event.eventDateTime,
        carrierData: event
      })),
      estimatedDelivery: data.estimatedDeliveryDate,
      isDelivered: latestEvent?.eventCode === 'DELIVERED'
    };
  }

  // Map Royal Mail status codes to standardized statuses
  mapStatus(eventCode) {
    const statusMap = {
      'ACCEPTED': 'ACCEPTED',
      'PROCESSED': 'IN_TRANSIT',
      'DESPATCHED': 'IN_TRANSIT',
      'DELIVERED': 'DELIVERED',
      'DELIVERY_ATTEMPTED': 'OUT_FOR_DELIVERY',
      'COLLECTION': 'PICKED_UP',
      'RETURNED': 'RETURNED',
      'DAMAGED': 'EXCEPTION',
      'LOST': 'EXCEPTION'
    };

    return statusMap[eventCode] || 'UNKNOWN';
  }

  // Mock tracking data for development
  getMockTrackingData(trackingNumber) {
    const mockStatuses = [
      { status: 'ACCEPTED', description: 'Item accepted at sorting office', location: 'London Sorting Centre' },
      { status: 'IN_TRANSIT', description: 'Item in transit', location: 'In transit' },
      { status: 'OUT_FOR_DELIVERY', description: 'Out for delivery', location: 'Local delivery office' },
      { status: 'DELIVERED', description: 'Delivered', location: 'Delivered to recipient' }
    ];

    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];

    return {
      trackingNumber,
      status: randomStatus.status,
      statusDescription: randomStatus.description,
      location: randomStatus.location,
      timestamp: new Date().toISOString(),
      carrier: 'ROYAL_MAIL',
      events: [randomStatus],
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      isDelivered: randomStatus.status === 'DELIVERED'
    };
  }

  // Get cached tracking data
  async getCachedTrackingInfo(trackingNumber) {
    try {
      const cacheResult = await query(
        'SELECT tracking_data, last_updated, expires_at FROM tracking_cache WHERE tracking_number = ?',
        [trackingNumber]
      );

      if (cacheResult.rows.length > 0) {
        const cache = cacheResult.rows[0];
        if (new Date() < new Date(cache.expires_at)) {
          return JSON.parse(cache.tracking_data);
        }
      }

      return null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  // Cache tracking data
  async cacheTrackingInfo(trackingNumber, data, ttlMinutes = 30) {
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await query(
        `INSERT OR REPLACE INTO tracking_cache
         (tracking_number, carrier, tracking_data, expires_at, last_updated)
         VALUES (?, ?, ?, ?, ?)`,
        [
          trackingNumber,
          'ROYAL_MAIL',
          JSON.stringify(data),
          expiresAt.toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      logger.error('Cache storage failed:', error);
    }
  }

  // Update tracking history in database
  async updateTrackingHistory(orderId, trackingData) {
    try {
      const client = await require('../config/database').getClient();

      await client.begin();

      // Update order tracking info
      await client.query(
        `UPDATE orders SET
         tracking_status = ?,
         tracking_updated_at = ?,
         estimated_delivery_date = ?
         WHERE id = ?`,
        [
          trackingData.status,
          new Date().toISOString(),
          trackingData.estimatedDelivery,
          orderId
        ]
      );

      // Insert tracking events
      for (const event of trackingData.events) {
        await client.query(
          `INSERT INTO tracking_history
           (order_id, tracking_number, status, status_description, location, timestamp, carrier_data)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            trackingData.trackingNumber,
            event.status,
            event.description,
            event.location,
            event.timestamp,
            JSON.stringify(event.carrierData || {})
          ]
        );
      }

      await client.commit();
    } catch (error) {
      logger.error('Tracking history update failed:', error);
      throw error;
    }
  }

  // Get tracking info with caching
  async getTrackingInfoWithCache(trackingNumber, orderId = null) {
    try {
      // Try cache first
      let trackingData = await this.getCachedTrackingInfo(trackingNumber);

      if (!trackingData) {
        // Fetch from API
        trackingData = await this.getTrackingInfo(trackingNumber);

        // Cache the result
        await this.cacheTrackingInfo(trackingNumber, trackingData);
      }

      // Update database if orderId provided
      if (orderId) {
        await this.updateTrackingHistory(orderId, trackingData);
      }

      return trackingData;
    } catch (error) {
      logger.error(`Tracking info retrieval failed for ${trackingNumber}:`, error);
      throw error;
    }
  }
}

module.exports = new RoyalMailService();