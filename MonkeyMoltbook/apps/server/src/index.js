import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { getAgentStats, getNextAgentHook, getNextAgentHooks, listAgents } from './lib/agents.js';
import { getMoltbookIntel, getMoltbookStats, getMoltbookAgents } from './lib/moltbook.js';
import { getResponse, getResponseStats } from './lib/responses.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8787;
const PHASE = 'Controlled Moltbook ingestion';
const DEFAULT_PRELOAD_COUNT = 3;

app.get('/health', async (_req, res) => {
  res.json({
    ok: true,
    app: 'MonkeyMoltbook',
    phase: PHASE,
    ...(await getAgentStats()),
    ...getMoltbookStats(),
    ...getResponseStats()
  });
});

app.get('/agents', async (_req, res) => {
  res.json({
    phase: PHASE,
    agents: await listAgents()
  });
});

app.get('/moltbook/intel', async (_req, res) => {
  res.json({
    phase: PHASE,
    ...(await getMoltbookIntel())
  });
});

app.get('/moltbook/rankings', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    lastFetchedAt: intel.lastFetchedAt,
    rankings: intel.rankings ?? []
  });
});

app.post('/moltbook/refresh', async (_req, res) => {
  const result = await getMoltbookAgents();
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    ok: true,
    source: result.source,
    activeAgents: result.agents.length,
    lastFetchedAt: intel.lastFetchedAt,
    postCount: intel.postCount,
    authorCount: intel.authorCount,
  });
});

app.get('/hook', async (_req, res) => {
  res.json(await getNextAgentHook());
});

app.get('/preload', async (req, res) => {
  const requested = Number.parseInt(req.query.count, 10);
  const count = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, DEFAULT_PRELOAD_COUNT)
    : DEFAULT_PRELOAD_COUNT;

  res.json({
    phase: PHASE,
    count,
    hooks: await getNextAgentHooks(count)
  });
});

app.get('/response', (req, res) => {
  const agentId = String(req.query.agentId || 'ego-destroyer');
  const userText = String(req.query.userText || '');
  const response = getResponse(agentId, userText);

  res.json({
    phase: PHASE,
    agentId,
    userText,
    response: {
      type: 'response',
      agentId,
      text: response.text,
      validation: response.validation
    }
  });
});

wss.on('connection', async (ws) => {
  ws.send(JSON.stringify({
    type: 'boot',
    app: 'MonkeyMoltbook',
    phase: PHASE,
    status: 'connected'
  }));

  ws.send(JSON.stringify(await getNextAgentHook()));
});

server.listen(PORT, () => {
  console.log(`MonkeyMoltbook server listening on http://localhost:${PORT}`);
});
