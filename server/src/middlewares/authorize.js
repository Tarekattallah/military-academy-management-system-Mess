const AppError = require('../utils/AppError');

// Usage: authorize('users:create')
// Requires `authenticate` middleware to run first (needs req.user).
function authorize(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userPermissions = req.user.permissions || [];

    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
}

module.exports = authorize;
