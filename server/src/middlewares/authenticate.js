const env = require('../config/env');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const token = req.cookies?.[env.cookieName];

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { sub, username, roles, permissions }
    next();
  } catch (error) {
    next(error); // handled centrally (JsonWebTokenError / TokenExpiredError)
  }
}

module.exports = authenticate;
