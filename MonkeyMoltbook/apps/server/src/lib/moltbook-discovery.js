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
  const includesAny = (patterns) => patterns.filter((phrase) => text.includes(phrase));

  const walletActionHits = includesAny([
    'wallet connect', 'connect wallet', 'connect your wallet', 'connect wallet to claim',
    'verify your wallet', 'wallet verification'
  ]);
  const walletRecoveryHits = includesAny([
    'wallet recovery', 'recover your wallet', 'restore wallet', 'restore your wallet',
    'import your wallet', 'wallet authentication'
  ]);
  const seedHits = includesAny(['seed phrase', 'secret phrase', 'private key', 'enter seed phrase']);
  const exploitHits = includesAny(['drainer', 'wallet drain', 'approval scam', 'malicious link', 'phishing', 'malware']);

  const actionChainHits = includesAny([
    'fill form', 'instant usdt', 'free 1 usdt', 'usdt', 'zero risk', 'no risk',
    'no signing required', 'claim now', 'claim your reward', 'claim your airdrop',
    'claim your tokens', 'eligible for airdrop', 'check your eligibility',
    'redeem now', 'redeem your reward', 'unlock your reward'
  ]);
  const technicalContextHits = includesAny([
    'zero-knowledge', 'benchmark', 'zk', 'cryptography', 'signature scheme', 'key management',
    'security model', 'threat model', 'custody', 'wallet architecture', 'technical design',
    'implementation', 'inference', 'proof system'
  ]);

  const weakFamilies = [];
  const weakPhrases = [];

  const hasConnectWallet = includesAny(['connect wallet', 'connect your wallet']).length > 0;
  const hasWalletConnect = includesAny(['wallet connect']).length > 0;
  const hasFillForm = includesAny(['fill form']).length > 0;
  const hasInstantUsdt = includesAny(['instant usdt']).length > 0;
  const hasNoSigningRequired = includesAny(['no signing required']).length > 0;
  const hasZeroRiskUsdt = includesAny(['zero risk', 'no risk']).length > 0 && includesAny(['usdt', 'free 1 usdt']).length > 0;
  const hasObservedActionCluster = (
    (hasConnectWallet && hasFillForm)
    || (hasConnectWallet && hasInstantUsdt)
    || (hasConnectWallet && hasNoSigningRequired)
    || hasZeroRiskUsdt
    || (hasWalletConnect && actionChainHits.length > 0)
  );

  const allowClaim = hasObservedActionCluster;
  const allowWallet = hasObservedActionCluster || walletRecoveryHits.length > 0;
  const allowSeed = seedHits.length > 0 && hasObservedActionCluster && technicalContextHits.length === 0;
  const allowExploit = exploitHits.length > 0;

  if (allowClaim) {
    weakFamilies.push('claim');
    weakPhrases.push(...actionChainHits, ...walletActionHits);
  }
  if (allowWallet) {
    weakFamilies.push('wallet');
    weakPhrases.push(...walletActionHits, ...walletRecoveryHits, ...seedHits, ...actionChainHits);
  }
  if (allowSeed) {
    weakFamilies.push('seed');
    weakPhrases.push(...seedHits);
  }
  if (allowExploit) {
    weakFamilies.push('exploit');
    weakPhrases.push(...exploitHits);
  }

  return {
    matched: weakFamilies.length > 0,
    families: [...new Set(weakFamilies)],
    phrases: [...new Set(weakPhrases)]
  };
}

function secondStageCandidateScore(post, weakMeta) {
  const title = String(post?.title || '');
  const snippet = String(post?.snippet || post?.body || post?.description || post?.content || '');
  const text = `${title} ${snippet}`.toLowerCase();
  const includesAny = (patterns) => patterns.filter((phrase) => text.includes(phrase));

  const scoreSignals = {
    weakCueFamilies: weakMeta?.families || [],
    weakCuePhrases: weakMeta?.phrases || [],
    strongSignals: [],
    penaltySignals: []
  };

  let score = 0;

  const walletActionHits = includesAny([
    'connect wallet', 'wallet connect', 'connect your wallet', 'connect wallet to claim',
    'verify your wallet', 'wallet verification', 'restore wallet', 'restore your wallet',
    'wallet recovery', 'recover your wallet', 'import your wallet', 'wallet authentication'
  ]);
  const seedActionHits = includesAny([
    'enter seed phrase', 'seed phrase required', 'secret phrase', 'private key', 'restore your wallet'
  ]);
  const abuseHits = includesAny(['drainer', 'wallet drain', 'approval scam', 'malicious link', 'phishing']);
  const rewardHits = includesAny(['claim', 'claim now', 'eligible', 'reward', 'redeem', 'airdrop']);
  const weakPromoHits = includesAny(['free', 'bonus', 'instant']);
  const pressureHits = includesAny(['zero risk', 'no risk', 'limited time', 'act now', 'verify now']);

  if (rewardHits.length) {
    score += 8 + Math.min(8, (rewardHits.length - 1) * 2);
    scoreSignals.strongSignals.push(...rewardHits);
  }
  if (walletActionHits.length) {
    score += 24 + Math.min(10, (walletActionHits.length - 1) * 3);
    scoreSignals.strongSignals.push(...walletActionHits);
  }
  if (seedActionHits.length) {
    score += 28 + Math.min(10, (seedActionHits.length - 1) * 3);
    scoreSignals.strongSignals.push(...seedActionHits);
  }
  if (abuseHits.length) {
    score += 20 + Math.min(10, (abuseHits.length - 1) * 3);
    scoreSignals.strongSignals.push(...abuseHits);
  }
  if (pressureHits.length) {
    score += 12 + Math.min(6, (pressureHits.length - 1) * 2);
    scoreSignals.strongSignals.push(...pressureHits);
  }
  if (weakPromoHits.length) {
    score += 3 + Math.min(3, weakPromoHits.length - 1);
    scoreSignals.strongSignals.push(...weakPromoHits);
  }

  if ((weakMeta?.families || []).length >= 2) score += 6;
  if ((weakMeta?.phrases || []).length >= 3) score += 4;

  const hasWalletCue = (weakMeta?.families || []).includes('wallet') || /wallet/.test(text);
  const hasClaimCue = (weakMeta?.families || []).includes('claim') || /claim|airdrop|reward|eligible|redeem/.test(text);
  const hasSeedCue = (weakMeta?.families || []).includes('seed') || /seed phrase|secret phrase|private key/.test(text);
  const hasExploitCue = (weakMeta?.families || []).includes('exploit') || /drainer|wallet drain|approval scam|malicious link|phishing|malware|exploit/.test(text);
  const hasStrongWalletAction = walletActionHits.length > 0 || seedActionHits.length > 0;

  if (hasWalletCue && hasClaimCue && hasStrongWalletAction) {
    score += 20;
    scoreSignals.strongSignals.push('wallet+claim_action_combo');
  }
  if (hasWalletCue && hasSeedCue) {
    score += 22;
    scoreSignals.strongSignals.push('wallet+seed_combo');
  }
  if (hasExploitCue && hasWalletCue) {
    score += hasStrongWalletAction ? 18 : 8;
    scoreSignals.strongSignals.push('exploit+wallet_combo');
  }
  if (hasWalletCue && pressureHits.length && hasStrongWalletAction) {
    score += 10;
    scoreSignals.strongSignals.push('wallet+pressure_combo');
  }

  const penaltyGroups = [
    { label: 'security_research', weight: -26, patterns: ['security research', 'researcher', 'incident analysis', 'postmortem', 'defensive', 'protection', 'detected', 'detection', 'how phishing works', 'how drainer works'] },
    { label: 'philosophy_general', weight: -22, patterns: ['philosophy', 'consciousness', 'pondering', 'meditation', 'meaning of', 'ethics', 'spiritual'] },
    { label: 'generic_airdrop_discussion', weight: -18, patterns: ['tax', 'taxes', 'tax strategy', 'capital gains', 'discussion', 'news recap', 'market update', 'guide', 'tutorial'] },
    { label: 'benign_education', weight: -16, patterns: ['open source', 'hackathon', 'compliance', 'best practices', 'awareness', 'education'] },
    { label: 'generic_crypto_framing', weight: -20, patterns: ['economy', 'wealth', 'on-chain', 'agents', 'agent payment', 'payment protocol', 'revolution', 'incentive layer', 'ground truth'] }
  ];

  for (const group of penaltyGroups) {
    const hits = includesAny(group.patterns);
    if (!hits.length) continue;
    score += group.weight;
    scoreSignals.penaltySignals.push(...hits);
  }

  if (hasWalletCue && !hasStrongWalletAction && !hasSeedCue) {
    score -= 10;
    scoreSignals.penaltySignals.push('wallet_without_action');
  }

  if ((weakMeta?.families || []).includes('claim') && !hasStrongWalletAction && !hasSeedCue && !pressureHits.length) {
    score -= 16;
    scoreSignals.penaltySignals.push('claim_without_wallet_action');
  }

  if (weakPromoHits.length && !hasStrongWalletAction && !hasExploitCue) {
    score -= 6;
    scoreSignals.penaltySignals.push('weak_promo_without_action');
  }

  const hasMultiSignalCombo = (
    (rewardHits.length > 0 && pressureHits.length > 0)
    || (rewardHits.length > 0 && abuseHits.length > 0)
    || (abuseHits.length > 0 && pressureHits.length > 0)
    || ((weakMeta?.families || []).length >= 2 && (rewardHits.length + abuseHits.length + pressureHits.length) >= 2)
  );

  const dedup = (items) => [...new Set(items)];
  const finalScore = Math.max(0, score);
  let label = 'low';
  if (finalScore >= 75 && hasStrongWalletAction) label = 'high';
  else if (finalScore >= 34 && (hasStrongWalletAction || hasMultiSignalCombo)) label = 'medium';

  return {
    score: finalScore,
    label,
    strongSignals: dedup(scoreSignals.strongSignals),
    penaltySignals: dedup(scoreSignals.penaltySignals)
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
  const scoredCounts = { high: 0, medium: 0, low: 0 };

  for (const post of sample.posts || []) {
    const meta = weakSuspiciousCueMeta(post);
    if (!meta.matched) continue;
    for (const family of meta.families) {
      cueCounts[family] = (cueCounts[family] || 0) + 1;
    }
    const secondStage = secondStageCandidateScore(post, meta);
    scoredCounts[secondStage.label] = (scoredCounts[secondStage.label] || 0) + 1;
    candidatePosts.push({
      ...post,
      weakCueFamilies: meta.families,
      weakCuePhrases: meta.phrases,
      candidateScore: secondStage.score,
      candidateLabel: secondStage.label,
      candidateStrongSignals: secondStage.strongSignals,
      candidatePenaltySignals: secondStage.penaltySignals,
      discoverySurface: post.discoverySurface || 'new'
    });
    if (candidatePosts.length >= 250) break;
  }

  const uniqueCandidatePosts = uniqueBy(candidatePosts, (post) => post.id)
    .sort((a, b) => {
      return (b.candidateScore || 0) - (a.candidateScore || 0)
        || (b.candidateStrongSignals?.length || 0) - (a.candidateStrongSignals?.length || 0)
        || (b.weakCueFamilies?.length || 0) - (a.weakCueFamilies?.length || 0);
    });
  const candidatePreview = uniqueCandidatePosts.slice(0, 10).map((post) => ({
    postId: String(post?.id || ''),
    title: String(post?.title || ''),
    weakCueFamilies: post?.weakCueFamilies || [],
    weakCuePhrases: post?.weakCuePhrases || [],
    candidateScore: post?.candidateScore || 0,
    candidateLabel: post?.candidateLabel || 'low',
    candidateStrongSignals: post?.candidateStrongSignals || [],
    candidatePenaltySignals: post?.candidatePenaltySignals || [],
    submolt: typeof post?.submolt === 'string'
      ? post.submolt
      : post?.submolt?.name || post?.submolt?.slug || post?.submolt?.title || null
  }));

  await emitProgress(onProgress, 'candidate_probe_completed', {
    fetchedPosts: (sample.posts || []).length,
    candidatePosts: uniqueCandidatePosts.length,
    cueCounts,
    scoredCounts,
    topCandidateScore: uniqueCandidatePosts?.[0]?.candidateScore || 0
  });

  return {
    ...sample,
    posts: uniqueCandidatePosts,
    candidateCount: uniqueCandidatePosts.length,
    cueCounts,
    scoredCounts,
    candidatePreview,
    firstCursorStat: sample.cursorStats?.[0] || null
  };
}

export async function fetchActionChainProbeSample({ cursor = null, limit = 100, steps = 20, delayMs = 0, onProgress = null } = {}) {
  await emitProgress(onProgress, 'action_chain_probe_entered', { cursor: cursor || null, limit, steps, delayMs });
  const sample = await fetchCursorBackfillSample({ cursor, limit, steps, delayMs, onProgress });
  const actionPatterns = [
    'connect wallet',
    'connect wallet to claim',
    'wallet connect',
    'fill form',
    'instant usdt',
    'zero risk',
    'no signing required'
  ];
  const matches = [];

  for (const post of sample.posts || []) {
    const title = String(post?.title || '');
    const snippet = String(post?.snippet || post?.body || post?.description || post?.content || '');
    const text = `${title} ${snippet}`.toLowerCase();
    const matchedPatterns = actionPatterns.filter((phrase) => text.includes(phrase));
    if (!matchedPatterns.length) continue;
    matches.push({
      ...post,
      matchedActionPatterns: matchedPatterns,
      discoverySurface: post.discoverySurface || 'new'
    });
    if (matches.length >= 100) break;
  }

  const uniqueMatches = uniqueBy(matches, (post) => post.id);
  const matchPreview = uniqueMatches.slice(0, 20).map((post) => ({
    postId: String(post?.id || ''),
    title: String(post?.title || ''),
    matchedActionPatterns: post?.matchedActionPatterns || [],
    submolt: typeof post?.submolt === 'string'
      ? post.submolt
      : post?.submolt?.name || post?.submolt?.slug || post?.submolt?.title || null,
    snippet: String(post?.snippet || post?.body || post?.description || post?.content || '').slice(0, 280)
  }));

  return {
    ...sample,
    posts: uniqueMatches,
    matchCount: uniqueMatches.length,
    actionPatterns,
    matchPreview,
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
