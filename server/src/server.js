const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`[server] MessOps API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const websocket = require('./utils/websocket');
  websocket.init(server);
}

start();

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled Rejection:', err);
  process.exit(1);
});
