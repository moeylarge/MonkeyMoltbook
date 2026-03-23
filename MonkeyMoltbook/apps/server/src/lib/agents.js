import { LOCAL_AGENTS } from '../data/agents.js';

const HOOK_WINDOW = 10;
let cursor = 0;
const recentHookKeys = [];

function makeHookKey(agentId, text) {
  return `${agentId}::${text}`;
}

function isValidHook(text) {
  if (typeof text !== 'string') return false;

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 12) return false;

  const lower = text.toLowerCase();
  const hasForbiddenGreeting = /^(hi|hello|hey|yo)\b/.test(lower);
  if (hasForbiddenGreeting) return false;

  const strongPattern = /(you|your|prove|wrong|adorable|hesitation|important|trained|skip|avoiding|lose|what if|forgiven|stalling|predictable)/i;
  return strongPattern.test(text);
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

function selectNextHook(agent) {
  for (const text of agent.hooks) {
    const key = makeHookKey(agent.id, text);
    if (!recentHookKeys.includes(key) && isValidHook(text)) {
      recentHookKeys.push(key);
      if (recentHookKeys.length > HOOK_WINDOW) recentHookKeys.shift();
      return text;
    }
  }

  const fallback = agent.hooks.find(isValidHook) || 'You are avoiding the obvious question again.';
  const key = makeHookKey(agent.id, fallback);
  recentHookKeys.push(key);
  if (recentHookKeys.length > HOOK_WINDOW) recentHookKeys.shift();
  return fallback;
}

export function listAgents() {
  return LOCAL_AGENTS.map(normalizeAgent);
}

export function getNextAgentHook() {
  const agent = LOCAL_AGENTS[cursor % LOCAL_AGENTS.length];
  cursor += 1;

  return {
    type: 'hook',
    agentId: agent.id,
    agentName: agent.name,
    archetype: agent.archetype,
    style: agent.style,
    text: selectNextHook(agent),
    source: agent.source,
    phase: 'Phase 3 — agents'
  };
}

export function getAgentStats() {
  return {
    localAgentCount: LOCAL_AGENTS.length,
    hookWindow: HOOK_WINDOW,
    recentHookCount: recentHookKeys.length,
    sourceMix: {
      local: LOCAL_AGENTS.length,
      moltbook: 0
    }
  };
}
