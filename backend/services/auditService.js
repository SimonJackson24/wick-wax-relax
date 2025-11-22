const { logger } = require('./logger');
const { query } = require('../config/database');

class AuditService {
  constructor() {
    this.auditLoggers = {
      security: this.createSecurityLogger(),
      access: this.createAccessLogger(),
      data: this.createDataLogger()
    };
  }

  // Create security event logger
  createSecurityLogger() {
    return {
      logFailedLogin: (email, ip, userAgent, reason) => {
        const event = {
          type: 'SECURITY_FAILED_LOGIN',
          email: email,
          ip: ip,
          userAgent: userAgent,
          reason: reason,
          timestamp: new Date().toISOString()
        };

        logger.warn('Security Event: Failed Login Attempt', event);
        this.storeAuditEvent(event);
      },

      logSuccessfulLogin: (userId, email, ip, userAgent) => {
        const event = {
          type: 'SECURITY_SUCCESSFUL_LOGIN',
          userId: userId,
          email: email,
          ip: ip,
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        };

        logger.info('Security Event: Successful Login', event);
        this.storeAuditEvent(event);
      },

      logPasswordReset: (email, ip, userAgent) => {
        const event = {
          type: 'SECURITY_PASSWORD_RESET_REQUEST',
          email: email,
          ip: ip,
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        };

        logger.info('Security Event: Password Reset Request', event);
        this.storeAuditEvent(event);
      },

      logSuspiciousActivity: (userId, email, ip, activity, details) => {
        const event = {
          type: 'SECURITY_SUSPICIOUS_ACTIVITY',
          userId: userId,
          email: email,
          ip: ip,
          activity: activity,
          details: details,
          timestamp: new Date().toISOString()
        };

        logger.warn('Security Event: Suspicious Activity Detected', event);
        this.storeAuditEvent(event);
      },

      logRateLimitExceeded: (ip, endpoint, userAgent) => {
        const event = {
          type: 'SECURITY_RATE_LIMIT_EXCEEDED',
          ip: ip,
          endpoint: endpoint,
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        };

        logger.warn('Security Event: Rate Limit Exceeded', event);
        this.storeAuditEvent(event);
      },

      logXSSAttempt: (ip, endpoint, payload, userAgent) => {
        const event = {
          type: 'SECURITY_XSS_ATTEMPT',
          ip: ip,
          endpoint: endpoint,
          payload: payload.substring(0, 500), // Truncate long payloads
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        };

        logger.error('Security Event: XSS Attempt Detected', event);
        this.storeAuditEvent(event);
      },

      logSQLInjectionAttempt: (ip, endpoint, payload, userAgent) => {
        const event = {
          type: 'SECURITY_SQL_INJECTION_ATTEMPT',
          ip: ip,
          endpoint: endpoint,
          payload: JSON.stringify(payload).substring(0, 500),
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        };

        logger.error('Security Event: SQL Injection Attempt Detected', event);
        this.storeAuditEvent(event);
      }
    };
  }

  // Create access control logger
  createAccessLogger() {
    return {
      logUnauthorizedAccess: (userId, email, ip, resource, action) => {
        const event = {
          type: 'ACCESS_UNAUTHORIZED',
          userId: userId,
          email: email,
          ip: ip,
          resource: resource,
          action: action,
          timestamp: new Date().toISOString()
        };

        logger.warn('Access Event: Unauthorized Access Attempt', event);
        this.storeAuditEvent(event);
      },

      logAdminAction: (userId, email, ip, action, resource, details) => {
        const event = {
          type: 'ACCESS_ADMIN_ACTION',
          userId: userId,
          email: email,
          ip: ip,
          action: action,
          resource: resource,
          details: details,
          timestamp: new Date().toISOString()
        };

        logger.info('Access Event: Admin Action Performed', event);
        this.storeAuditEvent(event);
      },

      logPermissionChange: (adminId, adminEmail, targetUserId, targetEmail, permission, action) => {
        const event = {
          type: 'ACCESS_PERMISSION_CHANGE',
          adminId: adminId,
          adminEmail: adminEmail,
          targetUserId: targetUserId,
          targetEmail: targetEmail,
          permission: permission,
          action: action,
          timestamp: new Date().toISOString()
        };

        logger.info('Access Event: Permission Changed', event);
        this.storeAuditEvent(event);
      }
    };
  }

  // Create data operation logger
  createDataLogger() {
    return {
      logDataExport: (userId, email, ip, dataType, recordCount) => {
        const event = {
          type: 'DATA_EXPORT',
          userId: userId,
          email: email,
          ip: ip,
          dataType: dataType,
          recordCount: recordCount,
          timestamp: new Date().toISOString()
        };

        logger.info('Data Event: Data Export Performed', event);
        this.storeAuditEvent(event);
      },

      logDataDeletion: (userId, email, ip, dataType, recordCount) => {
        const event = {
          type: 'DATA_DELETION',
          userId: userId,
          email: email,
          ip: ip,
          dataType: dataType,
          recordCount: recordCount,
          timestamp: new Date().toISOString()
        };

        logger.info('Data Event: Data Deletion Performed', event);
        this.storeAuditEvent(event);
      },

      logGDPRRequest: (userId, email, ip, requestType, details) => {
        const event = {
          type: 'GDPR_REQUEST',
          userId: userId,
          email: email,
          ip: ip,
          requestType: requestType,
          details: details,
          timestamp: new Date().toISOString()
        };

        logger.info('GDPR Event: Privacy Request Submitted', event);
        this.storeAuditEvent(event);
      },

      logBulkOperation: (userId, email, ip, operation, table, recordCount) => {
        const event = {
          type: 'DATA_BULK_OPERATION',
          userId: userId,
          email: email,
          ip: ip,
          operation: operation,
          table: table,
          recordCount: recordCount,
          timestamp: new Date().toISOString()
        };

        logger.info('Data Event: Bulk Operation Performed', event);
        this.storeAuditEvent(event);
      }
    };
  }

  // Store audit event in database
  async storeAuditEvent(event) {
    try {
      await query(
        `INSERT INTO audit_log (
          event_type, user_id, email, ip_address, user_agent,
          resource, action, details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.type,
          event.userId || null,
          event.email || null,
          event.ip || null,
          event.userAgent || null,
          event.resource || event.endpoint || null,
          event.action || event.activity || null,
          JSON.stringify(event),
          event.timestamp
        ]
      );
    } catch (error) {
      logger.error('Failed to store audit event', {
        error: error.message,
        event: event
      });
    }
  }

  // Query audit events with filters
  async queryAuditEvents(filters = {}, limit = 100, offset = 0) {
    try {
      let whereClause = '';
      const params = [];

      if (filters.eventType) {
        whereClause += ' AND event_type = ?';
        params.push(filters.eventType);
      }

      if (filters.userId) {
        whereClause += ' AND user_id = ?';
        params.push(filters.userId);
      }

      if (filters.email) {
        whereClause += ' AND email = ?';
        params.push(filters.email);
      }

      if (filters.ip) {
        whereClause += ' AND ip_address = ?';
        params.push(filters.ip);
      }

      if (filters.startDate) {
        whereClause += ' AND created_at >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        whereClause += ' AND created_at <= ?';
        params.push(filters.endDate);
      }

      const queryStr = `
        SELECT * FROM audit_log
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      const result = await query(queryStr, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to query audit events', { error: error.message, filters });
      throw error;
    }
  }

  // Get audit statistics
  async getAuditStats(timeframe = '24 hours') {
    try {
      const result = await query(`
        SELECT
          event_type,
          COUNT(*) as count,
          MAX(created_at) as last_occurrence
        FROM audit_log
        WHERE created_at >= datetime('now', '-${timeframe}')
        GROUP BY event_type
        ORDER BY count DESC
      `);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get audit statistics', { error: error.message });
      throw error;
    }
  }

  // Clean up old audit logs (retention policy)
  async cleanupOldLogs(daysToKeep = 365) {
    try {
      const result = await query(
        'DELETE FROM audit_log WHERE created_at < datetime("now", "-? days")',
        [daysToKeep]
      );

      logger.info('Audit log cleanup completed', {
        recordsDeleted: result.changes,
        retentionDays: daysToKeep
      });

      return result.changes;
    } catch (error) {
      logger.error('Failed to cleanup old audit logs', { error: error.message });
      throw error;
    }
  }

  // Get security events for monitoring
  async getSecurityEvents(hours = 24) {
    try {
      const result = await query(`
        SELECT * FROM audit_log
        WHERE event_type LIKE 'SECURITY_%'
        AND created_at >= datetime('now', '-? hours')
        ORDER BY created_at DESC
      `, [hours]);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get security events', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const auditService = new AuditService();

module.exports = {
  auditService,
  securityLogger: auditService.auditLoggers.security,
  accessLogger: auditService.auditLoggers.access,
  dataLogger: auditService.auditLoggers.data
};