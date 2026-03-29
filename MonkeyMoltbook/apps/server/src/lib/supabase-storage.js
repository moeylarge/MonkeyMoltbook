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

export async function createIngestRun(payload) {
  const result = await supabaseFetch('raw_ingest_runs', {
    method: 'POST',
    body: payload,
    prefer: 'return=representation'
  });
  return result.data?.[0] || null;
}

export async function upsertAuthors(authors) {
  if (!authors?.length) return [];
  const rows = authors.map((row) => ({
    source_author_id: String(row.authorId || ''),
    author_name: row.authorName,
    profile_url: row.profileUrl || authorProfileUrl(row),
    description: row.description || null,
    is_claimed: Boolean(row.isClaimed),
    is_active: Boolean(row.isActive),
    karma: Number(row.karma || 0),
    post_count: Number(row.postCount || 0),
    total_score: Number(row.totalScore || 0),
    total_comments: Number(row.totalComments || 0),
    avg_score_per_post: Number(row.avgScorePerPost || 0),
    avg_comments_per_post: Number(row.avgCommentsPerPost || 0),
    signal_score: Number(row.signalScore || 0),
    fit_score: Number(row.fitScore || 0),
    label: row.label || null,
    reason: row.reason || null,
    latest_post_at: row.latestPostAt || null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const result = await supabaseFetch('authors', {
    method: 'POST',
    query: 'on_conflict=author_name',
    body: rows,
    prefer: 'resolution=merge-duplicates,return=representation'
  });
  return result.data || [];
}

export async function replaceRankingSnapshots(runId, type, rows, authorIdMap) {
  if (!runId || !rows?.length) return [];
  const payload = rows.map((row, index) => ({
    run_id: runId,
    ranking_type: type,
    author_id: authorIdMap.get(String(row.authorId || '')) || null,
    position: index + 1,
    fit_score: Number(row.fitScore || 0),
    signal_score: Number(row.signalScore || 0)
  }));
  const result = await supabaseFetch('ranking_snapshots', {
    method: 'POST',
    body: payload,
    prefer: 'return=minimal'
  });
  return result.data || [];
}

export async function replaceTopicClusters(runId, topics) {
  if (!runId || !topics?.length) return [];
  const payload = topics.map((row) => ({
    run_id: runId,
    topic: row.topic,
    count: Number(row.count || 0),
    payload: row
  }));
  const result = await supabaseFetch('topic_clusters', {
    method: 'POST',
    body: payload,
    prefer: 'return=minimal'
  });
  return result.data || [];
}

export async function storeRawAuthorSnapshots(runId, authors) {
  if (!runId || !authors?.length) return [];
  const payload = authors.map((row) => ({
    run_id: runId,
    source_author_id: String(row.authorId || ''),
    author_name: row.authorName,
    profile_url: row.profileUrl || authorProfileUrl(row),
    payload: row
  }));
  const result = await supabaseFetch('raw_author_snapshots', {
    method: 'POST',
    body: payload,
    prefer: 'return=minimal'
  });
  return result.data || [];
}

export async function persistMoltbookSnapshot({ mode = 'default', triggerSource = 'manual', source = 'unknown', intel }) {
  if (!isSupabaseStorageEnabled()) {
    return { ok: false, disabled: true };
  }

  const authors = intel?.authors || [];
  const run = await createIngestRun({
    mode,
    trigger_source: triggerSource,
    source,
    status: 'ok',
    author_count: Number(intel?.authorCount || authors.length || 0),
    post_count: Number(intel?.postCount || 0),
    submolt_count: Number(intel?.discovery?.submolts?.length || intel?.signals?.topSubmolts?.length || 0),
    payload_summary: {
      lastFetchedAt: intel?.lastFetchedAt || null,
      discoverySurfaces: intel?.discovery?.surfaces || [],
      errors: intel?.discovery?.errors || []
    }
  });

  const upsertedAuthors = await upsertAuthors(authors);
  const authorIdMap = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row.id]));

  await storeRawAuthorSnapshots(run?.id, authors.slice(0, 100));
  await replaceRankingSnapshots(run?.id, 'top', authors.slice(0, 25), authorIdMap);
  await replaceRankingSnapshots(run?.id, 'rising', intel?.signals?.rising || [], authorIdMap);
  await replaceRankingSnapshots(run?.id, 'hot', intel?.signals?.hot || [], authorIdMap);
  await replaceTopicClusters(run?.id, intel?.signals?.topicClusters || []);

  return {
    ok: true,
    runId: run?.id || null,
    authorRows: upsertedAuthors.length,
    mode,
    triggerSource
  };
}
