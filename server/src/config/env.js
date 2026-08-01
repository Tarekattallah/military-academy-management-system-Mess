require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';

const WEAK_DEFAULT_SECRET = 'dev_secret_change_me';
const jwtSecret = process.env.JWT_SECRET || WEAK_DEFAULT_SECRET;

// In production, never allow the weak default JWT secret.
// This prevents signature forgery if the env var is accidentally missing.
if (nodeEnv === 'production' && jwtSecret === WEAK_DEFAULT_SECRET) {
  throw new Error(
    '[env] JWT_SECRET must be set to a strong random value in production. Set JWT_SECRET in your environment (Render/Vercel) before starting the server.'
  );
}

const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mmwms',

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  cookieName: process.env.COOKIE_NAME || 'mmwms_token',
  cookieMaxAgeMs: Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000,

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

module.exports = env;
