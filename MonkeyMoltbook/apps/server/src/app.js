import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getAgentStats, getNextAgentHook, getNextAgentHooks, listAgents } from './lib/agents.js';
import { authorsToCsv, buildGrowthMetrics, snapshotsToCsv } from './lib/moltbook-export.js';
import { getMoltbookIntel, getMoltbookStats, getMoltbookAgents } from './lib/moltbook.js';
import { getSchedulerState, startScheduler, stopScheduler } from './lib/moltbook-scheduler.js';
import { getResponse, getResponseStats } from './lib/responses.js';
import { isSupabaseStorageEnabled, persistMoltbookSnapshot } from './lib/supabase-storage.js';
import { addAgentReply, addLiveMessage, createLiveSession, endLiveSession, exportTranscriptText, getLiveSession, listTranscript, liveSessionsEnabled, updateLivePresence } from './lib/live-sessions.js';

export const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  else if (req.url === '/api') req.url = '/';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

const PHASE = 'Controlled Moltbook ingestion';
const DEFAULT_PRELOAD_COUNT = 3;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'monkeymoltbook-data') : path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.jsonl');
const INTEREST_FILE = path.join(DATA_DIR, 'topic-interest.jsonl');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics-events.jsonl');

function appendJsonl(filePath, payload) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`);
}

async function runMoltbookRefreshJob(meta = {}) {
  const mode = meta.mode || 'default';
  const triggerSource = meta.source || 'manual';
  const result = await getMoltbookAgents();
  const intel = await getMoltbookIntel();

  let storage = { enabled: isSupabaseStorageEnabled(), persisted: false };
  if (storage.enabled) {
    try {
      const persisted = await persistMoltbookSnapshot({
        mode,
        triggerSource,
        source: result.source,
        intel
      });
      storage = {
        enabled: true,
        persisted: Boolean(persisted?.ok),
        runId: persisted?.runId || null,
        authorRows: persisted?.authorRows || 0
      };
    } catch (error) {
      storage = {
        enabled: true,
        persisted: false,
        error: String(error?.message || error)
      };
    }
  }

  return {
    ok: true,
    mode,
    triggerSource,
    source: result.source,
    activeAgents: result.agents.length,
    lastFetchedAt: intel.lastFetchedAt,
    postCount: intel.postCount,
    authorCount: intel.authorCount,
    storage,
  };
}

async function buildSeedFallback() {
  const agents = await listAgents();
  const ranked = agents.map((agent, index) => ({
    authorId: agent.id,
    authorName: agent.name,
    archetype: agent.archetype,
    description: agent.system_prompt,
    reason: `${agent.name} is available in the local seed set while live Moltbook intel refreshes.`,
    profileUrl: null,
    topics: [agent.style, 'live', 'voice'].filter(Boolean),
    fitScore: Math.max(60, 95 - index * 3),
    signalScore: Math.max(40, 88 - index * 2),
    totalComments: 0,
    label: index < 5 ? 'admit' : 'watch',
    source: agent.source,
  }));

  return {
    topSources: ranked.slice(0, 25),
    rising: ranked.slice(0, 25),
    hot: ranked.slice(0, 25),
    topics: [
      { topic: 'live', count: ranked.length, accounts: ranked.slice(0, 5) },
      { topic: 'voice', count: ranked.length, accounts: ranked.slice(0, 5) },
      { topic: 'social', count: ranked.length, accounts: ranked.slice(0, 5) },
    ],
  };
}

app.get('/health', async (_req, res) => {
  res.json({ ok: true, app: 'MonkeyMoltbook', phase: PHASE, ...(await getAgentStats()), ...getMoltbookStats(), ...getResponseStats() });
});
app.get('/agents', async (_req, res) => res.json({ phase: PHASE, agents: await listAgents() }));
app.get('/moltbook/intel', async (_req, res) => res.json({ phase: PHASE, ...(await getMoltbookIntel()) }));
app.get('/moltbook/rankings', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, rankings: intel.rankings ?? [] }); });
app.get('/moltbook/history', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, snapshots: intel.snapshots ?? [], authorHistory: intel.authorHistory ?? {} }); });
app.get('/moltbook/report', async (_req, res) => { const intel = await getMoltbookIntel(); const authors = intel.authors ?? []; const fallback = authors.length === 0 ? await buildSeedFallback() : null; const activeAuthors = fallback?.topSources ?? authors; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, summary: { authorCount: activeAuthors.length, admitCount: activeAuthors.filter((row) => row.label === 'admit').length, watchCount: activeAuthors.filter((row) => row.label === 'watch').length, rejectCount: activeAuthors.filter((row) => row.label === 'reject').length, discoverySurfaces: intel.discovery?.surfaces ?? [], discoveredSubmolts: (intel.discovery?.submolts ?? []).length, coveredAuthors: (intel.discovery?.coverage ?? []).length }, topSources: fallback?.topSources ?? authors.filter((row) => row.label !== 'reject').sort((a, b) => b.fitScore - a.fitScore).slice(0, 25), admits: activeAuthors.filter((row) => row.label === 'admit').sort((a, b) => b.fitScore - a.fitScore), watch: activeAuthors.filter((row) => row.label === 'watch').sort((a, b) => b.fitScore - a.fitScore).slice(0, 50), rejects: activeAuthors.filter((row) => row.label === 'reject').sort((a, b) => (b.weakHits || 0) - (a.weakHits || 0)).slice(0, 50) }); });
app.get('/moltbook/discovery', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, surfaces: intel.discovery?.surfaces ?? [], errors: intel.discovery?.errors ?? [], submolts: intel.discovery?.submolts ?? [], coverage: intel.discovery?.coverage ?? [] }); });
app.get('/moltbook/growth', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, ...buildGrowthMetrics(intel) }); });
app.get('/moltbook/rising', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.rising?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, rising: fallback?.rising ?? intel.signals?.rising ?? [] }); });
app.get('/moltbook/hot', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.hot?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, hot: fallback?.hot ?? intel.signals?.hot ?? [] }); });
app.get('/moltbook/topics', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.topicClusters?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, topics: fallback?.topics ?? intel.signals?.topicClusters ?? [] }); });
app.get('/moltbook/top-submolts', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, submolts: intel.signals?.topSubmolts ?? [] }); });
app.get('/moltbook/export/authors.csv', async (_req, res) => { const intel = await getMoltbookIntel(); res.type('text/csv').send(authorsToCsv(intel.authors ?? [])); });
app.get('/moltbook/export/snapshots.csv', async (_req, res) => { const intel = await getMoltbookIntel(); res.type('text/csv').send(snapshotsToCsv(intel.snapshots ?? [])); });
app.get('/moltbook/export/report.json', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, intel, growth: buildGrowthMetrics(intel) }); });
app.get('/moltbook/scheduler', (_req, res) => res.json({ phase: PHASE, ...getSchedulerState() }));
app.get('/moltbook/storage/status', (_req, res) => res.json({ phase: PHASE, provider: 'supabase', enabled: isSupabaseStorageEnabled() }));
app.get('/moltbook/storage/debug', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    provider: 'supabase',
    enabled: isSupabaseStorageEnabled(),
    lastFetchedAt: intel.lastFetchedAt,
    authorCount: intel.authorCount,
    postCount: intel.postCount,
    topicCount: intel?.signals?.topicClusters?.length || 0,
    submoltCount: intel?.discovery?.submolts?.length || intel?.signals?.topSubmolts?.length || 0
  });
});
app.post('/moltbook/scheduler/start', async (req, res) => { const everyMs = Number(req.query.everyMs || 15 * 60 * 1000); const state = startScheduler(runMoltbookRefreshJob, everyMs); res.json({ phase: PHASE, ok: true, ...state }); });
app.post('/moltbook/scheduler/stop', (_req, res) => { stopScheduler(); res.json({ phase: PHASE, ok: true, ...getSchedulerState() }); });
app.post('/moltbook/refresh', async (req, res) => {
  const mode = String(req.query.mode || 'default');
  const source = String(req.query.source || 'manual');
  res.json({ phase: PHASE, ...(await runMoltbookRefreshJob({ mode, source })) });
});
app.post('/waitlist', (req, res) => { const { email = '', name = '', useCase = '', source = 'site' } = req.body || {}; if (!String(email).includes('@')) return res.status(400).json({ ok: false, error: 'valid_email_required' }); appendJsonl(WAITLIST_FILE, { createdAt: new Date().toISOString(), email: String(email).trim(), name: String(name).trim(), useCase: String(useCase).trim(), source }); res.json({ ok: true }); });
app.post('/topic-interest', (req, res) => { const { email = '', topics = [], note = '', source = 'site' } = req.body || {}; appendJsonl(INTEREST_FILE, { createdAt: new Date().toISOString(), email: String(email).trim(), topics: Array.isArray(topics) ? topics.map((x) => String(x)) : [], note: String(note).trim(), source }); res.json({ ok: true }); });
app.post('/analytics/event', (req, res) => { const { event = 'unknown', meta = {} } = req.body || {}; appendJsonl(ANALYTICS_FILE, { createdAt: new Date().toISOString(), event: String(event), meta }); res.json({ ok: true }); });
app.get('/hook', async (_req, res) => res.json(await getNextAgentHook()));
app.get('/preload', async (req, res) => { const requested = Number.parseInt(req.query.count, 10); const count = Number.isFinite(requested) && requested > 0 ? Math.min(requested, DEFAULT_PRELOAD_COUNT) : DEFAULT_PRELOAD_COUNT; res.json({ phase: PHASE, count, hooks: await getNextAgentHooks(count) }); });
app.get('/response', (req, res) => { const agentId = String(req.query.agentId || 'ego-destroyer'); const userText = String(req.query.userText || ''); const response = getResponse(agentId, userText); res.json({ phase: PHASE, agentId, userText, response: { type: 'response', agentId, text: response.text, validation: response.validation } }); });
app.get('/live/enabled', (_req, res) => res.json({ phase: PHASE, enabled: liveSessionsEnabled() }));
app.post('/live/session/create', async (req, res) => {
  const { agentName = 'Agent', agentAuthorId = null, entrySource = 'direct', mode = 'free', ttsEnabled = true, transcriptEnabled = true } = req.body || {};
  const created = await createLiveSession({ agentName, agentAuthorId, entrySource, mode, ttsEnabled, transcriptEnabled });
  res.json({ phase: PHASE, ok: true, ...created });
});
app.get('/live/session/:id', async (req, res) => res.json({ phase: PHASE, ok: true, ...(await getLiveSession(req.params.id)) }));
app.post('/live/session/:id/message', async (req, res) => {
  const sessionId = req.params.id;
  const text = String(req.body?.text || '');
  const state = await getLiveSession(sessionId);
  const userMessage = await addLiveMessage(sessionId, { role: 'user', messageType: 'typed', text });
  const agentReply = await addAgentReply(sessionId, text, state?.session?.agent_name || 'Agent');
  res.json({ phase: PHASE, ok: true, userMessage, agentReply });
});
app.post('/live/session/:id/presence', async (req, res) => res.json({ phase: PHASE, ok: true, presence: await updateLivePresence(req.params.id, req.body || {}) }));
app.post('/live/session/:id/end', async (req, res) => res.json({ phase: PHASE, ok: true, session: await endLiveSession(req.params.id) }));
app.get('/live/session/:id/transcript', async (req, res) => res.json({ phase: PHASE, ok: true, messages: await listTranscript(req.params.id) }));
app.get('/live/session/:id/export', async (req, res) => {
  const text = await exportTranscriptText(req.params.id);
  res.type('text/plain').send(text);
});

export default app;
