const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const orderService = require('./order');

class PDFService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Generate invoice PDF for a specific order
  async generateInvoice(orderId) {
    try {
      // Get order details
      const order = await orderService.getOrderDetails(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Get tracking information if available
      let trackingInfo = null;
      try {
        trackingInfo = await orderService.getTrackingInfo(orderId);
      } catch (error) {
        console.log('No tracking info available for order:', orderId);
      }

      const fileName = `invoice-${order.external_id}.pdf`;
      const filePath = path.join(this.tempDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Generate the invoice content
      await this.generateInvoiceContent(doc, order, trackingInfo);

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            filePath,
            fileName,
            contentType: 'application/pdf'
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });

    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  // Generate the invoice content
  async generateInvoiceContent(doc, order, trackingInfo) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Header with branding
    this.addHeader(doc, pageWidth);

    // Invoice details
    this.addInvoiceDetails(doc, order, pageWidth);

    // Billing and shipping info
    this.addAddressInfo(doc, order, pageWidth);

    // Order items table
    this.addOrderItemsTable(doc, order, pageWidth);

    // Order summary
    this.addOrderSummary(doc, order, pageWidth);

    // Tracking information if available
    if (trackingInfo && trackingInfo.hasTracking) {
      this.addTrackingInfo(doc, trackingInfo, pageWidth);
    }

    // Footer
    this.addFooter(doc, pageWidth, pageHeight);
  }

  // Add company header with branding
  addHeader(doc, pageWidth) {
    // Company name
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2E7D32')
       .text('WICK WAX & RELAX', 50, 50);

    // Tagline
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Premium Waxing Products & Relaxation Essentials', 50, 80);

    // Contact info
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text('Email: info@wickwaxrelax.com', 50, 100)
       .text('Phone: +44 123 456 7890', 50, 115)
       .text('Website: www.wickwaxrelax.com', 50, 130);

    // Invoice title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#2E7D32')
       .text('INVOICE', pageWidth - 150, 50, { align: 'right' });
  }

  // Add invoice details
  addInvoiceDetails(doc, order, pageWidth) {
    const yPos = 180;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('Invoice Details:', 50, yPos);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Invoice Number: ${order.external_id}`, 50, yPos + 20)
       .text(`Order Date: ${new Date(order.order_date).toLocaleDateString('en-GB')}`, 50, yPos + 35)
       .text(`Invoice Date: ${new Date().toLocaleDateString('en-GB')}`, 50, yPos + 50);

    // Status badge
    const statusColors = {
      'PENDING': '#FF9800',
      'PROCESSING': '#2196F3',
      'SHIPPED': '#4CAF50',
      'DELIVERED': '#2E7D32',
      'CANCELLED': '#F44336',
      'REFUNDED': '#9C27B0'
    };

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(statusColors[order.status] || '#666666')
       .text(`Status: ${order.status}`, pageWidth - 150, yPos + 20, { align: 'right' });
  }

  // Add billing and shipping address
  addAddressInfo(doc, order, pageWidth) {
    const yPos = 260;

    // Billing Address
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('Bill To:', 50, yPos);

    // For now, we'll use placeholder as we don't have customer address in the order data
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Customer Information', 50, yPos + 20)
       .text('Email will be sent to customer', 50, yPos + 35);

    // Shipping Method
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('Shipping Method:', pageWidth - 200, yPos, { align: 'right' });

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Royal Mail Standard Delivery', pageWidth - 200, yPos + 20, { align: 'right' });
  }

  // Add order items table
  addOrderItemsTable(doc, order, pageWidth) {
    const yPos = 340;
    const tableWidth = pageWidth - 100;
    const colWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.2];

    // Table header
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#2E7D32');

    let xPos = 50;
    doc.text('Product', xPos, yPos);
    xPos += colWidths[0];
    doc.text('Qty', xPos, yPos, { width: colWidths[1], align: 'center' });
    xPos += colWidths[1];
    doc.text('Unit Price', xPos, yPos, { width: colWidths[2], align: 'right' });
    xPos += colWidths[2];
    doc.text('Total', xPos, yPos, { width: colWidths[3], align: 'right' });

    // Header line
    doc.moveTo(50, yPos + 15)
       .lineTo(pageWidth - 50, yPos + 15)
       .stroke('#2E7D32');

    // Table rows
    let currentY = yPos + 25;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');

    order.items.forEach((item, index) => {
      const rowY = currentY + (index * 20);

      // Product name and variant
      let productText = item.product_name;
      if (item.variant_name && item.variant_name !== 'Default') {
        productText += ` - ${item.variant_name}`;
      }
      if (item.sku) {
        productText += ` (SKU: ${item.sku})`;
      }

      xPos = 50;
      doc.text(productText, xPos, rowY, { width: colWidths[0] });

      xPos += colWidths[0];
      doc.text(item.quantity.toString(), xPos, rowY, { width: colWidths[1], align: 'center' });

      xPos += colWidths[1];
      doc.text(`£${parseFloat(item.unit_price).toFixed(2)}`, xPos, rowY, { width: colWidths[2], align: 'right' });

      xPos += colWidths[2];
      doc.text(`£${parseFloat(item.total_price).toFixed(2)}`, xPos, rowY, { width: colWidths[3], align: 'right' });

      // Light row separator
      if (index < order.items.length - 1) {
        doc.moveTo(50, rowY + 15)
           .lineTo(pageWidth - 50, rowY + 15)
           .stroke('#EEEEEE');
      }
    });

    return currentY + (order.items.length * 20) + 10;
  }

  // Add order summary
  addOrderSummary(doc, order, pageWidth) {
    const yPos = 500;
    const summaryWidth = 200;

    // Summary box
    doc.rect(pageWidth - summaryWidth - 50, yPos, summaryWidth, 80)
       .fillAndStroke('#F5F5F5', '#2E7D32');

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2E7D32')
       .text('Order Summary', pageWidth - summaryWidth - 40, yPos + 10);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');

    const subtotal = parseFloat(order.total);
    const shipping = 0; // Could be calculated based on order data
    const tax = 0; // Could be calculated if tax info is available
    const total = subtotal + shipping + tax;

    doc.text(`Subtotal: £${subtotal.toFixed(2)}`, pageWidth - summaryWidth - 40, yPos + 30);
    doc.text(`Shipping: £${shipping.toFixed(2)}`, pageWidth - summaryWidth - 40, yPos + 45);
    doc.text(`Tax: £${tax.toFixed(2)}`, pageWidth - summaryWidth - 40, yPos + 60);

    // Total line
    doc.moveTo(pageWidth - summaryWidth - 40, yPos + 70)
       .lineTo(pageWidth - 50, yPos + 70)
       .stroke('#2E7D32');

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2E7D32')
       .text(`Total: £${total.toFixed(2)}`, pageWidth - summaryWidth - 40, yPos + 75);
  }

  // Add tracking information
  addTrackingInfo(doc, trackingInfo, pageWidth) {
    const yPos = 600;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2E7D32')
       .text('Shipping & Tracking Information', 50, yPos);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(`Tracking Number: ${trackingInfo.trackingNumber}`, 50, yPos + 20)
       .text(`Carrier: ${trackingInfo.carrier}`, 50, yPos + 35)
       .text(`Current Status: ${trackingInfo.currentStatus}`, 50, yPos + 50);

    if (trackingInfo.estimatedDelivery) {
      doc.text(`Estimated Delivery: ${new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-GB')}`, 50, yPos + 65);
    }

    if (trackingInfo.lastUpdated) {
      doc.text(`Last Updated: ${new Date(trackingInfo.lastUpdated).toLocaleDateString('en-GB')}`, 50, yPos + 80);
    }
  }

  // Add footer
  addFooter(doc, pageWidth, pageHeight) {
    const footerY = pageHeight - 80;

    // Footer line
    doc.moveTo(50, footerY)
       .lineTo(pageWidth - 50, footerY)
       .stroke('#2E7D32');

    // Footer text
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Thank you for your business!', 50, footerY + 10, { align: 'center' })
       .text('Wick Wax & Relax - Premium Waxing Products & Relaxation Essentials', 50, footerY + 25, { align: 'center' })
       .text('For any questions about this invoice, please contact us at info@wickwaxrelax.com', 50, footerY + 40, { align: 'center' });

    // Page number
    doc.text('Page 1 of 1', pageWidth - 100, footerY + 55, { align: 'right' });
  }

  // Clean up temporary files
  cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  // Generate bulk invoices (for admin use)
  async generateBulkInvoices(orderIds) {
    const results = [];

    for (const orderId of orderIds) {
      try {
        const result = await this.generateInvoice(orderId);
        results.push({
          orderId,
          success: true,
          filePath: result.filePath,
          fileName: result.fileName
        });
      } catch (error) {
        console.error(`Failed to generate invoice for order ${orderId}:`, error);
        results.push({
          orderId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new PDFService();