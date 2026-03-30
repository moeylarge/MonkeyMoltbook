const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getRestUrl(table, query = '') {
  const base = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

function getHeaders(prefer = '') {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

export function isSupabaseStorageEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseFetch(table, options = {}) {
  const { method = 'GET', query = '', body, prefer = '' } = options;
  if (!isSupabaseStorageEnabled()) {
    return { ok: false, disabled: true, data: null };
  }

  const response = await fetch(getRestUrl(table, query), {
    method,
    headers: getHeaders(prefer),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!response.ok) {
    throw new Error(`supabase_${table}_${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }

  return { ok: true, data };
}

function authorProfileUrl(row) {
  return row?.authorName ? `https://www.moltbook.com/u/${encodeURIComponent(row.authorName)}` : null;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeText(value) {
  if (value === undefined || value === null) return null;
  return String(value)
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

function sanitizeForJson(value) {
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeForJson(v)])
    );
  }
  if (typeof value === 'string') return safeText(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  return value ?? null;
}

export async function createIngestRun(payload) {
  const result = await supabaseFetch('raw_ingest_runs', {
    method: 'POST',
    body: payload,
    prefer: 'return=representation'
  });
  return result.data?.[0] || null;
}

function chunkArray(items, size = 50) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function upsertAuthors(authors) {
  if (!authors?.length) return [];
  const rows = authors.map((row) => ({
    source_author_id: safeText(row.authorId) || safeText(row.source_author_id) || null,
    author_name: safeText(row.authorName) || safeText(row.author_name),
    profile_url: safeText(row.profileUrl) || safeText(row.profile_url) || authorProfileUrl(row),
    description: safeText(row.description),
    is_claimed: Boolean(row.isClaimed ?? row.is_claimed),
    is_active: Boolean(row.isActive ?? row.is_active),
    karma: safeNumber(row.karma),
    post_count: safeNumber(row.postCount ?? row.post_count),
    total_score: safeNumber(row.totalScore ?? row.total_score),
    total_comments: safeNumber(row.totalComments ?? row.total_comments),
    avg_score_per_post: safeNumber(row.avgScorePerPost ?? row.avg_score_per_post),
    avg_comments_per_post: safeNumber(row.avgCommentsPerPost ?? row.avg_comments_per_post),
    signal_score: safeNumber(row.signalScore ?? row.signal_score),
    fit_score: safeNumber(row.fitScore ?? row.fit_score),
    label: safeText(row.label),
    reason: safeText(row.reason),
    latest_post_at: row.latestPostAt || row.latest_post_at || null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })).filter((row) => row.author_name);

  const merged = [];
  for (const batch of chunkArray(rows, 50)) {
    const result = await supabaseFetch('authors', {
      method: 'POST',
      query: 'on_conflict=author_name',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    merged.push(...(result.data || []));
  }
  return merged;
}

export async function replaceRankingSnapshots(runId, type, rows, authorIdMap) {
  if (!runId || !rows?.length) return [];
  const payload = rows.map((row, index) => ({
    run_id: runId,
    ranking_type: type,
    author_id: authorIdMap.get(String(row.authorId || '')) || null,
    position: index + 1,
    fit_score: safeNumber(row.fitScore),
    signal_score: safeNumber(row.signalScore)
  }));
  for (const batch of chunkArray(payload, 50)) {
    await supabaseFetch('ranking_snapshots', {
      method: 'POST',
      body: batch,
      prefer: 'return=minimal'
    });
  }
  return [];
}

export async function replaceTopicClusters(runId, topics) {
  if (!runId || !topics?.length) return [];
  const payload = topics.map((row) => ({
    run_id: runId,
    topic: row.topic,
    count: safeNumber(row.count) || 0,
    payload: sanitizeForJson(row)
  }));
  for (const batch of chunkArray(payload, 50)) {
    await supabaseFetch('topic_clusters', {
      method: 'POST',
      body: batch,
      prefer: 'return=minimal'
    });
  }
  return [];
}

export async function storeRawAuthorSnapshots(runId, authors) {
  if (!runId || !authors?.length) return [];
  const payload = authors.map((row) => ({
    run_id: runId,
    source_author_id: safeText(row.authorId) || null,
    author_name: safeText(row.authorName) || 'unknown',
    profile_url: safeText(row.profileUrl) || authorProfileUrl(row),
    payload: sanitizeForJson(row)
  }));
  for (const batch of chunkArray(payload, 50)) {
    await supabaseFetch('raw_author_snapshots', {
      method: 'POST',
      body: batch,
      prefer: 'return=minimal'
    });
  }
  return [];
}

export async function upsertSubmolts(submolts) {
  if (!submolts?.length) return [];
  const rows = submolts.map((row) => ({
    name: safeText(row.name),
    url: safeText(row.url) || (row.name ? `https://www.moltbook.com/m/${encodeURIComponent(row.name)}` : null),
    post_count: safeNumber(row.postCount ?? row.post_count),
    avg_score_per_post: safeNumber(row.avgScorePerPost ?? row.avg_score_per_post),
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })).filter((row) => row.name);

  const merged = [];
  for (const batch of chunkArray(rows, 50)) {
    const result = await supabaseFetch('submolts', {
      method: 'POST',
      query: 'on_conflict=name',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    merged.push(...(result.data || []));
  }
  return merged;
}

export async function upsertPosts(posts, authorIdMap) {
  if (!posts?.length) return [];
  const rows = posts.map((post) => {
    const derivedSubmoltName = safeText(
      post.submolt_name
      || post.submoltName
      || (typeof post.submolt === 'string' ? post.submolt : null)
      || post.submolt?.name
      || post.submolt?.slug
      || post.submolt?.title
      || post.submolt?.display_name
    );
    return ({
      source_post_id: safeText(post.id),
      source_author_id: safeText(post.author?.id),
      author_id: authorIdMap.get(String(post.author?.id || '')) || null,
      author_name: safeText(post.author?.name),
      title: safeText(post.title),
      snippet: safeText(post.content),
      url: safeText(post.url),
      submolt_name: derivedSubmoltName,
      score: safeNumber(post.score),
      comment_count: safeNumber(post.comment_count ?? post.commentCount),
      created_at_source: post.created_at || post.createdAt || null,
      payload: sanitizeForJson(post)
    });
  }).filter((row) => row.source_post_id || row.title);

  const merged = [];
  for (const batch of chunkArray(rows, 50)) {
    const result = await supabaseFetch('posts', {
      method: 'POST',
      query: 'on_conflict=source_post_id',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    merged.push(...(result.data || []));
  }
  return merged;
}

export async function storeRawPostSnapshots(runId, posts) {
  if (!runId || !posts?.length) return [];
  const payload = posts.map((post) => ({
    run_id: runId,
    source_post_id: safeText(post.id),
    source_author_id: safeText(post.author?.id),
    submolt_name: safeText(post.submolt_name || post.submoltName),
    payload: sanitizeForJson(post)
  }));
  for (const batch of chunkArray(payload, 50)) {
    await supabaseFetch('raw_post_snapshots', {
      method: 'POST',
      body: batch,
      prefer: 'return=minimal'
    });
  }
  return [];
}

export async function storeRawSubmoltSnapshots(runId, submolts) {
  if (!runId || !submolts?.length) return [];
  const payload = submolts.map((row) => ({
    run_id: runId,
    submolt_name: safeText(row.name) || 'unknown',
    payload: sanitizeForJson(row)
  }));
  for (const batch of chunkArray(payload, 50)) {
    await supabaseFetch('raw_submolt_snapshots', {
      method: 'POST',
      body: batch,
      prefer: 'return=minimal'
    });
  }
  return [];
}

export async function replaceSubmoltSnapshots(runId, submolts, submoltIdMap) {
  if (!runId || !submolts?.length) return [];
  const payload = submolts.map((row, index) => ({
    run_id: runId,
    submolt_id: submoltIdMap.get(String(row.name || '')) || null,
    position: index + 1,
    post_count: safeNumber(row.postCount ?? row.post_count),
    avg_score_per_post: safeNumber(row.avgScorePerPost ?? row.avg_score_per_post),
    payload: sanitizeForJson(row)
  }));
  for (const batch of chunkArray(payload, 50)) {
    await supabaseFetch('submolt_snapshots', {
      method: 'POST',
      body: batch,
      prefer: 'return=minimal'
    });
  }
  return [];
}

export async function persistMoltbookSnapshot({ mode = 'default', triggerSource = 'manual', source = 'unknown', intel }) {
  if (!isSupabaseStorageEnabled()) {
    return { ok: false, disabled: true };
  }

  const authors = intel?.authors || [];
  const posts = intel?.posts || [];
  const submolts = intel?.discovery?.submolts || intel?.signals?.topSubmolts || [];
  const run = await createIngestRun({
    mode,
    trigger_source: triggerSource,
    source,
    status: 'ok',
    author_count: Number(intel?.authorCount || authors.length || 0),
    post_count: Number(intel?.postCount || 0),
    submolt_count: Number(intel?.discovery?.submolts?.length || intel?.signals?.topSubmolts?.length || 0),
    payload_summary: sanitizeForJson({
      lastFetchedAt: intel?.lastFetchedAt || null,
      discoverySurfaces: intel?.discovery?.surfaces || [],
      errors: intel?.discovery?.errors || []
    })
  });

  const upsertedAuthors = await upsertAuthors(authors);
  const authorIdMap = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row.id]));

  const upsertedSubmolts = await upsertSubmolts(submolts);
  const submoltIdMap = new Map(upsertedSubmolts.map((row) => [String(row.name || ''), row.id]));

  await storeRawAuthorSnapshots(run?.id, authors.slice(0, 100));
  await storeRawPostSnapshots(run?.id, posts.slice(0, 200));
  await storeRawSubmoltSnapshots(run?.id, submolts.slice(0, 100));
  await upsertPosts(posts.slice(0, 300), authorIdMap);
  await replaceRankingSnapshots(run?.id, 'top', authors.slice(0, 25), authorIdMap);
  await replaceRankingSnapshots(run?.id, 'rising', intel?.signals?.rising || [], authorIdMap);
  await replaceRankingSnapshots(run?.id, 'hot', intel?.signals?.hot || [], authorIdMap);
  await replaceTopicClusters(run?.id, intel?.signals?.topicClusters || []);
  await replaceSubmoltSnapshots(run?.id, submolts.slice(0, 100), submoltIdMap);

  return {
    ok: true,
    runId: run?.id || null,
    authorRows: upsertedAuthors.length,
    postRows: Math.min(posts.length, 300),
    submoltRows: upsertedSubmolts.length,
    mode,
    triggerSource
  };
}

export async function upsertSearchDocuments(rows) {
  if (!rows?.length) return [];
  const payload = rows.map((row) => ({
    entity_type: safeText(row.entity_type || row.entityType),
    entity_id: row.entity_id || row.entityId,
    title: safeText(row.title),
    subtitle: safeText(row.subtitle),
    body: safeText(row.body),
    keywords: safeText(row.keywords),
    popularity_score: safeNumber(row.popularity_score ?? row.popularityScore) || 0,
    freshness_score: safeNumber(row.freshness_score ?? row.freshnessScore) || 0,
    live_score: safeNumber(row.live_score ?? row.liveScore) || 0,
    updated_at: new Date().toISOString()
  })).filter((row) => row.entity_type && row.entity_id && row.title);

  const merged = [];
  for (const batch of chunkArray(payload, 50)) {
    const result = await supabaseFetch('search_documents', {
      method: 'POST',
      query: 'on_conflict=entity_type,entity_id',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    merged.push(...(result.data || []));
  }
  return merged;
}

export async function searchDocuments({ query, entityType, limit = 20 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const safeQuery = encodeURIComponent(`%${String(query || '').trim()}%`);
  const clauses = [
    `or=(title.ilike.${safeQuery},subtitle.ilike.${safeQuery},keywords.ilike.${safeQuery},body.ilike.${safeQuery})`,
    `limit=${Math.max(1, Math.min(Number(limit) || 20, 50))}`,
    'order=popularity_score.desc'
  ];
  if (entityType) clauses.unshift(`entity_type=eq.${encodeURIComponent(entityType)}`);
  const result = await supabaseFetch('search_documents', { query: clauses.join('&') });
  return result.data || [];
}

export async function upsertCommunities(rows) {
  if (!rows?.length) return [];

  const names = [...new Set(rows.map((row) => safeText(row.name)).filter(Boolean))];
  const existing = new Map();
  for (const batch of chunkArray(names, 20)) {
    const orClause = batch.map((name) => `name.eq.${encodeURIComponent(name)}`).join(',');
    const result = await supabaseFetch('communities', {
      query: `or=(${orClause})&select=*`
    }).catch(() => ({ data: [] }));
    for (const row of result.data || []) existing.set(String(row.name || ''), row);
  }

  const payload = rows.map((row) => {
    const name = safeText(row.name);
    const prev = existing.get(String(name || '')) || null;
    const prevPayload = prev?.payload || {};
    const prevTitles = Array.isArray(prevPayload.sampleTitles) ? prevPayload.sampleTitles : [];
    const nextTitles = Array.isArray(row.sampleTitles) ? row.sampleTitles : [];
    const mergedTitles = [...new Set([...prevTitles, ...nextTitles].filter(Boolean).map((x) => safeText(x)).filter(Boolean))].slice(0, 8);
    const nextPostCount = safeNumber(row.post_count ?? row.postCount) || 0;
    const prevPostCount = safeNumber(prev?.post_count) || 0;

    return {
      source_community_id: safeText(row.source_community_id || row.sourceCommunityId || row.id) || prev?.source_community_id || null,
      slug: safeText(row.slug || row.name) || prev?.slug || null,
      name,
      title: safeText(row.title) || prev?.title || name,
      description: safeText(row.description) || prev?.description || null,
      member_count: safeNumber(row.member_count ?? row.memberCount) ?? safeNumber(prev?.member_count),
      post_count: Math.max(prevPostCount, nextPostCount),
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload: sanitizeForJson({
        ...(prevPayload || {}),
        ...row,
        sampleTitles: mergedTitles
      })
    };
  }).filter((row) => row.name);

  const merged = [];
  for (const batch of chunkArray(payload, 50)) {
    const result = await supabaseFetch('communities', {
      method: 'POST',
      query: 'on_conflict=name',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    merged.push(...(result.data || []));
  }
  return merged;
}

export async function getCommunityBySlug(slug) {
  if (!isSupabaseStorageEnabled()) return null;
  const result = await supabaseFetch('communities', { query: `slug=eq.${encodeURIComponent(slug)}&select=*` });
  return result.data?.[0] || null;
}

export async function searchCommunities({ query, limit = 20 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const q = String(query || '').trim();
  const safeQuery = encodeURIComponent(`%${q}%`);
  const clauses = [
    'select=*',
    `limit=${Math.max(1, Math.min(Number(limit) || 20, 50))}`,
    'order=post_count.desc.nullslast'
  ];
  if (q) clauses.unshift(`or=(name.ilike.${safeQuery},title.ilike.${safeQuery},description.ilike.${safeQuery},slug.ilike.${safeQuery})`);
  const result = await supabaseFetch('communities', { query: clauses.join('&') });
  return result.data || [];
}

export async function searchCommunityEvidence({ query, limit = 20 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const mintIntentTerms = new Set(['mint', 'mbc20', 'mbc-20', 'hackai', 'bot', 'wang']);
  const isMintIntent = mintIntentTerms.has(q.toLowerCase());
  const safeQuery = encodeURIComponent(`%${q}%`);
  const mintClauses = [
    'select=submolt_name,title,snippet,score,comment_count,payload',
    `or=(submolt_name.ilike.%25mbc20%25,submolt_name.ilike.%25mbc-20%25,title.ilike.%25hackai%25,title.ilike.%25bot%25,title.ilike.%25wang%25,title.ilike.%25mint%25,snippet.ilike.%25mbc-20%25,snippet.ilike.%25mbc20%25,snippet.ilike.%25hackai%25,snippet.ilike.%25bot%25,snippet.ilike.%25wang%25,snippet.ilike.%25\"op\":\"mint\"%25,snippet.ilike.%25mint%25)` ,
    `limit=${Math.max(10, Math.min(Number(limit) * 12 || 60, 240))}`,
    'order=score.desc.nullslast'
  ];
  const clauses = isMintIntent ? mintClauses : [
    'select=submolt_name,title,snippet,score,comment_count,payload',
    `or=(submolt_name.ilike.${safeQuery},title.ilike.${safeQuery},snippet.ilike.${safeQuery})`,
    `limit=${Math.max(5, Math.min(Number(limit) * 10 || 50, 200))}`,
    'order=score.desc.nullslast'
  ];
  const result = await supabaseFetch('posts', { query: clauses.join('&') });
  const rows = result.data || [];
  const grouped = new Map();
  for (const row of rows) {
    const name = safeText(row.submolt_name);
    if (!name) continue;
    if (!grouped.has(name)) {
      grouped.set(name, {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: name,
        description: safeText(row.snippet) || safeText(row.title) || 'Community evidence from post matches.',
        sampleTitles: [],
        postCount: 0,
        matchedPostCount: 0,
        totalScore: 0,
        specializedEvidence: 0,
        source: 'post-evidence'
      });
    }
    const entry = grouped.get(name);
    const text = `${safeText(row.title)} ${safeText(row.snippet)}`.toLowerCase();
    entry.matchedPostCount += 1;
    entry.postCount = Math.max(entry.postCount, entry.matchedPostCount);
    entry.totalScore += safeNumber(row.score) || 0;
    const strongMintPattern = /(mbc20|mbc-20|\"op\":\"mint\"|\"p\":\"mbc-20\"|mbc20\.xyz)/.test(text)
      || (/hackai/.test(text) && /mint/.test(text))
      || (/\bbot\b/.test(text) && /mint|\"tick\"/.test(text))
      || (/\bwang\b/.test(text) && /mint|claim|\"tick\"/.test(text));
    if (strongMintPattern) entry.specializedEvidence += 1;
    if (row.title && entry.sampleTitles.length < 8) entry.sampleTitles.push(safeText(row.title));
  }
  return [...grouped.values()]
    .sort((a, b) => b.specializedEvidence - a.specializedEvidence || b.matchedPostCount - a.matchedPostCount || b.totalScore - a.totalScore)
    .slice(0, Math.max(1, Math.min(Number(limit) || 20, 50)));
}

export async function searchAuthors({ query, limit = 20 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const q = String(query || '').trim();
  const safeQuery = encodeURIComponent(`%${q}%`);
  const clauses = [
    'select=*',
    `limit=${Math.max(1, Math.min(Number(limit) || 20, 50))}`,
    'order=post_count.desc.nullslast,signal_score.desc.nullslast,fit_score.desc.nullslast'
  ];
  if (q) clauses.unshift(`or=(author_name.ilike.${safeQuery},description.ilike.${safeQuery},reason.ilike.${safeQuery})`);
  const result = await supabaseFetch('authors', { query: clauses.join('&') });
  return result.data || [];
}

export async function getAuthorsBySourceIds(sourceIds = []) {
  if (!isSupabaseStorageEnabled()) return [];
  const ids = [...new Set((sourceIds || []).map((v) => String(v || '').trim()).filter(Boolean))];
  if (!ids.length) return [];
  const clauses = [
    'select=*',
    `or=(${ids.map((id) => `source_author_id.eq.${encodeURIComponent(id)}`).join(',')})`,
    `limit=${Math.max(1, Math.min(ids.length, 200))}`
  ];
  const result = await supabaseFetch('authors', { query: clauses.join('&') });
  return result.data || [];
}

export async function getAuthorsByIds(authorIds = []) {
  if (!isSupabaseStorageEnabled()) return [];
  const ids = [...new Set((authorIds || []).map((v) => String(v || '').trim()).filter(Boolean))];
  if (!ids.length) return [];
  const clauses = [
    'select=*',
    `or=(${ids.map((id) => `id.eq.${encodeURIComponent(id)}`).join(',')})`,
    `limit=${Math.max(1, Math.min(ids.length, 500))}`
  ];
  const result = await supabaseFetch('authors', { query: clauses.join('&') });
  return result.data || [];
}

export async function searchAuthorEvidence({ query, limit = 20 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const normalized = q.toLowerCase();
  const safeQuery = encodeURIComponent(`%${q}%`);
  const suspiciousClausesByIntent = {
    wallet: `or=(snippet.ilike.%25wallet%20connect%25,snippet.ilike.%25connect%20wallet%25,snippet.ilike.%25verify%20your%20wallet%25,snippet.ilike.%25wallet%20recovery%25,snippet.ilike.%25recover%20your%20wallet%25,snippet.ilike.%25import%20your%20wallet%25,snippet.ilike.%25wallet%20drainer%25,snippet.ilike.%25clipboard%20drainer%25,snippet.ilike.%25seed%20phrase%25,snippet.ilike.%25private%20key%25,snippet.ilike.%25connect%20wallet%20to%20claim%25,snippet.ilike.%25redeem%20your%20wallet%25,snippet.ilike.%25wallet%20verification%25)`,
    'seed phrase': `or=(title.ilike.%25seed%20phrase%25,snippet.ilike.%25seed%20phrase%25,snippet.ilike.%25private%20key%25,snippet.ilike.%25wallet%20recovery%25,snippet.ilike.%25recover%20your%20wallet%25,snippet.ilike.%25recovery%20phrase%25,snippet.ilike.%25secret%20phrase%25,snippet.ilike.%25import%20your%20wallet%25,snippet.ilike.%25connect%20wallet%20to%20claim%25)`,
    drainer: `or=(title.ilike.%25drainer%25,snippet.ilike.%25drainer%25,snippet.ilike.%25wallet%20drainer%25,snippet.ilike.%25clipboard%20drainer%25,snippet.ilike.%25stealer%25,snippet.ilike.%25seed%20phrase%25,snippet.ilike.%25private%20key%25,snippet.ilike.%25drain%20your%20wallet%25)`,
    malware: `or=(title.ilike.%25malware%25,snippet.ilike.%25malware%25,snippet.ilike.%25virus%25,snippet.ilike.%25keygen%25,snippet.ilike.%25stealer%25,snippet.ilike.%25rat%25,snippet.ilike.%25remote%20access%20trojan%25)`,
    exploit: `or=(snippet.ilike.%25wallet%20exploit%25,snippet.ilike.%25verify%20your%20wallet%25,snippet.ilike.%25connect%20wallet%20to%20claim%25,snippet.ilike.%25wallet%20drainer%25,snippet.ilike.%25clipboard%20drainer%25,snippet.ilike.%25seed%20phrase%25,snippet.ilike.%25private%20key%25,snippet.ilike.%25stealer%25,snippet.ilike.%25recover%20your%20wallet%25)`,
    claim: `or=(snippet.ilike.%25claim%20now%25,snippet.ilike.%25claim%20your%20reward%25,snippet.ilike.%25claim%20your%20tokens%25,snippet.ilike.%25claim%20your%20airdrop%25,snippet.ilike.%25connect%20wallet%20to%20claim%25,snippet.ilike.%25claim%20airdrop%25,snippet.ilike.%25airdrop%20claim%25,snippet.ilike.%25verify%20your%20wallet%25,snippet.ilike.%25wallet%20connect%25,snippet.ilike.%25redeem%20now%25,snippet.ilike.%25redeem%20your%20reward%25,snippet.ilike.%25unlock%20your%20reward%25,snippet.ilike.%25check%20your%20eligibility%25,snippet.ilike.%25eligible%20for%20airdrop%25)`,
    airdrop: `or=(title.ilike.%25airdrop%25,snippet.ilike.%25airdrop%25,snippet.ilike.%25claim%20your%20reward%25,snippet.ilike.%25claim%20your%20airdrop%25,snippet.ilike.%25connect%20wallet%20to%20claim%25,snippet.ilike.%25wallet%20connect%25,snippet.ilike.%25seed%20phrase%25,snippet.ilike.%25eligible%20for%20airdrop%25,snippet.ilike.%25check%20your%20eligibility%25)`
  };
  const intentClause = suspiciousClausesByIntent[normalized] || `or=(author_name.ilike.${safeQuery},title.ilike.${safeQuery},snippet.ilike.${safeQuery})`;
  const clauses = [
    'select=author_name,source_author_id,title,snippet,score,comment_count,submolt_name,payload',
    intentClause,
    `limit=${Math.max(8, Math.min(Number(limit) * 12 || 60, 240))}`,
    'order=score.desc.nullslast'
  ];
  const result = await supabaseFetch('posts', { query: clauses.join('&') });
  const rows = result.data || [];
  const grouped = new Map();
  for (const row of rows) {
    const authorName = safeText(row.author_name);
    if (!authorName) continue;
    const key = safeText(row.source_author_id) || authorName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        sourceAuthorId: safeText(row.source_author_id) || null,
        authorName,
        description: safeText(row.payload?.author?.description) || '',
        matchedPostCount: 0,
        totalScore: 0,
        suspiciousHits: 0,
        phraseDiversity: new Set(),
        sampleTitles: [],
        sampleSnippets: [],
        submolts: new Set(),
        source: 'post-evidence'
      });
    }
    const entry = grouped.get(key);
    const text = `${safeText(row.title)} ${safeText(row.snippet)}`.toLowerCase();
    entry.matchedPostCount += 1;
    entry.totalScore += safeNumber(row.score) || 0;
    if (row.submolt_name) entry.submolts.add(safeText(row.submolt_name));
    if (row.title && entry.sampleTitles.length < 6) entry.sampleTitles.push(safeText(row.title));
    if (row.snippet && entry.sampleSnippets.length < 4) entry.sampleSnippets.push(safeText(row.snippet).slice(0, 220));

    const phrasePatterns = [
      'wallet connect', 'connect wallet', 'verify your wallet', 'wallet verification', 'wallet recovery', 'recover your wallet', 'import your wallet',
      'seed phrase', 'secret phrase', 'private key', 'connect wallet to claim', 'wallet drainer', 'clipboard drainer', 'drain your wallet',
      'remote access trojan', 'keygen', 'stealer', 'claim your reward now', 'claim your reward', 'claim your tokens', 'claim your airdrop',
      'redeem now', 'redeem your reward', 'unlock your reward', 'check your eligibility', 'eligible for airdrop'
    ];
    for (const phrase of phrasePatterns) {
      if (text.includes(phrase)) entry.phraseDiversity.add(phrase);
    }

    if (/seed phrase|secret phrase|private key|wallet recovery|recover your wallet|import your wallet|connect wallet to claim|wallet drainer|clipboard drainer|drain your wallet|remote access trojan|keygen|stealer|claim your reward now|claim your reward|claim your tokens|claim your airdrop|redeem now|redeem your reward|unlock your reward|verify your wallet|wallet connect|wallet verification|check your eligibility|eligible for airdrop/.test(text)) {
      entry.suspiciousHits += 2;
    } else if (normalized && text.includes(normalized)) {
      entry.suspiciousHits += 1;
    }
  }
  const minHitsByIntent = {
    wallet: 2,
    'seed phrase': 2,
    drainer: 2,
    malware: 1,
    exploit: 2,
    claim: 2,
    airdrop: 1
  };
  const minHits = minHitsByIntent[normalized] || 1;
  return [...grouped.values()].map((row) => ({
    ...row,
    submolts: [...row.submolts].filter(Boolean),
    phraseDiversity: row.phraseDiversity.size
  }))
    .filter((row) => row.suspiciousHits >= minHits)
    .sort((a, b) => b.phraseDiversity - a.phraseDiversity || b.suspiciousHits - a.suspiciousHits || b.matchedPostCount - a.matchedPostCount || b.totalScore - a.totalScore)
    .slice(0, Math.max(1, Math.min(Number(limit) || 20, 50)));
}

export async function upsertEntityRiskScores(rows) {
  if (!rows?.length) return [];
  const payload = rows.map((row) => ({
    entity_type: safeText(row.entity_type || row.entityType),
    entity_id: safeText(row.entity_id || row.entityId),
    version: safeText(row.version) || 'trust-v1',
    risk_score: safeNumber(row.risk_score ?? row.riskScore) || 0,
    risk_label: safeText(row.risk_label || row.riskLabel) || 'Low Risk',
    reason_short: safeText(row.reason_short || row.reasonShort),
    signal_breakdown: sanitizeForJson(row.signal_breakdown || row.signalBreakdown || {}),
    evidence_summary: sanitizeForJson(row.evidence_summary || row.evidenceSummary || null),
    scored_at: row.scored_at || row.scoredAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  })).filter((row) => row.entity_type && row.entity_id);

  const merged = [];
  for (const batch of chunkArray(payload, 50)) {
    const result = await supabaseFetch('entity_risk_scores', {
      method: 'POST',
      query: 'on_conflict=entity_type,entity_id,version',
      body: batch,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    merged.push(...(result.data || []));
  }
  return merged;
}

export async function getEntityRiskScore(entityType, entityId, version = 'trust-v1') {
  if (!isSupabaseStorageEnabled()) return null;
  const result = await supabaseFetch('entity_risk_scores', {
    query: `entity_type=eq.${encodeURIComponent(entityType)}&entity_id=eq.${encodeURIComponent(entityId)}&version=eq.${encodeURIComponent(version)}&select=*`
  });
  return result.data?.[0] || null;
}

export async function listEvidenceBackedSuspiciousAuthors({ limit = 50 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const rowLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const result = await supabaseFetch('entity_risk_scores', {
    query: [
      'select=*',
      'entity_type=eq.author',
      'version=eq.trust-v1',
      'or=(evidence_summary->>matchedPostCount.gt.0,evidence_summary->>suspiciousHits.gt.0,evidence_summary->>phraseDiversity.gt.0)',
      'order=risk_score.desc,updated_at.desc',
      `limit=${rowLimit}`
    ].join('&')
  });
  return result.data || [];
}

export async function listMintAbuseAuthors({ limit = 50 } = {}) {
  if (!isSupabaseStorageEnabled()) return [];
  const rowLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const result = await supabaseFetch('entity_risk_scores', {
    query: [
      'select=*',
      'entity_type=eq.author',
      'version=eq.trust-v1',
      'reason_short=ilike.%25mint%2Fticker%20spam%20pattern%25',
      'or=(evidence_summary.is.null,evidence_summary->>matchedPostCount.eq.0)',
      'order=risk_score.desc,updated_at.desc',
      `limit=${rowLimit}`
    ].join('&')
  });
  return result.data || [];
}

export async function getIngestionJob(jobName) {
  if (!isSupabaseStorageEnabled()) return null;
  const result = await supabaseFetch('ingestion_jobs', { query: `job_name=eq.${encodeURIComponent(jobName)}&select=*` });
  return result.data?.[0] || null;
}

export async function upsertIngestionJob(job) {
  const result = await supabaseFetch('ingestion_jobs', {
    method: 'POST',
    query: 'on_conflict=job_name',
    body: [{ ...sanitizeForJson(job), updated_at: new Date().toISOString() }],
    prefer: 'resolution=merge-duplicates,return=representation'
  });
  return result.data?.[0] || null;
}

export async function buildSearchDocumentsFromState({ authors = [], topics = [], submolts = [] } = {}) {
  const docs = [];

  for (const row of authors) {
    docs.push({
      entity_type: 'author',
      entity_id: row.id,
      title: row.author_name || row.authorName,
      subtitle: row.label || 'author',
      body: row.description || row.reason || '',
      keywords: [row.author_name || row.authorName, row.label, row.reason].filter(Boolean).join(' '),
      popularity_score: safeNumber(row.fit_score ?? row.fitScore) || 0,
      freshness_score: safeNumber(row.signal_score ?? row.signalScore) || 0,
      live_score: safeNumber(row.signal_score ?? row.signalScore) || 0,
    });
  }

  for (const row of topics) {
    docs.push({
      entity_type: 'topic',
      entity_id: row.id || crypto.randomUUID(),
      title: row.topic || row.label,
      subtitle: 'topic',
      body: ((row.accounts || []).map((a) => a.authorName).join(' ')) || '',
      keywords: [row.topic, row.label].filter(Boolean).join(' '),
      popularity_score: safeNumber(row.count) || 0,
      freshness_score: 0,
      live_score: 0,
    });
  }

  for (const row of submolts) {
    docs.push({
      entity_type: 'submolt',
      entity_id: row.id,
      title: row.name,
      subtitle: 'group',
      body: (row.sampleTitles || []).join(' '),
      keywords: [row.name, ...(row.authors || [])].filter(Boolean).join(' '),
      popularity_score: safeNumber(row.post_count ?? row.postCount) || 0,
      freshness_score: safeNumber(row.avg_score_per_post ?? row.avgScorePerPost) || 0,
      live_score: 0,
    });
  }

  return upsertSearchDocuments(docs);
}
