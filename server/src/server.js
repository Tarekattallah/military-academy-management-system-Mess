const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

async function start() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`[server] MMWMS API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start();

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled Rejection:', err);
  process.exit(1);
});
