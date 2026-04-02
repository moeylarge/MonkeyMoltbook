const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SEND_COST = Number(process.env.MOLTMAIL_SEND_COST || 0);
const SYSTEM_USER_ID = 'usr_moltmail_system';

function isEnabled() {
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
  if (!isEnabled()) throw new Error('moltmail_storage_disabled');
  const response = await fetch(url(table, query), {
    method,
    headers: headers(prefer),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!response.ok) {
    const bodyText = typeof data === 'string' ? data : JSON.stringify(data);
    console.error(`[moltmail-supabase-rest-error] table=${table} status=${response.status} body=${bodyText} timestamp=${new Date().toISOString()}`);
    throw new Error(`moltmail_${table}_${response.status}: ${bodyText}`);
  }
  return data;
}

function nowIso() {
  return new Date().toISOString();
}

function safeNameFromEmail(email = '') {
  return String(email || '').split('@')[0] || 'member';
}

function normalizeProfileUser(profile) {
  if (!profile) return null;
  return {
    id: String(profile.user_id),
    displayName: profile.display_name || profile.username || safeNameFromEmail(profile.email),
    handle: profile.username || safeNameFromEmail(profile.email),
    avatarUrl: profile.avatar_url || null,
    category: profile.category || null,
    email: profile.email || null,
    updatedAt: profile.updated_at || profile.created_at || null,
    lastActiveAt: profile.last_active_at || null,
    isOnline: false,
    relationship: {
      isFriend: false,
      isFollowing: false,
      isFollowedBy: false,
      isMutual: false,
      friendRequestSent: false,
      friendRequestReceived: false
    },
    reason: profile.reason || 'Member',
    messagePermission: profile.message_permission || 'everyone'
  };
}

async function getRelationshipMaps(userId) {
  const outgoing = await rest('member_relationships', {
    query: `source_user_id=eq.${encodeURIComponent(String(userId))}&select=target_user_id,relationship_type,status`
  }).catch(() => []);
  const incoming = await rest('member_relationships', {
    query: `target_user_id=eq.${encodeURIComponent(String(userId))}&select=source_user_id,relationship_type,status`
  }).catch(() => []);
  return {
    outgoing: Array.isArray(outgoing) ? outgoing : [],
    incoming: Array.isArray(incoming) ? incoming : []
  };
}

function applyRelationshipMeta(baseUser, targetUserId, relationshipMaps, reasonFallback = 'Member') {
  const outgoing = relationshipMaps.outgoing.filter((row) => String(row.target_user_id) === String(targetUserId));
  const incoming = relationshipMaps.incoming.filter((row) => String(row.source_user_id) === String(targetUserId));
  const isFollowing = outgoing.some((row) => row.relationship_type === 'follow' && row.status === 'active');
  const isFollowedBy = incoming.some((row) => row.relationship_type === 'follow' && row.status === 'active');
  const isFriend = outgoing.some((row) => row.relationship_type === 'friend' && row.status === 'accepted') || incoming.some((row) => row.relationship_type === 'friend' && row.status === 'accepted');
  const friendRequestSent = outgoing.some((row) => row.relationship_type === 'friend_request' && row.status === 'pending');
  const friendRequestReceived = incoming.some((row) => row.relationship_type === 'friend_request' && row.status === 'pending');
  const isMutual = isFollowing && isFollowedBy;
  let reason = reasonFallback;
  if (isFriend) reason = 'Friend';
  else if (friendRequestReceived) reason = 'Wants to connect';
  else if (friendRequestSent) reason = 'Friend request sent';
  else if (isMutual) reason = 'Mutual';
  else if (isFollowing) reason = 'Following';
  return {
    ...baseUser,
    isOnline: Boolean(baseUser.lastActiveAt && (Date.now() - new Date(baseUser.lastActiveAt).getTime()) < (1000 * 60 * 10)),
    relationship: {
      isFriend,
      isFollowing,
      isFollowedBy,
      isMutual,
      friendRequestSent,
      friendRequestReceived
    },
    reason
  };
}

async function getRecentRecipients(userId, limit = 6) {
  const mailbox = await getMailboxSupabase({ id: userId }, 'inbox').catch(() => ({ threads: [] }));
  const ids = [];
  for (const thread of mailbox.threads || []) {
    for (const participant of thread.participants || []) {
      if (participant?.id && !ids.includes(participant.id)) ids.push(participant.id);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

async function listDefaultRecipients(user) {
  const relationshipMaps = await getRelationshipMaps(user.id);
  const recentIds = await getRecentRecipients(user.id, 6);
  const recentProfiles = recentIds.length ? await rest('profiles', {
    query: `user_id=in.${encodeURIComponent(`(${recentIds.map((id) => `"${String(id).replace(/"/g, '')}"`).join(',')})`)}&select=user_id,email,username,display_name,avatar_url,category,message_permission,is_public,allow_search_indexing,is_discoverable,is_message_enabled,last_active_at,updated_at,created_at`
  }).catch(() => []) : [];
  const recent = (Array.isArray(recentProfiles) ? recentProfiles : [])
    .map((profile) => applyRelationshipMeta(normalizeProfileUser(profile), profile.user_id, relationshipMaps, 'Messaged recently'))
    .slice(0, 8);

  const onlineProfiles = await rest('profiles', {
    query: 'select=user_id,email,username,display_name,avatar_url,category,message_permission,is_public,allow_search_indexing,is_discoverable,is_message_enabled,last_active_at,updated_at,created_at&is_discoverable=eq.true&is_message_enabled=eq.true&order=last_active_at.desc.nullslast&limit=8'
  }).catch(() => []);
  const online = (Array.isArray(onlineProfiles) ? onlineProfiles : [])
    .filter((profile) => String(profile.user_id || '') !== String(user.id))
    .filter((profile) => profile.is_public !== false)
    .filter((profile) => profile.allow_search_indexing !== false)
    .filter((profile) => (profile.message_permission || 'everyone') !== 'nobody')
    .map((profile) => applyRelationshipMeta(normalizeProfileUser(profile), profile.user_id, relationshipMaps, 'Online now'))
    .slice(0, 8);

  const suggestedProfiles = await rest('profiles', {
    query: 'select=user_id,email,username,display_name,avatar_url,category,message_permission,is_public,allow_search_indexing,is_discoverable,is_message_enabled,last_active_at,updated_at,created_at&is_discoverable=eq.true&is_message_enabled=eq.true&order=updated_at.desc.nullslast&limit=12'
  }).catch(() => []);
  const shown = new Set([...recent, ...online].map((item) => item.id));
  const suggested = (Array.isArray(suggestedProfiles) ? suggestedProfiles : [])
    .filter((profile) => String(profile.user_id || '') !== String(user.id))
    .filter((profile) => profile.is_public !== false)
    .filter((profile) => profile.allow_search_indexing !== false)
    .filter((profile) => (profile.message_permission || 'everyone') !== 'nobody')
    .map((profile) => applyRelationshipMeta(normalizeProfileUser(profile), profile.user_id, relationshipMaps, 'Suggested'))
    .filter((item) => !shown.has(item.id))
    .slice(0, 8);

  return {
    ok: true,
    sections: { friends: [], recent, online, mutuals: [], following: [], suggested }
  };
}

async function getExistingThreadForRecipient(user, recipientUserId) {
  const existingParticipants = await rest('mail_participants', {
    query: `user_id=in.${encodeURIComponent(`("${String(user.id).replace(/"/g, '')}","${String(recipientUserId).replace(/"/g, '')}")`)}&select=thread_id,user_id`
  }).catch(() => []);
  const byThread = new Map();
  for (const row of Array.isArray(existingParticipants) ? existingParticipants : []) {
    const key = String(row.thread_id);
    const list = byThread.get(key) || [];
    list.push(String(row.user_id));
    byThread.set(key, list);
  }
  for (const [threadId, members] of byThread.entries()) {
    const set = new Set(members);
    if (set.has(String(user.id)) && set.has(String(recipientUserId)) && set.size === 2) {
      return { ok: true, thread: { id: threadId } };
    }
  }
  return { ok: true, thread: null };
}

async function listProfilesByQuery(query, excludeUserId = '') {
  const q = String(query || '').trim();
  if (!q) return [];
  const needle = q.toLowerCase();
  const profiles = await rest('profiles', {
    query: 'select=user_id,email,username,display_name,avatar_url,category,message_permission,is_public,allow_search_indexing,updated_at,created_at&order=updated_at.desc.nullslast'
  });
  return (Array.isArray(profiles) ? profiles : [])
    .filter((profile) => String(profile.user_id || '') !== String(excludeUserId || ''))
    .filter((profile) => profile.is_public !== false)
    .filter((profile) => profile.allow_search_indexing !== false)
    .filter((profile) => (profile.message_permission || 'everyone') !== 'nobody')
    .filter((profile) => {
      const username = String(profile.username || '').toLowerCase();
      const displayName = String(profile.display_name || '').toLowerCase();
      const email = String(profile.email || '').toLowerCase();
      return username.includes(needle) || displayName.includes(needle) || email.includes(needle);
    })
    .slice(0, 12)
    .map(normalizeProfileUser)
    .filter(Boolean);
}

async function getProfilesByUserIds(userIds = []) {
  const uniqueIds = [...new Set((userIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!uniqueIds.length) return new Map();
  const inClause = `(${uniqueIds.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`;
  const rows = await rest('profiles', {
    query: `user_id=in.${encodeURIComponent(inClause)}&select=user_id,email,username,display_name,avatar_url,category,message_permission,is_public,allow_search_indexing,updated_at,created_at`
  });
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row.user_id), normalizeProfileUser(row)]));
}

async function ensureWallet(userId) {
  const existing = await rest('wallets', {
    query: `user_id=eq.${encodeURIComponent(String(userId))}&select=*`
  });
  if (existing?.[0]) return existing[0];
  const created = await rest('wallets', {
    method: 'POST',
    body: [{ user_id: String(userId), balance: 25 }],
    prefer: 'return=representation'
  });
  return created?.[0] || null;
}

async function getWallet(userId) {
  return ensureWallet(userId);
}

async function debitWallet(userId, amount, reason = 'MESSAGE_SEND', messageId = null, metadataJson = null) {
  const wallet = await ensureWallet(userId);
  const balance = Number(wallet?.balance || 0);
  if (balance < amount) return { ok: false, wallet };
  const updated = await rest('wallets', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(String(userId))}&select=*`,
    body: { balance: balance - amount, updated_at: nowIso() },
    prefer: 'return=representation'
  });
  await rest('credit_ledger', {
    method: 'POST',
    body: [{ user_id: String(userId), delta: -amount, reason, message_id: messageId, metadata_json: metadataJson || null }],
    prefer: 'return=minimal'
  }).catch(() => null);
  return { ok: true, wallet: updated?.[0] || { ...wallet, balance: balance - amount } };
}

async function fetchThreadParticipants(threadIds = []) {
  const uniqueIds = [...new Set((threadIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!uniqueIds.length) return [];
  const inClause = `(${uniqueIds.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`;
  const rows = await rest('mail_participants', {
    query: `thread_id=in.${encodeURIComponent(inClause)}&select=*`
  });
  return Array.isArray(rows) ? rows : [];
}

async function fetchMessagesByThreadIds(threadIds = []) {
  const uniqueIds = [...new Set((threadIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!uniqueIds.length) return [];
  const inClause = `(${uniqueIds.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`;
  const rows = await rest('mail_messages', {
    query: `thread_id=in.${encodeURIComponent(inClause)}&select=*&order=created_at.asc`
  });
  return Array.isArray(rows) ? rows : [];
}

function summarizeReply(messages, message) {
  if (!message?.reply_to_message_id) return null;
  const target = messages.find((item) => item.id === message.reply_to_message_id && !item.deleted_at);
  if (!target) return null;
  return {
    id: target.id,
    senderUserId: target.sender_user_id,
    bodyText: target.body_text || '',
    sticker: target.sticker || null,
    attachment: target.attachment ? { name: target.attachment.name, type: target.attachment.type } : null
  };
}

function mapReactions(reactions = [], viewerId = '') {
  return (Array.isArray(reactions) ? reactions : []).map((reaction) => ({
    emoji: reaction.emoji,
    count: Array.isArray(reaction.userIds) ? reaction.userIds.length : 0,
    reacted: Boolean(viewerId && reaction.userIds?.includes(viewerId))
  }));
}

function buildThreadSummary(thread, viewerId, messages, participants, profilesByUserId) {
  const threadMessages = messages.filter((message) => message.thread_id === thread.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const last = threadMessages[threadMessages.length - 1] || null;
  const threadParticipants = participants.filter((participant) => participant.thread_id === thread.id);
  const otherParticipants = threadParticipants.filter((participant) => String(participant.user_id) !== String(viewerId));
  const publicParticipants = otherParticipants.map((participant) => profilesByUserId.get(String(participant.user_id))).filter(Boolean);
  const viewerParticipant = threadParticipants.find((participant) => String(participant.user_id) === String(viewerId));
  const unread = Boolean(last && String(last.sender_user_id) !== String(viewerId) && (!viewerParticipant?.last_read_at || new Date(viewerParticipant.last_read_at) < new Date(last.created_at)));
  const latestSent = [...threadMessages].reverse().find((message) => String(message.sender_user_id) === String(viewerId));
  const recipientParticipant = otherParticipants[0] || null;
  const latestSentStatus = latestSent ? ((recipientParticipant?.last_read_at && new Date(recipientParticipant.last_read_at) >= new Date(latestSent.created_at)) ? 'Read' : 'Delivered') : null;
  return {
    id: thread.id,
    subject: thread.subject,
    displayTitle: publicParticipants[0]?.displayName || publicParticipants[0]?.handle || thread.subject || 'Conversation',
    lastMessagePreview: last?.deleted_at ? 'Message removed' : (last?.body_text?.slice(0, 120) || last?.sticker?.label || last?.attachment?.name || ''),
    lastMessageAt: thread.last_message_at,
    unread,
    deliveryStatus: latestSentStatus || 'Delivered',
    participants: publicParticipants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      handle: participant.handle,
      avatarUrl: participant.avatarUrl || null,
      category: participant.category || null
    })),
    pinned: false
  };
}

export async function searchRecipientsSupabase(user, query) {
  const relationshipMaps = await getRelationshipMaps(user.id);
  const results = (await listProfilesByQuery(query, user.id)).map((item) => applyRelationshipMeta(item, item.id, relationshipMaps));
  return { ok: true, results };
}

export async function getDefaultRecipientsSupabase(user) {
  return listDefaultRecipients(user);
}

export async function getRecipientThreadSupabase(user, recipientUserId) {
  return getExistingThreadForRecipient(user, recipientUserId);
}

export async function getBootstrapSupabase(user) {
  const wallet = await getWallet(user.id);
  return {
    ok: true,
    inboxEnabled: true,
    composeEnabled: true,
    unreadCount: 0,
    wallet: { balance: Number(wallet?.balance || 0) },
    user
  };
}

export async function getMailboxSupabase(user, mode = 'inbox') {
  const mailboxStartedAt = Date.now();
  console.log('[moltmail-inbox-timing]', { step: 'participants:before', userId: user.id, mode, at: new Date().toISOString() });
  const participantFetchStartedAt = Date.now();
  const participantRows = await rest('mail_participants', {
    query: `user_id=eq.${encodeURIComponent(String(user.id))}&select=*&order=created_at.desc`
  });
  console.log('[moltmail-inbox-timing]', { step: 'participants:after', userId: user.id, mode, elapsedMs: Date.now() - participantFetchStartedAt, count: Array.isArray(participantRows) ? participantRows.length : null });
  const myParticipants = Array.isArray(participantRows) ? participantRows : [];
  const visibleParticipants = mode === 'inbox'
    ? myParticipants.filter((participant) => !participant.archived_at)
    : myParticipants;
  const threadIds = [...new Set(visibleParticipants.map((participant) => String(participant.thread_id)).filter(Boolean))];
  if (!threadIds.length) return { ok: true, threads: [], nextCursor: null };
  const inClause = `(${threadIds.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`;
  console.log('[moltmail-inbox-timing]', { step: 'threads:before', userId: user.id, mode, threadCount: threadIds.length });
  const threadsFetchStartedAt = Date.now();
  const threads = await rest('mail_threads', {
    query: `id=in.${encodeURIComponent(inClause)}&select=*&order=last_message_at.desc`
  });
  console.log('[moltmail-inbox-timing]', { step: 'threads:after', userId: user.id, mode, elapsedMs: Date.now() - threadsFetchStartedAt, count: Array.isArray(threads) ? threads.length : null });
  console.log('[moltmail-inbox-timing]', { step: 'allParticipants:before', userId: user.id, mode, threadCount: threadIds.length });
  const allParticipantsFetchStartedAt = Date.now();
  const allParticipants = await fetchThreadParticipants(threadIds);
  console.log('[moltmail-inbox-timing]', { step: 'allParticipants:after', userId: user.id, mode, elapsedMs: Date.now() - allParticipantsFetchStartedAt, count: Array.isArray(allParticipants) ? allParticipants.length : null });
  console.log('[moltmail-inbox-timing]', { step: 'messages:before', userId: user.id, mode, threadCount: threadIds.length });
  const messagesFetchStartedAt = Date.now();
  const messages = await fetchMessagesByThreadIds(threadIds);
  console.log('[moltmail-inbox-timing]', { step: 'messages:after', userId: user.id, mode, elapsedMs: Date.now() - messagesFetchStartedAt, count: Array.isArray(messages) ? messages.length : null });
  const userIds = [...new Set(allParticipants.map((participant) => String(participant.user_id)).filter(Boolean))];
  console.log('[moltmail-inbox-timing]', { step: 'profiles:before', userId: user.id, mode, userCount: userIds.length });
  const profilesFetchStartedAt = Date.now();
  const profilesByUserId = await getProfilesByUserIds(userIds);
  console.log('[moltmail-inbox-timing]', { step: 'profiles:after', userId: user.id, mode, elapsedMs: Date.now() - profilesFetchStartedAt, count: profilesByUserId?.size || 0 });
  console.log('[moltmail-inbox-timing]', { step: 'assembly:before', userId: user.id, mode, threadCount: Array.isArray(threads) ? threads.length : 0 });
  const assemblyStartedAt = Date.now();
  const summaries = (Array.isArray(threads) ? threads : [])
    .map((thread) => buildThreadSummary(thread, user.id, messages, allParticipants, profilesByUserId))
    .filter((thread) => mode === 'outbox' ? messages.some((message) => String(message.thread_id) === String(thread.id) && String(message.sender_user_id) === String(user.id)) : true);
  console.log('[moltmail-inbox-timing]', { step: 'assembly:after', userId: user.id, mode, elapsedMs: Date.now() - assemblyStartedAt, count: summaries.length, totalElapsedMs: Date.now() - mailboxStartedAt });
  return { ok: true, threads: summaries, nextCursor: null };
}

export async function getThreadSupabase(user, threadId) {
  const myParticipantRows = await rest('mail_participants', {
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&user_id=eq.${encodeURIComponent(String(user.id))}&select=*`
  });
  const myParticipant = Array.isArray(myParticipantRows) ? myParticipantRows[0] : null;
  if (!myParticipant) {
    return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  }
  const participants = await rest('mail_participants', {
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&select=*`
  });
  const threadParticipants = Array.isArray(participants) ? participants : [];
  const threads = await rest('mail_threads', {
    query: `id=eq.${encodeURIComponent(String(threadId))}&select=*`
  });
  let thread = threads?.[0] || null;
  const messages = await rest('mail_messages', {
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&select=*&order=created_at.asc`
  });
  if (!thread) {
    const fallbackLastMessageAt = Array.isArray(messages) && messages.length ? messages[messages.length - 1].created_at : nowIso();
    thread = {
      id: String(threadId),
      subject: 'Conversation',
      status: 'OPEN',
      pinned_message_id: null,
      last_message_at: fallbackLastMessageAt
    };
  }
  const userIds = [...new Set(threadParticipants.map((participant) => String(participant.user_id)).filter(Boolean))];
  const profilesByUserId = await getProfilesByUserIds(userIds);
  await rest('mail_participants', {
    method: 'PATCH',
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&user_id=eq.${encodeURIComponent(String(user.id))}`,
    body: { last_read_at: nowIso(), archived_at: null },
    prefer: 'return=minimal'
  });
  const wallet = await getWallet(user.id);
  return {
    ok: true,
    thread: {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      pinnedMessageId: thread.pinned_message_id || null,
      participants: threadParticipants
        .filter((participant) => String(participant.user_id) !== String(user.id))
        .map((participant) => profilesByUserId.get(String(participant.user_id)) || {
          id: String(participant.user_id),
          displayName: 'Member',
          handle: String(participant.user_id),
          avatarUrl: null,
          category: null
        })
        .map((participant) => ({ id: participant.id, displayName: participant.displayName, handle: participant.handle, avatarUrl: participant.avatarUrl || null, category: participant.category || null })),
      messages: (Array.isArray(messages) ? messages : []).map((message) => ({
        id: message.id,
        senderUserId: message.sender_user_id,
        bodyText: message.deleted_at ? 'Message removed' : message.body_text,
        createdAt: message.created_at,
        clientMessageId: message.client_message_id || null,
        sticker: message.deleted_at ? null : (message.sticker || null),
        attachment: message.deleted_at ? null : (message.attachment || null),
        replyToMessageId: message.deleted_at ? null : (message.reply_to_message_id || null),
        replyPreview: message.deleted_at ? null : summarizeReply(messages, message),
        reactions: message.deleted_at ? [] : mapReactions(message.reactions, user.id),
        deletedAt: message.deleted_at || null
      }))
    },
    wallet: { balance: Number(wallet?.balance || 0), replyCost: SEND_COST }
  };
}

export async function createThreadSupabase(user, body) {
  const recipientUserId = String(body?.recipientUserId || '').trim();
  const bodyText = String(body?.bodyText || '').trim();
  const clientMessageId = String(body?.clientMessageId || '').trim() || null;
  const sticker = body?.sticker || null;
  const attachment = body?.attachment || null;
  const replyToMessageId = String(body?.replyToMessageId || '').trim() || null;
  if (!recipientUserId || (!bodyText && !sticker && !attachment)) return { ok: false, status: 400, code: 'INVALID_PAYLOAD', message: 'Recipient and message are required.' };
  if (recipientUserId === user.id) return { ok: false, status: 400, code: 'CANNOT_MESSAGE_SELF', message: 'You cannot message yourself.' };

  const recipientProfiles = await rest('profiles', {
    query: `user_id=eq.${encodeURIComponent(recipientUserId)}&select=user_id,email,username,display_name,avatar_url,category,message_permission,is_public,allow_search_indexing,updated_at,created_at`
  });
  const recipient = normalizeProfileUser(recipientProfiles?.[0] || null);
  if (!recipient) return { ok: false, status: 404, code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found.' };
  if (recipient.messagePermission === 'nobody') return { ok: false, status: 403, code: 'USER_RESTRICTED', message: 'This message cannot be sent right now.' };

  const senderWallet = await getWallet(user.id);
  if (SEND_COST > 0 && Number(senderWallet?.balance || 0) < SEND_COST) return { ok: false, status: 400, code: 'INSUFFICIENT_CREDITS', message: 'You need more credits to send MoltMail.' };

  const existingParticipants = await rest('mail_participants', {
    query: `user_id=in.${encodeURIComponent(`("${String(user.id).replace(/"/g, '')}","${String(recipientUserId).replace(/"/g, '')}")`)}&select=thread_id,user_id`
  });
  const byThread = new Map();
  for (const row of Array.isArray(existingParticipants) ? existingParticipants : []) {
    const key = String(row.thread_id);
    const list = byThread.get(key) || [];
    list.push(String(row.user_id));
    byThread.set(key, list);
  }
  let threadId = null;
  for (const [candidateThreadId, members] of byThread.entries()) {
    const set = new Set(members);
    if (set.has(String(user.id)) && set.has(String(recipientUserId)) && set.size === 2) {
      threadId = candidateThreadId;
      break;
    }
  }

  const createdAt = nowIso();
  if (!threadId) {
    const createdThreads = await rest('mail_threads', {
      method: 'POST',
      body: [{
        subject: recipient.displayName || recipient.handle || 'Conversation',
        created_by_user_id: String(user.id),
        status: 'OPEN',
        last_message_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt
      }],
      prefer: 'return=representation'
    });
    const thread = createdThreads?.[0];
    threadId = thread?.id;
    await rest('mail_participants', {
      method: 'POST',
      body: [
        { thread_id: threadId, user_id: String(user.id), last_read_at: createdAt, created_at: createdAt },
        { thread_id: threadId, user_id: String(recipientUserId), last_read_at: null, created_at: createdAt }
      ],
      prefer: 'return=minimal'
    });
  }

  const createdMessages = await rest('mail_messages', {
    method: 'POST',
    body: [{
      thread_id: threadId,
      sender_user_id: String(user.id),
      body_text: bodyText,
      created_at: createdAt,
      client_message_id: clientMessageId,
      sticker,
      attachment,
      reply_to_message_id: replyToMessageId,
      reactions: []
    }],
    prefer: 'return=representation'
  });
  const message = createdMessages?.[0];
  await rest('mail_threads', {
    method: 'PATCH',
    query: `id=eq.${encodeURIComponent(String(threadId))}`,
    body: { last_message_at: createdAt, updated_at: createdAt },
    prefer: 'return=minimal'
  });
  await rest('mail_participants', {
    method: 'PATCH',
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&user_id=eq.${encodeURIComponent(String(user.id))}`,
    body: { last_read_at: createdAt, archived_at: null },
    prefer: 'return=minimal'
  });
  await rest('mail_deliveries', {
    method: 'POST',
    body: [{
      message_id: message.id,
      recipient_user_id: String(recipientUserId),
      channel: 'INBOX',
      status: 'DELIVERED',
      attempt_count: 1,
      created_at: createdAt,
      updated_at: createdAt
    }],
    prefer: 'return=minimal'
  }).catch(() => null);

  const debit = SEND_COST > 0
    ? await debitWallet(user.id, SEND_COST, 'MESSAGE_SEND', message.id, { threadId, recipientUserId })
    : { ok: true, wallet: senderWallet };
  return { ok: true, thread: { id: threadId }, message: { id: message.id, clientMessageId }, wallet: { balance: Number(debit.wallet?.balance || senderWallet?.balance || 0), debited: SEND_COST } };
}

export async function replyThreadSupabase(user, threadId, body) {
  const bodyText = String(body?.bodyText || '').trim();
  const clientMessageId = String(body?.clientMessageId || '').trim() || null;
  const sticker = body?.sticker || null;
  const attachment = body?.attachment || null;
  const replyToMessageId = String(body?.replyToMessageId || '').trim() || null;
  if (!bodyText && !sticker && !attachment) return { ok: false, status: 400, code: 'INVALID_PAYLOAD', message: 'Reply cannot be empty.' };

  const participants = await rest('mail_participants', {
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&select=*`
  });
  const threadParticipants = Array.isArray(participants) ? participants : [];
  if (!threadParticipants.some((participant) => String(participant.user_id) === String(user.id))) {
    return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };
  }
  const recipientParticipant = threadParticipants.find((participant) => String(participant.user_id) !== String(user.id));
  if (!recipientParticipant) return { ok: false, status: 404, code: 'THREAD_NOT_FOUND', message: 'Thread not found.' };

  const senderWallet = await getWallet(user.id);
  if (SEND_COST > 0 && Number(senderWallet?.balance || 0) < SEND_COST) return { ok: false, status: 400, code: 'INSUFFICIENT_CREDITS', message: 'You need more credits to send MoltMail.' };

  const createdAt = nowIso();
  const createdMessages = await rest('mail_messages', {
    method: 'POST',
    body: [{
      thread_id: String(threadId),
      sender_user_id: String(user.id),
      body_text: bodyText,
      created_at: createdAt,
      client_message_id: clientMessageId,
      sticker,
      attachment,
      reply_to_message_id: replyToMessageId,
      reactions: []
    }],
    prefer: 'return=representation'
  });
  const message = createdMessages?.[0];
  await rest('mail_threads', {
    method: 'PATCH',
    query: `id=eq.${encodeURIComponent(String(threadId))}`,
    body: { last_message_at: createdAt, updated_at: createdAt },
    prefer: 'return=minimal'
  });
  await rest('mail_participants', {
    method: 'PATCH',
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&user_id=eq.${encodeURIComponent(String(user.id))}`,
    body: { last_read_at: createdAt, archived_at: null },
    prefer: 'return=minimal'
  });
  await rest('mail_deliveries', {
    method: 'POST',
    body: [{
      message_id: message.id,
      recipient_user_id: String(recipientParticipant.user_id),
      channel: 'INBOX',
      status: 'DELIVERED',
      attempt_count: 1,
      created_at: createdAt,
      updated_at: createdAt
    }],
    prefer: 'return=minimal'
  }).catch(() => null);
  const debit = SEND_COST > 0
    ? await debitWallet(user.id, SEND_COST, 'MESSAGE_REPLY', message.id, { threadId, recipientUserId: recipientParticipant.user_id })
    : { ok: true, wallet: senderWallet };
  return { ok: true, message: { id: message.id, clientMessageId }, wallet: { balance: Number(debit.wallet?.balance || senderWallet?.balance || 0), debited: SEND_COST } };
}

export async function markThreadReadSupabase(user, threadId) {
  await rest('mail_participants', {
    method: 'PATCH',
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&user_id=eq.${encodeURIComponent(String(user.id))}`,
    body: { last_read_at: nowIso() },
    prefer: 'return=minimal'
  });
  return { ok: true };
}

export async function archiveThreadSupabase(user, threadId) {
  await rest('mail_participants', {
    method: 'PATCH',
    query: `thread_id=eq.${encodeURIComponent(String(threadId))}&user_id=eq.${encodeURIComponent(String(user.id))}`,
    body: { archived_at: nowIso() },
    prefer: 'return=minimal'
  });
  return { ok: true };
}

export async function getUnreadCountSupabase(user) {
  const inbox = await getMailboxSupabase(user, 'inbox');
  return { ok: true, unreadCount: (inbox.threads || []).filter((item) => item.unread).length };
}

export function moltmailSupabaseEnabled() {
  return isEnabled();
}
