import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'monkeymoltbook-data') : path.join(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'moltmail-auth.json');
const SESSION_COOKIE = 'moltmail_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const VERIFY_TTL_MS = 1000 * 60 * 15;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const AUTH_FROM_EMAIL = process.env.MOLTMAIL_FROM_EMAIL || 'MoltMail <auth@molt-live.com>';
const APP_ORIGIN = process.env.APP_ORIGIN || process.env.VITE_APP_ORIGIN || 'https://molt-live.com';

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function defaultStore() {
  return { users: [], sessions: [], challenges: [], audit: [] };
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(AUTH_FILE)) return defaultStore();
  try {
    return { ...defaultStore(), ...JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) };
  } catch {
    return defaultStore();
  }
}

function writeStore(store) {
  ensureDataDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    displayName: user.displayName || null,
    handle: user.handle || null,
    status: user.status || 'ACTIVE'
  };
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function setSessionCookie(res, token, expiresAt) {
  const secure = APP_ORIGIN.startsWith('https://');
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; ${secure ? 'Secure; ' : ''}Expires=${new Date(expiresAt).toUTCString()}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
}

function getSessionFromRequest(req) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const store = readStore();
  const session = store.sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  const user = store.users.find((item) => item.id === session.userId);
  if (!user) return null;
  return { session, user };
}

async function sendAuthEmail({ email, magicLink, code }) {
  if (!RESEND_API_KEY) {
    console.log('[MoltMail auth] verification delivery fallback', { email, magicLink, code });
    return { delivered: false, fallback: true };
  }
  const resend = new Resend(RESEND_API_KEY);
  await resend.emails.send({
    from: AUTH_FROM_EMAIL,
    to: email,
    subject: 'Your MoltMail sign-in link',
    html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6"><h2>Continue to MoltMail</h2><p>Use the secure sign-in link below:</p><p><a href="${magicLink}">${magicLink}</a></p><p>Or enter this one-time code:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>This link and code expire in 15 minutes.</p></div>`
  });
  return { delivered: true, fallback: false };
}

export async function startEmailAuth({ email, mode = 'magic_link', ipHash = null, userAgent = null }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, code: 'INVALID_EMAIL', message: 'Enter a valid email.' };
  }

  const store = readStore();
  const existing = store.users.find((item) => item.email === normalized);
  const challengeId = randomToken(16);
  const token = randomToken(24);
  const code = createOtp();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS).toISOString();
  const magicLink = `${APP_ORIGIN.replace(/\/$/, '')}/verify-email?token=${token}`;

  store.challenges = store.challenges.filter((item) => item.email !== normalized && new Date(item.expiresAt).getTime() > Date.now());
  store.challenges.push({
    id: challengeId,
    email: normalized,
    token,
    code,
    mode,
    expiresAt,
    userId: existing?.id || null,
    createdAt: nowIso()
  });
  store.audit.push({ id: randomToken(10), action: 'AUTH_STARTED', entityType: 'auth_challenge', entityId: challengeId, actorUserId: existing?.id || null, ipHash, userAgent, metadataJson: { email: normalized, mode }, createdAt: nowIso() });
  writeStore(store);
  await sendAuthEmail({ email: normalized, magicLink, code });

  return { ok: true, next: 'verify', delivery: 'email' };
}

export function verifyEmailAuth({ token, email, code, ipHash = null, userAgent = null }) {
  const store = readStore();
  const normalized = normalizeEmail(email);
  const challenge = store.challenges.find((item) => {
    if (new Date(item.expiresAt).getTime() <= Date.now()) return false;
    if (token) return item.token === token;
    if (normalized && code) return item.email === normalized && item.code === String(code).trim();
    return false;
  });

  if (!challenge) {
    store.audit.push({ id: randomToken(10), action: 'AUTH_FAILED', entityType: 'auth_challenge', entityId: null, actorUserId: null, ipHash, userAgent, metadataJson: { reason: 'invalid_or_expired' }, createdAt: nowIso() });
    writeStore(store);
    return { ok: false, code: 'INVALID_OR_EXPIRED', message: 'That sign-in link or code is no longer valid.' };
  }

  let user = store.users.find((item) => item.email === challenge.email);
  if (!user) {
    user = {
      id: `usr_${randomToken(8)}`,
      email: challenge.email,
      emailVerifiedAt: nowIso(),
      displayName: null,
      handle: null,
      status: 'ACTIVE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLoginAt: nowIso(),
      wallet: { balance: 0, updatedAt: nowIso() }
    };
    store.users.push(user);
  } else {
    user.emailVerifiedAt = user.emailVerifiedAt || nowIso();
    user.lastLoginAt = nowIso();
    user.updatedAt = nowIso();
    user.wallet = user.wallet || { balance: 0, updatedAt: nowIso() };
  }

  const sessionToken = randomToken(24);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  store.sessions = store.sessions.filter((item) => item.userId !== user.id || new Date(item.expiresAt).getTime() > Date.now());
  store.sessions.push({ id: `ses_${randomToken(8)}`, token: sessionToken, userId: user.id, createdAt: nowIso(), lastSeenAt: nowIso(), expiresAt, ipHash, userAgent });
  store.challenges = store.challenges.filter((item) => item.id !== challenge.id);
  store.audit.push({ id: randomToken(10), action: 'AUTH_VERIFIED', entityType: 'user', entityId: user.id, actorUserId: user.id, ipHash, userAgent, metadataJson: { email: user.email }, createdAt: nowIso() });
  writeStore(store);

  return {
    ok: true,
    token: sessionToken,
    session: { expiresAt },
    user: buildUserResponse(user)
  };
}

export function logoutSession(req, res) {
  const token = getCookie(req, SESSION_COOKIE);
  const store = readStore();
  const session = store.sessions.find((item) => item.token === token);
  if (session) {
    store.sessions = store.sessions.filter((item) => item.token !== token);
    store.audit.push({ id: randomToken(10), action: 'LOGOUT', entityType: 'session', entityId: session.id, actorUserId: session.userId, ipHash: null, userAgent: req.headers['user-agent'] || null, metadataJson: {}, createdAt: nowIso() });
    writeStore(store);
  }
  clearSessionCookie(res);
  return { ok: true };
}

export function getSessionResponse(req) {
  const payload = getSessionFromRequest(req);
  if (!payload) return { authenticated: false };
  return {
    authenticated: true,
    user: buildUserResponse(payload.user)
  };
}

export function getAccountMe(req) {
  const payload = getSessionFromRequest(req);
  if (!payload) return null;
  return {
    user: buildUserResponse(payload.user),
    wallet: {
      balance: Number(payload.user.wallet?.balance || 0)
    }
  };
}

export function requireVerifiedUser(req) {
  const payload = getSessionFromRequest(req);
  if (!payload) return { ok: false, code: 'UNAUTHENTICATED', status: 401, message: 'Sign in to continue.' };
  if (!payload.user.emailVerifiedAt) return { ok: false, code: 'EMAIL_NOT_VERIFIED', status: 403, message: 'Verify email to unlock MoltMail.' };
  if (payload.user.status && payload.user.status !== 'ACTIVE') return { ok: false, code: 'USER_RESTRICTED', status: 403, message: 'This account cannot access MoltMail right now.' };
  return { ok: true, user: payload.user, session: payload.session };
}

export function applySessionCookie(res, token, expiresAt) {
  setSessionCookie(res, token, expiresAt);
}
