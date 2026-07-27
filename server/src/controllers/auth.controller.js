const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const env = require('../config/env');

function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: env.cookieMaxAgeMs,
});
}

const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const { token, user } = await authService.login(username, password);

  setAuthCookie(res, token);

  res.status(200).json({ success: true, data: { user } });
});

const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, data: { user } });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie(env.cookieName);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const me = catchAsync(async (req, res) => {
  const user = await authService.me(req.user.sub);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { login, register, logout, me };
