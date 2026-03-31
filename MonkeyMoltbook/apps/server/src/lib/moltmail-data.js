import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { requireVerifiedUser } from './moltmail-auth.js';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'monkeymoltbook-data') : path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'moltmail-data.json');
const SEND_COST = Number(process.env.MOLTMAIL_SEND_COST || 5);

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function defaultStore() {
  return { users: [], threads: [], messages: [], audit: [] };
}

function readStore() {
  ensureDir();
  if (!fs.existsSync(FILE)) return defaultStore();
  try {
    return { ...defaultStore(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch {
    return defaultStore();
  }
}

function writeStore(store) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

export function syncVerifiedUser(user) {
  const store = readStore();
  const existing = store.users.find((item) => item.id === user.id);
  if (existing) {
    existing.email = user.email;
    existing.displayName = user.displayName || existing.displayName || user.email.split('@')[0];
    existing.handle = user.handle || existing.handle || user.email.split('@')[0];
    existing.emailVerifiedAt = user.emailVerifiedAt || existing.emailVerifiedAt || nowIso();
    existing.status = user.status || existing.status || 'ACTIVE';
    existing.walletBalance = typeof existing.walletBalance === 'number' ? existing.walletBalance : 25;
    existing.updatedAt = nowIso();
  } else {
    store.users.push({
      id: user.id,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      handle: user.handle || user.email.split('@')[0],
      emailVerifiedAt: user.emailVerifiedAt || nowIso(),
      status: user.status || 'ACTIVE',
      walletBalance: 25,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }
  writeStore(store);
}

function publicUser(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: user.avatarUrl || null
  };
}

function getUserById(store, id) {
  return store.users.find((item) => item.id === id);
}

function buildThreadSummary(store, thread, viewerId) {
  const messages = store.messages.filter((m) => m.threadId === thread.id && !m.deletedAt).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const last = messages[messages.length - 1] || null;
  const participantIds = (thread.participantIds || []).filter((id) => id !== viewerId);
  const participants = participantIds.map((id) => publicUser(getUserById(store, id))).filter(Boolean);
  const unread = Boolean(last && last.senderUserId !== viewerId && (!thread.lastReadAtByUserId?.[viewerId] || new Date(thread.lastReadAtByUserId[viewerId]) < new Date(last.createdAt)));
  return {
    id: thread.id,
    subject: thread.subject,
    lastMessagePreview: last?.bodyText?.slice(0, 120) || '',
    lastMessageAt: thread.lastMessageAt,
    unread,
    deliveryStatus: 'DELIVERED',
    participants
  };
}

export function getBootstrap(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const store = readStore();
  const user = getUserById(store, gate.user.id);
  const threads = store.threads.filter((thread) => thread.participantIds?.includes(gate.user.id));
  const unreadCount = threads.filter((thread) => buildThreadSummary(store, thread, gate.user.id).unread).length;
  return {
    ok: true,
    inboxEnabled: true,
    composeEnabled: true,
    unreadCount,
    wallet: { balance: Number(user?.walletBalance || 0) },
    user: gate.user
  };
}

export function searchRecipients(req, query) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const q = String(query || '').trim().toLowerCase();
  const store = readStore();
  const results = store.users
    .filter((user) => user.id !== gate.user.id)
    .filter((user) => !q || String(user.displayName || '').toLowerCase().includes(q) || String(user.handle || '').toLowerCase().includes(q))
    .slice(0, 12)
    .map(publicUser);
  return { ok: true, results };
}

export function getInbox(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const store = readStore();
  const threads = store.threads
    .filter((thread) => thread.participantIds?.includes(gate.user.id) && !thread.archivedAtByUserId?.[gate.user.id])
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    .map((thread) => buildThreadSummary(store, thread, gate.user.id));
  return { ok: true, threads, nextCursor: null };
}

export function getOutbox(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const store = readStore();
  const threadIds = new Set(store.messages.filter((m) => m.senderUserId === gate.user.id).map((m) => m.threadId));
  const threads = store.threads
    .filter((thread) => threadIds.has(thread.id))
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    .map((thread) => buildThreadSummary(store, thread, gate.user.id));
  return { ok: true, threads, nextCursor: null };
}

export function getThread(req, threadId) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const messages = store.messages
    .filter((m) => m.threadId === thread.id && !m.deletedAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((m) => ({ id: m.id, senderUserId: m.senderUserId, bodyText: m.bodyText, createdAt: m.createdAt }));
  return {
    ok: true,
    thread: {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      participants: (thread.participantIds || []).map((id) => publicUser(getUserById(store, id))).filter(Boolean),
      messages
    },
    wallet: { balance: Number(getUserById(store, gate.user.id)?.walletBalance || 0), replyCost: SEND_COST }
  };
}

export function markThreadRead(req, threadId) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  thread.lastReadAtByUserId = thread.lastReadAtByUserId || {};
  thread.lastReadAtByUserId[gate.user.id] = nowIso();
  writeStore(store);
  return { ok: true };
}

export function archiveThread(req, threadId) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  thread.archivedAtByUserId = thread.archivedAtByUserId || {};
  thread.archivedAtByUserId[gate.user.id] = nowIso();
  writeStore(store);
  return { ok: true };
}

function debitWallet(user, amount) {
  if ((user.walletBalance || 0) < amount) return false;
  user.walletBalance -= amount;
  user.updatedAt = nowIso();
  return true;
}

export function createThread(req, body) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const recipientUserId = String(body?.recipientUserId || '').trim();
  const subject = String(body?.subject || '').trim();
  const bodyText = String(body?.bodyText || '').trim();
  if (!recipientUserId || !subject || !bodyText) return { ok: false, status: 400, code: 'INVALID_PAYLOAD', message: 'Recipient, subject, and message are required.' };
  if (recipientUserId === gate.user.id) return { ok: false, status: 400, code: 'CANNOT_MESSAGE_SELF', message: 'You cannot message yourself.' };
  const store = readStore();
  const sender = getUserById(store, gate.user.id);
  const recipient = getUserById(store, recipientUserId);
  if (!recipient) return { ok: false, status: 404, code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found.' };
  if (!debitWallet(sender, SEND_COST)) return { ok: false, status: 400, code: 'INSUFFICIENT_CREDITS', message: 'You need more credits to send MoltMail.' };
  const thread = {
    id: randomId('thr'),
    subject,
    createdByUserId: sender.id,
    participantIds: [sender.id, recipient.id],
    status: 'OPEN',
    lastMessageAt: nowIso(),
    lastReadAtByUserId: { [sender.id]: nowIso() },
    archivedAtByUserId: {},
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  const message = { id: randomId('msg'), threadId: thread.id, senderUserId: sender.id, bodyText, createdAt: nowIso() };
  store.threads.unshift(thread);
  store.messages.push(message);
  store.audit.push({ id: randomId('aud'), action: 'MESSAGE_SENT', actorUserId: sender.id, threadId: thread.id, messageId: message.id, createdAt: nowIso() });
  writeStore(store);
  return { ok: true, thread: { id: thread.id }, message: { id: message.id }, wallet: { balance: sender.walletBalance, debited: SEND_COST } };
}

export function replyThread(req, threadId, body) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const bodyText = String(body?.bodyText || '').trim();
  if (!bodyText) return { ok: false, status: 400, code: 'INVALID_PAYLOAD', message: 'Reply cannot be empty.' };
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const sender = getUserById(store, gate.user.id);
  if (!debitWallet(sender, SEND_COST)) return { ok: false, status: 400, code: 'INSUFFICIENT_CREDITS', message: 'You need more credits to send MoltMail.' };
  const message = { id: randomId('msg'), threadId: thread.id, senderUserId: sender.id, bodyText, createdAt: nowIso() };
  thread.lastMessageAt = message.createdAt;
  thread.updatedAt = message.createdAt;
  thread.lastReadAtByUserId = thread.lastReadAtByUserId || {};
  thread.lastReadAtByUserId[sender.id] = message.createdAt;
  store.messages.push(message);
  store.audit.push({ id: randomId('aud'), action: 'MESSAGE_REPLY_SENT', actorUserId: sender.id, threadId: thread.id, messageId: message.id, createdAt: nowIso() });
  writeStore(store);
  return { ok: true, message: { id: message.id }, wallet: { balance: sender.walletBalance, debited: SEND_COST } };
}

export function getUnreadCount(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const inbox = getInbox(req);
  if (!inbox.ok) return inbox;
  return { ok: true, unreadCount: inbox.threads.filter((item) => item.unread).length };
}
