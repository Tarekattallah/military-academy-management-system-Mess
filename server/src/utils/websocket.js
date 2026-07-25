const ws = require('ws');

let wss = null;

const websocketHelper = {
  /**
   * Initializes the WebSocket Server bound to the HTTP Server.
   */
  init(server) {
    wss = new ws.Server({ server });

    console.log('[websocket] WebSocket server initialized');

    wss.on('connection', (socket) => {
      console.log('[websocket] Client connected');

      socket.on('close', () => {
        console.log('[websocket] Client disconnected');
      });

      socket.on('error', (err) => {
        console.error('[websocket] Socket error:', err.message);
      });
    });
  },

  /**
   * Broadcasts an event with data to all connected clients.
   */
  broadcast(event, data = {}) {
    if (!wss) {
      console.warn('[websocket] Cannot broadcast, server not initialized');
      return;
    }

    const payload = JSON.stringify({ event, data });

    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(payload);
      }
    });
  },
};

module.exports = websocketHelper;
