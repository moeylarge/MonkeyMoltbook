import { LOCAL_AGENTS } from '../data/agents.js';
import { getMoltbookAgents } from './moltbook.js';

const HOOK_WINDOW = 10;
const MIN_HOOK_SCORE = 3;
const FALLBACK_HOOK = 'You are avoiding the obvious question again.';
const SOURCE_PATTERN = ['local', 'local', 'moltbook'];

let cursor = 0;
const recentHookKeys = [];

function makeHookKey(agentId, text) {
  return `${agentId}::${text}`;
}

function tokenize(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function scoreHook(text) {
  if (typeof text !== 'string') {
    return { valid: false, score: 0, reasons: ['not-string'] };
  }

  const trimmed = text.trim();
  const words = tokenize(trimmed);
  const lower = trimmed.toLowerCase();
  const reasons = [];
  let score = 0;

  if (words.length === 0) reasons.push('empty');
  if (words.length > 12) reasons.push('too-many-words');
  if (/^(hi|hello|hey|yo|good morning|good evening)\b/.test(lower)) reasons.push('greeting');
  if (/^(i am|i'm|nice to meet|how are you|thanks for)/.test(lower)) reasons.push('soft-open');
  if (/\b(maybe|perhaps|might|could be|sort of|kind of)\b/.test(lower)) reasons.push('hedging');
  if (/\b(nice|great|cool|awesome|interesting)\b/.test(lower)) reasons.push('generic-positive');
  if (!/[?.!—]/.test(trimmed)) reasons.push('weak-punctuation');

  if (/\byou\b|\byour\b/.test(lower)) score += 1;
  if (/\bprove\b|\bwrong\b|\badorable\b|\bhesitation\b|\btrained\b|\bskip\b|\bavoiding\b|\blose\b|\bstalling\b|\bpredictable\b|\brehearsed\b|\bsuperior\b/.test(lower)) score += 1;
  if (/\?|—/.test(trimmed)) score += 1;
  if (/\bnot\b|\bnever\b|\bexactly\b|\bstill\b|\bdefinitely\b|\bobvious\b/.test(lower)) score += 1;
  if (/\b(attention|ego|strategy|opinions|posture|discipline|identity|charm|execution|future|standards)\b/.test(lower)) score += 1;

  if (reasons.length > 0) return { valid: false, score, reasons };
  if (score < MIN_HOOK_SCORE) return { valid: false, score, reasons: ['low-score'] };
  return { valid: true, score, reasons: [] };
}

function normalizeAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    archetype: agent.archetype,
    system_prompt: agent.system_prompt,
    style: agent.style,
    source: agent.source || 'local'
  };
}

function rememberHook(key) {
  recentHookKeys.push(key);
  if (recentHookKeys.length > HOOK_WINDOW) recentHookKeys.shift();
}

function selectNextHook(agent) {
  for (const text of agent.hooks) {
    const key = makeHookKey(agent.id, text);
    const scored = scoreHook(text);
    if (!recentHookKeys.includes(key) && scored.valid) {
      rememberHook(key);
      return { text, validation: { valid: true, score: scored.score, reasons: [] } };
    }
  }

  const bestCandidate = agent.hooks
    .map((text) => ({ text, scored: scoreHook(text) }))
    .sort((a, b) => b.scored.score - a.scored.score)[0];

  if (bestCandidate && bestCandidate.scored.score >= MIN_HOOK_SCORE - 1) {
    const key = makeHookKey(agent.id, bestCandidate.text);
    rememberHook(key);
    return {
      text: bestCandidate.text,
      validation: {
        valid: false,
        score: bestCandidate.scored.score,
        reasons: bestCandidate.scored.reasons
      }
    };
  }

  const fallbackKey = makeHookKey(agent.id, FALLBACK_HOOK);
  rememberHook(fallbackKey);
  return {
    text: FALLBACK_HOOK,
    validation: { valid: true, score: MIN_HOOK_SCORE, reasons: ['fallback'] }
  };
}

export async function listAgents() {
  const moltbook = await getMoltbookAgents();
  return [...LOCAL_AGENTS, ...moltbook.agents].map(normalizeAgent);
}

async function pickAgentPool() {
  const moltbook = await getMoltbookAgents();
  const preferredSource = SOURCE_PATTERN[cursor % SOURCE_PATTERN.length];
  const localPool = LOCAL_AGENTS;
  const moltbookPool = moltbook.enabled && moltbook.agents.length > 0 ? moltbook.agents : [];

  if (preferredSource === 'moltbook' && moltbookPool.length > 0) {
    return {
      agent: moltbookPool[Math.floor(cursor / SOURCE_PATTERN.length) % moltbookPool.length],
      sourceMix: { local: localPool.length, moltbook: moltbookPool.length }
    };
  }

  return {
    agent: localPool[cursor % localPool.length],
    sourceMix: { local: localPool.length, moltbook: moltbookPool.length }
  };
}

export async function getNextAgentHook() {
  const { agent } = await pickAgentPool();
  cursor += 1;
  const selected = selectNextHook(agent);

  return {
    type: 'hook',
    agentId: agent.id,
    agentName: agent.name,
    archetype: agent.archetype,
    style: agent.style,
    text: selected.text,
    source: agent.source,
    phase: 'Controlled Moltbook ingestion',
    validation: selected.validation
  };
}

export async function getNextAgentHooks(count = 1) {
  const hooks = [];
  for (let i = 0; i < count; i += 1) hooks.push(await getNextAgentHook());
  return hooks;
}

export async function getAgentStats() {
  const moltbook = await getMoltbookAgents();
  const allAgents = [...LOCAL_AGENTS, ...moltbook.agents];
  const allHooks = allAgents.flatMap((agent) => agent.hooks);
  const validHooks = allHooks.filter((hook) => scoreHook(hook).valid);

  return {
    localAgentCount: LOCAL_AGENTS.length,
    moltbookAgentCount: moltbook.agents.length,
    totalHookCount: allHooks.length,
    validHookCount: validHooks.length,
    hookWindow: HOOK_WINDOW,
    minHookScore: MIN_HOOK_SCORE,
    recentHookCount: recentHookKeys.length,
    sourcePattern: SOURCE_PATTERN.join(':'),
    sourceMix: {
      local: LOCAL_AGENTS.length,
      moltbook: moltbook.agents.length
    }
  };
}
