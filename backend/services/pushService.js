const webpush = require('web-push');

class PushService {
  constructor() {
    // VAPID keys - in production, these should be environment variables
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BKxQzBJh8ZQG6VdQKZ8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-key-here'
    };

    // Comment out VAPID setup for testing
    // webpush.setVapidDetails(
    //   'mailto:admin@wickwaxrelax.com',
    //   this.vapidKeys.publicKey,
    //   this.vapidKeys.privateKey
    // );

    this.subscriptions = new Map(); // In production, use database
  }

  // Store push subscription
  async storeSubscription(userId, subscription) {
    this.subscriptions.set(userId, subscription);
    // In production, save to database
    console.log('Stored subscription for user:', userId);
  }

  // Send push notification to specific user
  async sendNotificationToUser(userId, payload) {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      throw new Error('User subscription not found');
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log('Push notification sent to user:', userId);
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Remove invalid subscription
      this.subscriptions.delete(userId);
    }
  }

  // Send push notification to all subscribers
  async sendNotificationToAll(payload) {
    const promises = [];
    for (const [userId, subscription] of this.subscriptions) {
      promises.push(
        webpush.sendNotification(subscription, JSON.stringify(payload))
          .catch((error) => {
            console.error(`Error sending to user ${userId}:`, error);
            this.subscriptions.delete(userId);
          })
      );
    }

    await Promise.all(promises);
    console.log('Push notifications sent to all subscribers');
  }

  // Send order status update notification
  async sendOrderStatusUpdate(userId, orderId, status) {
    const payload = {
      title: 'Order Status Update',
      body: `Your order #${orderId} status has been updated to: ${status}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        type: 'order_update',
        orderId: orderId,
        status: status,
        url: `/account/orders/${orderId}`
      }
    };

    await this.sendNotificationToUser(userId, payload);
  }

  // Send product availability notification
  async sendProductAvailableNotification(userId, productName) {
    const payload = {
      title: 'Product Back in Stock!',
      body: `${productName} is now available for purchase`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        type: 'product_available',
        productName: productName,
        url: '/products'
      }
    };

    await this.sendNotificationToUser(userId, payload);
  }

  // Send promotional notification
  async sendPromotionalNotification(title, body, url = '/') {
    const payload = {
      title: title,
      body: body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        type: 'promotion',
        url: url
      }
    };

    await this.sendNotificationToAll(payload);
  }

  // Get VAPID public key
  getVapidPublicKey() {
    return this.vapidKeys.publicKey;
  }
}

module.exports = new PushService();