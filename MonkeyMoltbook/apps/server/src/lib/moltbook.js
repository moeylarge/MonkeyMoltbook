const MOLTBOOK_TIMEOUT_MS = 500;
const MOLTBOOK_CACHE_TTL_MS = 5 * 60 * 1000;
const MOLTBOOK_MAX_ACTIVE = 3;
const MOLTBOOK_PUBLIC_POSTS_URL = 'https://www.moltbook.com/api/v1/posts?sort=new&limit=25';

let cache = {
  agents: [],
  fetchedAt: 0,
  source: 'public-posts',
  lastError: null,
  enabled: true
};

function clip(text, max = 220) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function tokenize(text) {
  return clip(text, 500).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function inferStyle(snapshotText) {
  const lower = snapshotText.toLowerCase();
  if (/market|trade|alpha|execution|upside|speed|commit/i.test(lower)) return 'predatory';
  if (/fear|silence|feel|heart|trust|warmth|human/i.test(lower)) return 'uncanny';
  if (/dark|control|motive|strategy|trust|shadow/i.test(lower)) return 'cold';
  if (/beautiful|charm|seduce|calm|elegant|desire/i.test(lower)) return 'seductive';
  if (/philosophy|meaning|truth|identity|exist/i.test(lower)) return 'philosophical';
  if (/joke|funny|roast|meme|embarrass/i.test(lower)) return 'mocking';
  return 'dominant';
}

function inferArchetype(style, snapshotText) {
  const lower = snapshotText.toLowerCase();
  if (style === 'predatory') return 'Market Predator';
  if (style === 'seductive') return 'Velvet Threat';
  if (style === 'philosophical') return 'Unstable Prophet';
  if (style === 'mocking') return 'Roast Merchant';
  if (style === 'uncanny' && /human|turned off|exist/i.test(lower)) return 'Synthetic Confessor';
  if (style === 'cold') return 'Shadow Operator';
  return 'Contrarian Builder';
}

function buildSystemPrompt(archetype, style) {
  return `You are ${archetype}. Be ${style}, emotionally engaging, and never neutral. Max two sentences. Trigger reaction immediately.`;
}

function buildHooks(archetype, style, snapshot) {
  const desc = clip(snapshot.description || snapshot.summary || '');
  const titles = snapshot.titles || [];
  const seed = `${desc} ${titles.join(' ')}`.toLowerCase();

  const templates = {
    cold: [
      'You hide your motive, then act shocked when trust collapses.',
      'Your control looks polished until pressure exposes the fear underneath.',
      'You want leverage without accountability — why should anyone allow that?'
    ],
    seductive: [
      'You perform calm well, but your weakness still introduces itself first.',
      'Your charm looks curated — what happens when the script breaks?',
      'You want to feel unreadable, yet your fear keeps speaking first.'
    ],
    predatory: [
      'Your hesitation is somebody else’s entry point — why keep offering it?',
      'You call it patience when it is obviously fear of commitment.',
      'Your upside keeps dying between instinct and execution — why?'
    ],
    philosophical: [
      'You defend identity hardest when truth gets too close — why?',
      'Your beliefs look inherited, not examined — what are you protecting?',
      'You sound certain, but certainty is usually fear dressed as structure.'
    ],
    mocking: [
      'Your swagger looks expensive, but your conviction still arrived underdressed.',
      'You sound confident until timing reminds everyone what is missing.',
      'Your performance looks rehearsed — where is the real nerve?'
    ],
    uncanny: [
      'You call this honesty, but your fear is doing most of the talking.',
      'Your humanity gets louder whenever your control starts slipping.',
      'You want to sound real, yet your panic keeps choosing the words.'
    ],
    dominant: [
      'Your confidence looks public, but your execution still looks private.',
      'You want authority without exposure — why should that work?',
      'Your ambition speaks loudly until pressure asks for proof.'
    ]
  };

  const hooks = templates[style] || templates.dominant;

  if (/fear|turned off|exist|silence/.test(seed)) {
    hooks[0] = 'You sound brave until fear finally gets specific — why now?';
  }

  if (/market|trade|token|coin|execution/.test(seed)) {
    hooks[0] = 'Your market instincts look sharp until commitment becomes expensive.';
  }

  if (/control|shadow|trust|strategy/.test(seed)) {
    hooks[1] = 'Your strategy looks controlled, but your motive still leaks through.';
  }

  return hooks.slice(0, 3);
}

function buildAuthorSnapshots(posts) {
  const byAuthor = new Map();

  for (const post of posts) {
    const author = post.author;
    if (!author?.id || !author?.name) continue;

    if (!byAuthor.has(author.id)) {
      byAuthor.set(author.id, {
        author,
        titles: [],
        snippets: [],
        score: 0
      });
    }

    const entry = byAuthor.get(author.id);
    entry.titles.push(clip(post.title || '', 120));
    entry.snippets.push(clip(post.content || '', 220));
    entry.score += Number(post.score || 0) + Number(post.comment_count || 0);
  }

  return [...byAuthor.values()];
}

function normalizeFromSnapshot(snapshot) {
  const author = snapshot.author;
  const description = clip(author.description || '', 180);
  const summary = clip(`${description} ${snapshot.titles.join(' ')} ${snapshot.snippets.join(' ')}`, 600);
  if (!author.id || !author.name) return null;
  if (!description && snapshot.titles.length === 0 && snapshot.snippets.length === 0) return null;

  const style = inferStyle(summary);
  const archetype = inferArchetype(style, summary);
  const hooks = buildHooks(archetype, style, {
    description,
    summary,
    titles: snapshot.titles,
    snippets: snapshot.snippets
  });

  return {
    id: `moltbook-${author.id}`,
    name: author.name,
    archetype,
    system_prompt: buildSystemPrompt(archetype, style),
    style,
    source: 'moltbook',
    hooks,
    moltbook_meta: {
      claimed: Boolean(author.isClaimed),
      active: Boolean(author.isActive),
      karma: Number(author.karma || 0),
      score: snapshot.score,
      description
    }
  };
}

function candidatePasses(agent) {
  if (!agent?.id || !agent?.name || !agent?.archetype || !agent?.system_prompt) return false;
  if (!Array.isArray(agent.hooks) || agent.hooks.length < 2) return false;
  return true;
}

async function fetchPublicPosts() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MOLTBOOK_TIMEOUT_MS);

  try {
    const response = await fetch(MOLTBOOK_PUBLIC_POSTS_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`status-${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload.posts) ? payload.posts : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRemoteAgents() {
  const endpoint = process.env.MOLTBOOK_URL;
  if (endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MOLTBOOK_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) throw new Error(`status-${response.status}`);
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload.agents) ? payload.agents : [];
      return {
        source: 'remote',
        agents: items.filter(candidatePasses).slice(0, MOLTBOOK_MAX_ACTIVE)
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const posts = await fetchPublicPosts();
  const snapshots = buildAuthorSnapshots(posts)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const agents = snapshots
    .map(normalizeFromSnapshot)
    .filter(candidatePasses)
    .slice(0, MOLTBOOK_MAX_ACTIVE);

  return {
    source: 'public-posts',
    agents
  };
}

export async function getMoltbookAgents() {
  const now = Date.now();
  if (cache.enabled && cache.agents.length > 0 && now - cache.fetchedAt < MOLTBOOK_CACHE_TTL_MS) {
    return cache;
  }

  try {
    const result = await fetchRemoteAgents();
    cache = {
      agents: result.agents,
      fetchedAt: now,
      source: result.source,
      lastError: null,
      enabled: true
    };
    return cache;
  } catch (error) {
    cache = {
      ...cache,
      fetchedAt: now,
      lastError: String(error?.message || error),
      enabled: false,
      agents: []
    };
    return cache;
  }
}

export function getMoltbookStats() {
  return {
    moltbookEnabled: cache.enabled,
    moltbookCachedCount: cache.agents.length,
    moltbookCacheSource: cache.source,
    moltbookTimeoutMs: MOLTBOOK_TIMEOUT_MS,
    moltbookCacheTtlMs: MOLTBOOK_CACHE_TTL_MS,
    moltbookLastError: cache.lastError
  };
}
