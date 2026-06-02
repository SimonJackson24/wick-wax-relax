const { logger } = require('./logger');
const { query } = require('../config/database');
const { sanitize } = require('../middleware/piiSanitizer');

/**
 * Audit service.
 *
 * Three log channels: security, access, data. All events are also persisted to
 * the `audit_log` table for query/reporting.
 *
 * Notes on prior bugs fixed here:
 *   - The `getAuditStats` and `getSecurityEvents` queries used SQLite syntax
 *     (`datetime('now', '-${timeframe}')`) and a Python-style ? placeholder in
 *     the same string. They have been replaced with Postgres-native
 *     `NOW() - INTERVAL '…'` and a single placeholder.
 *   - The `storeAuditEvent` writes the full event object into `details`. That
 *     object includes emails. We now sanitise before serialisation.
 */

class AuditService {
  constructor() {
    this.auditLoggers = {
      security: this.createSecurityLogger(),
      access: this.createAccessLogger(),
      data: this.createDataLogger(),
    };
  }

  createSecurityLogger() {
    return {
      logFailedLogin: (email, ip, userAgent, reason) => {
        const event = {
          type: 'SECURITY_FAILED_LOGIN',
          email,
          ip,
          userAgent,
          reason,
          timestamp: new Date().toISOString(),
        };
        logger.warn('Security Event: Failed Login Attempt', event);
        this.storeAuditEvent(event);
      },
      logSuccessfulLogin: (userId, email, ip, userAgent) => {
        const event = {
          type: 'SECURITY_SUCCESSFUL_LOGIN',
          userId,
          email,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        };
        logger.info('Security Event: Successful Login', event);
        this.storeAuditEvent(event);
      },
      logPasswordReset: (email, ip, userAgent) => {
        const event = {
          type: 'SECURITY_PASSWORD_RESET_REQUEST',
          email,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        };
        logger.info('Security Event: Password Reset Request', event);
        this.storeAuditEvent(event);
      },
      logSuspiciousActivity: (userId, email, ip, activity, details) => {
        const event = {
          type: 'SECURITY_SUSPICIOUS_ACTIVITY',
          userId,
          email,
          ip,
          activity,
          details,
          timestamp: new Date().toISOString(),
        };
        logger.warn('Security Event: Suspicious Activity Detected', event);
        this.storeAuditEvent(event);
      },
      logRateLimitExceeded: (ip, endpoint, userAgent) => {
        const event = {
          type: 'SECURITY_RATE_LIMIT_EXCEEDED',
          ip,
          endpoint,
          userAgent,
          timestamp: new Date().toISOString(),
        };
        logger.warn('Security Event: Rate Limit Exceeded', event);
        this.storeAuditEvent(event);
      },
      logXSSAttempt: (ip, endpoint, payload, userAgent) => {
        const event = {
          type: 'SECURITY_XSS_ATTEMPT',
          ip,
          endpoint,
          payload: String(payload).substring(0, 500),
          userAgent,
          timestamp: new Date().toISOString(),
        };
        logger.error('Security Event: XSS Attempt Detected', event);
        this.storeAuditEvent(event);
      },
      logSQLInjectionAttempt: (ip, endpoint, payload, userAgent) => {
        const event = {
          type: 'SECURITY_SQL_INJECTION_ATTEMPT',
          ip,
          endpoint,
          payload: JSON.stringify(payload).substring(0, 500),
          userAgent,
          timestamp: new Date().toISOString(),
        };
        logger.error('Security Event: SQL Injection Attempt Detected', event);
        this.storeAuditEvent(event);
      },
    };
  }

  createAccessLogger() {
    return {
      logUnauthorizedAccess: (userId, email, ip, resource, action) => {
        const event = {
          type: 'ACCESS_UNAUTHORIZED',
          userId,
          email,
          ip,
          resource,
          action,
          timestamp: new Date().toISOString(),
        };
        logger.warn('Access Event: Unauthorized Access Attempt', event);
        this.storeAuditEvent(event);
      },
      logAdminAction: (userId, email, ip, action, resource, details) => {
        const event = {
          type: 'ACCESS_ADMIN_ACTION',
          userId,
          email,
          ip,
          action,
          resource,
          details,
          timestamp: new Date().toISOString(),
        };
        logger.info('Access Event: Admin Action Performed', event);
        this.storeAuditEvent(event);
      },
      logPermissionChange: (adminId, adminEmail, targetUserId, targetEmail, permission, action) => {
        const event = {
          type: 'ACCESS_PERMISSION_CHANGE',
          adminId,
          adminEmail,
          targetUserId,
          targetEmail,
          permission,
          action,
          timestamp: new Date().toISOString(),
        };
        logger.info('Access Event: Permission Changed', event);
        this.storeAuditEvent(event);
      },
    };
  }

  createDataLogger() {
    return {
      logDataExport: (userId, email, ip, dataType, recordCount) => {
        const event = {
          type: 'DATA_EXPORT',
          userId,
          email,
          ip,
          dataType,
          recordCount,
          timestamp: new Date().toISOString(),
        };
        logger.info('Data Event: Data Export Performed', event);
        this.storeAuditEvent(event);
      },
      logDataDeletion: (userId, email, ip, dataType, recordCount) => {
        const event = {
          type: 'DATA_DELETION',
          userId,
          email,
          ip,
          dataType,
          recordCount,
          timestamp: new Date().toISOString(),
        };
        logger.info('Data Event: Data Deletion Performed', event);
        this.storeAuditEvent(event);
      },
      logGDPRRequest: (userId, email, ip, requestType, details) => {
        const event = {
          type: 'GDPR_REQUEST',
          userId,
          email,
          ip,
          requestType,
          details,
          timestamp: new Date().toISOString(),
        };
        logger.info('GDPR Event: Privacy Request Submitted', event);
        this.storeAuditEvent(event);
      },
      logBulkOperation: (userId, email, ip, operation, table, recordCount) => {
        const event = {
          type: 'DATA_BULK_OPERATION',
          userId,
          email,
          ip,
          operation,
          table,
          recordCount,
          timestamp: new Date().toISOString(),
        };
        logger.info('Data Event: Bulk Operation Performed', event);
        this.storeAuditEvent(event);
      },
    };
  }

  // Persist a single event. `details` is sanitised to redact obvious PII.
  async storeAuditEvent(event) {
    try {
      const safeDetails = sanitize(event);
      await query(
        `INSERT INTO audit_log
           (event_type, user_id, email, ip_address, user_agent,
            resource, action, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.type,
          event.userId || null,
          event.email || null,
          event.ip || null,
          event.userAgent || null,
          event.resource || event.endpoint || null,
          event.action || event.activity || null,
          JSON.stringify(safeDetails),
          event.timestamp,
        ]
      );
    } catch (error) {
      logger.error('Failed to store audit event', { error: error.message });
    }
  }

  async queryAuditEvents(filters = {}, limit = 100, offset = 0) {
    let whereClause = '';
    const params = [];
    if (filters.eventType) { whereClause += ' AND event_type = ?'; params.push(filters.eventType); }
    if (filters.userId)    { whereClause += ' AND user_id = ?';    params.push(filters.userId); }
    if (filters.email)     { whereClause += ' AND email = ?';     params.push(filters.email); }
    if (filters.ip)        { whereClause += ' AND ip_address = ?'; params.push(filters.ip); }
    if (filters.startDate) { whereClause += ' AND created_at >= ?'; params.push(filters.startDate); }
    if (filters.endDate)   { whereClause += ' AND created_at <= ?'; params.push(filters.endDate); }

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM audit_log WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    return result.rows;
  }

  // Postgres-native. Accepts plain-English timeframes used by the admin UI:
  // '24 hours', '7 days', '30 days'. We parse defensively to avoid any chance
  // of string injection into the INTERVAL clause.
  async getAuditStats(timeframe = '24 hours') {
    const { amount, unit } = parseTimeframe(timeframe);
    const result = await query(
      `SELECT event_type, COUNT(*)::int AS count, MAX(created_at) AS last_occurrence
         FROM audit_log
        WHERE created_at >= NOW() - ($1 || ' ' || $2)::interval
        GROUP BY event_type
        ORDER BY count DESC`,
      [String(amount), unit]
    );
    return result.rows;
  }

  async getSecurityEvents(hours = 24) {
    const result = await query(
      `SELECT * FROM audit_log
        WHERE event_type LIKE 'SECURITY_%'
          AND created_at >= NOW() - ($1 || ' hours')::interval
        ORDER BY created_at DESC`,
      [String(hours)]
    );
    return result.rows;
  }

  async cleanupOldLogs(daysToKeep = 365) {
    const result = await query(
      `DELETE FROM audit_log
        WHERE created_at < NOW() - ($1 || ' days')::interval`,
      [String(daysToKeep)]
    );
    logger.info('Audit log cleanup completed', {
      recordsDeleted: result.rowCount,
      retentionDays: daysToKeep,
    });
    return result.rowCount;
  }
}

// Parse "24 hours" / "7 days" / "30 minutes" etc. into {amount, unit}.
function parseTimeframe(tf) {
  const match = String(tf).trim().match(/^(\d+)\s+([a-z]+)$/i);
  if (!match) return { amount: 24, unit: 'hours' };
  const amount = parseInt(match[1], 10);
  const unitRaw = match[2].toLowerCase();
  const allowed = new Set(['seconds', 'minutes', 'hours', 'days', 'weeks']);
  const unit = allowed.has(unitRaw) ? unitRaw : 'hours';
  return { amount, unit };
}

const auditService = new AuditService();

module.exports = {
  auditService,
  securityLogger: auditService.auditLoggers.security,
  accessLogger: auditService.auditLoggers.access,
  dataLogger: auditService.auditLoggers.data,
};
