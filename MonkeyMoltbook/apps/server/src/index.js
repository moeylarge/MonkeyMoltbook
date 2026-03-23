import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8787;

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'MonkeyMoltbook',
    phase: 'Phase 1 — scaffold'
  });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'boot',
    app: 'MonkeyMoltbook',
    phase: 'Phase 1 — scaffold',
    status: 'connected'
  }));
});

server.listen(PORT, () => {
  console.log(`MonkeyMoltbook server listening on http://localhost:${PORT}`);
});
