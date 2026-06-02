/**
 * Audit logging for cross-user access by admin accounts.
 *
 * GDPR Art. 30 (records of processing activities) requires that administrative
 * access to personal data be logged so the data subject can be told who looked
 * at their record. This middleware writes a single audit row per admin access.
 */

const { accessLogger } = require('../services/auditService');

function logAdminAccess(resourceType) {
  return function adminAccessLogger(req, res, next) {
    res.on('finish', () => {
      // Only log on successful responses — failed authz is already logged elsewhere.
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      const targetId =
        req.params.id ||
        req.params.userId ||
        req.params.orderId ||
        req.body?.userId ||
        null;

      if (!req.user || !req.user.isAdmin) return; // non-admins are IDOR-blocked already.

      accessLogger.logAdminAction(
        req.user.userId,
        req.user.email,
        req.ip,
        req.method,
        `${resourceType}:${targetId || 'list'}`,
        {
          path: req.originalUrl,
          status: res.statusCode,
          targetOwnerId: res.locals?.resourceOwnerId || null,
        }
      );
    });
    next();
  };
}

module.exports = { logAdminAccess };
