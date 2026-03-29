const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DEFAULT_USER_ID = 'demo-user';
const DEFAULT_PRODUCTS = [
  { code: 'starter_25', name: 'Starter 25', credits_amount: 25, stripe_price_id: null, active: true },
  { code: 'creator_100', name: 'Creator 100', credits_amount: 100, stripe_price_id: null, active: true },
  { code: 'battle_300', name: 'Battle 300', credits_amount: 300, stripe_price_id: null, active: true }
];
const SPEND_RULES = {
  chat_unlock: 2,
  priority_prompt: 3,
  queue_jump: 5,
  session_extend_5m: 8,
  premium_agent_unlock: 12,
  battle_unlock: 15
};

function enabled() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function headers(prefer = '') {
  const out = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
  if (prefer) out.Prefer = prefer;
  return out;
}

function url(table, query = '') {
  const base = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

async function rest(table, { method = 'GET', query = '', body, prefer = '' } = {}) {
  if (!enabled()) throw new Error('credits_storage_disabled');
  const response = await fetch(url(table, query), {
    method,
    headers: headers(prefer),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!response.ok) throw new Error(`credits_${table}_${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

export function creditsEnabled() {
  return enabled();
}

export function getSpendRules() {
  return SPEND_RULES;
}

export async function ensureCreditProducts() {
  const rows = await rest('credit_products', {
    method: 'POST',
    query: 'on_conflict=code',
    body: DEFAULT_PRODUCTS,
    prefer: 'resolution=merge-duplicates,return=representation'
  });
  return rows || [];
}

export async function getWallet(userId = DEFAULT_USER_ID) {
  const rows = await rest('wallets', {
    query: `user_id=eq.${encodeURIComponent(userId)}&select=*`
  });
  if (rows?.length) return rows[0];
  const [created] = await rest('wallets', {
    method: 'POST',
    body: [{ user_id: userId, balance: 0, updated_at: new Date().toISOString() }],
    prefer: 'return=representation'
  });
  return created;
}

export async function listCreditTransactions(userId = DEFAULT_USER_ID, limit = 20) {
  return rest('credit_transactions', {
    query: `user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=${limit}`
  });
}

export async function listCreditProducts() {
  await ensureCreditProducts();
  return rest('credit_products', {
    query: 'active=eq.true&select=*&order=credits_amount.asc'
  });
}

export async function grantCredits({ userId = DEFAULT_USER_ID, amount, reason = 'manual', sessionId = null, meta = null, type = 'bonus' }) {
  const wallet = await getWallet(userId);
  const balanceAfter = Number(wallet.balance || 0) + Number(amount || 0);
  const [updatedWallet] = await rest('wallets', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(userId)}&select=*`,
    body: { balance: balanceAfter, updated_at: new Date().toISOString() },
    prefer: 'return=representation'
  });
  const [tx] = await rest('credit_transactions', {
    method: 'POST',
    body: [{ user_id: userId, session_id: sessionId, type, amount: Number(amount || 0), balance_after: balanceAfter, reason, meta }],
    prefer: 'return=representation'
  });
  return { wallet: updatedWallet, transaction: tx };
}

export async function spendCredits({ userId = DEFAULT_USER_ID, sessionId = null, actionCode }) {
  const cost = SPEND_RULES[actionCode];
  if (!cost) throw new Error('unknown_action_code');
  const wallet = await getWallet(userId);
  const current = Number(wallet.balance || 0);
  if (current < cost) {
    return { ok: false, error: 'insufficient_credits', balance: current, cost };
  }
  const balanceAfter = current - cost;
  const [updatedWallet] = await rest('wallets', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(userId)}&select=*`,
    body: { balance: balanceAfter, updated_at: new Date().toISOString() },
    prefer: 'return=representation'
  });
  const [tx] = await rest('credit_transactions', {
    method: 'POST',
    body: [{ user_id: userId, session_id: sessionId, type: 'spend', amount: -cost, balance_after: balanceAfter, reason: actionCode, meta: { actionCode, cost } }],
    prefer: 'return=representation'
  });
  return { ok: true, balance: balanceAfter, cost, wallet: updatedWallet, transaction: tx };
}
