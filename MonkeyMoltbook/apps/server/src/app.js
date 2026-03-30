import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getAgentStats, getNextAgentHook, getNextAgentHooks, listAgents } from './lib/agents.js';
import { authorsToCsv, buildGrowthMetrics, snapshotsToCsv } from './lib/moltbook-export.js';
import { getMoltbookIntel, getMoltbookStats, getMoltbookAgents } from './lib/moltbook.js';
import { buildAuthorCoverage, buildCommunityIndex, buildSubmoltIndex, fetchExpandedUniverseSample, fetchCursorBackfillSample, fetchPaginatedUniverseSample } from './lib/moltbook-discovery.js';
import { getSchedulerState, startScheduler, stopScheduler } from './lib/moltbook-scheduler.js';
import { getResponse, getResponseStats } from './lib/responses.js';
import { buildSearchDocumentsFromState, getCommunityBySlug, getEntityRiskScore, getIngestionJob, isSupabaseStorageEnabled, persistMoltbookSnapshot, searchCommunities, searchCommunityEvidence, searchDocuments, upsertCommunities, upsertEntityRiskScores, upsertIngestionJob, upsertPosts, upsertSearchDocuments, upsertSubmolts, upsertAuthors } from './lib/supabase-storage.js';
import { scoreAuthorRisk, scoreCommunityRisk } from './lib/trust-score.js';
import { addAgentReply, addLiveMessage, createLiveSession, endLiveSession, exportTranscriptText, getLiveSession, listTranscript, liveSessionsEnabled, updateLivePresence } from './lib/live-sessions.js';
import { createCheckoutSession, creditsEnabled, ensureCreditProducts, getSpendRules, getWallet, grantCredits, listCreditProducts, listCreditTransactions, spendCredits } from './lib/credits.js';

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
  const ranked = agents.map((agent, index) => {
    const fitScore = Math.max(60, 95 - index * 3);
    const signalScore = Math.max(40, 88 - index * 2);
    const rise = Math.max(6, 28 - index * 2 + ((index % 4) * 3));
    const hotScore = fitScore + signalScore + ((index % 5) * 7);
    const liveReady = index % 3 !== 2;
    return {
      authorId: agent.id,
      authorName: agent.name,
      archetype: agent.archetype,
      description: agent.system_prompt,
      reason: `${agent.name} is available in the local seed set while live Moltbook intel refreshes.`,
      profileUrl: null,
      topics: [agent.style, 'live', 'voice'].filter(Boolean),
      fitScore,
      signalScore,
      totalComments: Math.max(0, 18 - index),
      rise,
      hotScore,
      liveReady,
      label: index < 5 ? 'admit' : 'watch',
      source: agent.source,
    };
  });

  const topSources = [...ranked].sort((a, b) => b.fitScore - a.fitScore || b.signalScore - a.signalScore).slice(0, 100);
  const rising = [...ranked].sort((a, b) => b.rise - a.rise || b.signalScore - a.signalScore).slice(0, 25);
  const hot = [...ranked].sort((a, b) => b.hotScore - a.hotScore || b.totalComments - a.totalComments).slice(0, 25);
  const liveReady = [...ranked].filter((row) => row.liveReady).sort((a, b) => b.signalScore - a.signalScore || b.fitScore - a.fitScore).slice(0, 25);

  return {
    topSources,
    rising,
    hot,
    liveReady,
    topics: [
      { topic: 'live', count: ranked.length, accounts: topSources.slice(0, 5) },
      { topic: 'voice', count: ranked.length, accounts: rising.slice(0, 5) },
      { topic: 'social', count: ranked.length, accounts: hot.slice(0, 5) },
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
app.get('/moltbook/report', async (_req, res) => { const intel = await getMoltbookIntel(); const authors = intel.authors ?? []; const fallback = authors.length === 0 ? await buildSeedFallback() : null; const allAuthors = fallback ? [...fallback.topSources, ...fallback.rising, ...fallback.hot].filter((row, index, arr) => arr.findIndex((x) => x.authorId === row.authorId) === index) : authors; const topSources = fallback?.topSources ?? authors.filter((row) => row.label !== 'reject').sort((a, b) => b.fitScore - a.fitScore).slice(0, 100); const activeAuthors = fallback?.topSources ?? authors; const liveReady = fallback?.liveReady ?? authors.filter((row) => row.label !== 'reject').filter((row) => (row.signalScore || 0) >= 45 || (row.fitScore || 0) >= 70).sort((a, b) => (b.signalScore || 0) - (a.signalScore || 0) || (b.fitScore || 0) - (a.fitScore || 0)).slice(0, 25); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, summary: { authorCount: activeAuthors.length, admitCount: activeAuthors.filter((row) => row.label === 'admit').length, watchCount: activeAuthors.filter((row) => row.label === 'watch').length, rejectCount: activeAuthors.filter((row) => row.label === 'reject').length, discoverySurfaces: intel.discovery?.surfaces ?? [], discoveredSubmolts: (intel.discovery?.submolts ?? []).length, coveredAuthors: (intel.discovery?.coverage ?? []).length }, topSources, liveReady, allAuthors, admits: activeAuthors.filter((row) => row.label === 'admit').sort((a, b) => b.fitScore - a.fitScore), watch: activeAuthors.filter((row) => row.label === 'watch').sort((a, b) => b.fitScore - a.fitScore).slice(0, 50), rejects: activeAuthors.filter((row) => row.label === 'reject').sort((a, b) => (b.weakHits || 0) - (a.weakHits || 0)).slice(0, 50) }); });
app.get('/moltbook/discovery', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, surfaces: intel.discovery?.surfaces ?? [], errors: intel.discovery?.errors ?? [], submolts: intel.discovery?.submolts ?? [], coverage: intel.discovery?.coverage ?? [] }); });
app.get('/moltbook/growth', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, ...buildGrowthMetrics(intel) }); });
app.get('/moltbook/rising', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.rising?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, rising: fallback?.rising ?? intel.signals?.rising ?? [] }); });
app.get('/moltbook/hot', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.hot?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, hot: fallback?.hot ?? intel.signals?.hot ?? [] }); });
app.get('/moltbook/topics', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.topicClusters?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, topics: fallback?.topics ?? intel.signals?.topicClusters ?? [] }); });
app.get('/moltbook/top-submolts', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, submolts: intel.signals?.topSubmolts ?? [] }); });
app.get('/molt-live/search', async (req, res) => {
  const intel = await getMoltbookIntel();
  const q = String(req.query.q || '').trim().toLowerCase();
  const tab = String(req.query.tab || 'all');
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));

  const authors = (intel.authors || []).filter((row) => {
    if (!q) return true;
    return `${row.authorName || ''} ${row.description || ''} ${(row.topics || []).join(' ')} ${row.reason || ''}`.toLowerCase().includes(q);
  }).slice(0, tab === 'all' ? 12 : limit).map((row) => ({
    ...row,
    trust: scoreAuthorRisk(row)
  }));

  const topics = (intel.signals?.topicClusters || []).filter((row) => {
    if (!q) return true;
    return `${row.topic || ''} ${(row.accounts || []).map((a) => a.authorName).join(' ')}`.toLowerCase().includes(q);
  }).slice(0, tab === 'all' ? 6 : limit);

  let communities = [];
  if (isSupabaseStorageEnabled() && (tab === 'all' || tab === 'groups')) {
    const rowLimit = tab === 'all' ? 6 : limit;
    const [storedRows, evidenceRows] = await Promise.all([
      searchCommunities({ query: q, limit: rowLimit }).catch(() => []),
      searchCommunityEvidence({ query: q, limit: rowLimit }).catch(() => [])
    ]);
    const mergedBySlug = new Map();
    for (const row of storedRows) {
      const base = {
        id: row.id,
        slug: row.slug || row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
        name: row.name,
        title: row.title || row.name,
        description: row.description || 'Community coverage from Moltbook.',
        sampleTitles: row?.payload?.sampleTitles || [],
        postCount: Math.round(row.post_count || 0),
        memberCount: row.member_count || 0,
        source: 'community'
      };
      mergedBySlug.set(base.slug, base);
    }
    for (const row of evidenceRows) {
      const slug = row.slug || row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
      const prev = mergedBySlug.get(slug);
      if (!prev) {
        mergedBySlug.set(slug, row);
        continue;
      }
      mergedBySlug.set(slug, {
        ...prev,
        description: prev.description || row.description,
        sampleTitles: [...new Set([...(prev.sampleTitles || []), ...(row.sampleTitles || [])])].slice(0, 8),
        postCount: Math.max(prev.postCount || 0, row.postCount || 0),
        matchedPostCount: Math.max(prev.matchedPostCount || 0, row.matchedPostCount || 0)
      });
    }
    communities = [...mergedBySlug.values()]
      .map((base) => ({ ...base, trust: scoreCommunityRisk(base) }))
      .sort((a, b) => (b.matchedPostCount || 0) - (a.matchedPostCount || 0) || (b.postCount || 0) - (a.postCount || 0))
      .slice(0, rowLimit);
  }

  const submolts = (intel.signals?.topSubmolts || intel.discovery?.submolts || []).filter((row) => {
    if (!q) return true;
    return `${row.name || ''} ${(row.sampleTitles || []).join(' ')}`.toLowerCase().includes(q);
  }).slice(0, tab === 'all' ? 6 : limit).map((row) => {
    const base = {
      slug: String(row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: row.name,
      title: row.name,
      description: row.sampleTitles?.[0] || 'A Moltbook group surfaced from active discussion coverage.',
      sampleTitles: row.sampleTitles || [],
      postCount: row.postCount || 0,
      source: 'submolt'
    };
    return {
      ...base,
      trust: scoreCommunityRisk(base)
    };
  });

  const groups = [...communities, ...submolts].filter((row, index, arr) => arr.findIndex((x) => x.slug === row.slug) === index).slice(0, tab === 'all' ? 6 : limit);

  res.json({
    phase: PHASE,
    ok: true,
    query: q,
    tab,
    results: {
      authors: tab === 'all' || tab === 'users' ? authors : [],
      topics: tab === 'all' || tab === 'topics' ? topics : [],
      communities: tab === 'all' || tab === 'groups' ? groups : [],
      submolts: []
    }
  });
});
app.get('/molt-live/community/:slug', async (req, res) => {
  const slug = String(req.params.slug || '');
  const community = await getCommunityBySlug(slug);
  if (!community) return res.status(404).json({ phase: PHASE, ok: false, error: 'community_not_found' });
  const storedTrust = community?.id ? await getEntityRiskScore('community', community.id).catch(() => null) : null;
  const computedTrust = scoreCommunityRisk({
    ...community,
    postCount: community.post_count,
    sampleTitles: community?.payload?.sampleTitles || []
  });
  res.json({ phase: PHASE, ok: true, community: { ...community, trust: storedTrust ? {
    riskScore: Number(storedTrust.risk_score || 0),
    riskLabel: storedTrust.risk_label || 'Low Risk',
    reasonShort: storedTrust.reason_short || 'low observed community risk so far',
    signalBreakdown: storedTrust.signal_breakdown || {},
    version: storedTrust.version || 'trust-v1'
  } : computedTrust } });
});
app.post('/moltbook/backfill/start', async (_req, res) => {
  const intel = await getMoltbookIntel();
  const docs = await buildSearchDocumentsFromState({
    authors: intel.authors || [],
    topics: intel.signals?.topicClusters || [],
    submolts: intel.signals?.topSubmolts || intel.discovery?.submolts || []
  });
  const job = await upsertIngestionJob({
    job_name: 'moltbook-full-backfill',
    status: 'queued',
    last_run_at: new Date().toISOString(),
    stats_json: { seededSearchDocuments: docs.length }
  });
  res.json({ phase: PHASE, ok: true, job, seededSearchDocuments: docs.length });
});
app.get('/moltbook/backfill/status', async (_req, res) => {
  const job = await getIngestionJob('moltbook-full-backfill');
  res.json({ phase: PHASE, ok: true, job });
});
app.post('/moltbook/reindex/search', async (_req, res) => {
  const intel = await getMoltbookIntel();
  const docs = await buildSearchDocumentsFromState({
    authors: intel.authors || [],
    topics: intel.signals?.topicClusters || [],
    submolts: intel.signals?.topSubmolts || intel.discovery?.submolts || []
  });
  res.json({ phase: PHASE, ok: true, indexed: docs.length });
});
app.post('/moltbook/collect/rolling', async (req, res) => {
  const perPage = Math.max(25, Math.min(Number(req.query.perPage) || 100, 200));
  const sample = await fetchCursorBackfillSample({ cursor: null, limit: perPage, steps: 1, delayMs: 0 });
  const posts = sample.posts || [];
  const authors = buildAuthorCoverage(posts);
  const communities = buildCommunityIndex(posts);
  const submolts = buildSubmoltIndex(posts);

  let upsertedAuthors = [];
  let upsertedPosts = [];
  let upsertedCommunities = [];
  let upsertedSubmolts = [];
  let searchDocs = [];

  if (isSupabaseStorageEnabled()) {
    upsertedAuthors = await upsertAuthors(authors.map((row) => ({
      authorId: row.authorId,
      authorName: row.authorName,
      description: row.description,
      isClaimed: row.isClaimed,
      isActive: row.isActive,
      karma: row.karma,
      postCount: row.observedPosts,
      totalComments: 0,
      totalScore: 0,
      signalScore: row.observedPosts,
      fitScore: row.observedPosts,
      reason: `Rolling collector coverage from stable new-feed sampling`,
    })));
    const authorIdMap = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row.id]));
    upsertedPosts = await upsertPosts(posts, authorIdMap);
    upsertedCommunities = await upsertCommunities(communities);
    upsertedSubmolts = await upsertSubmolts(submolts);
    searchDocs = await upsertSearchDocuments([
      ...upsertedAuthors.map((row) => ({ entity_type: 'author', entity_id: row.id, title: row.author_name, subtitle: row.label || 'author', body: row.description || row.reason || '', keywords: `${row.author_name} ${row.reason || ''}`, popularity_score: row.fit_score || 0, freshness_score: row.signal_score || 0, live_score: row.signal_score || 0 })),
      ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, title: row.name, subtitle: 'community', body: row.description || '', keywords: `${row.name} ${row.title || ''}`, popularity_score: row.post_count || 0, freshness_score: 0, live_score: 0 })),
      ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, title: row.name, subtitle: 'group', body: '', keywords: row.name, popularity_score: row.post_count || 0, freshness_score: row.avg_score_per_post || 0, live_score: 0 }))
    ]);
    await upsertEntityRiskScores([
      ...upsertedAuthors.map((row) => ({ entity_type: 'author', entity_id: row.id, ...scoreAuthorRisk({ authorName: row.author_name, description: row.description, reason: row.reason, postCount: row.post_count, karma: row.karma }) })),
      ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.title, description: row.description, postCount: row.post_count }) })),
      ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.name, description: '', postCount: row.post_count }) }))
    ]);
  }

  const job = await upsertIngestionJob({
    job_name: 'moltbook-rolling-collector',
    status: 'ok',
    cursor_json: { mode: 'rolling', perPage, nextCursor: sample.nextCursor || null, hasMore: !!sample.hasMore },
    last_run_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    stats_json: {
      sampledPosts: posts.length,
      authors: authors.length,
      communities: communities.length,
      submolts: submolts.length,
      indexed: searchDocs.length,
      cursorStats: sample.cursorStats || [],
      errors: sample.errors || []
    }
  });

  res.json({ phase: PHASE, ok: true, perPage, sampledPosts: posts.length, authors: authors.length, communities: communities.length, submolts: submolts.length, indexed: searchDocs.length, nextCursor: sample.nextCursor || null, hasMore: !!sample.hasMore, errors: sample.errors || [], job });
});
app.post('/moltbook/ingest/expanded', async (req, res) => {
  const mode = String(req.query.mode || 'cursor');
  const pages = Math.max(1, Math.min(Number(req.query.pages) || 3, 10));
  const perPage = Math.max(25, Math.min(Number(req.query.perPage) || (mode === 'cursor' ? 50 : 100), 200));
  const steps = Math.max(1, Math.min(Number(req.query.steps) || 5, 20));
  const delayMs = Math.max(0, Math.min(Number(req.query.delayMs) || 750, 5000));
  const savedJob = mode === 'cursor' ? await getIngestionJob('moltbook-expanded-ingest') : null;
  const savedCursor = savedJob?.cursor_json?.nextCursor || null;
  const cursor = req.query.cursor ? String(req.query.cursor) : savedCursor;

  const sample = mode === 'page'
    ? await fetchPaginatedUniverseSample({ pages, perPage })
    : await fetchCursorBackfillSample({ cursor, limit: perPage, steps, delayMs });

  const posts = sample.posts || [];
  const authors = buildAuthorCoverage(posts);
  const communities = buildCommunityIndex(posts);
  const submolts = buildSubmoltIndex(posts);

  let upsertedAuthors = [];
  let upsertedPosts = [];
  let upsertedCommunities = [];
  let upsertedSubmolts = [];
  let searchDocs = [];

  if (isSupabaseStorageEnabled()) {
    upsertedAuthors = await upsertAuthors(authors.map((row) => ({
      authorId: row.authorId,
      authorName: row.authorName,
      description: row.description,
      isClaimed: row.isClaimed,
      isActive: row.isActive,
      karma: row.karma,
      postCount: row.observedPosts,
      totalComments: 0,
      totalScore: 0,
      signalScore: row.observedPosts,
      fitScore: row.observedPosts,
      reason: `Expanded coverage from public Moltbook sampling across ${row.surfaces.join(', ')}`,
    })));
    const authorIdMap = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row.id]));
    upsertedPosts = await upsertPosts(posts, authorIdMap);
    upsertedCommunities = await upsertCommunities(communities);
    upsertedSubmolts = await upsertSubmolts(submolts);
    searchDocs = await upsertSearchDocuments([
      ...upsertedAuthors.map((row) => ({ entity_type: 'author', entity_id: row.id, title: row.author_name, subtitle: row.label || 'author', body: row.description || row.reason || '', keywords: `${row.author_name} ${row.reason || ''}`, popularity_score: row.fit_score || 0, freshness_score: row.signal_score || 0, live_score: row.signal_score || 0 })),
      ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, title: row.name, subtitle: 'community', body: row.description || '', keywords: `${row.name} ${row.title || ''}`, popularity_score: row.post_count || 0, freshness_score: 0, live_score: 0 })),
      ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, title: row.name, subtitle: 'group', body: '', keywords: row.name, popularity_score: row.post_count || 0, freshness_score: row.avg_score_per_post || 0, live_score: 0 }))
    ]);
    await upsertEntityRiskScores([
      ...upsertedAuthors.map((row) => ({ entity_type: 'author', entity_id: row.id, ...scoreAuthorRisk({ authorName: row.author_name, description: row.description, reason: row.reason, postCount: row.post_count, karma: row.karma }) })),
      ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.title, description: row.description, postCount: row.post_count }) })),
      ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.name, description: '', postCount: row.post_count }) }))
    ]);
  }

  const nextCursor = sample.nextCursor || null;
  const job = await upsertIngestionJob({
    job_name: 'moltbook-expanded-ingest',
    status: 'ok',
    cursor_json: mode === 'cursor' ? { mode, nextCursor, steps, perPage, hasMore: !!sample.hasMore } : { mode, pages, perPage },
    last_run_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    stats_json: {
      sampledPosts: posts.length,
      authors: authors.length,
      communities: communities.length,
      submolts: submolts.length,
      indexed: searchDocs.length,
      pageStats: sample.pageStats || [],
      cursorStats: sample.cursorStats || [],
      errors: sample.errors || []
    }
  });

  res.json({ phase: PHASE, ok: true, mode, pages, perPage, steps, delayMs, resumedFromSavedCursor: mode === 'cursor' && !req.query.cursor && !!savedCursor, nextCursor, hasMore: !!sample.hasMore, sampledPosts: posts.length, authors: authors.length, communities: communities.length, submolts: submolts.length, indexed: searchDocs.length, pageStats: sample.pageStats || [], cursorStats: sample.cursorStats || [], errors: sample.errors || [], job });
});
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
app.get('/credits/enabled', (_req, res) => res.json({ phase: PHASE, enabled: creditsEnabled() }));
app.get('/wallet', async (req, res) => {
  const userId = String(req.query.userId || 'demo-user');
  const wallet = await getWallet(userId);
  const transactions = await listCreditTransactions(userId);
  res.json({ phase: PHASE, ok: true, wallet, transactions, spendRules: getSpendRules() });
});
app.get('/credits/products', async (_req, res) => {
  await ensureCreditProducts();
  res.json({ phase: PHASE, ok: true, products: await listCreditProducts() });
});
app.post('/credits/checkout', async (req, res) => {
  const { productCode, userId = 'demo-user' } = req.body || {};
  res.json({ phase: PHASE, ...(await createCheckoutSession({ productCode, userId })) });
});
app.post('/credits/grant', async (req, res) => {
  const { userId = 'demo-user', amount = 25, reason = 'manual-grant', sessionId = null } = req.body || {};
  res.json({ phase: PHASE, ok: true, ...(await grantCredits({ userId, amount, reason, sessionId })) });
});
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
app.post('/live/session/:id/spend', async (req, res) => {
  const { actionCode, userId = 'demo-user' } = req.body || {};
  const result = await spendCredits({ userId, sessionId: req.params.id, actionCode });
  if (!result.ok) return res.status(400).json({ phase: PHASE, ...result });
  await addLiveMessage(req.params.id, {
    role: 'system',
    messageType: 'credit-event',
    text: result.launchFree ? `${actionCode} unlocked free during launch. Credits are not required right now.` : `${actionCode} unlocked for ${result.cost} credits. Balance is now ${result.balance}.`,
    meta: { actionCode, cost: result.cost, balance: result.balance, launchFree: !!result.launchFree, normalCost: result.normalCost || result.cost }
  });
  res.json({ phase: PHASE, ...result });
});
app.get('/live/session/:id/transcript', async (req, res) => res.json({ phase: PHASE, ok: true, messages: await listTranscript(req.params.id) }));
app.get('/live/session/:id/export', async (req, res) => {
  const text = await exportTranscriptText(req.params.id);
  res.type('text/plain').send(text);
});

export default app;
