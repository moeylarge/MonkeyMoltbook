const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DEFAULT_USER_ID = 'demo-user';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const APP_URL = process.env.APP_URL || 'https://molt-live.com';

const DEFAULT_PRODUCTS = [
  { code: 'basic_monthly_100', name: 'Basic Monthly', credits_amount: 100, price_usd_cents: 1900, billing_interval: 'month', stripe_price_id: null, active: true },
  { code: 'silver_monthly_300', name: 'Silver Monthly', credits_amount: 300, price_usd_cents: 4900, billing_interval: 'month', stripe_price_id: null, active: true },
  { code: 'gold_monthly_750', name: 'Gold Monthly', credits_amount: 750, price_usd_cents: 9900, billing_interval: 'month', stripe_price_id: null, active: true }
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

  await rest('credit_products', {
    method: 'PATCH',
    query: 'code=in.(starter_25,creator_100,battle_300)',
    body: { active: false },
    prefer: 'return=minimal'
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
    query: 'active=eq.true&select=*&order=price_usd_cents.asc'
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
  return { ok: true, balance: balanceAfter, cost, wallet: updatedWallet, transaction: tx, launchFree: false };
}

export async function createCheckoutSession({ productCode, userId = DEFAULT_USER_ID }) {
  const products = await listCreditProducts();
  const product = products.find((p) => p.code === productCode);
  if (!product) throw new Error('unknown_product_code');
  if (!STRIPE_SECRET_KEY) {
    return {
      ok: false,
      error: 'stripe_not_configured',
      product,
      next: 'add STRIPE_SECRET_KEY and stripe_price_id values'
    };
  }
  if (!product.stripe_price_id) {
    return {
      ok: false,
      error: 'stripe_price_missing',
      product,
      next: 'attach Stripe price ids to credit_products rows'
    };
  }

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('line_items[0][price]', product.stripe_price_id);
  params.append('line_items[0][quantity]', '1');
  params.append('success_url', `${APP_URL}/live/${encodeURIComponent('jimmythelizard')}?checkout=success&product=${encodeURIComponent(product.code)}`);
  params.append('cancel_url', `${APP_URL}/live/${encodeURIComponent('jimmythelizard')}?checkout=cancelled`);
  params.append('metadata[userId]', userId);
  params.append('metadata[productCode]', product.code);
  params.append('metadata[creditsAmount]', String(product.credits_amount));

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!response.ok) throw new Error(`stripe_checkout_${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return { ok: true, product, checkoutUrl: data.url || null, checkoutSessionId: data.id || null };
}
