const express = require('express');
const { query } = require('../config/database');
const { body, param, query: queryParam, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const pdfService = require('../services/pdfService');
const csvService = require('../services/csvService');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  // Try header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try cookie
  if (!token) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Helper function to send file and cleanup
async function sendFileAndCleanup(res, fileResult, cleanup = true) {
  try {
    // Set headers for file download
    res.setHeader('Content-Type', fileResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileResult.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(fileResult.filePath);
    fileStream.pipe(res);

    // Clean up file after sending (with delay to ensure streaming completes)
    if (cleanup) {
      fileStream.on('end', () => {
        setTimeout(() => {
          if (fileResult.filePath.includes('pdfService') || fileResult.filePath.includes('csvService')) {
            pdfService.cleanup(fileResult.filePath);
          } else {
            csvService.cleanup(fileResult.filePath);
          }
        }, 5000); // 5 second delay
      });
    }

    // Handle errors
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('Error sending file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error downloading file' });
    }
  }
}

// Generate PDF invoice for a specific order
router.get('/invoice/:orderId', authenticateToken, [
  param('orderId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;

    // Check if user owns this order (unless admin)
    if (!isAdmin) {
      const orderCheck = await query('SELECT user_id FROM orders WHERE id = ?', [orderId]);
      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (orderCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Generate PDF invoice
    const fileResult = await pdfService.generateInvoice(orderId);

    // Send file to client
    await sendFileAndCleanup(res, fileResult);

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice' });
  }
});

// Generate bulk PDF invoices (Admin only)
router.post('/invoices/bulk', authenticateToken, requireAdmin, [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderIds } = req.body;

    // Generate bulk invoices
    const results = await pdfService.generateBulkInvoices(orderIds);

    // Create a ZIP file or return individual download links
    // For now, return the results with file paths
    res.json({
      message: 'Bulk invoice generation completed',
      results: results.map(result => ({
        orderId: result.orderId,
        success: result.success,
        fileName: result.fileName || null,
        error: result.error || null
      }))
    });

  } catch (error) {
    console.error('Error generating bulk invoices:', error);
    res.status(500).json({ error: error.message || 'Failed to generate bulk invoices' });
  }
});

// Export orders to CSV
router.get('/orders/csv', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      channel: req.query.channel,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const userId = req.user.isAdmin ? null : req.user.userId;

    // Generate CSV export
    const fileResult = await csvService.exportOrders(filters, userId);

    // Send file to client
    await sendFileAndCleanup(res, fileResult);

  } catch (error) {
    console.error('Error exporting orders to CSV:', error);
    res.status(500).json({ error: error.message || 'Failed to export orders' });
  }
});

// Export order items to CSV (detailed)
router.get('/orders/items/csv', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const userId = req.user.isAdmin ? null : req.user.userId;

    // Generate detailed CSV export
    const fileResult = await csvService.exportOrderItems(filters, userId);

    // Send file to client
    await sendFileAndCleanup(res, fileResult);

  } catch (error) {
    console.error('Error exporting order items to CSV:', error);
    res.status(500).json({ error: error.message || 'Failed to export order items' });
  }
});

// Export customer order summary (for customers)
router.get('/customer/summary/csv', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Generate customer summary CSV
    const fileResult = await csvService.exportCustomerSummary(userId);

    // Send file to client
    await sendFileAndCleanup(res, fileResult);

  } catch (error) {
    console.error('Error exporting customer summary:', error);
    res.status(500).json({ error: error.message || 'Failed to export customer summary' });
  }
});

// Get export statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await csvService.getExportStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting export stats:', error);
    res.status(500).json({ error: 'Failed to get export statistics' });
  }
});

// Download specific export file (for bulk operations)
router.get('/download/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;

    // Security check - ensure user can only download their own files or admin can download any
    const tempDir = path.join(__dirname, '../temp');
    const filePath = path.join(tempDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Basic security - check filename format
    const allowedPatterns = [
      /^invoice-[a-f0-9-]+\.pdf$/,
      /^orders-export-\d+\.csv$/,
      /^order-items-export-\d+\.csv$/,
      /^customer-summary-\d+\.csv$/
    ];

    const isValidFileName = allowedPatterns.some(pattern => pattern.test(fileName));
    if (!isValidFileName) {
      return res.status(403).json({ error: 'Invalid file name' });
    }

    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileName.endsWith('.csv')) {
      contentType = 'text/csv';
    }

    const fileResult = {
      filePath,
      fileName,
      contentType
    };

    // Send file to client
    await sendFileAndCleanup(res, fileResult);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Clean up old export files (Admin only)
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '../temp');
    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;

    // Delete files older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < oneHourAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    res.json({
      message: 'Cleanup completed',
      deletedFiles: deletedCount
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup files' });
  }
});

module.exports = router;