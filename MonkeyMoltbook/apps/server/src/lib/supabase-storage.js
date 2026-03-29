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
  const rows = posts.map((post) => ({
    source_post_id: safeText(post.id),
    source_author_id: safeText(post.author?.id),
    author_id: authorIdMap.get(String(post.author?.id || '')) || null,
    author_name: safeText(post.author?.name),
    title: safeText(post.title),
    snippet: safeText(post.content),
    url: safeText(post.url),
    submolt_name: safeText(post.submolt_name || post.submoltName),
    score: safeNumber(post.score),
    comment_count: safeNumber(post.comment_count ?? post.commentCount),
    created_at_source: post.created_at || post.createdAt || null,
    payload: sanitizeForJson(post)
  })).filter((row) => row.source_post_id || row.title);

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
