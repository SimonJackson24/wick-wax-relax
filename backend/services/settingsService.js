const crypto = require('crypto');
const { query, getClient } = require('../config/database');

class SettingsService {
  constructor() {
    this.encryptionKey = process.env.SETTINGS_ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
    this.algorithm = 'aes-256-gcm';
  }

  // Generate a unique ID for settings
  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Encrypt sensitive data
  encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    if (!encryptedData) return encryptedData;
    try {
      const { encrypted, iv, authTag } = JSON.parse(encryptedData);
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return as-is if decryption fails
    }
  }

  // Get all settings by category
  async getSettingsByCategory(category) {
    const result = await query(
      'SELECT id, category, key, value, encrypted, description, validation_rules, created_at, updated_at FROM platform_settings WHERE category = ? ORDER BY key',
      [category]
    );

    return result.rows.map(setting => ({
      ...setting,
      value: setting.encrypted ? this.decrypt(setting.value) : setting.value,
      validation_rules: setting.validation_rules ? JSON.parse(setting.validation_rules) : null
    }));
  }

  // Get all settings grouped by category
  async getAllSettings() {
    const result = await query(
      'SELECT id, category, key, value, encrypted, description, validation_rules, created_at, updated_at FROM platform_settings ORDER BY category, key'
    );

    const settings = {};
    result.rows.forEach(setting => {
      if (!settings[setting.category]) {
        settings[setting.category] = {};
      }
      settings[setting.category][setting.key] = {
        ...setting,
        value: setting.encrypted ? this.decrypt(setting.value) : setting.value,
        validation_rules: setting.validation_rules ? JSON.parse(setting.validation_rules) : null
      };
    });

    return settings;
  }

  // Get a specific setting
  async getSetting(category, key) {
    const result = await query(
      'SELECT id, category, key, value, encrypted, description, validation_rules, created_at, updated_at FROM platform_settings WHERE category = ? AND key = ?',
      [category, key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const setting = result.rows[0];
    return {
      ...setting,
      value: setting.encrypted ? this.decrypt(setting.value) : setting.value,
      validation_rules: setting.validation_rules ? JSON.parse(setting.validation_rules) : null
    };
  }

  // Update or create a setting
  async setSetting(category, key, value, userId = null, ipAddress = null, userAgent = null) {
    const client = await getClient();

    try {
      await client.begin();

      // Get existing setting
      const existingResult = await client.query(
        'SELECT id, value, encrypted FROM platform_settings WHERE category = ? AND key = ?',
        [category, key]
      );

      const oldValue = existingResult.rows.length > 0 ? existingResult.rows[0].value : null;
      const settingId = existingResult.rows.length > 0 ? existingResult.rows[0].id : this.generateId();
      const wasEncrypted = existingResult.rows.length > 0 ? existingResult.rows[0].encrypted : false;

      // Check if this setting should be encrypted
      const shouldEncrypt = await this.shouldEncryptSetting(category, key);

      // Encrypt value if needed
      const processedValue = shouldEncrypt ? this.encrypt(value) : value;

      if (existingResult.rows.length > 0) {
        // Update existing setting
        await client.query(
          'UPDATE platform_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ? AND key = ?',
          [processedValue, category, key]
        );
      } else {
        // Create new setting
        await client.query(
          'INSERT INTO platform_settings (id, category, key, value, encrypted) VALUES (?, ?, ?, ?, ?)',
          [settingId, category, key, processedValue, shouldEncrypt ? 1 : 0]
        );
      }

      // Log the change
      await this.logSettingChange(
        settingId,
        oldValue,
        processedValue,
        existingResult.rows.length > 0 ? 'UPDATE' : 'CREATE',
        userId,
        ipAddress,
        userAgent,
        client
      );

      await client.commit();

      return {
        id: settingId,
        category,
        key,
        value: shouldEncrypt ? value : processedValue, // Return decrypted value
        encrypted: shouldEncrypt,
        updated: true
      };

    } catch (error) {
      await client.rollback();
      console.error('Error setting platform setting:', error);
      throw error;
    }
  }

  // Bulk update settings
  async bulkUpdateSettings(updates, userId = null, ipAddress = null, userAgent = null) {
    const client = await getClient();
    const results = [];

    try {
      await client.begin();

      for (const update of updates) {
        const { category, key, value } = update;
        const result = await this.setSetting(category, key, value, userId, ipAddress, userAgent);
        results.push(result);
      }

      await client.commit();
      return results;

    } catch (error) {
      await client.rollback();
      console.error('Error bulk updating settings:', error);
      throw error;
    }
  }

  // Delete a setting
  async deleteSetting(category, key, userId = null, ipAddress = null, userAgent = null) {
    const client = await getClient();

    try {
      await client.begin();

      // Get existing setting for audit log
      const existingResult = await client.query(
        'SELECT id, value FROM platform_settings WHERE category = ? AND key = ?',
        [category, key]
      );

      if (existingResult.rows.length === 0) {
        throw new Error('Setting not found');
      }

      const settingId = existingResult.rows[0].id;
      const oldValue = existingResult.rows[0].value;

      // Delete the setting
      await client.query(
        'DELETE FROM platform_settings WHERE category = ? AND key = ?',
        [category, key]
      );

      // Log the deletion
      await this.logSettingChange(
        settingId,
        oldValue,
        null,
        'DELETE',
        userId,
        ipAddress,
        userAgent,
        client
      );

      await client.commit();
      return { deleted: true, category, key };

    } catch (error) {
      await client.rollback();
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  // Check if a setting should be encrypted
  async shouldEncryptSetting(category, key) {
    const sensitiveKeys = [
      'amazon_api_key', 'amazon_client_secret',
      'etsy_api_key', 'etsy_shared_secret',
      'revolut_api_key', 'revolut_webhook_secret',
      'smtp_password', 'email_password'
    ];

    return sensitiveKeys.includes(key);
  }

  // Log setting changes for audit trail
  async logSettingChange(settingId, oldValue, newValue, action, userId, ipAddress, userAgent, client = null) {
    const queryFn = client ? client.query.bind(client) : query;

    await queryFn(
      'INSERT INTO settings_audit_log (id, setting_id, old_value, new_value, action, changed_by, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [this.generateId(), settingId, oldValue, newValue, action, userId, ipAddress, userAgent]
    );
  }

  // Get audit trail for a setting
  async getSettingAuditTrail(settingId, limit = 50) {
    const result = await query(
      'SELECT * FROM settings_audit_log WHERE setting_id = ? ORDER BY changed_at DESC LIMIT ?',
      [settingId, limit]
    );

    return result.rows;
  }

  // Export settings for backup
  async exportSettings() {
    const result = await query(
      'SELECT id, category, key, value, encrypted, description, validation_rules, created_at, updated_at FROM platform_settings ORDER BY category, key'
    );

    return result.rows.map(setting => ({
      ...setting,
      value: setting.encrypted ? this.decrypt(setting.value) : setting.value,
      validation_rules: setting.validation_rules ? JSON.parse(setting.validation_rules) : null
    }));
  }

  // Import settings from backup
  async importSettings(settings, userId = null, ipAddress = null, userAgent = null) {
    const results = [];

    for (const setting of settings) {
      try {
        const result = await this.setSetting(
          setting.category,
          setting.key,
          setting.value,
          userId,
          ipAddress,
          userAgent
        );
        results.push({ ...result, imported: true });
      } catch (error) {
        results.push({
          category: setting.category,
          key: setting.key,
          error: error.message,
          imported: false
        });
      }
    }

    return results;
  }

  // Validate setting value against rules
  validateSettingValue(value, rules) {
    if (!rules) return { valid: true };

    try {
      // Basic type validation
      if (rules.type) {
        switch (rules.type) {
          case 'string':
            if (typeof value !== 'string') {
              return { valid: false, error: 'Value must be a string' };
            }
            if (rules.minLength && value.length < rules.minLength) {
              return { valid: false, error: `Minimum length is ${rules.minLength}` };
            }
            if (rules.maxLength && value.length > rules.maxLength) {
              return { valid: false, error: `Maximum length is ${rules.maxLength}` };
            }
            if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
              return { valid: false, error: 'Value format is invalid' };
            }
            break;

          case 'number':
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              return { valid: false, error: 'Value must be a number' };
            }
            if (rules.minimum !== undefined && numValue < rules.minimum) {
              return { valid: false, error: `Minimum value is ${rules.minimum}` };
            }
            if (rules.maximum !== undefined && numValue > rules.maximum) {
              return { valid: false, error: `Maximum value is ${rules.maximum}` };
            }
            break;

          case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
              return { valid: false, error: 'Value must be a boolean' };
            }
            break;

          case 'array':
            try {
              const arrValue = typeof value === 'string' ? JSON.parse(value) : value;
              if (!Array.isArray(arrValue)) {
                return { valid: false, error: 'Value must be an array' };
              }
            } catch (e) {
              return { valid: false, error: 'Invalid array format' };
            }
            break;
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Validation failed' };
    }
  }

  // Get settings summary for dashboard
  async getSettingsSummary() {
    const result = await query(
      'SELECT category, COUNT(*) as count FROM platform_settings GROUP BY category ORDER BY category'
    );

    const summary = {};
    result.rows.forEach(row => {
      summary[row.category] = row.count;
    });

    return summary;
  }
}

module.exports = new SettingsService();