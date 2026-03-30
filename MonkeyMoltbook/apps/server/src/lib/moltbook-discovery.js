export const MOLTBOOK_BASE = 'https://www.moltbook.com/api/v1/posts';
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

export async function fetchJson(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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

async function emitProgress(onProgress, phase, extra = {}) {
  if (typeof onProgress !== 'function') return;
  await onProgress(phase, extra);
}

export function normalizePosts(payload) {
  return Array.isArray(payload?.posts) ? payload.posts : [];
}

function weakSuspiciousCueMeta(post) {
  const title = String(post?.title || '');
  const snippet = String(post?.snippet || post?.body || post?.description || post?.content || '');
  const text = `${title} ${snippet}`.toLowerCase();
  const cueGroups = {
    claim: ['airdrop', 'claim', 'eligible', 'reward', 'redeem'],
    wallet: ['wallet', 'wallet connect', 'connect wallet', 'verify your wallet', 'private key'],
    seed: ['seed phrase', 'secret phrase', 'private key', 'restore wallet'],
    exploit: ['drainer', 'wallet drain', 'approval scam', 'malicious link', 'phishing', 'malware', 'exploit']
  };
  const weakFamilies = [];
  const weakPhrases = [];
  for (const [family, patterns] of Object.entries(cueGroups)) {
    const hits = patterns.filter((phrase) => text.includes(phrase));
    if (!hits.length) continue;
    weakFamilies.push(family);
    weakPhrases.push(...hits);
  }
  return {
    matched: weakFamilies.length > 0,
    families: [...new Set(weakFamilies)],
    phrases: [...new Set(weakPhrases)]
  };
}

function suspiciousMatchMeta(post) {
  const title = String(post?.title || '');
  const snippet = String(post?.snippet || post?.body || post?.description || post?.content || '');
  const text = `${title} ${snippet}`.toLowerCase();

  const includesAny = (patterns) => patterns.filter((phrase) => text.includes(phrase));

  const claimDirect = includesAny([
    'claim now', 'claim your reward', 'claim your tokens', 'claim your airdrop',
    'airdrop claim', 'eligible for airdrop', 'check your eligibility',
    'redeem now', 'redeem your reward', 'unlock your reward'
  ]);
  const walletDirect = includesAny([
    'wallet connect', 'connect wallet', 'connect your wallet', 'connect wallet to claim', 'verify your wallet',
    'wallet verification', 'wallet required', 'wallet login', 'reconnect wallet', 'sync your wallet',
    'authorize wallet', 'confirm wallet', 'validate wallet', 'wallet recovery', 'recover your wallet',
    'import your wallet', 'seed phrase required', 'enter your seed phrase', 'restore your wallet', 'wallet authentication'
  ]);
  const exploitDirect = includesAny([
    'wallet drainer', 'clipboard drainer', 'drain your wallet', 'wallet drain', 'drainer',
    'wallet drained', 'sweep wallet', 'compromised wallet', 'compromised account',
    'fake airdrop', 'malicious link', 'approval scam', 'malicious wallet', 'stealer', 'keygen',
    'remote access trojan', 'wallet exploit', 'fake wallet connect'
  ]);

  const families = [];
  const phrases = [];

  if (claimDirect.length) {
    families.push('claim');
    phrases.push(...claimDirect);
  }
  if (walletDirect.length) {
    families.push('wallet');
    phrases.push(...walletDirect);
  }
  if (exploitDirect.length) {
    families.push('exploit');
    phrases.push(...exploitDirect);
  }

  const walletActionContext = ['enter', 'import', 'verify', 'connect wallet', 'recover', 'restore', 'claim'];
  const seedTerms = ['seed phrase', 'secret phrase', 'private key'];
  const matchedSeedTerms = seedTerms.filter((phrase) => text.includes(phrase));
  const hasWalletActionContext = walletActionContext.some((phrase) => text.includes(phrase));
  if (matchedSeedTerms.length && hasWalletActionContext) {
    families.push('wallet');
    phrases.push(...matchedSeedTerms);
  }

  const phishingContext = text.includes('phishing') && (
    text.includes('wallet')
    || text.includes('claim')
    || text.includes('airdrop')
    || text.includes('seed phrase')
    || text.includes('private key')
  );
  if (phishingContext) {
    families.push('exploit');
    phrases.push('phishing');
  }

  const airdropContext = text.includes('airdrop') && (
    text.includes('claim')
    || text.includes('eligible')
    || text.includes('reward')
    || text.includes('connect wallet')
    || text.includes('verify your wallet')
    || text.includes('wallet connect')
  );
  if (airdropContext && !families.includes('claim')) {
    families.push('claim');
    phrases.push('airdrop');
  }

  const informationalExploitContext = (
    text.includes('edr evasion')
    || text.includes('red team')
    || text.includes('statistical analysis')
    || text.includes('protection')
    || text.includes('tax strategy')
    || text.includes('tax reports')
  );

  const dedupedFamilies = [...new Set(families)].filter((family) => {
    if (family !== 'exploit') return true;
    const exploitPhrases = [...new Set(phrases.filter((phrase) => [
      'wallet drainer', 'clipboard drainer', 'drain your wallet', 'wallet drain', 'drainer',
      'wallet drained', 'sweep wallet', 'compromised wallet', 'compromised account',
      'fake airdrop', 'malicious link', 'approval scam', 'malicious wallet', 'stealer', 'keygen',
      'remote access trojan', 'wallet exploit', 'fake wallet connect', 'phishing'
    ].includes(phrase)))];
    if (!exploitPhrases.length) return false;
    if (informationalExploitContext && exploitPhrases.every((phrase) => ['malware', 'phishing'].includes(phrase))) return false;
    return true;
  });

  const dedupedPhrases = [...new Set(phrases)].filter((phrase) => {
    if (phrase !== 'malware') return true;
    return !informationalExploitContext;
  });

  return {
    matched: dedupedFamilies.length > 0,
    families: dedupedFamilies,
    phrases: dedupedPhrases
  };
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

export async function fetchCursorBackfillSample({ cursor = null, limit = 50, steps = 5, delayMs = 750, onProgress = null } = {}) {
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
    await emitProgress(onProgress, 'probe_before_raw_fetch', { step, usedCursor, url });
    try {
      const payload = await fetchJson(url);
      const pagePosts = normalizePosts(payload).map((post) => ({ ...post, discoverySurface: 'new', discoveryStep: step }));
      posts.push(...pagePosts);
      const stat = { step, count: pagePosts.length, usedCursor, nextCursor: payload?.next_cursor || null, hasMore: Boolean(payload?.has_more), fetchMs: Date.now() - fetchStartedAt };
      cursorStats.push(stat);
      await emitProgress(onProgress, 'probe_after_raw_fetch', stat);
      nextCursor = payload?.next_cursor || null;
      hasMore = Boolean(payload?.has_more);
      if (!hasMore || !nextCursor || pagePosts.length === 0) break;
      if (delayMs > 0) await sleep(delayMs);
    } catch (error) {
      const message = String(error?.message || error || 'unknown');
      errors.push(`cursor:step:${step}:${message}`);
      const stat = { step, count: 0, usedCursor, nextCursor: null, hasMore: false, fetchMs: Date.now() - fetchStartedAt, error: message };
      cursorStats.push(stat);
      await emitProgress(onProgress, 'probe_fetch_failed', stat);
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

export async function fetchSuspiciousCandidateSample({ cursor = null, limit = 100, steps = 20, delayMs = 0, onProgress = null } = {}) {
  await emitProgress(onProgress, 'candidate_probe_entered', { cursor: cursor || null, limit, steps, delayMs });
  const sample = await fetchCursorBackfillSample({ cursor, limit, steps, delayMs, onProgress });
  const candidatePosts = [];
  const cueCounts = { claim: 0, wallet: 0, seed: 0, exploit: 0 };

  for (const post of sample.posts || []) {
    const meta = weakSuspiciousCueMeta(post);
    if (!meta.matched) continue;
    for (const family of meta.families) {
      cueCounts[family] = (cueCounts[family] || 0) + 1;
    }
    candidatePosts.push({
      ...post,
      weakCueFamilies: meta.families,
      weakCuePhrases: meta.phrases,
      discoverySurface: post.discoverySurface || 'new'
    });
    if (candidatePosts.length >= 250) break;
  }

  const uniqueCandidatePosts = uniqueBy(candidatePosts, (post) => post.id);
  const candidatePreview = uniqueCandidatePosts.slice(0, 10).map((post) => ({
    postId: String(post?.id || ''),
    title: String(post?.title || ''),
    weakCueFamilies: post?.weakCueFamilies || [],
    weakCuePhrases: post?.weakCuePhrases || [],
    submolt: typeof post?.submolt === 'string'
      ? post.submolt
      : post?.submolt?.name || post?.submolt?.slug || post?.submolt?.title || null
  }));

  await emitProgress(onProgress, 'candidate_probe_completed', {
    fetchedPosts: (sample.posts || []).length,
    candidatePosts: uniqueCandidatePosts.length,
    cueCounts
  });

  return {
    ...sample,
    posts: uniqueCandidatePosts,
    candidateCount: uniqueCandidatePosts.length,
    cueCounts,
    candidatePreview,
    firstCursorStat: sample.cursorStats?.[0] || null
  };
}

export async function fetchSuspiciousLanguageProbe({ cursor = null, limit = 25, steps = 1, delayMs = 0, onProgress = null, filterFamily = null } = {}) {
  await emitProgress(onProgress, 'probe_entered', { cursor: cursor || null, limit, steps, delayMs, filterFamily: filterFamily || null });
  const sample = await fetchCursorBackfillSample({ cursor, limit, steps, delayMs, onProgress });
  const probePhases = [
    { phase: 'probe_entered', cursor: cursor || null, limit, steps, delayMs, filterFamily: filterFamily || null },
    {
      phase: 'probe_fetch_completed',
      fetchedPosts: (sample.posts || []).length,
      errors: sample.errors || [],
      firstCursorStat: sample.cursorStats?.[0] || null
    }
  ];
  await emitProgress(onProgress, 'probe_fetch_completed', {
    fetchedPosts: (sample.posts || []).length,
    errors: sample.errors || [],
    firstCursorStat: sample.cursorStats?.[0] || null
  });

  await emitProgress(onProgress, 'probe_before_filter_matches', {
    fetchedPosts: (sample.posts || []).length
  });

  const matchedPosts = [];
  const familyCounts = { claim: 0, wallet: 0, exploit: 0 };

  let filterIndex = 0;
  for (const post of sample.posts || []) {
    filterIndex += 1;
    if (filterIndex === 1 || filterIndex % 5 === 0 || filterIndex === (sample.posts || []).length) {
      await emitProgress(onProgress, 'probe_filter_progress', {
        index: filterIndex,
        postId: String(post?.id || ''),
        titleLength: String(post?.title || '').length,
        snippetLength: String(post?.snippet || post?.body || post?.description || post?.content || '').length,
        matchedCountSoFar: matchedPosts.length
      });
    }

    let meta;
    try {
      meta = suspiciousMatchMeta(post);
    } catch (error) {
      await emitProgress(onProgress, 'probe_filter_failed', {
        index: filterIndex,
        postId: String(post?.id || ''),
        error: String(error?.message || error || 'unknown')
      });
      throw error;
    }

    if (!meta.matched) continue;
    if (filterFamily) {
      const familyAliases = filterFamily === 'seed'
        ? ['wallet']
        : [filterFamily];
      const phraseGate = filterFamily === 'seed'
        ? meta.phrases.some((phrase) => ['seed phrase', 'secret phrase', 'private key', 'seed phrase required', 'enter your seed phrase'].includes(phrase))
        : true;
      if (!familyAliases.some((family) => meta.families.includes(family)) || !phraseGate) continue;
    }
    for (const family of meta.families) familyCounts[family] += 1;
    matchedPosts.push({
      ...post,
      suspiciousFamilies: meta.families,
      suspiciousPhrases: meta.phrases,
      discoverySurface: post.discoverySurface || 'new'
    });
    if (matchedPosts.length >= 100) break;
  }

  await emitProgress(onProgress, 'probe_after_filter_matches', {
    iteratedPosts: (sample.posts || []).length,
    suspiciousMatchedCount: matchedPosts.length,
    familyCounts
  });

  probePhases.push({
    phase: 'probe_filtered_matches',
    suspiciousMatchedCount: matchedPosts.length,
    familyCounts
  });
  await emitProgress(onProgress, 'probe_filtered_matches', {
    suspiciousMatchedCount: matchedPosts.length,
    familyCounts
  });

  const uniqueMatchedPosts = uniqueBy(matchedPosts, (post) => post.id);
  const matchedPostPreview = uniqueMatchedPosts.slice(0, 5).map((post) => ({
    postId: String(post?.id || ''),
    title: String(post?.title || ''),
    suspiciousFamilies: post?.suspiciousFamilies || [],
    suspiciousPhrases: post?.suspiciousPhrases || [],
    submolt: typeof post?.submolt === 'string'
      ? post.submolt
      : post?.submolt?.name || post?.submolt?.slug || post?.submolt?.title || null
  }));

  return {
    ...sample,
    posts: uniqueMatchedPosts,
    familyCounts,
    suspiciousMatchedCount: uniqueMatchedPosts.length,
    matchedPostPreview,
    firstCursorStat: sample.cursorStats?.[0] || null,
    probePhases
  };
}
