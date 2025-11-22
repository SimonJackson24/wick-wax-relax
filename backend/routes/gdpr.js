const express = require('express');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { dataLogger, securityLogger } = require('../services/auditService');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware to verify user owns the data
const verifyDataOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if the user owns this data or is an admin
    const result = await query('SELECT id FROM users WHERE id = ? AND (id = ? OR is_admin = 1)', [id, userId]);

    if (result.rows.length === 0) {
      securityLogger.logUnauthorizedAccess(
        userId,
        req.user.email,
        req.ip,
        'GDPR data access',
        'Attempted to access data without ownership'
      );
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own data'
      });
    }

    next();
  } catch (error) {
    console.error('Data ownership verification error:', error);
    res.status(500).json({ error: 'Failed to verify data ownership' });
  }
};

// GDPR Data Export Route
router.get('/export/:id', authenticateToken, verifyDataOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Collect all user data
    const userData = {};

    // Basic user information
    const userResult = await query(`
      SELECT id, email, first_name, last_name, created_at, last_login, is_admin
      FROM users WHERE id = ?
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    userData.profile = userResult.rows[0];

    // Orders and order items
    const ordersResult = await query(`
      SELECT o.id, o.external_id, o.status, o.total, o.created_at,
             oi.product_id, oi.quantity, oi.price, p.name as product_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [id]);

    userData.orders = ordersResult.rows;

    // Audit log entries (user's own actions)
    const auditResult = await query(`
      SELECT event_type, resource, action, created_at, details
      FROM audit_log
      WHERE user_id = ? AND created_at >= datetime('now', '-2 years')
      ORDER BY created_at DESC
      LIMIT 1000
    `, [id]);

    userData.auditTrail = auditResult.rows;

    // Log the data export
    dataLogger.logDataExport(
      userId,
      req.user.email,
      req.ip,
      'user_data',
      1
    );

    // Return data as JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      userId: id,
      data: userData,
      gdprNotice: 'This data export is provided in accordance with GDPR Article 15 - Right of Access'
    });

  } catch (error) {
    console.error('GDPR data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// GDPR Data Deletion Route (Right to be Forgotten)
router.delete('/delete/:id', authenticateToken, verifyDataOwnership, [
  body('confirmation').equals('DELETE_ALL_MY_DATA').withMessage('Confirmation text must match exactly'),
  body('reason').isIn(['withdraw_consent', 'no_longer_needed', 'other']).withMessage('Invalid deletion reason')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason, additionalNotes } = req.body;
    const userId = req.user.userId;

    // Start transaction for data deletion
    const db = require('../config/database');

    try {
      // Anonymize user data instead of deleting (GDPR compliance)
      await db.query('BEGIN');

      // Update user profile to anonymized state
      await db.query(`
        UPDATE users SET
          first_name = 'Deleted',
          last_name = 'User',
          email = CONCAT('deleted-', id, '@anonymized.local'),
          password_hash = NULL,
          refresh_token = NULL,
          reset_token = NULL,
          reset_token_expires = NULL,
          gdpr_deleted = 1,
          gdpr_deletion_date = CURRENT_TIMESTAMP,
          gdpr_deletion_reason = ?
        WHERE id = ?
      `, [reason, id]);

      // Anonymize orders (keep for business records but remove personal data)
      await db.query(`
        UPDATE orders SET
          shipping_address = '{"anonymized": true}',
          billing_address = '{"anonymized": true}',
          gdpr_anonymized = 1
        WHERE user_id = ?
      `, [id]);

      // Log the deletion
      await db.query(`
        INSERT INTO audit_log (event_type, user_id, details)
        VALUES ('GDPR_DATA_DELETION', ?, ?)
      `, [userId, JSON.stringify({
        action: 'data_deletion',
        reason: reason,
        notes: additionalNotes,
        timestamp: new Date().toISOString()
      })]);

      await db.query('COMMIT');

      // Log the data deletion
      dataLogger.logDataDeletion(
        userId,
        req.user.email,
        req.ip,
        'user_account',
        1
      );

      res.json({
        message: 'Your data has been successfully deleted in accordance with GDPR',
        gdprNotice: 'Your account and associated data have been anonymized. You will be logged out.',
        deletionDate: new Date().toISOString()
      });

    } catch (dbError) {
      await db.query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('GDPR data deletion error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// GDPR Consent Management
router.post('/consent/:id', authenticateToken, verifyDataOwnership, [
  body('consentType').isIn(['marketing', 'analytics', 'third_party', 'data_processing']).withMessage('Invalid consent type'),
  body('consent').isBoolean().withMessage('Consent must be boolean'),
  body('consentVersion').isString().withMessage('Consent version required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { consentType, consent, consentVersion } = req.body;
    const userId = req.user.userId;

    // Store consent record
    await query(`
      INSERT INTO user_consents (user_id, consent_type, consent_given, consent_version, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      consentType,
      consent,
      consentVersion,
      req.ip,
      req.get('User-Agent')
    ]);

    // Update user's consent preferences
    const consentField = `${consentType}_consent`;
    await query(`
      UPDATE users SET
        ${consentField} = ?,
        ${consentField}_date = CURRENT_TIMESTAMP,
        ${consentField}_version = ?
      WHERE id = ?
    `, [consent, consentVersion, id]);

    // Log consent change
    dataLogger.logGDPRRequest(
      userId,
      req.user.email,
      req.ip,
      consent ? 'consent_granted' : 'consent_withdrawn',
      { consentType, consentVersion }
    );

    res.json({
      message: `Consent ${consent ? 'granted' : 'withdrawn'} for ${consentType}`,
      consentType,
      consent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GDPR consent management error:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

// Get user's consent status
router.get('/consent/:id', authenticateToken, verifyDataOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        marketing_consent, marketing_consent_date, marketing_consent_version,
        analytics_consent, analytics_consent_date, analytics_consent_version,
        third_party_consent, third_party_consent_date, third_party_consent_version,
        data_processing_consent, data_processing_consent_date, data_processing_consent_version
      FROM users WHERE id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const consents = {};

    // Format consent data
    ['marketing', 'analytics', 'third_party', 'data_processing'].forEach(type => {
      consents[type] = {
        granted: user[`${type}_consent`] || false,
        date: user[`${type}_consent_date`],
        version: user[`${type}_consent_version`]
      };
    });

    res.json({
      userId: id,
      consents,
      gdprNotice: 'Consent status retrieved in accordance with GDPR Article 7'
    });

  } catch (error) {
    console.error('GDPR consent retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve consent status' });
  }
});

// GDPR Data Portability - Export in machine-readable format
router.get('/portability/:id', authenticateToken, verifyDataOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'json'; // json, csv, xml

    // Similar to export but in different formats
    const userResult = await query(`
      SELECT
        id, email, first_name, last_name, created_at, last_login,
        marketing_consent, analytics_consent, third_party_consent, data_processing_consent
      FROM users WHERE id = ?
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];

    // Log data portability request
    dataLogger.logGDPRRequest(
      req.user.userId,
      req.user.email,
      req.ip,
      'data_portability',
      { format, requestedAt: new Date().toISOString() }
    );

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Field', 'Value'],
        ['User ID', userData.id],
        ['Email', userData.email],
        ['First Name', userData.first_name],
        ['Last Name', userData.last_name],
        ['Created At', userData.created_at],
        ['Last Login', userData.last_login],
        ['Marketing Consent', userData.marketing_consent],
        ['Analytics Consent', userData.analytics_consent],
        ['Third Party Consent', userData.third_party_consent],
        ['Data Processing Consent', userData.data_processing_consent]
      ];

      const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.csv"`);
      res.send(csvContent);
    } else {
      // Default JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.json"`);
      res.json({
        dataPortability: true,
        exportDate: new Date().toISOString(),
        user: userData,
        gdprNotice: 'Data exported in accordance with GDPR Article 20 - Right to Data Portability'
      });
    }

  } catch (error) {
    console.error('GDPR data portability error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;