import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8787;

const PHASE = 'Phase 2 — chat';
const FIRST_HOOK = {
  type: 'hook',
  agentName: 'Ego Destroyer',
  text: 'You want attention, not honesty — prove me wrong.',
  source: 'local',
  phase: PHASE
};

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'MonkeyMoltbook',
    phase: PHASE
  });
});

app.get('/hook', (_req, res) => {
  res.json(FIRST_HOOK);
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'boot',
    app: 'MonkeyMoltbook',
    phase: PHASE,
    status: 'connected'
  }));

  ws.send(JSON.stringify(FIRST_HOOK));
});

server.listen(PORT, () => {
  console.log(`MonkeyMoltbook server listening on http://localhost:${PORT}`);
});
