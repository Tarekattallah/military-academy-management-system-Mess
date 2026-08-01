const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const env = require('../config/env');

function setAuthCookie(res, token) {
  // In production (HTTPS) we use Secure + SameSite=None (cross-site between Vercel frontend & Render backend).
  // In development (HTTP localhost) we use a lax cookie so the browser stores it correctly.
  const isProduction = env.nodeEnv === 'production';
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
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
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const me = catchAsync(async (req, res) => {
  const user = await authService.me(req.user.sub);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { login, register, logout, me };
