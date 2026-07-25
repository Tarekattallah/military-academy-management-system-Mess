const AuditLog = require('../models/auditLog.model');

/**
 * Middleware that auto-logs mutating HTTP requests (POST, PUT, PATCH, DELETE).
 * Saves a record after the response is sent to avoid delaying the response.
 */
function auditLogger(req, res, next) {
  const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!MUTATING_METHODS.includes(req.method)) {
    return next();
  }

  // Extract module from route path e.g. /products/123 -> products
  const pathParts = req.path.replace(/^\//, '').split('/');
  const module = pathParts[0] || 'unknown';

  // Map HTTP method to action label
  const methodToAction = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };
  const action = methodToAction[req.method] || 'update';

  // Extract document ID from URL if present
  const documentId = pathParts[1] || null;

  // Hook into response finish event (after response is sent)
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    const result = originalSend(body);
    // Only log successful mutations (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      setImmediate(() => {
        AuditLog.create({
          user: req.user.sub,
          username: req.user.username,
          action,
          module,
          documentId,
          description: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        }).catch(() => {}); // Silent fail - don't break the app
      });
    }
    return result;
  };

  next();
}

module.exports = auditLogger;
