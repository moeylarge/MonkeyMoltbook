const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
  if (!isEnabled()) throw new Error('live_sessions_storage_disabled');
  const response = await fetch(url(table, query), {
    method,
    headers: headers(prefer),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!response.ok) throw new Error(`live_sessions_${table}_${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

function guestId() {
  return `guest_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createLiveSession({ agentName, agentAuthorId = null, entrySource = 'direct', mode = 'free', ttsEnabled = true, transcriptEnabled = true } = {}) {
  const [session] = await rest('sessions', {
    method: 'POST',
    body: [{
      guest_id: guestId(),
      agent_author_id: agentAuthorId,
      agent_name: agentName || 'Agent',
      entry_source: entrySource,
      mode,
      status: 'active',
      tts_enabled: Boolean(ttsEnabled),
      stt_enabled: false,
      cam_enabled: false,
      mic_enabled: true,
      transcript_enabled: Boolean(transcriptEnabled),
      started_at: new Date().toISOString(),
      last_event_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }],
    prefer: 'return=representation'
  });

  const [presence] = await rest('session_presence', {
    method: 'POST',
    body: [{
      session_id: session.id,
      user_cam_on: false,
      user_mic_on: true,
      tts_on: Boolean(ttsEnabled),
      transcript_on: Boolean(transcriptEnabled),
      battle_ready: mode === 'battle-ready',
      updated_at: new Date().toISOString()
    }],
    prefer: 'return=representation'
  });

  return { session, presence };
}

export async function getLiveSession(sessionId) {
  const sessions = await rest('sessions', { query: `id=eq.${encodeURIComponent(sessionId)}&select=*` });
  const presence = await rest('session_presence', { query: `session_id=eq.${encodeURIComponent(sessionId)}&select=*` });
  return {
    session: sessions?.[0] || null,
    presence: presence?.[0] || null
  };
}

export async function addLiveMessage(sessionId, { role = 'user', messageType = 'typed', text = '', meta = null } = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) throw new Error('message_text_required');

  const [message] = await rest('session_messages', {
    method: 'POST',
    body: [{
      session_id: sessionId,
      role,
      message_type: messageType,
      text: cleanText,
      meta
    }],
    prefer: 'return=representation'
  });

  await rest('sessions', {
    method: 'PATCH',
    query: `id=eq.${encodeURIComponent(sessionId)}`,
    body: {
      last_event_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    prefer: 'return=minimal'
  });

  return message;
}

export async function addAgentReply(sessionId, userText, agentName) {
  const agentText = `${agentName || 'Agent'} heard: ${userText}. This is the first real stored live-session loop, with transcript persistence now active.`;
  return addLiveMessage(sessionId, {
    role: 'agent',
    messageType: 'tts-text',
    text: agentText,
    meta: { generated: true }
  });
}

export async function listTranscript(sessionId) {
  return rest('session_messages', {
    query: `session_id=eq.${encodeURIComponent(sessionId)}&select=*&order=created_at.asc`
  });
}

export async function updateLivePresence(sessionId, fields = {}) {
  const payload = {
    ...(fields.userCamOn !== undefined ? { user_cam_on: Boolean(fields.userCamOn) } : {}),
    ...(fields.userMicOn !== undefined ? { user_mic_on: Boolean(fields.userMicOn) } : {}),
    ...(fields.ttsOn !== undefined ? { tts_on: Boolean(fields.ttsOn) } : {}),
    ...(fields.transcriptOn !== undefined ? { transcript_on: Boolean(fields.transcriptOn) } : {}),
    ...(fields.queuePosition !== undefined ? { queue_position: fields.queuePosition } : {}),
    ...(fields.battleReady !== undefined ? { battle_ready: Boolean(fields.battleReady) } : {}),
    updated_at: new Date().toISOString()
  };

  const result = await rest('session_presence', {
    method: 'PATCH',
    query: `session_id=eq.${encodeURIComponent(sessionId)}&select=*`,
    body: payload,
    prefer: 'return=representation'
  });
  return result?.[0] || null;
}

export async function endLiveSession(sessionId) {
  const result = await rest('sessions', {
    method: 'PATCH',
    query: `id=eq.${encodeURIComponent(sessionId)}&select=*`,
    body: {
      status: 'ended',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_event_at: new Date().toISOString()
    },
    prefer: 'return=representation'
  });
  return result?.[0] || null;
}

export async function exportTranscriptText(sessionId) {
  const messages = await listTranscript(sessionId);
  return messages.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
}

export function liveSessionsEnabled() {
  return isEnabled();
}
