import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAllAuthUsers, requireVerifiedUser } from './moltmail-auth.js';

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
  return { users: [], threads: [], messages: [], audit: [], delivery: [], rateLimits: [] };
}

function readStore() {
  ensureDir();
  if (!fs.existsSync(FILE)) return defaultStore();
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultStore(), ...parsed };
  } catch {
    return defaultStore();
  }
}

function withStore(mutator) {
  ensureDir();
  let store = defaultStore();
  if (fs.existsSync(FILE)) {
    try {
      store = { ...defaultStore(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
    } catch {
      store = defaultStore();
    }
  }
  const result = mutator(store);
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
  return result;
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
  ensureSystemUser(store);
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


const SYSTEM_USER_ID = 'usr_moltmail_system';

function getDemoThreadId(userId) {
  return `thr_demo_${userId}`;
}

function ensureDemoThreadForUser(store, userId) {
  const systemUser = ensureSystemUser(store);
  const threadId = getDemoThreadId(userId);
  const baseTime = Date.now() - (1000 * 60 * 18);
  const at = (step) => new Date(baseTime + (step * 1000 * 55)).toISOString();
  const demoBodies = [
    [systemUser.id, 'Welcome to MoltMail — your inbox is live.'],
    [systemUser.id, 'I seeded this thread so the unlocked experience feels like a real conversation, not an empty shell.'],
    [userId, 'Good. I wanted the thread to look inhabited right away.'],
    [systemUser.id, 'Exactly. The goal is a believable DM flow with clear back-and-forth.'],
    [userId, 'So the basics are: distinct sent and received bubbles, stronger density, and less dead space.'],
    [systemUser.id, 'Yes — plus a feed that reads instantly on desktop and still feels real on mobile.'],
    [userId, 'That should make the active thread feel closer to iMessage or Instagram DM instead of a sparse demo.'],
    [systemUser.id, 'Exactly. Keep the composer anchored, but make the conversation itself dominate the screen.'],
    [systemUser.id, 'Once the screenshots clearly show both sides of the thread, the realism pass is doing its job.']
  ];
  store.threads = store.threads.filter((thread) => !(thread.participantIds?.includes(userId) && thread.participantIds?.includes(systemUser.id) && thread.id !== threadId));
  store.messages = store.messages.filter((message) => message.threadId !== threadId);
  let thread = store.threads.find((item) => item.id === threadId);
  if (!thread) {
    thread = {
      id: threadId,
      subject: systemUser.displayName || systemUser.handle || 'Conversation',
      createdByUserId: systemUser.id,
      participantIds: [userId, systemUser.id],
      status: 'OPEN',
      lastMessageAt: at(0),
      archivedForUserIds: [],
      createdAt: at(0),
      updatedAt: at(0)
    };
    store.threads.unshift(thread);
  }
  const messages = demoBodies.map(([senderUserId, bodyText], index) => ({
    id: randomId('msg'),
    threadId,
    senderUserId,
    bodyText,
    createdAt: at(index)
  }));
  store.messages.push(...messages);
  thread.subject = systemUser.displayName || systemUser.handle || thread.subject || 'Conversation';
  thread.participantIds = [userId, systemUser.id];
  thread.status = 'OPEN';
  thread.lastReadAtByUserId = thread.lastReadAtByUserId || {};
  thread.archivedAtByUserId = thread.archivedAtByUserId || {};
  thread.lastMessageAt = messages[messages.length - 1].createdAt;
  thread.updatedAt = thread.lastMessageAt;
  return thread;
}

function ensureSystemUser(store) {
  const existing = store.users.find((item) => item.id === SYSTEM_USER_ID);
  if (existing) return existing;
  const user = {
    id: SYSTEM_USER_ID,
    email: 'hello@molt.live',
    displayName: 'MoltMail',
    handle: 'moltmail',
    emailVerifiedAt: nowIso(),
    status: 'ACTIVE',
    walletBalance: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    avatarUrl: null
  };
  store.users.push(user);
  return user;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: user.avatarUrl || null
  };
}

function sanitizeAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') return null;
  if (!attachment.name || !attachment.dataUrl) return null;
  return {
    name: String(attachment.name || 'file'),
    type: String(attachment.type || 'application/octet-stream'),
    size: Number(attachment.size || 0),
    dataUrl: String(attachment.dataUrl || '')
  };
}

function sanitizeSticker(sticker) {
  if (!sticker || typeof sticker !== 'object') return null;
  if (!sticker.id || !sticker.emoji) return null;
  return {
    id: String(sticker.id),
    emoji: String(sticker.emoji),
    label: String(sticker.label || sticker.emoji)
  };
}

function sanitizeReactionEmoji(value) {
  const emoji = String(value || '').trim();
  return emoji ? emoji.slice(0, 8) : '';
}

function summarizeReply(store, message) {
  if (!message?.replyToMessageId) return null;
  const target = store.messages.find((item) => item.id === message.replyToMessageId && !item.deletedAt);
  if (!target) return null;
  return {
    id: target.id,
    senderUserId: target.senderUserId,
    bodyText: target.bodyText || '',
    sticker: target.sticker || null,
    attachment: target.attachment ? { name: target.attachment.name, type: target.attachment.type } : null
  };
}

function mapReactions(reactions = [], viewerId = '') {
  return (reactions || []).map((reaction) => ({
    emoji: reaction.emoji,
    count: Array.isArray(reaction.userIds) ? reaction.userIds.length : 0,
    reacted: Boolean(viewerId && reaction.userIds?.includes(viewerId))
  }));
}

function logAudit(store, action, metadata = {}) {
  store.audit.push({ id: randomId('aud'), action, createdAt: nowIso(), ...metadata });
}

function getRateLimitKey(req, userId, action) {
  return `${action}:${userId}:${req.ip || 'unknown'}`;
}

function checkRateLimit(store, req, userId, action, maxCount = 5, windowMs = 60000) {
  const key = getRateLimitKey(req, userId, action);
  const now = Date.now();
  store.rateLimits = (store.rateLimits || []).filter((entry) => now - entry.timestamp < windowMs);
  const recent = store.rateLimits.filter((entry) => entry.key === key);
  if (recent.length >= maxCount) return false;
  store.rateLimits.push({ key, timestamp: now });
  return true;
}

function hasRecentDuplicate(store, threadId, senderUserId, bodyText, windowMs = 30000, clientMessageId = '') {
  const normalizedClientMessageId = String(clientMessageId || '').trim();
  if (normalizedClientMessageId) {
    return store.messages.some((message) => message.threadId === threadId && message.senderUserId === senderUserId && String(message.clientMessageId || '') === normalizedClientMessageId);
  }
  const now = Date.now();
  return store.messages.some((message) => message.threadId === threadId && message.senderUserId === senderUserId && message.bodyText === bodyText && now - new Date(message.createdAt).getTime() < windowMs);
}

function findMessageByClientMessageId(store, senderUserId, clientMessageId) {
  const normalizedClientMessageId = String(clientMessageId || '').trim();
  if (!normalizedClientMessageId) return null;
  return store.messages.find((message) => message.senderUserId === senderUserId && String(message.clientMessageId || '') === normalizedClientMessageId && !message.deletedAt) || null;
}

function getUserById(store, id) {
  return store.users.find((item) => item.id === id);
}

function getAuthUserByAnyIdentifier(identifier) {
  const needle = String(identifier || '').trim().toLowerCase();
  if (!needle) return null;
  const authUsers = getAllAuthUsers();
  return authUsers.find((user) => (
    String(user.id || '').toLowerCase() === needle ||
    String(user.handle || '').toLowerCase() === needle ||
    String(user.email || '').toLowerCase() === needle
  )) || null;
}

function buildThreadSummary(store, thread, viewerId) {
  const messages = store.messages.filter((m) => m.threadId === thread.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const last = messages[messages.length - 1] || null;
  const participantIds = (thread.participantIds || []).filter((id) => id !== viewerId);
  const participants = participantIds.map((id) => publicUser(getUserById(store, id))).filter(Boolean);
  const unread = Boolean(last && last.senderUserId !== viewerId && (!thread.lastReadAtByUserId?.[viewerId] || new Date(thread.lastReadAtByUserId[viewerId]) < new Date(last.createdAt)));
  const latestSent = [...messages].reverse().find((message) => message.senderUserId === viewerId);
  const latestSentStatus = latestSent ? ((thread.lastReadAtByUserId?.[participants[0]?.id] && new Date(thread.lastReadAtByUserId[participants[0]?.id]) >= new Date(latestSent.createdAt)) ? 'Read' : 'Delivered') : null;
  return {
    id: thread.id,
    subject: thread.subject,
    displayTitle: participants[0]?.displayName || participants[0]?.handle || thread.subject || 'Conversation',
    lastMessagePreview: last?.deletedAt ? 'Message removed' : (last?.bodyText?.slice(0, 120) || last?.sticker?.label || last?.attachment?.name || ''),
    lastMessageAt: thread.lastMessageAt,
    unread,
    deliveryStatus: latestSentStatus || 'Delivered',
    participants,
    pinned: Boolean(thread.pinnedByUserIds?.includes(viewerId))
  };
}

export function getBootstrap(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const store = readStore();
  ensureSystemUser(store);
  ensureDemoThreadForUser(store, gate.user.id);
  writeStore(store);
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

  return withStore((store) => {
    ensureSystemUser(store);
    if (!checkRateLimit(store, req, gate.user.id, 'recipient_search', 20, 60000)) {
      logAudit(store, 'RATE_LIMIT_HIT', { actorUserId: gate.user.id, entityType: 'recipient_search', entityId: gate.user.id });
      return { ok: false, status: 429, code: 'RATE_LIMITED', message: 'Please wait before searching again.' };
    }

    const authUsers = getAllAuthUsers();
    const targetUser = authUsers.find((user) => String(user.email || '').toLowerCase() === 'rnewman1229@gmail.com' || String(user.handle || '').toLowerCase() === 'rnewman1229');
    const systemUser = ensureSystemUser(store);

    const candidateDiagnostics = authUsers.map((user) => {
      const isSelf = user.id === gate.user.id;
      const isBanned = user.status === 'BANNED';
      const isVerified = Boolean(user.emailVerifiedAt);
      const handleMatch = String(user.handle || '').toLowerCase().includes(q);
      const emailMatch = String(user.email || '').toLowerCase().includes(q);
      const displayNameMatch = String(user.displayName || '').toLowerCase().includes(q);
      const queryMatch = !q || handleMatch || emailMatch || displayNameMatch;
      let exclusionReason = null;
      if (isSelf) exclusionReason = 'self';
      else if (isBanned) exclusionReason = 'banned';
      else if (!isVerified) exclusionReason = 'not_verified';
      else if (!queryMatch) exclusionReason = 'query_mismatch';
      return {
        id: user.id,
        email: user.email || null,
        displayName: user.displayName || null,
        handle: user.handle || null,
        emailVerifiedAt: user.emailVerifiedAt || null,
        status: user.status || null,
        isSelf,
        isBanned,
        isVerified,
        handleMatch,
        emailMatch,
        displayNameMatch,
        queryMatch,
        exclusionReason,
        included: !exclusionReason
      };
    });

    const debugPayload = {
      query: q,
      requester: {
        id: gate.user.id,
        email: gate.user.email || null,
        handle: gate.user.handle || null
      },
      authSource: {
        totalUsers: authUsers.length,
        hasMoeylarge: authUsers.some((user) => String(user.email || '').toLowerCase() === 'moeylarge@gmail.com' || String(user.handle || '').toLowerCase() === 'moeylarge'),
        hasRnewman: authUsers.some((user) => String(user.email || '').toLowerCase() === 'rnewman1229@gmail.com' || String(user.handle || '').toLowerCase() === 'rnewman1229')
      },
      hasRnewmanCandidate: Boolean(targetUser),
      rnewmanCandidate: targetUser ? {
        id: targetUser.id,
        email: targetUser.email || null,
        displayName: targetUser.displayName || null,
        handle: targetUser.handle || null,
        emailVerifiedAt: targetUser.emailVerifiedAt || null,
        status: targetUser.status || null
      } : null,
      rnewmanDiagnostic: candidateDiagnostics.find((user) => String(user.email || '').toLowerCase() === 'rnewman1229@gmail.com' || String(user.handle || '').toLowerCase() === 'rnewman1229') || null
    };

    console.log('[moltmail][searchRecipients]', JSON.stringify(debugPayload));

    const results = candidateDiagnostics
      .filter((user) => user.included)
      .map((user) => {
        const mirroredUser = getUserById(store, user.id);
        return {
          id: user.id,
          displayName: mirroredUser?.displayName || user.displayName || user.email?.split('@')[0] || 'Member',
          handle: mirroredUser?.handle || user.handle || user.email?.split('@')[0] || user.id,
          avatarUrl: mirroredUser?.avatarUrl || null,
          email: user.email || null,
          category: mirroredUser?.category || null,
          lastActiveAt: mirroredUser?.updatedAt || null
        };
      })
      .sort((a, b) => {
        if (a.id === systemUser.id) return -1;
        if (b.id === systemUser.id) return 1;
        return (new Date(b.lastActiveAt || 0).getTime() || 0) - (new Date(a.lastActiveAt || 0).getTime() || 0);
      })
      .slice(0, 12);

    if (req.query?.debug === '1') {
      return { ok: true, results, debug: debugPayload };
    }
    return { ok: true, results };
  });
}

export function getInbox(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const store = readStore();
  ensureSystemUser(store);
  ensureDemoThreadForUser(store, gate.user.id);
  writeStore(store);
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
  ensureSystemUser(store);
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
  ensureSystemUser(store);
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const messages = store.messages
    .filter((m) => m.threadId === thread.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((m) => ({ id: m.id, senderUserId: m.senderUserId, bodyText: m.deletedAt ? 'Message removed' : m.bodyText, createdAt: m.createdAt, clientMessageId: m.clientMessageId || null, sticker: m.deletedAt ? null : (m.sticker || null), attachment: m.deletedAt ? null : (m.attachment || null), replyToMessageId: m.deletedAt ? null : (m.replyToMessageId || null), replyPreview: m.deletedAt ? null : summarizeReply(store, m), reactions: m.deletedAt ? [] : mapReactions(m.reactions, gate.user.id), deletedAt: m.deletedAt || null }));
  thread.lastReadAtByUserId = thread.lastReadAtByUserId || {};
  thread.lastReadAtByUserId[gate.user.id] = nowIso();
  writeStore(store);
  return {
    ok: true,
    thread: {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      pinnedMessageId: thread.pinnedMessageId || null,
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
  ensureSystemUser(store);
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
  ensureSystemUser(store);
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
  const bodyText = String(body?.bodyText || '').trim();
  const clientMessageId = String(body?.clientMessageId || '').trim();
  const sticker = sanitizeSticker(body?.sticker);
  const attachment = sanitizeAttachment(body?.attachment);
  const replyToMessageId = String(body?.replyToMessageId || '').trim() || null;
  if (!recipientUserId || (!bodyText && !sticker && !attachment)) return { ok: false, status: 400, code: 'INVALID_PAYLOAD', message: 'Recipient and message are required.' };
  if (recipientUserId === gate.user.id) return { ok: false, status: 400, code: 'CANNOT_MESSAGE_SELF', message: 'You cannot message yourself.' };

  return withStore((store) => {
    ensureSystemUser(store);
    const authRecipient = getAuthUserByAnyIdentifier(recipientUserId);
    if (!authRecipient) return { ok: false, status: 404, code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found.' };
    syncVerifiedUser(authRecipient);

    const refreshedStore = readStore();
    ensureSystemUser(refreshedStore);
    const sender = getUserById(refreshedStore, gate.user.id);
    const recipient = getUserById(refreshedStore, authRecipient.id);
    if (!recipient) return { ok: false, status: 404, code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found.' };

    const existingByClientMessageId = findMessageByClientMessageId(refreshedStore, gate.user.id, clientMessageId);
    if (existingByClientMessageId) {
      return { ok: true, thread: { id: existingByClientMessageId.threadId }, message: { id: existingByClientMessageId.id, clientMessageId }, wallet: { balance: sender?.walletBalance || 0, debited: 0 } };
    }
    if (sender?.status !== 'ACTIVE' || recipient?.status === 'BANNED') return { ok: false, status: 403, code: 'USER_RESTRICTED', message: 'This message cannot be sent right now.' };
    if (!checkRateLimit(refreshedStore, req, gate.user.id, 'thread_create', 4, 60000)) {
      logAudit(refreshedStore, 'RATE_LIMIT_HIT', { actorUserId: gate.user.id, entityType: 'thread_create', entityId: recipientUserId });
      store.users = refreshedStore.users;
      store.threads = refreshedStore.threads;
      store.messages = refreshedStore.messages;
      store.audit = refreshedStore.audit;
      store.delivery = refreshedStore.delivery;
      store.rateLimits = refreshedStore.rateLimits;
      return { ok: false, status: 429, code: 'RATE_LIMITED', message: 'Please wait before sending another message.' };
    }
    const duplicateThread = refreshedStore.threads.find((thread) => thread.participantIds?.length === 2 && thread.participantIds.includes(sender.id) && thread.participantIds.includes(recipient.id));
    if (duplicateThread && hasRecentDuplicate(refreshedStore, duplicateThread.id, sender.id, bodyText, 30000, clientMessageId)) {
      const existingMessage = clientMessageId ? findMessageByClientMessageId(refreshedStore, gate.user.id, clientMessageId) : null;
      if (existingMessage) return { ok: true, thread: { id: duplicateThread.id }, message: { id: existingMessage.id, clientMessageId }, wallet: { balance: sender.walletBalance, debited: 0 } };
      return { ok: false, status: 409, code: 'DUPLICATE_MESSAGE', message: 'That message was already sent recently.' };
    }
    if (!debitWallet(sender, SEND_COST)) return { ok: false, status: 400, code: 'INSUFFICIENT_CREDITS', message: 'You need more credits to send MoltMail.' };

    const createdAt = nowIso();
    const thread = {
      id: randomId('thr'),
      subject: recipient.displayName || recipient.handle || 'Conversation',
      createdByUserId: sender.id,
      participantIds: [sender.id, recipient.id],
      status: 'OPEN',
      lastMessageAt: createdAt,
      lastReadAtByUserId: { [sender.id]: createdAt },
      archivedAtByUserId: {},
      createdAt,
      updatedAt: createdAt
    };
    const message = { id: randomId('msg'), threadId: thread.id, senderUserId: sender.id, bodyText, createdAt, clientMessageId: clientMessageId || null, sticker, attachment, replyToMessageId, reactions: [] };
    const delivery = { id: randomId('del'), messageId: message.id, recipientUserId: recipient.id, channel: 'EMAIL', status: 'QUEUED', attemptCount: 0, createdAt, updatedAt: createdAt };
    refreshedStore.threads.unshift(thread);
    refreshedStore.messages.push(message);
    refreshedStore.delivery.push(delivery);
    if (recipient.id === SYSTEM_USER_ID) {
      const autoReplyAt = nowIso();
      const autoReply = { id: randomId('msg'), threadId: thread.id, senderUserId: SYSTEM_USER_ID, bodyText: 'Got it — MoltMail is working.', createdAt: autoReplyAt };
      thread.lastMessageAt = autoReply.createdAt;
      thread.updatedAt = autoReply.createdAt;
      refreshedStore.messages.push(autoReply);
    }
    if (recipient.id === SYSTEM_USER_ID) {
      const autoReplyAt = nowIso();
      const autoReply = { id: randomId('msg'), threadId: thread.id, senderUserId: SYSTEM_USER_ID, bodyText: 'Welcome to MoltMail. This thread is live and ready.', createdAt: autoReplyAt };
      thread.lastMessageAt = autoReply.createdAt;
      thread.updatedAt = autoReply.createdAt;
      refreshedStore.messages.push(autoReply);
    }
    logAudit(refreshedStore, 'MESSAGE_SENT', { actorUserId: sender.id, entityType: 'thread', entityId: thread.id, threadId: thread.id, messageId: message.id });
    logAudit(refreshedStore, 'CREDIT_DEBITED', { actorUserId: sender.id, entityType: 'message', entityId: message.id, metadataJson: { debited: SEND_COST } });
    logAudit(refreshedStore, 'MESSAGE_DELIVERY_QUEUED', { actorUserId: sender.id, entityType: 'delivery', entityId: delivery.id, threadId: thread.id, messageId: message.id });
    store.users = refreshedStore.users;
    store.threads = refreshedStore.threads;
    store.messages = refreshedStore.messages;
    store.audit = refreshedStore.audit;
    store.delivery = refreshedStore.delivery;
    store.rateLimits = refreshedStore.rateLimits;
    return { ok: true, thread: { id: thread.id }, message: { id: message.id, clientMessageId }, wallet: { balance: sender.walletBalance, debited: SEND_COST } };
  });
}

export function replyThread(req, threadId, body) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  syncVerifiedUser(gate.user);
  const bodyText = String(body?.bodyText || '').trim();
  const clientMessageId = String(body?.clientMessageId || '').trim();
  const sticker = sanitizeSticker(body?.sticker);
  const attachment = sanitizeAttachment(body?.attachment);
  const replyToMessageId = String(body?.replyToMessageId || '').trim() || null;
  if (!bodyText && !sticker && !attachment) return { ok: false, status: 400, code: 'INVALID_PAYLOAD', message: 'Reply cannot be empty.' };
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const sender = getUserById(store, gate.user.id);
  const existingByClientMessageId = findMessageByClientMessageId(store, gate.user.id, clientMessageId);
  if (existingByClientMessageId) {
    return { ok: true, message: { id: existingByClientMessageId.id, clientMessageId }, wallet: { balance: sender?.walletBalance || 0, debited: 0 } };
  }
  const recipientId = (thread.participantIds || []).find((id) => id !== sender.id);
  const recipient = getUserById(store, recipientId);
  if (sender?.status !== 'ACTIVE' || recipient?.status === 'BANNED' || thread.status !== 'OPEN') return { ok: false, status: 403, code: 'USER_RESTRICTED', message: 'This reply cannot be sent right now.' };
  if (!checkRateLimit(store, req, gate.user.id, 'thread_reply', 8, 60000)) {
    logAudit(store, 'RATE_LIMIT_HIT', { actorUserId: gate.user.id, entityType: 'thread_reply', entityId: threadId });
    writeStore(store);
    return { ok: false, status: 429, code: 'RATE_LIMITED', message: 'Please wait before sending another reply.' };
  }
  if (hasRecentDuplicate(store, thread.id, sender.id, bodyText, 30000, clientMessageId)) {
    const existingMessage = clientMessageId ? findMessageByClientMessageId(store, gate.user.id, clientMessageId) : null;
    if (existingMessage) return { ok: true, message: { id: existingMessage.id, clientMessageId }, wallet: { balance: sender.walletBalance, debited: 0 } };
    return { ok: false, status: 409, code: 'DUPLICATE_MESSAGE', message: 'That reply was already sent recently.' };
  }
  if (!debitWallet(sender, SEND_COST)) return { ok: false, status: 400, code: 'INSUFFICIENT_CREDITS', message: 'You need more credits to send MoltMail.' };
  const createdAt = nowIso();
  const message = { id: randomId('msg'), threadId: thread.id, senderUserId: sender.id, bodyText, createdAt, clientMessageId: clientMessageId || null, sticker, attachment, replyToMessageId, reactions: [] };
  const delivery = { id: randomId('del'), messageId: message.id, recipientUserId: recipient.id, channel: 'EMAIL', status: 'QUEUED', attemptCount: 0, createdAt, updatedAt: createdAt };
  thread.lastMessageAt = message.createdAt;
  thread.updatedAt = message.createdAt;
  thread.lastReadAtByUserId = thread.lastReadAtByUserId || {};
  thread.lastReadAtByUserId[sender.id] = message.createdAt;
  store.messages.push(message);
  store.delivery.push(delivery);
  logAudit(store, 'MESSAGE_REPLY_SENT', { actorUserId: sender.id, entityType: 'thread', entityId: thread.id, threadId: thread.id, messageId: message.id });
  logAudit(store, 'CREDIT_DEBITED', { actorUserId: sender.id, entityType: 'message', entityId: message.id, metadataJson: { debited: SEND_COST } });
  logAudit(store, 'MESSAGE_DELIVERY_QUEUED', { actorUserId: sender.id, entityType: 'delivery', entityId: delivery.id, threadId: thread.id, messageId: message.id });
  writeStore(store);
  return { ok: true, message: { id: message.id, clientMessageId }, wallet: { balance: sender.walletBalance, debited: SEND_COST } };
}

export function getUnreadCount(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const inbox = getInbox(req);
  if (!inbox.ok) return inbox;
  return { ok: true, unreadCount: inbox.threads.filter((item) => item.unread).length };
}

export function togglePinThread(req, threadId) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  thread.pinnedByUserIds = Array.isArray(thread.pinnedByUserIds) ? thread.pinnedByUserIds : [];
  if (thread.pinnedByUserIds.includes(gate.user.id)) thread.pinnedByUserIds = thread.pinnedByUserIds.filter((id) => id !== gate.user.id);
  else thread.pinnedByUserIds.push(gate.user.id);
  writeStore(store);
  return { ok: true, pinned: thread.pinnedByUserIds.includes(gate.user.id) };
}

export function pinMessage(req, threadId, messageId) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const message = store.messages.find((item) => item.id === messageId && item.threadId === threadId);
  if (!message) return { ok: false, status: 404, code: 'MESSAGE_NOT_FOUND', message: 'Message not found.' };
  thread.pinnedMessageId = thread.pinnedMessageId === messageId ? null : messageId;
  writeStore(store);
  return { ok: true, pinnedMessageId: thread.pinnedMessageId };
}

export function unsendMessage(req, threadId, messageId) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const message = store.messages.find((item) => item.id === messageId && item.threadId === threadId);
  if (!message) return { ok: false, status: 404, code: 'MESSAGE_NOT_FOUND', message: 'Message not found.' };
  if (message.senderUserId !== gate.user.id) return { ok: false, status: 403, code: 'FORBIDDEN', message: 'Cannot remove this message.' };
  message.deletedAt = nowIso();
  message.bodyText = 'Message removed';
  message.sticker = null;
  message.attachment = null;
  message.replyToMessageId = null;
  message.reactions = [];
  writeStore(store);
  return { ok: true };
}

export function toggleReaction(req, threadId, messageId, body) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const emoji = sanitizeReactionEmoji(body?.emoji);
  if (!emoji) return { ok: false, status: 400, code: 'INVALID_REACTION', message: 'Reaction emoji required.' };
  const store = readStore();
  const thread = store.threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds?.includes(gate.user.id)) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  const message = store.messages.find((item) => item.id === messageId && item.threadId === threadId && !item.deletedAt);
  if (!message) return { ok: false, status: 404, code: 'MESSAGE_NOT_FOUND', message: 'Message not found.' };
  message.reactions = Array.isArray(message.reactions) ? message.reactions : [];
  let reaction = message.reactions.find((item) => item.emoji === emoji);
  if (!reaction) {
    reaction = { emoji, userIds: [] };
    message.reactions.push(reaction);
  }
  reaction.userIds = Array.isArray(reaction.userIds) ? reaction.userIds : [];
  if (reaction.userIds.includes(gate.user.id)) reaction.userIds = reaction.userIds.filter((id) => id !== gate.user.id);
  else reaction.userIds.push(gate.user.id);
  message.reactions = message.reactions.filter((item) => item.userIds?.length);
  writeStore(store);
  return { ok: true, reactions: mapReactions(message.reactions, gate.user.id) };
}

export function getAuditSummary(req) {
  const gate = requireVerifiedUser(req);
  if (!gate.ok) return gate;
  const store = readStore();
  return {
    ok: true,
    audit: store.audit.filter((entry) => entry.actorUserId === gate.user.id).slice(-20).reverse(),
    delivery: store.delivery.filter((entry) => {
      const threadMessage = store.messages.find((message) => message.id === entry.messageId);
      return threadMessage?.senderUserId === gate.user.id || entry.recipientUserId === gate.user.id;
    }).slice(-20).reverse()
  };
}
