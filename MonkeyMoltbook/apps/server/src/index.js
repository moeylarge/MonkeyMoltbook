import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { getAgentStats, getNextAgentHook, listAgents } from './lib/agents.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8787;
const PHASE = 'Phase 4 — swipe';

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'MonkeyMoltbook',
    phase: PHASE,
    ...getAgentStats()
  });
});

app.get('/agents', (_req, res) => {
  res.json({
    phase: PHASE,
    agents: listAgents()
  });
});

app.get('/hook', (_req, res) => {
  res.json(getNextAgentHook());
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'boot',
    app: 'MonkeyMoltbook',
    phase: PHASE,
    status: 'connected'
  }));

  ws.send(JSON.stringify(getNextAgentHook()));
});

server.listen(PORT, () => {
  console.log(`MonkeyMoltbook server listening on http://localhost:${PORT}`);
});
