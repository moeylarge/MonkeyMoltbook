import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { getAgentStats, getNextAgentHook, getNextAgentHooks, listAgents } from './lib/agents.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8787;
const PHASE = 'Phase 6 — hook validation';
const DEFAULT_PRELOAD_COUNT = 3;

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

app.get('/preload', (req, res) => {
  const requested = Number.parseInt(req.query.count, 10);
  const count = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, DEFAULT_PRELOAD_COUNT)
    : DEFAULT_PRELOAD_COUNT;

  res.json({
    phase: PHASE,
    count,
    hooks: getNextAgentHooks(count)
  });
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
