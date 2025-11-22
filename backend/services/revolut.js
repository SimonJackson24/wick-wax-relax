const axios = require('axios');
const crypto = require('crypto');

class RevolutService {
  constructor() {
    this.baseUrl = process.env.REVOLUT_API_URL || 'https://api.revolut.com';
    this.apiKey = process.env.REVOLUT_API_KEY;
    this.webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET;
  }

  // Generate Revolut signature for webhook verification
  generateSignature(payload, timestamp) {
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(message)
      .digest('hex');
  }

  // Verify webhook signature
  verifyWebhookSignature(signature, payload, timestamp) {
    const expectedSignature = this.generateSignature(payload, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Create payment intent
  async createPaymentIntent(amount, currency = 'GBP', description = '') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/1.0/payment-intents`,
        {
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          description,
          capture_mode: 'automatic'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        paymentIntentId: response.data.id,
        clientSecret: response.data.client_secret,
        status: response.data.status
      };
    } catch (error) {
      console.error('Revolut payment intent creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create payment intent');
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/1.0/payment-intents/${paymentIntentId}/confirm`,
        {
          payment_method: paymentMethodId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        status: response.data.status,
        paymentId: response.data.id
      };
    } catch (error) {
      console.error('Revolut payment confirmation failed:', error.response?.data || error.message);
      throw new Error('Failed to confirm payment');
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/1.0/payment-intents/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        status: response.data.status,
        amount: response.data.amount / 100, // Convert from cents
        currency: response.data.currency,
        paymentId: response.data.id
      };
    } catch (error) {
      console.error('Revolut payment status check failed:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  // Process refund
  async processRefund(paymentId, amount, reason = 'requested_by_customer') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/1.0/refunds`,
        {
          payment: paymentId,
          amount: Math.round(amount * 100),
          reason
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount / 100
      };
    } catch (error) {
      console.error('Revolut refund failed:', error.response?.data || error.message);
      throw new Error('Failed to process refund');
    }
  }

  // Handle webhook events
  async handleWebhookEvent(eventType, eventData) {
    const eventHandlers = {
      'payment_intent.succeeded': this.handlePaymentSucceeded.bind(this),
      'payment_intent.payment_failed': this.handlePaymentFailed.bind(this),
      'payment_intent.canceled': this.handlePaymentCanceled.bind(this),
      'charge.dispute.created': this.handleDisputeCreated.bind(this)
    };

    const handler = eventHandlers[eventType];
    if (handler) {
      await handler(eventData);
    } else {
      console.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  async handlePaymentSucceeded(data) {
    const { id: paymentIntentId } = data;
    // Update payment status in database
    const { query } = require('../config/database');

    try {
      await query(
        'UPDATE payments SET status = $1 WHERE revolut_payment_id = $2',
        ['SUCCEEDED', paymentIntentId]
      );

      // Update order status
      await query(`
        UPDATE orders SET status = 'PROCESSING'
        WHERE id = (SELECT order_id FROM payments WHERE revolut_payment_id = $1)
      `, [paymentIntentId]);

      console.log(`Payment ${paymentIntentId} marked as succeeded`);
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  }

  async handlePaymentFailed(data) {
    const { id: paymentIntentId } = data;
    const { query } = require('../config/database');

    try {
      await query(
        'UPDATE payments SET status = $1 WHERE revolut_payment_id = $2',
        ['FAILED', paymentIntentId]
      );

      // Update order status
      await query(`
        UPDATE orders SET status = 'CANCELLED'
        WHERE id = (SELECT order_id FROM payments WHERE revolut_payment_id = $1)
      `, [paymentIntentId]);

      console.log(`Payment ${paymentIntentId} marked as failed`);
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  }

  async handlePaymentCanceled(data) {
    const { id: paymentIntentId } = data;
    const { query } = require('../config/database');

    try {
      await query(
        'UPDATE payments SET status = $1 WHERE revolut_payment_id = $2',
        ['CANCELED', paymentIntentId]
      );

      // Update order status
      await query(`
        UPDATE orders SET status = 'CANCELLED'
        WHERE id = (SELECT order_id FROM payments WHERE revolut_payment_id = $1)
      `, [paymentIntentId]);

      console.log(`Payment ${paymentIntentId} marked as canceled`);
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  }

  async handleDisputeCreated(data) {
    console.log('Dispute created:', data);
    // Handle dispute logic here
  }
}

module.exports = new RevolutService();