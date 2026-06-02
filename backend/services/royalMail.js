const axios = require('axios');
const crypto = require('crypto');
const retryUtils = require('../utils/retryUtils');
const { query, getClient } = require('../config/database');
const { getRedis, isReady } = require('../config/redis');
const logger = require('./logger');

/**
 * Royal Mail tracking integration.
 *
 * Production contract: if the API call fails, we surface the error. We never
 * fabricate tracking data — the prior `getMockTrackingData` fallback (gated
 * behind NODE_ENV) is removed because:
 *   1. A NODE_ENV-unset production process would fall through to the mock.
 *   2. The user has explicitly forbidden fake/demo data in the production
 *      system.
 *
 * The access token is stored in Redis (TTL = token expiry - 60s) so it is not
 * held in process memory and is shared across all server instances.
 *
 * The tracking cache uses Postgres `ON CONFLICT … DO UPDATE` (the previous
 * `INSERT OR REPLACE` is SQLite syntax and silently failed against Postgres).
 */

const TOKEN_KEY = 'royal-mail:access-token';
const TOKEN_TTL_SAFETY_MARGIN_MS = 60 * 1000;

class RoyalMailService {
  constructor() {
    this.baseUrl = process.env.ROYAL_MAIL_API_URL || 'https://api.royalmail.com';
    this.apiKey = process.env.ROYAL_MAIL_API_KEY;
    this.clientId = process.env.ROYAL_MAIL_CLIENT_ID;
    this.clientSecret = process.env.ROYAL_MAIL_CLIENT_SECRET;

    this.authenticateWithCircuitBreaker = retryUtils.createCircuitBreaker(
      () => this._fetchAndStoreToken(),
      { failureThreshold: 3, recoveryTimeout: 30000 }
    );
  }

  // ---- Token management (Redis-backed) -----------------------------------

  async _fetchAndStoreToken() {
    const response = await axios.post(
      `${this.baseUrl}/oauth/v2/token`,
      {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      },
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
      }
    );

    const token = response.data.access_token;
    const expiresInMs = response.data.expires_in * 1000;
    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresInMs - TOKEN_TTL_SAFETY_MARGIN_MS) / 1000)
    );

    const redis = getRedis();
    if (isReady()) {
      await redis.set(TOKEN_KEY, JSON.stringify({
        token,
        expiresAt: Date.now() + expiresInMs,
      }), 'EX', ttlSeconds);
    }
    return token;
  }

  async authenticate() {
    const redis = getRedis();
    if (isReady()) {
      try {
        const cached = await redis.get(TOKEN_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.expiresAt > Date.now()) return parsed.token;
        }
      } catch (err) {
        logger.warn('Royal Mail: Redis token read failed, falling back to API', { error: err.message });
      }
    }
    return this.authenticateWithCircuitBreaker();
  }

  // ---- Tracking -----------------------------------------------------------

  async getTrackingInfo(trackingNumber) {
    const request = async () => {
      const token = await this.authenticate();
      const response = await axios.get(
        `${this.baseUrl}/mailpieces/v2/${trackingNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      return this.formatTrackingResponse(response.data);
    };

    return retryUtils.withRetry(request, {
      maxRetries: 3,
      baseDelay: 1000,
      retryCondition: retryUtils.isRetryableError,
    });
  }

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
      events: events.map((event) => ({
        status: this.mapStatus(event.eventCode),
        description: event.eventDescription,
        location: event.location,
        timestamp: event.eventDateTime,
        carrierData: event,
      })),
      estimatedDelivery: data.estimatedDeliveryDate,
      isDelivered: latestEvent?.eventCode === 'DELIVERED',
    };
  }

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
      'LOST': 'EXCEPTION',
    };
    return statusMap[eventCode] || 'UNKNOWN';
  }

  // ---- Cache (Postgres ON CONFLICT — replaces SQLite INSERT OR REPLACE) ----

  async getCachedTrackingInfo(trackingNumber) {
    try {
      const result = await query(
        'SELECT tracking_data, expires_at FROM tracking_cache WHERE tracking_number = ?',
        [trackingNumber]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        if (new Date() < new Date(row.expires_at)) {
          return JSON.parse(row.tracking_data);
        }
      }
      return null;
    } catch (error) {
      logger.error('Royal Mail cache read failed', { error: error.message });
      return null;
    }
  }

  async cacheTrackingInfo(trackingNumber, data, ttlMinutes = 30) {
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      await query(
        `INSERT INTO tracking_cache
           (tracking_number, carrier, tracking_data, expires_at, last_updated)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (tracking_number) DO UPDATE SET
           carrier       = EXCLUDED.carrier,
           tracking_data = EXCLUDED.tracking_data,
           expires_at    = EXCLUDED.expires_at,
           last_updated  = EXCLUDED.last_updated`,
        [
          trackingNumber,
          'ROYAL_MAIL',
          JSON.stringify(data),
          expiresAt.toISOString(),
          new Date().toISOString(),
        ]
      );
    } catch (error) {
      logger.error('Royal Mail cache write failed', { error: error.message });
    }
  }

  // ---- Tracking history (order-bound) -------------------------------------

  async updateTrackingHistory(orderId, trackingData) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
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
          orderId,
        ]
      );
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
            JSON.stringify(event.carrierData || {}),
          ]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Tracking history update failed', { error: error.message });
      throw error;
    }
  }

  async getTrackingInfoWithCache(trackingNumber, orderId = null) {
    let trackingData = await this.getCachedTrackingInfo(trackingNumber);
    if (!trackingData) {
      trackingData = await this.getTrackingInfo(trackingNumber);
      await this.cacheTrackingInfo(trackingNumber, trackingData);
    }
    if (orderId) {
      await this.updateTrackingHistory(orderId, trackingData);
    }
    return trackingData;
  }
}

module.exports = new RoyalMailService();
