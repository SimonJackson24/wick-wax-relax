const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  configure() {
    // For development, we'll use a simple console logger
    // In production, configure with actual SMTP settings
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development mode - log emails to console
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 DEVELOPMENT EMAIL SENT:');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('HTML:', mailOptions.html);
          console.log('---');
          return { messageId: 'dev-' + Date.now() };
        }
      };
    }
    this.isConfigured = true;
  }

  // ===== PASSWORD RESET EMAILS =====
  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: 'Reset Your Password - Wick Wax & Relax',
      html: this.generatePasswordResetTemplate(resetToken, resetUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // ===== ORDER EMAILS =====
  async sendOrderConfirmationEmail(email, orderDetails) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: 'Order Confirmation - Wick Wax & Relax',
      html: this.generateOrderConfirmationTemplate(orderDetails),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw new Error('Failed to send order confirmation email');
    }
  }

  async sendOrderStatusEmail(email, subject, html) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: subject,
      html: html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Order status email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending order status email:', error);
      throw new Error('Failed to send order status email');
    }
  }

  async sendOrderNotificationEmail(email, subject, message, orderDetails) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: subject,
      html: this.generateOrderNotificationTemplate(subject, message, orderDetails),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Order notification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending order notification email:', error);
      throw new Error('Failed to send order notification email');
    }
  }

  async sendShippingNotificationEmail(email, orderDetails, trackingInfo) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: `Your Order #${orderDetails.external_id} Has Shipped!`,
      html: this.generateShippingNotificationTemplate(orderDetails, trackingInfo),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Shipping notification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending shipping notification email:', error);
      throw new Error('Failed to send shipping notification email');
    }
  }

  // ===== CUSTOMER EMAILS =====
  async sendWelcomeEmail(email, customerName) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: 'Welcome to Wick Wax & Relax!',
      html: this.generateWelcomeEmailTemplate(customerName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // ===== MARKETING EMAILS =====
  async sendPromotionalEmail(email, subject, content, unsubscribeUrl) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: subject,
      html: this.generatePromotionalEmailTemplate(subject, content, unsubscribeUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Promotional email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending promotional email:', error);
      throw new Error('Failed to send promotional email');
    }
  }

  async sendNewsletterEmail(email, subject, content, unsubscribeUrl) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: subject,
      html: this.generateNewsletterTemplate(subject, content, unsubscribeUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Newsletter email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending newsletter email:', error);
      throw new Error('Failed to send newsletter email');
    }
  }

  // ===== ADMIN EMAILS =====
  async sendLowStockAlertEmail(email, lowStockItems) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: email,
      subject: 'Low Stock Alert - Wick Wax & Relax',
      html: this.generateLowStockAlertTemplate(lowStockItems),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Low stock alert email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending low stock alert email:', error);
      throw new Error('Failed to send low stock alert email');
    }
  }

  async sendAdminAlertEmail(adminEmail, alertType, alertData) {
    if (!this.isConfigured) {
      this.configure();
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@wickwaxrelax.com',
      to: adminEmail,
      subject: `Admin Alert: ${alertType}`,
      html: this.generateAdminAlertTemplate(alertType, alertData),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Admin alert email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending admin alert email:', error);
      throw new Error('Failed to send admin alert email');
    }
  }

  // ===== EMAIL TEMPLATES =====

  generatePasswordResetTemplate(resetToken, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #ffd700 30%, #ffb347 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Password Reset</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password for your Wick Wax & Relax account.</p>
            <p>Please click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>For security reasons, this link can only be used once.</p>
          </div>
          <div class="footer">
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p>${resetUrl}</p>
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOrderConfirmationTemplate(orderDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #ffd700 30%, #ffb347 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #1a1a2e; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Thank you for your order!</p>
            <p>Your order has been successfully placed and is being processed.</p>

            <div class="order-details">
              <h3>Order #${orderDetails.id}</h3>
              <p><strong>Order Date:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString()}</p>
              <p><strong>Total:</strong> £${orderDetails.total}</p>

              <h4>Items:</h4>
              ${orderDetails.items.map(item => `
                <div class="item">
                  <span>${item.productName} (${item.variantName})</span>
                  <span>£${item.price} x ${item.quantity}</span>
                </div>
              `).join('')}

              <div class="item total">
                <span>Total</span>
                <span>£${orderDetails.total}</span>
              </div>
            </div>

            <p>You will receive an email when your order ships.</p>
            <p>If you have any questions, please contact us at info@wickwaxrelax.com</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOrderNotificationTemplate(subject, message, orderDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #2196f3 30%, #21cbf3 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .notification-box { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Order Update</h2>
          </div>
          <div class="content">
            <div class="notification-box">
              <h3>${subject}</h3>
              <p>${message}</p>
              ${orderDetails ? `
                <p><strong>Order #${orderDetails.external_id}</strong></p>
                <p><strong>Order Date:</strong> ${new Date(orderDetails.order_date).toLocaleDateString()}</p>
                <p><strong>Total:</strong> £${orderDetails.total}</p>
              ` : ''}
            </div>
            <p>If you have any questions about your order, please contact us at info@wickwaxrelax.com</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateShippingNotificationTemplate(orderDetails, trackingInfo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Order Has Shipped!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #4caf50 30%, #81c784 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .tracking-info { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .tracking-button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Your Order Has Shipped!</h2>
          </div>
          <div class="content">
            <p>Great news! Your order has been shipped and is on its way to you.</p>

            <div class="tracking-info">
              <h3>Shipping Details</h3>
              <p><strong>Order #${orderDetails.external_id}</strong></p>
              <p><strong>Shipping Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Carrier:</strong> ${trackingInfo.carrier || 'Royal Mail'}</p>
              <p><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber || 'TBD'}</p>
              ${trackingInfo.trackingNumber ? `
                <a href="https://www.royalmail.com/track-your-item#/tracking-results/${trackingInfo.trackingNumber}" class="tracking-button">
                  Track Your Package
                </a>
              ` : ''}
            </div>

            <p>You will receive another email when your order is delivered.</p>
            <p>Thank you for shopping with Wick Wax & Relax!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailTemplate(customerName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Wick Wax & Relax!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #ffd700 30%, #ffb347 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .welcome-message { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .button { display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Welcome ${customerName}!</h2>
          </div>
          <div class="content">
            <div class="welcome-message">
              <h3>Thank you for joining Wick Wax & Relax!</h3>
              <p>We're excited to have you as part of our community of relaxation and wellness enthusiasts.</p>
              <p>Here's what you can expect from us:</p>
              <ul>
                <li>Premium quality wax melts, candles, and diffusers</li>
                <li>Exclusive offers and early access to new products</li>
                <li>Expert tips for creating the perfect ambiance</li>
                <li>Personalized recommendations based on your preferences</li>
              </ul>
            </div>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" class="button">Start Shopping</a>

            <p>Questions? We're here to help! Contact us at info@wickwaxrelax.com</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePromotionalEmailTemplate(subject, content, unsubscribeUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .promo-content { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .button { display: inline-block; background: #9c27b0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .unsubscribe { font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Special Offer</h2>
          </div>
          <div class="content">
            <div class="promo-content">
              <h3>${subject}</h3>
              ${content}
            </div>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" class="button">Shop Now</a>

            <div class="unsubscribe">
              <p>Don't want to receive promotional emails?
                <a href="${unsubscribeUrl}">Unsubscribe here</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateNewsletterTemplate(subject, content, unsubscribeUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #3f51b5 30%, #7986cb 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .newsletter-content { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .unsubscribe { font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Newsletter</h2>
          </div>
          <div class="content">
            <div class="newsletter-content">
              <h3>${subject}</h3>
              ${content}
            </div>

            <div class="unsubscribe">
              <p>You received this email because you subscribed to our newsletter.
                <a href="${unsubscribeUrl}">Unsubscribe here</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateLowStockAlertTemplate(lowStockItems) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Low Stock Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #ff6b6b 30%, #ee5a52 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-item { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #ff6b6b; }
          .urgent { border-left-color: #d63031; background: #ffeaa7; }
          .warning { border-left-color: #fdcb6e; background: #fff3cd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Low Stock Alert</h2>
          </div>
          <div class="content">
            <p>Attention: The following items are running low on stock and may need to be reordered.</p>

            ${lowStockItems.map(item => `
              <div class="alert-item ${item.inventory_quantity <= 2 ? 'urgent' : 'warning'}">
                <h4>${item.product_name} - ${item.variant_name}</h4>
                <p><strong>SKU:</strong> ${item.sku}</p>
                <p><strong>Current Stock:</strong> ${item.inventory_quantity} units</p>
                <p><strong>Category:</strong> ${item.category_name || 'N/A'}</p>
              </div>
            `).join('')}

            <p>Please review these items and consider placing orders with suppliers to maintain adequate stock levels.</p>
            <p>You can manage inventory levels in the admin dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateAdminAlertTemplate(alertType, alertData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Admin Alert: ${alertType}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(45deg, #f44336 30%, #ef5350 90%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-content { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ddd; }
          .urgent { border-left: 4px solid #f44336; background: #ffebee; }
          .warning { border-left: 4px solid #ff9800; background: #fff3e0; }
          .info { border-left: 4px solid #2196f3; background: #e3f2fd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Wick Wax & Relax</h1>
            <h2>Admin Alert</h2>
          </div>
          <div class="content">
            <div class="alert-content ${alertType.toLowerCase()}">
              <h3>Alert Type: ${alertType}</h3>
              <pre>${JSON.stringify(alertData, null, 2)}</pre>
            </div>

            <p>Please review this alert and take appropriate action in the admin dashboard.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin">Go to Admin Dashboard</a></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Wick Wax & Relax. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();