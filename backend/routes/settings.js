const express = require('express');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const settingsService = require('../services/settingsService');

const router = express.Router();

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
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

// Get all settings grouped by category
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get settings for a specific category
router.get('/category/:category', authenticateToken, requireAdmin, [
  param('category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category } = req.params;
    const settings = await settingsService.getSettingsByCategory(category);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching category settings:', error);
    res.status(500).json({ error: 'Failed to fetch category settings' });
  }
});

// Get a specific setting
router.get('/:category/:key', authenticateToken, requireAdmin, [
  param('category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, key } = req.params;
    const setting = await settingsService.getSetting(category, key);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update or create a setting
router.put('/:category/:key', authenticateToken, requireAdmin, [
  param('category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  param('key').isString().notEmpty(),
  body('value').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, key } = req.params;
    const { value } = req.body;

    // Get existing setting to validate the value
    const existingSetting = await settingsService.getSetting(category, key);
    if (existingSetting && existingSetting.validation_rules) {
      const validation = settingsService.validateSettingValue(value, existingSetting.validation_rules);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    const result = await settingsService.setSetting(
      category,
      key,
      value,
      req.user.userId,
      req.ip,
      req.headers['user-agent']
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Bulk update settings
router.post('/bulk', authenticateToken, requireAdmin, [
  body('settings').isArray({ min: 1 }),
  body('settings.*.category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  body('settings.*.key').isString().notEmpty(),
  body('settings.*.value').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { settings } = req.body;

    // Validate all settings before updating
    for (const setting of settings) {
      const existingSetting = await settingsService.getSetting(setting.category, setting.key);
      if (existingSetting && existingSetting.validation_rules) {
        const validation = settingsService.validateSettingValue(setting.value, existingSetting.validation_rules);
        if (!validation.valid) {
          return res.status(400).json({
            error: `Validation failed for ${setting.category}.${setting.key}: ${validation.error}`
          });
        }
      }
    }

    const results = await settingsService.bulkUpdateSettings(
      settings,
      req.user.userId,
      req.ip,
      req.headers['user-agent']
    );

    res.json({ results, updated: results.length });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    res.status(500).json({ error: 'Failed to bulk update settings' });
  }
});

// Delete a setting
router.delete('/:category/:key', authenticateToken, requireAdmin, [
  param('category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, key } = req.params;
    const result = await settingsService.deleteSetting(
      category,
      key,
      req.user.userId,
      req.ip,
      req.headers['user-agent']
    );

    res.json(result);
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Get audit trail for a setting
router.get('/:category/:key/audit', authenticateToken, requireAdmin, [
  param('category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  param('key').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, key } = req.params;
    const { limit = 50 } = req.query;

    // Get the setting to find its ID
    const setting = await settingsService.getSetting(category, key);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const auditTrail = await settingsService.getSettingAuditTrail(setting.id, parseInt(limit));
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// Export all settings
router.get('/export/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await settingsService.exportSettings();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="platform-settings-export.json"');
    res.json(settings);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

// Import settings
router.post('/import', authenticateToken, requireAdmin, [
  body('settings').isArray({ min: 1 }),
  body('settings.*.category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  body('settings.*.key').isString().notEmpty(),
  body('settings.*.value').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { settings } = req.body;
    const results = await settingsService.importSettings(
      settings,
      req.user.userId,
      req.ip,
      req.headers['user-agent']
    );

    const successful = results.filter(r => r.imported).length;
    const failed = results.filter(r => !r.imported).length;

    res.json({
      results,
      summary: {
        total: settings.length,
        successful,
        failed
      }
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({ error: 'Failed to import settings' });
  }
});

// Get settings summary for dashboard
router.get('/summary/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const summary = await settingsService.getSettingsSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching settings summary:', error);
    res.status(500).json({ error: 'Failed to fetch settings summary' });
  }
});

// Validate a setting value
router.post('/validate/:category/:key', authenticateToken, requireAdmin, [
  param('category').isIn(['shipping', 'payment', 'api', 'email', 'notifications', 'general']),
  param('key').isString().notEmpty(),
  body('value').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, key } = req.params;
    const { value } = req.body;

    const setting = await settingsService.getSetting(category, key);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const validation = settingsService.validateSettingValue(value, setting.validation_rules);
    res.json(validation);
  } catch (error) {
    console.error('Error validating setting:', error);
    res.status(500).json({ error: 'Failed to validate setting' });
  }
});

module.exports = router;