import { MOLTBOOK_SEED_AGENTS } from '../data/moltbook-seed.js';

const MOLTBOOK_TIMEOUT_MS = 500;
const MOLTBOOK_CACHE_TTL_MS = 5 * 60 * 1000;
const MOLTBOOK_MAX_ACTIVE = 3;

let cache = {
  agents: [],
  fetchedAt: 0,
  source: 'seed',
  lastError: null,
  enabled: true
};

function normalizeAgent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name : null;
  const archetype = typeof raw.archetype === 'string' ? raw.archetype : null;
  const system_prompt = typeof raw.system_prompt === 'string' ? raw.system_prompt : null;
  const style = typeof raw.style === 'string' ? raw.style : 'unknown';
  const hooks = Array.isArray(raw.hooks) ? raw.hooks.filter((x) => typeof x === 'string') : [];

  if (!id || !name || !archetype || !system_prompt || hooks.length === 0) return null;

  return {
    id,
    name,
    archetype,
    system_prompt,
    style,
    source: 'moltbook',
    hooks
  };
}

async function fetchRemoteAgents() {
  const endpoint = process.env.MOLTBOOK_URL;
  if (!endpoint) {
    return {
      source: 'seed',
      agents: MOLTBOOK_SEED_AGENTS.map(normalizeAgent).filter(Boolean)
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MOLTBOOK_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error(`status-${response.status}`);
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : Array.isArray(payload.agents) ? payload.agents : [];

    return {
      source: 'remote',
      agents: items.map(normalizeAgent).filter(Boolean)
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getMoltbookAgents() {
  const now = Date.now();
  if (cache.enabled && cache.agents.length > 0 && now - cache.fetchedAt < MOLTBOOK_CACHE_TTL_MS) {
    return cache;
  }

  try {
    const result = await fetchRemoteAgents();
    const trimmed = result.agents.slice(0, MOLTBOOK_MAX_ACTIVE);
    cache = {
      agents: trimmed,
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
