const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function isEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getRestUrl(table, query = '') {
  const base = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

function getHeaders(prefer = '') {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function supabaseFetch(table, options = {}) {
  const { method = 'GET', query = '', body, prefer = '' } = options;
  if (!isEnabled()) return { ok: false, disabled: true, data: null };
  const response = await fetch(getRestUrl(table, query), {
    method,
    headers: getHeaders(prefer),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!response.ok) throw new Error(`profile_${table}_${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return { ok: true, data };
}

function safeText(value) {
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

function normalizeUsername(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function isProfileStorageEnabled() {
  return isEnabled();
}

export function validateProfilePatch(input = {}) {
  const errors = {};
  const patch = {};

  if ('display_name' in input) {
    patch.display_name = safeText(input.display_name)?.slice(0, 80) || null;
  }
  if ('bio' in input) {
    const bio = safeText(input.bio) || '';
    if (bio.length > 220) errors.bio = 'Bio must be 220 characters or fewer.';
    patch.bio = bio || null;
  }
  if ('website_url' in input) {
    const raw = safeText(input.website_url) || '';
    if (!raw) {
      patch.website_url = null;
    } else {
      try {
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        if (!/^https?:$/.test(url.protocol)) throw new Error('invalid');
        patch.website_url = url.toString();
      } catch {
        errors.website_url = 'Enter a valid website URL.';
      }
    }
  }
  if ('location_text' in input) {
    patch.location_text = (safeText(input.location_text) || '').slice(0, 80) || null;
  }
  if ('tagline' in input) {
    patch.tagline = (safeText(input.tagline) || '').slice(0, 80) || null;
  }
  if ('pronouns' in input) {
    patch.pronouns = (safeText(input.pronouns) || '').slice(0, 40) || null;
  }
  if ('is_public' in input) patch.is_public = Boolean(input.is_public);
  if ('message_permission' in input) patch.message_permission = ['everyone', 'followers', 'nobody'].includes(input.message_permission) ? input.message_permission : 'everyone';
  if ('mention_permission' in input) patch.mention_permission = ['everyone', 'followers', 'nobody'].includes(input.mention_permission) ? input.mention_permission : 'everyone';
  if ('discoverable_by_email' in input) patch.discoverable_by_email = Boolean(input.discoverable_by_email);
  if ('discoverable_by_phone' in input) patch.discoverable_by_phone = Boolean(input.discoverable_by_phone);
  if ('allow_search_indexing' in input) patch.allow_search_indexing = Boolean(input.allow_search_indexing);
  if ('notification_email_enabled' in input) patch.notification_email_enabled = Boolean(input.notification_email_enabled);
  if ('notification_push_enabled' in input) patch.notification_push_enabled = Boolean(input.notification_push_enabled);
  if ('notification_messages_enabled' in input) patch.notification_messages_enabled = Boolean(input.notification_messages_enabled);
  if ('notification_mentions_enabled' in input) patch.notification_mentions_enabled = Boolean(input.notification_mentions_enabled);
  if ('notification_follows_enabled' in input) patch.notification_follows_enabled = Boolean(input.notification_follows_enabled);
  if ('notification_marketing_enabled' in input) patch.notification_marketing_enabled = Boolean(input.notification_marketing_enabled);
  if ('theme_preference' in input) patch.theme_preference = ['system', 'light', 'dark'].includes(input.theme_preference) ? input.theme_preference : 'system';

  if ('username' in input) {
    const username = normalizeUsername(input.username);
    if (!username) {
      errors.username = 'Username is required.';
    } else if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      errors.username = 'Username must be 3-24 chars and use lowercase letters, numbers, or underscores.';
    } else if (['admin', 'settings', 'profile', 'search', 'moltmail', 'live', 'terms', 'privacy'].includes(username)) {
      errors.username = 'That username is reserved.';
    } else {
      patch.username = username;
    }
  }

  return { patch, errors };
}

function buildDefaultProfile(user) {
  const email = safeText(user?.email) || null;
  const base = email ? email.split('@')[0] : `user_${String(user?.id || '').slice(-6)}`;
  return {
    user_id: String(user.id),
    email,
    username: normalizeUsername(user?.handle || base),
    display_name: safeText(user?.displayName) || base,
    bio: null,
    website_url: null,
    location_text: null,
    tagline: null,
    pronouns: null,
    avatar_url: null,
    banner_url: null,
    is_public: true,
    message_permission: 'everyone',
    mention_permission: 'everyone',
    discoverable_by_email: true,
    discoverable_by_phone: false,
    allow_search_indexing: true,
    notification_email_enabled: true,
    notification_push_enabled: true,
    notification_messages_enabled: true,
    notification_mentions_enabled: true,
    notification_follows_enabled: true,
    notification_marketing_enabled: false,
    theme_preference: 'system'
  };
}

export async function getOrCreateProfileForUser(user) {
  const existing = await supabaseFetch('profiles', { query: `user_id=eq.${encodeURIComponent(String(user.id))}&select=*` });
  if (existing.data?.[0]) return existing.data[0];
  const created = await supabaseFetch('profiles', {
    method: 'POST',
    body: buildDefaultProfile(user),
    prefer: 'return=representation'
  });
  return created.data?.[0] || null;
}

export async function getProfileByUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  const result = await supabaseFetch('profiles', { query: `username=eq.${encodeURIComponent(normalized)}&select=*` });
  return result.data?.[0] || null;
}

export async function isUsernameAvailable(username, userId = '') {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;
  const result = await supabaseFetch('profiles', { query: `username=eq.${encodeURIComponent(normalized)}&select=user_id` });
  const row = result.data?.[0];
  if (!row) return true;
  return String(row.user_id) === String(userId);
}

export async function updateProfileForUser(user, input = {}) {
  const current = await getOrCreateProfileForUser(user);
  const { patch, errors } = validateProfilePatch(input);
  if (Object.keys(errors).length) return { ok: false, errors };
  if (patch.username) {
    const available = await isUsernameAvailable(patch.username, user.id);
    if (!available) return { ok: false, errors: { username: 'That username is already taken.' } };
  }
  const nextPatch = {
    ...patch,
    email: safeText(user?.email) || current.email || null,
    updated_at: new Date().toISOString()
  };
  const result = await supabaseFetch('profiles', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(String(user.id))}&select=*`,
    body: nextPatch,
    prefer: 'return=representation'
  });
  return { ok: true, profile: result.data?.[0] || null };
}

export async function updateProfileAvatar(user, avatarUrl = null) {
  await getOrCreateProfileForUser(user);
  const result = await supabaseFetch('profiles', {
    method: 'PATCH',
    query: `user_id=eq.${encodeURIComponent(String(user.id))}&select=*`,
    body: {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    },
    prefer: 'return=representation'
  });
  return result.data?.[0] || null;
}

export function toPublicProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    user_id: profile.user_id,
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    website_url: profile.website_url,
    location_text: profile.location_text,
    tagline: profile.tagline,
    pronouns: profile.pronouns,
    avatar_url: profile.avatar_url,
    banner_url: profile.banner_url,
    is_public: profile.is_public,
    allow_search_indexing: profile.allow_search_indexing,
    theme_preference: profile.theme_preference,
    updated_at: profile.updated_at,
    created_at: profile.created_at
  };
}
