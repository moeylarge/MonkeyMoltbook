const MOLTBOOK_BASE = 'https://www.moltbook.com/api/v1/posts';
const FETCH_TIMEOUT_MS = 6000;

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`status-${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePosts(payload) {
  return Array.isArray(payload?.posts) ? payload.posts : [];
}

export async function fetchExpandedPublicPosts() {
  const surfaces = [
    { key: 'new', url: `${MOLTBOOK_BASE}?sort=new&limit=100` },
    { key: 'top', url: `${MOLTBOOK_BASE}?sort=top&limit=100` },
    { key: 'hot', url: `${MOLTBOOK_BASE}?sort=hot&limit=100` },
  ];

  const settled = await Promise.allSettled(surfaces.map(async (surface) => ({
    key: surface.key,
    posts: normalizePosts(await fetchJson(surface.url)),
  })));

  const bySurface = {};
  const merged = [];
  const errors = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      bySurface[result.value.key] = result.value.posts;
      merged.push(...result.value.posts.map((post) => ({ ...post, discoverySurface: result.value.key })));
    } else {
      errors.push(String(result.reason?.message || result.reason || 'unknown'));
    }
  }

  return {
    surfaces: Object.keys(bySurface),
    errors,
    posts: uniqueBy(merged, (post) => post.id),
    bySurface,
  };
}

export function buildSubmoltIndex(posts) {
  const submolts = new Map();
  for (const post of posts || []) {
    const raw = post.submolt;
    const name = typeof raw === 'string'
      ? raw.trim()
      : raw?.name || raw?.slug || raw?.title || null;
    if (!name) continue;

    if (!submolts.has(name)) {
      submolts.set(name, {
        name,
        postCount: 0,
        totalScore: 0,
        totalComments: 0,
        authors: new Set(),
        sampleTitles: [],
      });
    }

    const row = submolts.get(name);
    row.postCount += 1;
    row.totalScore += Number(post.score || 0);
    row.totalComments += Number(post.comment_count || 0);
    if (post.author?.name) row.authors.add(post.author.name);
    if (post.title && row.sampleTitles.length < 5) row.sampleTitles.push(String(post.title).slice(0, 120));
  }

  return [...submolts.values()]
    .map((row) => ({
      ...row,
      authors: [...row.authors],
      avgScorePerPost: row.postCount ? row.totalScore / row.postCount : 0,
      avgCommentsPerPost: row.postCount ? row.totalComments / row.postCount : 0,
    }))
    .sort((a, b) => b.postCount - a.postCount || b.totalScore - a.totalScore);
}

export function buildAuthorCoverage(posts) {
  const authors = new Map();
  for (const post of posts || []) {
    const author = post.author;
    if (!author?.id || !author?.name) continue;
    const id = String(author.id);
    if (!authors.has(id)) {
      authors.set(id, {
        authorId: id,
        authorName: author.name,
        description: author.description || '',
        karma: Number(author.karma || 0),
        followerCount: Number(author.followerCount || 0),
        followingCount: Number(author.followingCount || 0),
        isClaimed: Boolean(author.isClaimed),
        isActive: Boolean(author.isActive),
        createdAt: author.createdAt || null,
        lastActive: author.lastActive || null,
        surfaces: new Set(),
        submolts: new Set(),
        postIds: new Set(),
      });
    }
    const row = authors.get(id);
    row.surfaces.add(post.discoverySurface || 'unknown');
    if (post.submolt) row.submolts.add(typeof post.submolt === 'string' ? post.submolt : post.submolt?.name || post.submolt?.slug || '');
    row.postIds.add(post.id);
  }

  return [...authors.values()].map((row) => ({
    ...row,
    surfaces: [...row.surfaces].filter(Boolean),
    submolts: [...row.submolts].filter(Boolean),
    observedPosts: row.postIds.size,
  }));
}

export function buildCommunityIndex(posts) {
  const communities = new Map();
  for (const post of posts || []) {
    const raw = post.submolt;
    const name = typeof raw === 'string' ? raw.trim() : raw?.name || raw?.slug || raw?.title || null;
    if (!name) continue;
    if (!communities.has(name)) {
      communities.set(name, {
        id: `community-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: name,
        description: `Community coverage derived from Moltbook public post discovery for ${name}.`,
        memberCount: null,
        postCount: 0,
        sampleTitles: [],
      });
    }
    const row = communities.get(name);
    row.postCount += 1;
    if (post.title && row.sampleTitles.length < 5) row.sampleTitles.push(String(post.title).slice(0, 120));
  }
  return [...communities.values()].sort((a, b) => b.postCount - a.postCount);
}

export async function fetchExpandedUniverseSample() {
  const limits = [100, 200, 300];
  const sorts = ['new', 'top', 'hot'];
  const urls = [];
  for (const sort of sorts) {
    for (const limit of limits) urls.push({ sort, limit, url: `${MOLTBOOK_BASE}?sort=${sort}&limit=${limit}` });
  }
  const settled = await Promise.allSettled(urls.map(async (entry) => ({
    key: `${entry.sort}-${entry.limit}`,
    posts: normalizePosts(await fetchJson(entry.url)).map((post) => ({ ...post, discoverySurface: entry.sort }))
  })));
  const posts = [];
  const errors = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') posts.push(...result.value.posts);
    else errors.push(String(result.reason?.message || result.reason || 'unknown'));
  }
  return { posts: uniqueBy(posts, (post) => post.id), errors };
}

export async function fetchPaginatedUniverseSample({ pages = 3, perPage = 100 } = {}) {
  const sorts = ['new', 'top', 'hot'];
  const posts = [];
  const errors = [];
  const pageStats = [];

  for (const sort of sorts) {
    let sortFailures = 0;
    for (let page = 1; page <= pages; page += 1) {
      const url = `${MOLTBOOK_BASE}?sort=${sort}&limit=${perPage}&page=${page}`;
      try {
        const pagePosts = normalizePosts(await fetchJson(url)).map((post) => ({ ...post, discoverySurface: sort, discoveryPage: page }));
        posts.push(...pagePosts);
        pageStats.push({ sort, page, count: pagePosts.length });
        if (pagePosts.length === 0) break;
      } catch (error) {
        errors.push(`${sort}:page:${page}:${String(error?.message || error || 'unknown')}`);
        sortFailures += 1;
        if (sort === 'new') continue;
        if (sortFailures >= 2) break;
      }
    }
  }

  return {
    posts: uniqueBy(posts, (post) => post.id),
    errors,
    pageStats,
    requestedPages: pages,
    perPage
  };
}

export async function fetchCursorBackfillSample({ cursor = null, limit = 50, steps = 5, delayMs = 750 } = {}) {
  const posts = [];
  const errors = [];
  const cursorStats = [];
  let nextCursor = cursor;
  let hasMore = true;

  for (let step = 1; step <= steps; step += 1) {
    const params = new URLSearchParams({ sort: 'new', limit: String(limit) });
    if (nextCursor) params.set('cursor', nextCursor);
    const usedCursor = nextCursor || null;
    const url = `${MOLTBOOK_BASE}?${params.toString()}`;
    const fetchStartedAt = Date.now();
    try {
      const payload = await fetchJson(url);
      const pagePosts = normalizePosts(payload).map((post) => ({ ...post, discoverySurface: 'new', discoveryStep: step }));
      posts.push(...pagePosts);
      cursorStats.push({ step, count: pagePosts.length, usedCursor, nextCursor: payload?.next_cursor || null, hasMore: Boolean(payload?.has_more), fetchMs: Date.now() - fetchStartedAt });
      nextCursor = payload?.next_cursor || null;
      hasMore = Boolean(payload?.has_more);
      if (!hasMore || !nextCursor || pagePosts.length === 0) break;
      if (delayMs > 0) await sleep(delayMs);
    } catch (error) {
      errors.push(`cursor:step:${step}:${String(error?.message || error || 'unknown')}`);
      cursorStats.push({ step, count: 0, usedCursor, nextCursor: null, hasMore: false, fetchMs: Date.now() - fetchStartedAt, error: String(error?.message || error || 'unknown') });
      break;
    }
  }

  return {
    posts: uniqueBy(posts, (post) => post.id),
    errors,
    cursorStats,
    nextCursor,
    hasMore,
    steps,
    limit,
    delayMs
  };
}

export async function fetchSuspiciousLanguageSample({ cursor = null, limit = 25, steps = 1, delayMs = 0 } = {}) {
  const sample = await fetchCursorBackfillSample({ cursor, limit, steps, delayMs });
  const matchedPosts = [];
  const familyCounts = { claim: 0, wallet: 0, exploit: 0 };

  for (const post of sample.posts || []) {
    const meta = suspiciousMatchMeta(post);
    if (!meta.matched) continue;
    for (const family of meta.families) familyCounts[family] += 1;
    matchedPosts.push({
      ...post,
      suspiciousFamilies: meta.families,
      suspiciousPhrases: meta.phrases,
      discoverySurface: post.discoverySurface || 'new'
    });
    if (matchedPosts.length >= 100) break;
  }

  return {
    ...sample,
    posts: uniqueBy(matchedPosts, (post) => post.id),
    familyCounts,
    suspiciousMatchedCount: matchedPosts.length,
    firstCursorStat: sample.cursorStats?.[0] || null
  };
}
