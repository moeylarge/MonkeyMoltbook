import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { getAgentStats, getNextAgentHook, getNextAgentHooks, listAgents } from './lib/agents.js';
import { authorsToCsv, buildGrowthMetrics, snapshotsToCsv } from './lib/moltbook-export.js';
import { getMoltbookIntel, getMoltbookStats, getMoltbookAgents } from './lib/moltbook.js';
import { getSchedulerState, startScheduler, stopScheduler } from './lib/moltbook-scheduler.js';
import { getResponse, getResponseStats } from './lib/responses.js';

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8787;
const PHASE = 'Controlled Moltbook ingestion';
const DEFAULT_PRELOAD_COUNT = 3;

async function runMoltbookRefreshJob() {
  const result = await getMoltbookAgents();
  const intel = await getMoltbookIntel();
  return {
    ok: true,
    source: result.source,
    activeAgents: result.agents.length,
    lastFetchedAt: intel.lastFetchedAt,
    postCount: intel.postCount,
    authorCount: intel.authorCount,
  };
}

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

app.get('/moltbook/history', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    lastFetchedAt: intel.lastFetchedAt,
    snapshots: intel.snapshots ?? [],
    authorHistory: intel.authorHistory ?? {}
  });
});

app.get('/moltbook/report', async (_req, res) => {
  const intel = await getMoltbookIntel();
  const authors = intel.authors ?? [];
  res.json({
    phase: PHASE,
    lastFetchedAt: intel.lastFetchedAt,
    summary: {
      authorCount: authors.length,
      admitCount: authors.filter((row) => row.label === 'admit').length,
      watchCount: authors.filter((row) => row.label === 'watch').length,
      rejectCount: authors.filter((row) => row.label === 'reject').length,
      discoverySurfaces: intel.discovery?.surfaces ?? [],
      discoveredSubmolts: (intel.discovery?.submolts ?? []).length,
      coveredAuthors: (intel.discovery?.coverage ?? []).length,
    },
    topSources: authors.filter((row) => row.label !== 'reject').sort((a, b) => b.fitScore - a.fitScore).slice(0, 25),
    admits: authors.filter((row) => row.label === 'admit').sort((a, b) => b.fitScore - a.fitScore),
    watch: authors.filter((row) => row.label === 'watch').sort((a, b) => b.fitScore - a.fitScore).slice(0, 50),
    rejects: authors.filter((row) => row.label === 'reject').sort((a, b) => b.weakHits - a.weakHits).slice(0, 50),
  });
});

app.get('/moltbook/discovery', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    lastFetchedAt: intel.lastFetchedAt,
    surfaces: intel.discovery?.surfaces ?? [],
    errors: intel.discovery?.errors ?? [],
    submolts: intel.discovery?.submolts ?? [],
    coverage: intel.discovery?.coverage ?? [],
  });
});

app.get('/moltbook/growth', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    ...buildGrowthMetrics(intel)
  });
});

app.get('/moltbook/rising', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, rising: intel.signals?.rising ?? [] });
});

app.get('/moltbook/hot', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, hot: intel.signals?.hot ?? [] });
});

app.get('/moltbook/topics', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, topics: intel.signals?.topicClusters ?? [] });
});

app.get('/moltbook/top-submolts', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, submolts: intel.signals?.topSubmolts ?? [] });
});

app.get('/moltbook/export/authors.csv', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.type('text/csv').send(authorsToCsv(intel.authors ?? []));
});

app.get('/moltbook/export/snapshots.csv', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.type('text/csv').send(snapshotsToCsv(intel.snapshots ?? []));
});

app.get('/moltbook/export/report.json', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    intel,
    growth: buildGrowthMetrics(intel)
  });
});

app.get('/moltbook/scheduler', (_req, res) => {
  res.json({
    phase: PHASE,
    ...getSchedulerState()
  });
});

app.post('/moltbook/scheduler/start', async (req, res) => {
  const everyMs = Number(req.query.everyMs || 15 * 60 * 1000);
  const state = startScheduler(runMoltbookRefreshJob, everyMs);
  res.json({ phase: PHASE, ok: true, ...state });
});

app.post('/moltbook/scheduler/stop', (_req, res) => {
  stopScheduler();
  res.json({ phase: PHASE, ok: true, ...getSchedulerState() });
});

app.post('/moltbook/refresh', async (_req, res) => {
  res.json({
    phase: PHASE,
    ...(await runMoltbookRefreshJob())
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
