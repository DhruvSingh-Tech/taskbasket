import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import * as dotenv from 'dotenv';
import { RealtimeEvent, CollaboratorSession } from '../types/task';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = parseInt(process.env.WS_PORT || process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

interface ClientMetadata {
  id: string;
  session?: CollaboratorSession;
  isAlive: boolean;
}

const clients = new Map<WebSocket, ClientMetadata>();

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', online: clients.size, time: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 [TaskBasket WebSocket Server] Running on port ${PORT} (0.0.0.0)`);
});

// Broadcast helper: sends message to all clients except optionally the sender
function broadcast(data: RealtimeEvent, sender?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [client, meta] of clients.entries()) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error(`Failed to send to client ${meta.id}:`, err);
      }
    }
  }
}

// Heartbeat ping-pong to detect disconnected clients
const interval = setInterval(() => {
  for (const [ws, meta] of clients.entries()) {
    if (!meta.isAlive) {
      console.log(`[WS] Terminating inactive client ${meta.id}`);
      clients.delete(ws);
      ws.terminate();
      if (meta.session) {
        broadcast({ type: 'PRESENCE_LEAVE', tabId: meta.session.tabId });
      }
      continue;
    }
    meta.isAlive = false;
    ws.ping();
  }
}, 15000);

wss.on('connection', (ws: WebSocket, req) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const clientMeta: ClientMetadata = {
    id: clientId,
    isAlive: true,
  };
  clients.set(ws, clientMeta);

  console.log(`[WS] Client connected: ${clientId} (Total online: ${clients.size})`);

  // Send current active collaborators to new client
  const activeSessions: CollaboratorSession[] = [];
  for (const meta of clients.values()) {
    if (meta.session) {
      activeSessions.push(meta.session);
    }
  }

  // Welcome message with existing presence
  ws.send(
    JSON.stringify({
      type: 'WS_CONNECTED',
      clientId,
      activeSessions,
      serverTime: new Date().toISOString(),
    })
  );

  ws.on('pong', () => {
    clientMeta.isAlive = true;
  });

  ws.on('message', (messageData: string) => {
    try {
      const event: RealtimeEvent = JSON.parse(messageData.toString());

      // Track presence
      if (event.type === 'PRESENCE_HEARTBEAT') {
        clientMeta.session = event.session;
        clientMeta.isAlive = true;
      } else if (event.type === 'PRESENCE_LEAVE') {
        clientMeta.session = undefined;
      }

      // Relay event to all other clients
      broadcast(event, ws);
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${clientId}`);
    if (clientMeta.session) {
      broadcast({ type: 'PRESENCE_LEAVE', tabId: clientMeta.session.tabId });
    }
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Socket error on ${clientId}:`, err);
  });
});

wss.on('close', () => {
  clearInterval(interval);
});
