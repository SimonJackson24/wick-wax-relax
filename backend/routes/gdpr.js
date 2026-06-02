const express = require('express');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { dataLogger, securityLogger } = require('../services/auditService');
const { logger } = require('../services/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const verifyDataOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // SECURITY: Self-service endpoint. A user can only export/delete their
    // OWN data. Admin data access goes through the separate admin routes
    // (see routes/admin.js) which check req.user.isAdmin. Previously this
    // query had 'OR is_admin = 1' which let any logged-in user read or
    // destroy any admin's data — fixed in C-08.
    const result = await query('SELECT id FROM users WHERE id = ? AND id = ?', [id, userId]);

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
    logger.error('Data ownership verification error', { error: error.message, stack: error.stack, userId, ip: req.ip });
    res.status(500).json({ error: 'Failed to verify data ownership' });
  }
};

router.get('/export/:id', authenticateToken, verifyDataOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const userData = {};

    const userResult = await query(`
      SELECT id, email, first_name, last_name, created_at, last_login, is_admin
      FROM users WHERE id = ?
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    userData.profile = userResult.rows[0];

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

    // GDPR Art. 15 requires a complete copy of personal data. The previous
    // implementation only included profile/orders/audit and silently dropped
    // wishlist, reviews, newsletter subscriptions, and saved addresses. We
    // now union in every user-data table; missing tables return zero rows
    // rather than throwing, so the export still succeeds.
    const additionalSections = [
      {
        key: 'wishlist',
        sql: `SELECT w.id, w.product_id, w.created_at, p.name AS product_name
                FROM wishlist w LEFT JOIN products p ON p.id = w.product_id
               WHERE w.user_id = ? ORDER BY w.created_at DESC`,
        params: [id],
      },
      {
        key: 'reviews',
        sql: `SELECT id, product_id, rating, title, body, created_at, approved
                FROM reviews WHERE user_id = ? ORDER BY created_at DESC`,
        params: [id],
      },
      {
        key: 'newsletterSubscriptions',
        sql: `SELECT id, email, status, subscribed_at, unsubscribed_at
                FROM newsletter_subscribers WHERE email = (SELECT email FROM users WHERE id = ?)`,
        params: [id],
      },
      {
        key: 'savedAddresses',
        sql: `SELECT id, label, recipient_name, line1, line2, city, postcode, country, phone, is_default, created_at
                FROM saved_addresses WHERE user_id = ? ORDER BY created_at DESC`,
        params: [id],
      },
      {
        key: 'subscriptions',
        sql: `SELECT id, plan_id, status, current_period_start, current_period_end, created_at
                FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC`,
        params: [id],
      },
      {
        key: 'searchHistory',
        sql: `SELECT query_text, created_at FROM search_history
                WHERE user_id = ? AND created_at >= NOW() - INTERVAL '2 years'
                ORDER BY created_at DESC LIMIT 1000`,
        params: [id],
      },
      {
        key: 'supportTickets',
        sql: `SELECT id, subject, status, created_at, closed_at
                FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
        params: [id],
      },
      {
        key: 'consents',
        sql: `SELECT consent_type, consent_given, consent_version, recorded_at
                FROM user_consents WHERE user_id = ? ORDER BY recorded_at DESC`,
        params: [id],
      },
    ];

    for (const section of additionalSections) {
      try {
        const r = await query(section.sql, section.params);
        userData[section.key] = r.rows;
      } catch (err) {
        // Missing table is not a failure of the export.
        if (err.code === '42P01') {
          userData[section.key] = [];
        } else {
          throw err;
        }
      }
    }

    const auditResult = await query(`
      SELECT event_type, resource, action, created_at, details
      FROM audit_log
      WHERE user_id = ? AND created_at >= NOW() - INTERVAL '2 years'
      ORDER BY created_at DESC
      LIMIT 1000
    `, [id]);

    userData.auditTrail = auditResult.rows;

    dataLogger.logDataExport(
      userId,
      req.user.email,
      req.ip,
      'user_data',
      1
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.json"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      exportDate: new Date().toISOString(),
      userId: id,
      data: userData,
      gdprNotice: 'This data export is provided in accordance with GDPR Article 15 - Right of Access',
    });

  } catch (error) {
      logger.error('GDPR data export error', { error: error.message, stack: error.stack, userId, ip: req.ip });
      res.status(500).json({ error: 'Failed to export data' });
  }
});

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

    const { query: dbQuery } = require('../config/database');

    try {
      await dbQuery('BEGIN');

      // Anonymize user data instead of deleting (GDPR compliance)
      await dbQuery(`
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
      await dbQuery(`
        UPDATE orders SET
          shipping_address = '{"anonymized": true}',
          billing_address = '{"anonymized": true}',
          gdpr_anonymized = 1
        WHERE user_id = ?
      `, [id]);

      await dbQuery(`
        INSERT INTO audit_log (event_type, user_id, details)
        VALUES ('GDPR_DATA_DELETION', ?, ?)
      `, [userId, JSON.stringify({
        action: 'data_deletion',
        reason: reason,
        notes: additionalNotes,
        timestamp: new Date().toISOString()
      })]);

      await dbQuery('COMMIT');

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
      await dbQuery('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
      logger.error('GDPR data deletion error', { error: error.message, stack: error.stack, userId, ip: req.ip });
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

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

    const consentField = `${consentType}_consent`;
    await query(`
      UPDATE users SET
        ${consentField} = ?,
        ${consentField}_date = CURRENT_TIMESTAMP,
        ${consentField}_version = ?
      WHERE id = ?
    `, [consent, consentVersion, id]);

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
      logger.error('GDPR consent management error', { error: error.message, stack: error.stack, userId, ip: req.ip });
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

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
    logger.error('GDPR consent retrieval error', { error: error.message, stack: error.stack, userId: req.user?.userId, ip: req.ip });
    res.status(500).json({ error: 'Failed to retrieve consent status' });
  }
});

// Escape a value for safe inclusion in a CSV file. The leading-character
// check is what blocks formula injection in Excel / LibreOffice: cells
// starting with =, +, -, @, TAB, or CR will be interpreted as a formula
// by the spreadsheet program and can execute commands. We prefix with a
// single quote and quote-wrap the field.
function csvEscape(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaChars.includes(str.charAt(0))) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

router.get('/portability/:id', authenticateToken, verifyDataOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'json';

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

    dataLogger.logGDPRRequest(
      req.user.userId,
      req.user.email,
      req.ip,
      'data_portability',
      { format, requestedAt: new Date().toISOString() }
    );

    if (format === 'csv') {
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
        ['Data Processing Consent', userData.data_processing_consent],
      ];

      const csvContent = csvData.map((row) => row.map(csvEscape).join(',')).join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.csv"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.json"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({
        dataPortability: true,
        exportDate: new Date().toISOString(),
        user: userData,
        gdprNotice: 'Data exported in accordance with GDPR Article 20 - Right to Data Portability',
      });
    }

  } catch (error) {
      logger.error('GDPR data portability error', { error: error.message, stack: error.stack, userId: req.user?.userId, ip: req.ip });
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;