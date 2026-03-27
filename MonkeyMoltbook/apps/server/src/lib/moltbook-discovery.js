const MOLTBOOK_BASE = 'https://www.moltbook.com/api/v1/posts';
const FETCH_TIMEOUT_MS = 1200;

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
