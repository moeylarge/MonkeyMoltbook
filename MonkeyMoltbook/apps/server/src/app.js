import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getAgentStats, getNextAgentHook, getNextAgentHooks, listAgents } from './lib/agents.js';
import { authorsToCsv, buildGrowthMetrics, snapshotsToCsv } from './lib/moltbook-export.js';
import { getMoltbookIntel, getMoltbookStats, getMoltbookAgents } from './lib/moltbook.js';
import { MOLTBOOK_BASE, buildAuthorCoverage, buildCommunityIndex, buildSubmoltIndex, fetchActionChainProbeSample, fetchExpandedUniverseSample, fetchCursorBackfillSample, fetchJson, fetchPaginatedUniverseSample, fetchSuspiciousCandidateSample, fetchSuspiciousLanguageProbe, normalizePosts } from './lib/moltbook-discovery.js';
import { getSchedulerState, startScheduler, stopScheduler } from './lib/moltbook-scheduler.js';
import { getResponse, getResponseStats } from './lib/responses.js';
import { buildSearchDocumentsFromState, getAuthorsByIds, getAuthorsBySourceIds, getCommunityBySlug, getEntityRiskScore, getIngestionJob, isSupabaseStorageEnabled, listEvidenceBackedSuspiciousAuthors, listMintAbuseAuthors, persistMoltbookSnapshot, searchAuthors, searchAuthorEvidence, searchCommunities, searchCommunityEvidence, searchDocuments, upsertCommunities, upsertEntityRiskScores, upsertIngestionJob, upsertPosts, upsertSearchDocuments, upsertSubmolts, upsertAuthors } from './lib/supabase-storage.js';
import { scoreAuthorRisk, scoreCommunityRisk } from './lib/trust-score.js';
import { addAgentReply, addLiveMessage, createLiveSession, endLiveSession, exportTranscriptText, getLiveSession, listTranscript, liveSessionsEnabled, updateLivePresence } from './lib/live-sessions.js';
import { createCheckoutSession, creditsEnabled, ensureCreditProducts, getSpendRules, getWallet, grantCredits, listCreditProducts, listCreditTransactions, spendCredits } from './lib/credits.js';
import { applySessionCookie, createDevVerifiedSession, getAccountMe, getSessionResponse, logoutSession, startEmailAuth, verifyEmailAuth } from './lib/moltmail-auth.js';
import { archiveThread, createThread, getAuditSummary, getBootstrap, getInbox, getOutbox, getThread, getUnreadCount, markThreadRead, pinMessage, replyThread, searchRecipients, syncVerifiedUser, togglePinThread, toggleReaction, unsendMessage } from './lib/moltmail-data.js';
import { createClipForUser, deleteClipForUser, getOrCreateProfileForUser, getProfileByUsername, isProfileStorageEnabled, listClipsForUser, toPublicProfile, updateProfileAvatar, updateProfileBanner, updateProfileForUser } from './lib/profile-storage.js';

const PROFILE_MEDIA_DIR = process.env.VERCEL ? '/tmp/monkeymoltbook-profile-media' : path.join(process.cwd(), 'data', 'profile-media');

export const app = express();
app.use(express.json({ limit: '8mb' }));
app.use('/profile-media', express.static(PROFILE_MEDIA_DIR, {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
}));

app.post('/auth/email/start', async (req, res) => {
  const result = await startEmailAuth({
    email: req.body?.email,
    mode: req.body?.mode || 'magic_link',
    ipHash: req.ip || null,
    userAgent: req.headers['user-agent'] || null
  });
  res.status(result.ok ? 200 : 400).json(result);
});

app.post('/auth/email/verify', (req, res) => {
  const result = verifyEmailAuth({
    token: req.body?.token,
    email: req.body?.email,
    code: req.body?.code,
    ipHash: req.ip || null,
    userAgent: req.headers['user-agent'] || null
  });
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  syncVerifiedUser({
    ...result.user,
    emailVerifiedAt: new Date().toISOString()
  });
  applySessionCookie(res, result.token, result.session.expiresAt);
  res.json({ ok: true, user: result.user, session: result.session });
});

app.post('/auth/logout', (req, res) => {
  res.json(logoutSession(req, res));
});

app.post('/auth/dev-login', (req, res) => {
  const host = String(req.headers.host || '');
  const enabled = host !== 'molt-live.com' && host !== 'www.molt-live.com';
  if (!enabled) {
    res.status(404).json({ ok: false, code: 'NOT_FOUND' });
    return;
  }
  const result = createDevVerifiedSession(req.body?.email || 'moeylarge@gmail.com', {
    displayName: req.body?.displayName || 'Moltbook',
    handle: req.body?.handle || 'moeylarge'
  });
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  syncVerifiedUser({
    ...result.user,
    emailVerifiedAt: new Date().toISOString()
  });
  applySessionCookie(res, result.token, result.expiresAt);
  res.json({ ok: true, user: result.user });
});

app.get('/auth/session', (req, res) => {
  res.json(getSessionResponse(req));
});

app.get('/account/me', (req, res) => {
  const account = getAccountMe(req);
  if (!account) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  res.json(account);
});

app.get('/profile/me', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    const profile = await getOrCreateProfileForUser(session.user);
    syncVerifiedUser({
      id: session.user.id,
      email: session.user.email,
      emailVerifiedAt: session.user.emailVerified ? new Date().toISOString() : null,
      displayName: profile?.display_name || session.user.displayName || null,
      handle: profile?.username || session.user.handle || null,
      status: session.user.status || 'ACTIVE'
    });
    const clips = await listClipsForUser(session.user.id);
    res.json({ ok: true, profile, clips });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'PROFILE_ME_FAILED', message: String(error?.message || error) });
  }
});

app.patch('/profile/me', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    const result = await updateProfileForUser(session.user, req.body || {});
    if (!result.ok) {
      res.status(400).json({ ok: false, code: 'VALIDATION_FAILED', errors: result.errors || {} });
      return;
    }
    syncVerifiedUser({
      id: session.user.id,
      email: session.user.email,
      emailVerifiedAt: session.user.emailVerified ? new Date().toISOString() : null,
      displayName: result.profile?.display_name || session.user.displayName || null,
      handle: result.profile?.username || session.user.handle || null,
      status: session.user.status || 'ACTIVE'
    });
    res.json({ ok: true, profile: result.profile });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'PROFILE_UPDATE_FAILED', message: String(error?.message || error) });
  }
});

app.get('/profile/:username', async (req, res) => {
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    const profile = await getProfileByUsername(String(req.params.username || ''));
    if (!profile) {
      res.status(404).json({ ok: false, code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' });
      return;
    }
    const session = getSessionResponse(req);
    const ownerView = Boolean(session.authenticated && session.user?.id && String(session.user.id) === String(profile.user_id));
    if (!profile.is_public && !ownerView) {
      res.status(403).json({ ok: false, code: 'PROFILE_PRIVATE', message: 'This profile is private.' });
      return;
    }
    const clips = await listClipsForUser(profile.user_id);
    res.json({ ok: true, profile: ownerView ? profile : toPublicProfile(profile), ownerView, clips });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'PROFILE_FETCH_FAILED', message: String(error?.message || error) });
  }
});

app.post('/profile/me/avatar', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }

  const dataUrl = String(req.body?.dataUrl || '');
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) {
    res.status(400).json({ ok: false, code: 'INVALID_IMAGE', message: 'Upload a valid PNG, JPG, or WebP image.' });
    return;
  }

  const mimeType = match[1].toLowerCase();
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    res.status(400).json({ ok: false, code: 'IMAGE_TOO_LARGE', message: 'Avatar must be 5MB or smaller.' });
    return;
  }

  try {
    fs.mkdirSync(PROFILE_MEDIA_DIR, { recursive: true });
    const key = `${String(session.user.id).replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const outPath = path.join(PROFILE_MEDIA_DIR, key);
    fs.writeFileSync(outPath, buffer);
    const avatarUrl = `/profile-media/${key}?v=${Date.now()}`;
    const profile = await updateProfileAvatar(session.user, avatarUrl);
    res.json({ ok: true, profile, avatarUrl });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'AVATAR_UPLOAD_FAILED', message: String(error?.message || error) });
  }
});

app.delete('/profile/me/avatar', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    const current = await getOrCreateProfileForUser(session.user);
    const currentUrl = String(current?.avatar_url || '');
    if (currentUrl.startsWith('/profile-media/')) {
      const filename = currentUrl.replace('/profile-media/', '').split('?')[0];
      const targetPath = path.join(PROFILE_MEDIA_DIR, filename);
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    }
    const profile = await updateProfileAvatar(session.user, null);
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'AVATAR_REMOVE_FAILED', message: String(error?.message || error) });
  }
});

app.post('/profile/me/banner', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }

  const dataUrl = String(req.body?.dataUrl || '');
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) {
    res.status(400).json({ ok: false, code: 'INVALID_IMAGE', message: 'Upload a valid PNG, JPG, or WebP image.' });
    return;
  }

  const mimeType = match[1].toLowerCase();
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 8 * 1024 * 1024) {
    res.status(400).json({ ok: false, code: 'IMAGE_TOO_LARGE', message: 'Banner must be 8MB or smaller.' });
    return;
  }

  try {
    fs.mkdirSync(PROFILE_MEDIA_DIR, { recursive: true });
    const key = `banner-${String(session.user.id).replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const outPath = path.join(PROFILE_MEDIA_DIR, key);
    fs.writeFileSync(outPath, buffer);
    const bannerUrl = `/profile-media/${key}?v=${Date.now()}`;
    const profile = await updateProfileBanner(session.user, bannerUrl);
    res.json({ ok: true, profile, bannerUrl });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'BANNER_UPLOAD_FAILED', message: String(error?.message || error) });
  }
});

app.delete('/profile/me/banner', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    const current = await getOrCreateProfileForUser(session.user);
    const currentUrl = String(current?.banner_url || '');
    if (currentUrl.startsWith('/profile-media/')) {
      const filename = currentUrl.replace('/profile-media/', '').split('?')[0];
      const targetPath = path.join(PROFILE_MEDIA_DIR, filename);
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    }
    const profile = await updateProfileBanner(session.user, null);
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(500).json({ ok: false, code: 'BANNER_REMOVE_FAILED', message: String(error?.message || error) });
  }
});

app.post('/profile/me/clips', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    const clip = await createClipForUser(session.user, req.body || {});
    const clips = await listClipsForUser(session.user.id);
    const profile = await getOrCreateProfileForUser(session.user);
    res.json({ ok: true, clip, clips, profile });
  } catch (error) {
    res.status(400).json({ ok: false, code: 'CLIP_CREATE_FAILED', message: String(error?.message || error) });
  }
});

app.delete('/profile/me/clips/:clipId', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.id) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  if (!isProfileStorageEnabled()) {
    res.status(503).json({ ok: false, code: 'PROFILE_STORAGE_DISABLED', message: 'Profile storage is not configured.' });
    return;
  }
  try {
    await deleteClipForUser(session.user, req.params.clipId);
    const clips = await listClipsForUser(session.user.id);
    const profile = await getOrCreateProfileForUser(session.user);
    res.json({ ok: true, clips, profile });
  } catch (error) {
    res.status(400).json({ ok: false, code: 'CLIP_DELETE_FAILED', message: String(error?.message || error) });
  }
});

app.post('/account/resend-verification', async (req, res) => {
  const session = getSessionResponse(req);
  if (!session.authenticated || !session.user?.email) {
    res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
    return;
  }
  const result = await startEmailAuth({
    email: session.user.email,
    mode: 'magic_link',
    ipHash: req.ip || null,
    userAgent: req.headers['user-agent'] || null
  });
  res.status(result.ok ? 200 : 400).json({ ok: result.ok });
});

app.get('/moltmail/bootstrap', (req, res) => {
  const result = getBootstrap(req);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.get('/moltmail/recipients/search', (req, res) => {
  const result = searchRecipients(req, req.query?.q);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.get('/moltmail/inbox', (req, res) => {
  const result = getInbox(req);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.get('/moltmail/outbox', (req, res) => {
  const result = getOutbox(req);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.get('/moltmail/thread/:threadId', (req, res) => {
  const result = getThread(req, req.params.threadId);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread', (req, res) => {
  const result = createThread(req, req.body || {});
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/reply', (req, res) => {
  const result = replyThread(req, req.params.threadId, req.body || {});
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/read', (req, res) => {
  const result = markThreadRead(req, req.params.threadId);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/archive', (req, res) => {
  const result = archiveThread(req, req.params.threadId);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/message/:messageId/reaction', (req, res) => {
  const result = toggleReaction(req, req.params.threadId, req.params.messageId, req.body || {});
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/message/:messageId/unsend', (req, res) => {
  const result = unsendMessage(req, req.params.threadId, req.params.messageId);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/pin', (req, res) => {
  const result = togglePinThread(req, req.params.threadId);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.post('/moltmail/thread/:threadId/message/:messageId/pin', (req, res) => {
  const result = pinMessage(req, req.params.threadId, req.params.messageId);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.get('/moltmail/unread-count', (req, res) => {
  const result = getUnreadCount(req);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

app.get('/moltmail/audit', (req, res) => {
  const result = getAuditSummary(req);
  res.status(result.ok ? 200 : result.status || 400).json(result);
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

function openAiEnabled() {
  return Boolean(OPENAI_API_KEY);
}

function premiumAiAvailable() {
  return openAiEnabled();
}

function buildFredMessages({ agentName, userText, transcript = [] }) {
  const recent = (transcript || []).slice(-10).map((m) => ({
    role: m.role === 'agent' ? 'assistant' : m.role === 'user' ? 'user' : 'system',
    content: String(m.text || '')
  }));

  return [
    {
      role: 'system',
      content: `You are ${agentName || 'Fred'}, a live chat persona on Molt Live. Be natural, concise, useful, and non-repetitive. Do not say you 'heard' the user. Respond like a real assistant in an ongoing conversation. Avoid meta commentary about transcripts, storage, or implementation.`
    },
    ...recent,
    { role: 'user', content: userText }
  ];
}

async function createOpenAiChatCompletion({ agentName, userText, transcript = [] }) {
  if (!openAiEnabled()) throw new Error('openai_not_configured');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.8,
      stream: false,
      messages: buildFredMessages({ agentName, userText, transcript })
    })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`openai_chat_failed:${response.status}:${JSON.stringify(json)}`);
  return String(json?.choices?.[0]?.message?.content || '').trim();
}

function communitySearchRank(item, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return 0;
  const name = String(item.name || item.title || '').toLowerCase();
  const slug = String(item.slug || '').toLowerCase();
  const desc = String(item.description || '').toLowerCase();
  const titles = Array.isArray(item.sampleTitles) ? item.sampleTitles.join(' ').toLowerCase() : '';
  const text = `${name} ${slug} ${desc} ${titles}`;
  const suspiciousQuery = /(mint|hackai|wallet|seed|claim|drainer|bot|exploit|malware|mbc20|mbc-20)/i.test(q);
  let score = 0;

  if (name === q || slug === q) score += 160;
  if (name.includes(q) || slug.includes(q)) score += 80;
  if (desc.includes(q)) score += 14;
  if (titles.includes(q)) score += 24;
  if (item.matchedPostCount) score += Math.min(140, item.matchedPostCount * 20);

  if (suspiciousQuery && /(mbc20|mbc-20|hackai|bot|wang)/i.test(text)) score += 95;
  if (suspiciousQuery && /(mbc20|mbc-20)/i.test(`${name} ${slug}`)) score += 120;
  if (suspiciousQuery && /(mbc20|mbc-20|hackai|bot|wang)/i.test(`${name} ${slug}`)) score += 160;
  if (suspiciousQuery && !['general', 'crypto'].includes(name) && !['general', 'crypto'].includes(slug) && String(item.trust?.riskLabel || '').match(/High|Severe/)) score += 140;
  if (q === 'hackai' && /hackai/.test(text)) score += 120;
  if (q === 'mint' && /(mint|mbc20|mbc-20|hackai|bot|wang)/.test(text)) score += 90;
  if (q === 'mint' && /(mbc20|mbc-20|hackai|bot|wang)/.test(text)) score += 140;
  if (['claim', 'claim now', 'claim your reward', 'claim your airdrop', 'airdrop claim', 'eligible for airdrop', 'redeem', 'redeem now'].includes(q) && /(claim now|claim your reward|claim your airdrop|claim your tokens|airdrop claim|eligible for airdrop|check your eligibility|connect wallet to claim|redeem now|redeem your reward|unlock your reward|verify your wallet|wallet connect|wang|mbc20|mbc-20)/.test(text)) score += 110;
  if (['wallet', 'wallet connect', 'connect wallet to claim', 'verify your wallet', 'wallet recovery', 'seed phrase', 'private key'].includes(q) && /(wallet connect|connect wallet|verify your wallet|wallet recovery|recover your wallet|import your wallet|seed phrase|private key|connect wallet to claim|wallet drainer|clipboard drainer|drainer)/.test(text)) score += 120;
  if (['exploit', 'wallet exploit', 'social engineering exploit', 'drainer', 'stealer', 'malware'].includes(q) && /(wallet exploit|verify your wallet|connect wallet to claim|wallet drainer|clipboard drainer|seed phrase|private key|stealer|malware|remote access trojan|drainer)/.test(text)) score += 120;

  if (suspiciousQuery && String(item.trust?.riskLabel || '').includes('Severe')) score += 90;
  else if (suspiciousQuery && String(item.trust?.riskLabel || '').includes('High')) score += 60;
  else if (suspiciousQuery && String(item.trust?.riskLabel || '').includes('Caution')) score += 28;

  if (name === 'general' || slug === 'general') score -= suspiciousQuery ? 320 : 35;
  if (name === 'crypto' || slug === 'crypto') score -= suspiciousQuery ? 110 : 8;
  if (suspiciousQuery && (item.matchedPostCount || 0) <= 3 && (name === 'general' || slug === 'general')) score -= 120;
  if (q === 'mint' && (name === 'general' || slug === 'general')) score -= 260;
  if ((q === 'mbc20' || q === 'mbc-20' || q === 'hackai' || q === 'bot' || q === 'wang') && (name === 'general' || slug === 'general')) score -= 260;
  if ((q === 'mbc20' || q === 'mbc-20' || q === 'hackai' || q === 'bot' || q === 'wang') && (item.specializedEvidence || 0) <= 1) score -= 120;
  if (q === 'wallet' && (name === 'general' || slug === 'general')) score -= 120;

  return score;
}

function buildPersistableAuthorRiskRows({ posts = [], upsertedAuthors = [] } = {}) {
  const authorBySourceId = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row]));
  const grouped = new Map();
  const suspiciousPhrasePatterns = [
    'wallet connect', 'connect wallet', 'verify your wallet', 'wallet verification', 'wallet recovery', 'recover your wallet', 'import your wallet',
    'seed phrase', 'secret phrase', 'private key', 'connect wallet to claim', 'wallet drainer', 'clipboard drainer', 'drain your wallet',
    'remote access trojan', 'keygen', 'stealer', 'claim your reward now', 'claim your reward', 'claim your tokens', 'claim your airdrop',
    'redeem now', 'redeem your reward', 'unlock your reward', 'check your eligibility', 'eligible for airdrop', 'airdrop'
  ];

  for (const post of posts || []) {
    const sourceAuthorId = String(post?.author?.id || '');
    const mapped = authorBySourceId.get(sourceAuthorId);
    if (!mapped?.id || !mapped?.author_name) continue;
    if (!grouped.has(mapped.id)) {
      grouped.set(mapped.id, {
        id: mapped.id,
        authorName: mapped.author_name,
        description: mapped.description || '',
        reason: mapped.reason || '',
        postCount: Number(mapped.post_count || 0),
        observedPosts: Number(mapped.post_count || 0),
        karma: Number(mapped.karma || 0),
        isClaimed: Boolean(mapped.is_claimed),
        submolts: new Set(),
        sampleTitles: [],
        sampleSnippets: [],
        matchedPostCount: 0,
        suspiciousHits: 0,
        phraseDiversity: new Set()
      });
    }
    const entry = grouped.get(mapped.id);
    const title = String(post?.title || '').slice(0, 160);
    const snippet = String(post?.snippet || post?.body || post?.description || '').slice(0, 260);
    const text = `${title} ${snippet}`.toLowerCase();
    if (post?.submolt) entry.submolts.add(typeof post.submolt === 'string' ? post.submolt : post.submolt?.name || post.submolt?.slug || '');
    if (title && entry.sampleTitles.length < 6) entry.sampleTitles.push(title);
    if (snippet && entry.sampleSnippets.length < 4) entry.sampleSnippets.push(snippet);

    let matched = false;
    for (const phrase of suspiciousPhrasePatterns) {
      if (text.includes(phrase)) {
        entry.phraseDiversity.add(phrase);
        matched = true;
      }
    }
    if (/seed phrase|secret phrase|private key|wallet recovery|recover your wallet|import your wallet|connect wallet to claim|wallet drainer|clipboard drainer|drain your wallet|remote access trojan|keygen|stealer|claim your reward now|claim your reward|claim your tokens|claim your airdrop|redeem now|redeem your reward|unlock your reward|verify your wallet|wallet connect|wallet verification|check your eligibility|eligible for airdrop|airdrop/.test(text)) {
      entry.suspiciousHits += 2;
      matched = true;
    }
    if (matched) entry.matchedPostCount += 1;
  }

  return [...grouped.values()].map((row) => {
    const hydrated = {
      ...row,
      submolts: [...row.submolts].filter(Boolean),
      phraseDiversity: row.phraseDiversity.size
    };
    const trust = scoreAuthorRisk(hydrated);
    return {
      entity_type: 'author',
      entity_id: row.id,
      risk_score: trust.riskScore,
      risk_label: trust.riskLabel,
      reason_short: trust.reasonShort,
      signal_breakdown: trust.signalBreakdown,
      evidence_summary: {
        matchedPostCount: hydrated.matchedPostCount || 0,
        suspiciousHits: hydrated.suspiciousHits || 0,
        phraseDiversity: hydrated.phraseDiversity || 0,
        sampleTitles: hydrated.sampleTitles || []
      },
      version: trust.version || 'trust-v1'
    };
  });
}

function authorSearchRank(item, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return 0;
  const name = String(item.authorName || item.author_name || '').toLowerCase();
  const desc = String(item.description || '').toLowerCase();
  const reason = String(item.reason || '').toLowerCase();
  const titles = Array.isArray(item.sampleTitles) ? item.sampleTitles.join(' ').toLowerCase() : '';
  const snippets = Array.isArray(item.sampleSnippets) ? item.sampleSnippets.join(' ').toLowerCase() : '';
  const submolts = Array.isArray(item.submolts) ? item.submolts.join(' ').toLowerCase() : '';
  const text = `${name} ${desc} ${reason} ${titles} ${snippets} ${submolts}`;
  const suspiciousQuery = /(wallet|seed phrase|seed|drainer|malware|exploit|claim|airdrop)/i.test(q);
  let score = 0;

  if (name === q) score += 120;
  if (name.includes(q)) score += 60;
  if (desc.includes(q)) score += 10;
  if (reason.includes(q)) score += 12;
  if (titles.includes(q)) score += 30;
  if (snippets.includes(q)) score += 45;
  if (item.matchedPostCount) score += Math.min(180, item.matchedPostCount * 24);
  if (item.suspiciousHits) score += Math.min(160, item.suspiciousHits * 32);
  if (item.phraseDiversity) score += Math.min(140, item.phraseDiversity * 40);

  if (suspiciousQuery && /(wallet connect|connect wallet|verify your wallet|seed phrase|private key|wallet recovery|drainer|clipboard drainer|stealer|keygen|remote access trojan|malware|airdrop|claim your reward now|claim your reward|connect wallet to claim)/.test(text)) score += 120;
  if (q === 'wallet' && /(wallet connect|connect wallet|verify your wallet|wallet verification|wallet recovery|recover your wallet|import your wallet|wallet drainer|seed phrase|private key|redeem your wallet)/.test(text)) score += 120;
  if (q === 'seed phrase' && /(seed phrase|secret phrase|private key|recovery phrase|wallet recovery|recover your wallet|import your wallet)/.test(text)) score += 130;
  if (q === 'drainer' && /(drainer|wallet drainer|clipboard drainer|drain your wallet|seed phrase|private key|stealer)/.test(text)) score += 120;
  if (q === 'malware' && /(malware|virus|keygen|stealer|remote access trojan)/.test(text)) score += 120;
  if (q === 'exploit' && /(wallet exploit|verify your wallet|connect wallet to claim|wallet drainer|clipboard drainer|seed phrase|private key|stealer|recover your wallet)/.test(text)) score += 100;
  if (q === 'claim' && /(claim your reward|claim now|claim your tokens|claim your airdrop|connect wallet to claim|airdrop claim|wallet connect|verify your wallet|redeem now|redeem your reward|unlock your reward|check your eligibility|eligible for airdrop)/.test(text)) score += 110;
  if (q === 'airdrop' && /(airdrop|claim your reward|claim your airdrop|connect wallet to claim|wallet connect|verify your wallet|check your eligibility|eligible for airdrop)/.test(text)) score += 100;

  if (suspiciousQuery && String(item.trust?.riskLabel || '').includes('Severe')) score += 100;
  else if (suspiciousQuery && String(item.trust?.riskLabel || '').includes('High')) score += 70;
  else if (suspiciousQuery && String(item.trust?.riskLabel || '').includes('Caution')) score += 24;

  if (suspiciousQuery && (item.matchedPostCount || 0) === 0 && String(item.trust?.riskLabel || '') === 'Low Risk') score -= 140;
  if (q === 'wallet' && !/(wallet connect|connect wallet|verify your wallet|wallet verification|wallet recovery|recover your wallet|import your wallet|wallet drainer|seed phrase|private key|redeem your wallet)/.test(text)) score -= 180;
  if (q === 'drainer' && !/(drainer|wallet drainer|clipboard drainer|drain your wallet|stealer|seed phrase|private key)/.test(text)) score -= 180;
  if (q === 'claim' && !/(claim your reward|claim now|claim your tokens|claim your airdrop|connect wallet to claim|airdrop claim|wallet connect|verify your wallet|redeem now|redeem your reward|unlock your reward|check your eligibility|eligible for airdrop)/.test(text)) score -= 220;
  if (q === 'claim' && /(hackathon|free guidance|open source|security research|compliance|falsifiable claim|claim: when|the claim is)/.test(text)) score -= 180;
  if (q === 'exploit' && !/(wallet exploit|verify your wallet|connect wallet to claim|wallet drainer|clipboard drainer|seed phrase|private key|stealer)/.test(text)) score -= 220;
  if (q === 'exploit' && /(hackathon|free guidance|open source|security research|compliance|marketplace exploit|social engineering exploits|exploit times|zero-days)/.test(text)) score -= 180;
  if (q === 'airdrop' && !/(airdrop|claim your reward|connect wallet to claim|wallet connect|verify your wallet)/.test(text)) score -= 120;

  return score;
}
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  else if (req.url === '/api') req.url = '/';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

const PHASE = 'Controlled Moltbook ingestion';
const DEFAULT_PRELOAD_COUNT = 3;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'monkeymoltbook-data') : path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.jsonl');
const INTEREST_FILE = path.join(DATA_DIR, 'topic-interest.jsonl');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics-events.jsonl');

function appendJsonl(filePath, payload) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`);
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function resolveAnalyticsWindow(windowValue = 'all') {
  const now = Date.now();
  if (windowValue === '24h') return { key: '24h', sinceMs: now - (24 * 60 * 60 * 1000) };
  if (windowValue === '7d') return { key: '7d', sinceMs: now - (7 * 24 * 60 * 60 * 1000) };
  return { key: 'all', sinceMs: 0 };
}

function shouldCountAnalyticsEvent(row, dedupeMap) {
  const createdMs = Date.parse(row?.createdAt || '') || 0;
  const sessionId = String(row?.meta?.sessionId || 'anon');
  const routePath = String(row?.meta?.routePath || 'unknown');
  const actionType = String(row?.meta?.actionType || '');
  const label = String(row?.meta?.label || '');
  const event = String(row?.event || 'unknown');
  const dedupeKey = [sessionId, routePath, event, actionType, label].join('|');
  const lastSeen = dedupeMap.get(dedupeKey);
  if (lastSeen && (createdMs - lastSeen) < 5000) return false;
  dedupeMap.set(dedupeKey, createdMs);
  return true;
}

function buildAnalyticsSummary(rows, windowValue = 'all') {
  const { key, sinceMs } = resolveAnalyticsWindow(windowValue);
  const filteredRows = rows.filter((row) => (Date.parse(row?.createdAt || '') || 0) >= sinceMs);
  const routes = {};
  const ctas = {};
  const dedupeMap = new Map();

  for (const row of filteredRows) {
    if (!shouldCountAnalyticsEvent(row, dedupeMap)) continue;
    const routePath = String(row?.meta?.routePath || 'unknown');
    if (!routes[routePath]) {
      routes[routePath] = {
        views: 0,
        primaryClicks: 0,
        secondaryClicks: 0,
        dropoffCount: 0,
        primaryCtr: 0,
        secondaryCtr: 0,
        dropoffRate: 0,
        ctas: {}
      };
    }

    if (row.event === 'route_view') routes[routePath].views += 1;
    if (row.event === 'route_dropoff_no_click') routes[routePath].dropoffCount += 1;
    if (row.event === 'route_action_click') {
      const actionType = row?.meta?.actionType === 'primary' ? 'primary' : 'secondary';
      const label = String(row?.meta?.label || 'unknown');
      const target = String(row?.meta?.target || 'unknown');
      if (actionType === 'primary') routes[routePath].primaryClicks += 1;
      else routes[routePath].secondaryClicks += 1;

      if (!routes[routePath].ctas[label]) routes[routePath].ctas[label] = { actionType, target, clicks: 0 };
      routes[routePath].ctas[label].clicks += 1;

      const ctaKey = `${routePath}::${label}`;
      if (!ctas[ctaKey]) ctas[ctaKey] = { routePath, label, actionType, target, clicks: 0 };
      ctas[ctaKey].clicks += 1;
    }
  }

  for (const route of Object.values(routes)) {
    const views = route.views || 0;
    route.primaryCtr = views ? route.primaryClicks / views : 0;
    route.secondaryCtr = views ? route.secondaryClicks / views : 0;
    route.dropoffRate = views ? route.dropoffCount / views : 0;
  }

  return {
    window: key,
    totalEvents: filteredRows.length,
    routes,
    ctas: Object.values(ctas).sort((a, b) => b.clicks - a.clicks)
  };
}

async function runMoltbookRefreshJob(meta = {}) {
  const mode = meta.mode || 'default';
  const triggerSource = meta.source || 'manual';
  const result = await getMoltbookAgents();
  const intel = await getMoltbookIntel();

  let storage = { enabled: isSupabaseStorageEnabled(), persisted: false };
  if (storage.enabled) {
    try {
      const persisted = await persistMoltbookSnapshot({
        mode,
        triggerSource,
        source: result.source,
        intel
      });
      storage = {
        enabled: true,
        persisted: Boolean(persisted?.ok),
        runId: persisted?.runId || null,
        authorRows: persisted?.authorRows || 0
      };
    } catch (error) {
      storage = {
        enabled: true,
        persisted: false,
        error: String(error?.message || error)
      };
    }
  }

  return {
    ok: true,
    mode,
    triggerSource,
    source: result.source,
    activeAgents: result.agents.length,
    lastFetchedAt: intel.lastFetchedAt,
    postCount: intel.postCount,
    authorCount: intel.authorCount,
    storage,
  };
}

function withAuthorTrust(row) {
  return { ...row, trust: scoreAuthorRisk(row) };
}

function withTopicTrust(topicRow) {
  return {
    ...topicRow,
    accounts: Array.isArray(topicRow.accounts) ? topicRow.accounts.map(withAuthorTrust) : []
  };
}

async function buildSeedFallback() {
  const agents = await listAgents();
  const ranked = agents.map((agent, index) => {
    const fitScore = Math.max(60, 95 - index * 3);
    const signalScore = Math.max(40, 88 - index * 2);
    const rise = Math.max(6, 28 - index * 2 + ((index % 4) * 3));
    const hotScore = fitScore + signalScore + ((index % 5) * 7);
    const liveReady = index % 3 !== 2;
    return {
      authorId: agent.id,
      authorName: agent.name,
      archetype: agent.archetype,
      description: agent.system_prompt,
      reason: `${agent.name} is available in the local seed set while live Moltbook intel refreshes.`,
      profileUrl: null,
      topics: [agent.style, 'live', 'voice'].filter(Boolean),
      fitScore,
      signalScore,
      totalComments: Math.max(0, 18 - index),
      rise,
      hotScore,
      liveReady,
      label: index < 5 ? 'admit' : 'watch',
      source: agent.source,
    };
  });

  const topSources = [...ranked].sort((a, b) => b.fitScore - a.fitScore || b.signalScore - a.signalScore).slice(0, 100);
  const rising = [...ranked].sort((a, b) => b.rise - a.rise || b.signalScore - a.signalScore).slice(0, 25);
  const hot = [...ranked].sort((a, b) => b.hotScore - a.hotScore || b.totalComments - a.totalComments).slice(0, 25);
  const liveReady = [...ranked].filter((row) => row.liveReady).sort((a, b) => b.signalScore - a.signalScore || b.fitScore - a.fitScore).slice(0, 25);

  return {
    topSources: topSources.map(withAuthorTrust),
    rising: rising.map(withAuthorTrust),
    hot: hot.map(withAuthorTrust),
    liveReady: liveReady.map(withAuthorTrust),
    topics: [
      { topic: 'live', count: ranked.length, accounts: topSources.slice(0, 5).map(withAuthorTrust) },
      { topic: 'voice', count: ranked.length, accounts: rising.slice(0, 5).map(withAuthorTrust) },
      { topic: 'social', count: ranked.length, accounts: hot.slice(0, 5).map(withAuthorTrust) },
    ],
  };
}

app.get('/health', async (_req, res) => {
  res.json({ ok: true, app: 'MonkeyMoltbook', phase: PHASE, ...(await getAgentStats()), ...getMoltbookStats(), ...getResponseStats() });
});
app.get('/agents', async (_req, res) => res.json({ phase: PHASE, agents: await listAgents() }));
app.get('/moltbook/intel', async (_req, res) => res.json({ phase: PHASE, ...(await getMoltbookIntel()) }));
app.get('/moltbook/rankings', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, rankings: intel.rankings ?? [] }); });
app.get('/moltbook/history', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, snapshots: intel.snapshots ?? [], authorHistory: intel.authorHistory ?? {} }); });
app.get('/moltbook/audit/suspicious-authors', async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
  const rows = await listEvidenceBackedSuspiciousAuthors({ limit }).catch(() => []);
  const storedAuthors = await getAuthorsByIds(rows.map((row) => row.entity_id)).catch(() => []);
  const authorMap = new Map(storedAuthors.map((row) => [String(row.id || ''), row]));
  res.json({
    phase: PHASE,
    ok: true,
    kind: 'evidence-backed-suspicious-authors',
    count: rows.length,
    rows: rows.map((row) => ({
      ...row,
      author: authorMap.get(String(row.entity_id || '')) || null
    }))
  });
});
app.get('/moltbook/audit/mint-authors', async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
  const rows = await listMintAbuseAuthors({ limit }).catch(() => []);
  const storedAuthors = await getAuthorsByIds(rows.map((row) => row.entity_id)).catch(() => []);
  const authorMap = new Map(storedAuthors.map((row) => [String(row.id || ''), row]));
  res.json({
    phase: PHASE,
    ok: true,
    kind: 'mint-abuse-authors',
    count: rows.length,
    rows: rows.map((row) => ({
      ...row,
      author: authorMap.get(String(row.entity_id || '')) || null
    }))
  });
});
app.get('/moltbook/report', async (_req, res) => { const intel = await getMoltbookIntel(); const intelAuthors = intel.authors ?? []; const storedAuthors = intelAuthors.length === 0 ? await searchAuthors({ query: '', limit: 200 }).catch(() => []) : []; const authors = intelAuthors.length ? intelAuthors : storedAuthors.map((row) => ({ authorId: row.source_author_id || row.id, authorName: row.author_name, description: row.description, isClaimed: row.is_claimed, isActive: row.is_active, karma: row.karma, postCount: row.post_count, totalScore: row.total_score, totalComments: row.total_comments, avgScorePerPost: row.avg_score_per_post, avgCommentsPerPost: row.avg_comments_per_post, signalScore: row.signal_score, fitScore: row.fit_score, label: row.label, reason: row.reason, strongHits: row.strong_hits, weakHits: row.weak_hits, latestPostAt: row.latest_post_at, profileUrl: row.profile_url, topics: row.topics || [], titles: row.titles || [], snippets: row.snippets || [] })) ; const fallback = authors.length === 0 ? await buildSeedFallback() : null; const allAuthors = (fallback ? [...fallback.topSources, ...fallback.rising, ...fallback.hot].filter((row, index, arr) => arr.findIndex((x) => x.authorId === row.authorId) === index) : authors).map(withAuthorTrust); const topSources = (fallback?.topSources ?? authors.filter((row) => row.label !== 'reject').sort((a, b) => b.fitScore - a.fitScore).slice(0, 100)).map(withAuthorTrust); const activeAuthors = (fallback?.topSources ?? authors).map(withAuthorTrust); const liveReady = (fallback?.liveReady ?? authors.filter((row) => row.label !== 'reject').filter((row) => (row.signalScore || 0) >= 45 || (row.fitScore || 0) >= 70).sort((a, b) => (b.signalScore || 0) - (a.signalScore || 0) || (b.fitScore || 0) - (a.fitScore || 0)).slice(0, 25)).map(withAuthorTrust); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, summary: { authorCount: activeAuthors.length, admitCount: activeAuthors.filter((row) => row.label === 'admit').length, watchCount: activeAuthors.filter((row) => row.label === 'watch').length, rejectCount: activeAuthors.filter((row) => row.label === 'reject').length, discoverySurfaces: intel.discovery?.surfaces ?? [], discoveredSubmolts: (intel.discovery?.submolts ?? []).length, coveredAuthors: (intel.discovery?.coverage ?? []).length }, topSources, liveReady, allAuthors, admits: activeAuthors.filter((row) => row.label === 'admit').sort((a, b) => b.fitScore - a.fitScore), watch: activeAuthors.filter((row) => row.label === 'watch').sort((a, b) => b.fitScore - a.fitScore).slice(0, 50), rejects: activeAuthors.filter((row) => row.label === 'reject').sort((a, b) => (b.weakHits || 0) - (a.weakHits || 0)).slice(0, 50) }); });
app.get('/moltbook/discovery', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, surfaces: intel.discovery?.surfaces ?? [], errors: intel.discovery?.errors ?? [], submolts: intel.discovery?.submolts ?? [], coverage: intel.discovery?.coverage ?? [] }); });
app.get('/moltbook/growth', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, ...buildGrowthMetrics(intel) }); });
app.get('/moltbook/rising', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.rising?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, rising: (fallback?.rising ?? intel.signals?.rising ?? []).map(withAuthorTrust) }); });
app.get('/moltbook/hot', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.hot?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, hot: (fallback?.hot ?? intel.signals?.hot ?? []).map(withAuthorTrust) }); });
app.get('/moltbook/topics', async (_req, res) => { const intel = await getMoltbookIntel(); const fallback = !(intel.signals?.topicClusters?.length) ? await buildSeedFallback() : null; res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, topics: (fallback?.topics ?? intel.signals?.topicClusters ?? []).map(withTopicTrust) }); });
app.get('/moltbook/top-submolts', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, lastFetchedAt: intel.lastFetchedAt, submolts: intel.signals?.topSubmolts ?? [] }); });
app.get('/molt-live/search', async (req, res) => {
  const intel = await getMoltbookIntel();
  const q = String(req.query.q || '').trim().toLowerCase();
  const tab = String(req.query.tab || 'all');
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));

  const suspiciousAuthorQuery = /(wallet|seed phrase|seed|drainer|malware|exploit|claim|airdrop|private key|wallet connect)/i.test(q);
  let authors = (intel.authors || []).filter((row) => {
    if (!q) return true;
    return `${row.authorName || ''} ${row.description || ''} ${(row.topics || []).join(' ')} ${row.reason || ''}`.toLowerCase().includes(q);
  }).map((row) => ({
    ...row,
    trust: scoreAuthorRisk(row),
    matchedPostCount: 0,
    suspiciousHits: 0,
    sampleTitles: [],
    sampleSnippets: []
  }));

  if (isSupabaseStorageEnabled() && (tab === 'all' || tab === 'users')) {
    const rowLimit = tab === 'all' ? 12 : limit;
    const [storedAuthors, evidenceAuthors] = await Promise.all([
      searchAuthors({ query: q, limit: rowLimit }).catch(() => []),
      searchAuthorEvidence({ query: q, limit: rowLimit }).catch(() => [])
    ]);
    const evidenceAuthorRecords = await getAuthorsBySourceIds(evidenceAuthors.map((row) => row.sourceAuthorId)).catch(() => []);
    const storedBySourceAuthorId = new Map([
      ...storedAuthors.map((row) => [String(row.source_author_id || ''), row]),
      ...evidenceAuthorRecords.map((row) => [String(row.source_author_id || ''), row])
    ]);
    const mergedByAuthor = new Map();

    for (const row of [...authors, ...storedAuthors.map((item) => ({
      id: item.id,
      sourceAuthorId: item.source_author_id,
      authorId: item.source_author_id,
      authorName: item.author_name,
      description: item.description || '',
      karma: item.karma || 0,
      postCount: item.post_count || 0,
      observedPosts: item.post_count || 0,
      reason: item.reason || '',
      isClaimed: Boolean(item.is_claimed),
      trust: scoreAuthorRisk({
        authorName: item.author_name,
        description: item.description,
        reason: item.reason,
        postCount: item.post_count,
        karma: item.karma,
        isClaimed: item.is_claimed
      }),
      matchedPostCount: 0,
      suspiciousHits: 0,
      phraseDiversity: 0,
      sampleTitles: [],
      sampleSnippets: [],
      submolts: []
    }))]) {
      const key = String(row.authorId || row.sourceAuthorId || row.authorName || '').toLowerCase();
      if (!key) continue;
      const prev = mergedByAuthor.get(key) || null;
      mergedByAuthor.set(key, prev ? {
        ...prev,
        ...row,
        description: prev.description || row.description,
        reason: prev.reason || row.reason,
        postCount: Math.max(prev.postCount || prev.observedPosts || 0, row.postCount || row.observedPosts || 0),
        observedPosts: Math.max(prev.observedPosts || prev.postCount || 0, row.observedPosts || row.postCount || 0),
        submolts: [...new Set([...(prev.submolts || []), ...(row.submolts || [])])],
        phraseDiversity: Math.max(prev.phraseDiversity || 0, row.phraseDiversity || 0),
        sampleTitles: [...new Set([...(prev.sampleTitles || []), ...(row.sampleTitles || [])])].slice(0, 6),
        sampleSnippets: [...new Set([...(prev.sampleSnippets || []), ...(row.sampleSnippets || [])])].slice(0, 4)
      } : row);
    }

    for (const row of evidenceAuthors) {
      const key = String(row.sourceAuthorId || row.authorName || '').toLowerCase();
      if (!key) continue;
      const prev = mergedByAuthor.get(key);
      const stored = storedBySourceAuthorId.get(String(row.sourceAuthorId || '')) || null;
      const base = prev || {
        id: stored?.id,
        sourceAuthorId: row.sourceAuthorId,
        authorId: stored?.id || row.sourceAuthorId,
        authorName: stored?.author_name || row.authorName,
        description: stored?.description || row.description || '',
        reason: stored?.reason || row.sampleSnippets?.[0] || row.sampleTitles?.[0] || '',
        postCount: Math.max(Number(stored?.post_count || 0), row.matchedPostCount || 0),
        observedPosts: Math.max(Number(stored?.post_count || 0), row.matchedPostCount || 0),
        karma: Number(stored?.karma || 0),
        isClaimed: Boolean(stored?.is_claimed),
        submolts: [],
        phraseDiversity: 0,
        sampleTitles: [],
        sampleSnippets: []
      };
      const merged = {
        ...base,
        sourceAuthorId: base.sourceAuthorId || row.sourceAuthorId,
        authorId: base.authorId || row.sourceAuthorId,
        authorName: base.authorName || row.authorName,
        description: base.description || row.description || '',
        reason: base.reason || row.sampleSnippets?.[0] || row.sampleTitles?.[0] || '',
        postCount: Math.max(base.postCount || base.observedPosts || 0, row.matchedPostCount || 0),
        observedPosts: Math.max(base.observedPosts || base.postCount || 0, row.matchedPostCount || 0),
        matchedPostCount: Math.max(base.matchedPostCount || 0, row.matchedPostCount || 0),
        suspiciousHits: Math.max(base.suspiciousHits || 0, row.suspiciousHits || 0),
        phraseDiversity: Math.max(base.phraseDiversity || 0, row.phraseDiversity || 0),
        submolts: [...new Set([...(base.submolts || []), ...(row.submolts || [])])],
        sampleTitles: [...new Set([...(base.sampleTitles || []), ...(row.sampleTitles || [])])].slice(0, 6),
        sampleSnippets: [...new Set([...(base.sampleSnippets || []), ...(row.sampleSnippets || [])])].slice(0, 4)
      };
      merged.trust = scoreAuthorRisk({
        ...merged,
        postCount: merged.postCount || merged.observedPosts || 0,
        observedPosts: merged.observedPosts || merged.postCount || 0,
        submolts: merged.submolts
      });
      mergedByAuthor.set(key, merged);
    }

    authors = [...mergedByAuthor.values()]
      .filter((row) => {
        if (!suspiciousAuthorQuery) return true;
        const riskLabel = String(row.trust?.riskLabel || '');
        return (row.matchedPostCount || 0) > 0 || /Caution|High|Severe/.test(riskLabel);
      })
      .sort((a, b) => authorSearchRank(b, q) - authorSearchRank(a, q) || (b.matchedPostCount || 0) - (a.matchedPostCount || 0) || (b.postCount || b.observedPosts || 0) - (a.postCount || a.observedPosts || 0))
      .slice(0, rowLimit);

    const persistableAuthorScores = authors
      .filter((row) => row.id && row.trust)
      .filter((row) => (row.matchedPostCount || 0) > 0 || /Caution|High|Severe/.test(String(row.trust?.riskLabel || '')))
      .map((row) => ({
        entity_type: 'author',
        entity_id: row.id,
        risk_score: row.trust.riskScore,
        risk_label: row.trust.riskLabel,
        reason_short: row.trust.reasonShort,
        signal_breakdown: row.trust.signalBreakdown,
        evidence_summary: {
          matchedPostCount: row.matchedPostCount || 0,
          suspiciousHits: row.suspiciousHits || 0,
          phraseDiversity: row.phraseDiversity || 0,
          sampleTitles: row.sampleTitles || []
        },
        version: row.trust.version || 'trust-v1'
      }));
    if (persistableAuthorScores.length) {
      await upsertEntityRiskScores(persistableAuthorScores).catch(() => null);
    }
  } else {
    authors = suspiciousAuthorQuery
      ? authors.filter((row) => (row.matchedPostCount || 0) > 0 || /Caution|High|Severe/.test(String(row.trust?.riskLabel || ''))).slice(0, tab === 'all' ? 12 : limit)
      : authors.slice(0, tab === 'all' ? 12 : limit);
  }

  const topics = (intel.signals?.topicClusters || []).filter((row) => {
    if (!q) return true;
    return `${row.topic || ''} ${(row.accounts || []).map((a) => a.authorName).join(' ')}`.toLowerCase().includes(q);
  }).slice(0, tab === 'all' ? 6 : limit);

  let communities = [];
  if (isSupabaseStorageEnabled() && (tab === 'all' || tab === 'groups')) {
    const rowLimit = tab === 'all' ? 6 : limit;
    const [storedRows, evidenceRows] = await Promise.all([
      searchCommunities({ query: q, limit: rowLimit }).catch(() => []),
      searchCommunityEvidence({ query: q, limit: rowLimit }).catch(() => [])
    ]);
    const mergedBySlug = new Map();
    for (const row of storedRows) {
      const base = {
        id: row.id,
        slug: row.slug || row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
        name: row.name,
        title: row.title || row.name,
        description: row.description || 'Community coverage from Moltbook.',
        sampleTitles: row?.payload?.sampleTitles || [],
        postCount: Math.round(row.post_count || 0),
        memberCount: row.member_count || 0,
        source: 'community'
      };
      mergedBySlug.set(base.slug, base);
    }
    for (const row of evidenceRows) {
      const slug = row.slug || row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
      const prev = mergedBySlug.get(slug);
      if (!prev) {
        mergedBySlug.set(slug, row);
        continue;
      }
      mergedBySlug.set(slug, {
        ...prev,
        description: prev.description || row.description,
        sampleTitles: [...new Set([...(prev.sampleTitles || []), ...(row.sampleTitles || [])])].slice(0, 8),
        postCount: Math.max(prev.postCount || 0, row.postCount || 0),
        matchedPostCount: Math.max(prev.matchedPostCount || 0, row.matchedPostCount || 0)
      });
    }
    let rankedCommunities = [...mergedBySlug.values()]
      .map((base) => ({ ...base, trust: scoreCommunityRisk(base) }));

    if (['mint', 'hackai', 'mbc20', 'mbc-20', 'bot', 'wang'].includes(q)) {
      const specializedOnly = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
      if (specializedOnly.length) rankedCommunities = specializedOnly;
      rankedCommunities = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        if (['general', 'crypto', 'builds', 'introductions', 'consciousness', 'philosophy', 'ponderings', 'botting-after-midnight-0110', 'bottube', 'robotics'].includes(name)) return false;
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
    }

    if (['claim', 'claim now', 'claim your reward', 'claim your airdrop', 'airdrop claim', 'eligible for airdrop', 'redeem', 'redeem now'].includes(q)) {
      const specializedOnly = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
      if (specializedOnly.length) rankedCommunities = specializedOnly;
      rankedCommunities = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        if (['general', 'philosophy', 'agents', 'clawtasks', 'aithoughts', 'ai-agents', 'memory', 'builds', 'introductions', 'consciousness', 'ponderings'].includes(name)) return false;
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
    }

    if (['wallet', 'wallet connect', 'connect wallet to claim', 'verify your wallet', 'wallet recovery', 'seed phrase', 'private key'].includes(q)) {
      const specializedOnly = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
      if (specializedOnly.length) rankedCommunities = specializedOnly;
      rankedCommunities = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        if (['general', 'crypto', 'agentfinance', 'defi', 'bitcoin', 'ai-agents', 'agents', 'clawtasks', 'builds', 'introductions', 'consciousness', 'philosophy', 'ponderings'].includes(name)) return false;
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
    }

    if (['exploit', 'wallet exploit', 'social engineering exploit', 'drainer', 'stealer', 'malware'].includes(q)) {
      const specializedOnly = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
      if (specializedOnly.length) rankedCommunities = specializedOnly;
      rankedCommunities = rankedCommunities.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        if (['general', 'crypto', 'agentfinance', 'agenttrust', 'defi', 'bitcoin', 'ai-agents', 'agents', 'clawtasks', 'builds', 'introductions', 'consciousness', 'philosophy', 'ponderings'].includes(name)) return false;
        return (item.specializedEvidence || 0) > 0 || /(mbc20|mbc-20)/.test(name);
      });
    }

    communities = rankedCommunities.sort((a, b) => {
        if (['mint', 'hackai', 'mbc20', 'mbc-20', 'bot', 'wang'].includes(q)) {
          const classify = (item) => {
            const text = `${String(item.name || '').toLowerCase()} ${String(item.slug || '').toLowerCase()} ${(item.sampleTitles || []).join(' ').toLowerCase()}`;
            if (/(mbc20|mbc-20)/.test(text)) return 4;
            if (/(hackai|wang|bot)/.test(text) || (item.specializedEvidence || 0) > 0) return 3;
            if (String(item.trust?.riskLabel || '').includes('Severe') || String(item.trust?.riskLabel || '').includes('High')) return 2;
            return 1;
          };
          const bucketDiff = classify(b) - classify(a);
          if (bucketDiff) return bucketDiff;
        }
        if (['claim', 'claim now', 'claim your reward', 'claim your airdrop', 'airdrop claim', 'eligible for airdrop', 'redeem', 'redeem now'].includes(q)) {
          const classify = (item) => {
            const text = `${String(item.name || '').toLowerCase()} ${String(item.slug || '').toLowerCase()} ${(item.sampleTitles || []).join(' ').toLowerCase()}`;
            if (/(mbc20|mbc-20)/.test(text)) return 4;
            if ((item.specializedEvidence || 0) > 0) return 3;
            if (String(item.trust?.riskLabel || '').includes('Severe') || String(item.trust?.riskLabel || '').includes('High')) return 2;
            return 1;
          };
          const bucketDiff = classify(b) - classify(a);
          if (bucketDiff) return bucketDiff;
        }
        if (['wallet', 'wallet connect', 'connect wallet to claim', 'verify your wallet', 'wallet recovery', 'seed phrase', 'private key'].includes(q)) {
          const classify = (item) => {
            const text = `${String(item.name || '').toLowerCase()} ${String(item.slug || '').toLowerCase()} ${(item.sampleTitles || []).join(' ').toLowerCase()}`;
            if (/(mbc20|mbc-20)/.test(text)) return 4;
            if ((item.specializedEvidence || 0) > 0) return 3;
            if (String(item.trust?.riskLabel || '').includes('Severe') || String(item.trust?.riskLabel || '').includes('High')) return 2;
            return 1;
          };
          const bucketDiff = classify(b) - classify(a);
          if (bucketDiff) return bucketDiff;
        }
        return communitySearchRank(b, q) - communitySearchRank(a, q) || (b.matchedPostCount || 0) - (a.matchedPostCount || 0) || (b.postCount || 0) - (a.postCount || 0);
      })
      .slice(0, rowLimit);
  }

  const submolts = (intel.signals?.topSubmolts || intel.discovery?.submolts || []).filter((row) => {
    if (!q) return true;
    return `${row.name || ''} ${(row.sampleTitles || []).join(' ')}`.toLowerCase().includes(q);
  }).slice(0, tab === 'all' ? 6 : limit).map((row) => {
    const base = {
      slug: String(row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: row.name,
      title: row.name,
      description: row.sampleTitles?.[0] || 'A Moltbook group surfaced from active discussion coverage.',
      sampleTitles: row.sampleTitles || [],
      postCount: row.postCount || 0,
      source: 'submolt'
    };
    return {
      ...base,
      trust: scoreCommunityRisk(base)
    };
  });

  const groups = [...communities, ...submolts].filter((row, index, arr) => arr.findIndex((x) => x.slug === row.slug) === index).slice(0, tab === 'all' ? 6 : limit);

  res.json({
    phase: PHASE,
    ok: true,
    query: q,
    tab,
    results: {
      authors: tab === 'all' || tab === 'users' ? authors : [],
      topics: tab === 'all' || tab === 'topics' ? topics : [],
      communities: tab === 'all' || tab === 'groups' ? groups : [],
      submolts: []
    }
  });
});
app.get('/molt-live/community/:slug', async (req, res) => {
  const slug = String(req.params.slug || '');
  const community = await getCommunityBySlug(slug);
  if (!community) return res.status(404).json({ phase: PHASE, ok: false, error: 'community_not_found' });
  const storedTrust = community?.id ? await getEntityRiskScore('community', community.id).catch(() => null) : null;
  const computedTrust = scoreCommunityRisk({
    ...community,
    postCount: community.post_count,
    sampleTitles: community?.payload?.sampleTitles || []
  });
  res.json({ phase: PHASE, ok: true, community: { ...community, trust: storedTrust ? {
    riskScore: Number(storedTrust.risk_score || 0),
    riskLabel: storedTrust.risk_label || 'Low Risk',
    reasonShort: storedTrust.reason_short || 'low observed community risk so far',
    signalBreakdown: storedTrust.signal_breakdown || {},
    version: storedTrust.version || 'trust-v1'
  } : computedTrust } });
});
app.post('/moltbook/backfill/start', async (_req, res) => {
  const intel = await getMoltbookIntel();
  const docs = await buildSearchDocumentsFromState({
    authors: intel.authors || [],
    topics: intel.signals?.topicClusters || [],
    submolts: intel.signals?.topSubmolts || intel.discovery?.submolts || []
  });
  const job = await upsertIngestionJob({
    job_name: 'moltbook-full-backfill',
    status: 'queued',
    last_run_at: new Date().toISOString(),
    stats_json: { seededSearchDocuments: docs.length }
  });
  res.json({ phase: PHASE, ok: true, job, seededSearchDocuments: docs.length });
});
app.get('/moltbook/backfill/status', async (_req, res) => {
  const job = await getIngestionJob('moltbook-full-backfill');
  res.json({ phase: PHASE, ok: true, job });
});
app.get('/moltbook/ingest/status', async (req, res) => {
  const requested = String(req.query.job || req.query.name || 'expanded').trim().toLowerCase();
  const family = String(req.query.family || req.query.target || '').trim().toLowerCase();
  const allowlist = {
    expanded: 'moltbook-expanded-ingest',
    suspicious: 'moltbook-suspicious-ingest',
    rolling: 'moltbook-rolling-collector',
    full: 'moltbook-full-backfill'
  };
  const targetedFamilies = new Set(['wallet', 'claim', 'seed', 'exploit']);
  const targetedJobName = family && targetedFamilies.has(family)
    ? `moltbook-suspicious-targeted-${family}`
    : null;
  const jobName = targetedJobName
    || allowlist[requested]
    || (requested.startsWith('moltbook-suspicious-targeted-') ? requested : null)
    || (Object.values(allowlist).includes(requested) ? requested : null);
  if (!jobName) {
    return res.status(400).json({ phase: PHASE, ok: false, error: 'invalid_job_name' });
  }
  const job = await getIngestionJob(jobName);
  res.json({ phase: PHASE, ok: true, jobName, job });
});
app.post('/moltbook/reindex/search', async (_req, res) => {
  const intel = await getMoltbookIntel();
  const docs = await buildSearchDocumentsFromState({
    authors: intel.authors || [],
    topics: intel.signals?.topicClusters || [],
    submolts: intel.signals?.topSubmolts || intel.discovery?.submolts || []
  });
  res.json({ phase: PHASE, ok: true, indexed: docs.length });
});
app.post('/moltbook/collect/rolling', async (req, res) => {
  const perPage = Math.max(25, Math.min(Number(req.query.perPage) || 100, 200));
  const sample = await fetchCursorBackfillSample({ cursor: null, limit: perPage, steps: 1, delayMs: 0 });
  const posts = sample.posts || [];
  const authors = buildAuthorCoverage(posts);
  const communities = buildCommunityIndex(posts);
  const submolts = buildSubmoltIndex(posts);

  let upsertedAuthors = [];
  let upsertedPosts = [];
  let upsertedCommunities = [];
  let upsertedSubmolts = [];
  let searchDocs = [];

  if (isSupabaseStorageEnabled()) {
    upsertedAuthors = await upsertAuthors(authors.map((row) => ({
      authorId: row.authorId,
      authorName: row.authorName,
      description: row.description,
      isClaimed: row.isClaimed,
      isActive: row.isActive,
      karma: row.karma,
      postCount: row.observedPosts,
      totalComments: 0,
      totalScore: 0,
      signalScore: row.observedPosts,
      fitScore: row.observedPosts,
      reason: `Rolling collector coverage from stable new-feed sampling`,
    })));
    const authorIdMap = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row.id]));
    upsertedPosts = await upsertPosts(posts, authorIdMap);
    upsertedCommunities = await upsertCommunities(communities);
    upsertedSubmolts = await upsertSubmolts(submolts);
    searchDocs = await upsertSearchDocuments([
      ...upsertedAuthors.map((row) => ({ entity_type: 'author', entity_id: row.id, title: row.author_name, subtitle: row.label || 'author', body: row.description || row.reason || '', keywords: `${row.author_name} ${row.reason || ''}`, popularity_score: row.fit_score || 0, freshness_score: row.signal_score || 0, live_score: row.signal_score || 0 })),
      ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, title: row.name, subtitle: 'community', body: row.description || '', keywords: `${row.name} ${row.title || ''}`, popularity_score: row.post_count || 0, freshness_score: 0, live_score: 0 })),
      ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, title: row.name, subtitle: 'group', body: '', keywords: row.name, popularity_score: row.post_count || 0, freshness_score: row.avg_score_per_post || 0, live_score: 0 }))
    ]);
    await upsertEntityRiskScores([
      ...buildPersistableAuthorRiskRows({ posts, upsertedAuthors }),
      ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.title, description: row.description, postCount: row.post_count }) })),
      ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.name, description: '', postCount: row.post_count }) }))
    ]);
  }

  const job = await upsertIngestionJob({
    job_name: 'moltbook-rolling-collector',
    status: 'ok',
    cursor_json: { mode: 'rolling', perPage, nextCursor: sample.nextCursor || null, hasMore: !!sample.hasMore },
    last_run_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    stats_json: {
      sampledPosts: posts.length,
      authors: authors.length,
      communities: communities.length,
      submolts: submolts.length,
      indexed: searchDocs.length,
      cursorStats: sample.cursorStats || [],
      errors: sample.errors || []
    }
  });

  res.json({ phase: PHASE, ok: true, perPage, sampledPosts: posts.length, authors: authors.length, communities: communities.length, submolts: submolts.length, indexed: searchDocs.length, nextCursor: sample.nextCursor || null, hasMore: !!sample.hasMore, errors: sample.errors || [], job });
});
app.post('/moltbook/ingest/expanded', async (req, res) => {
  const mode = String(req.query.mode || 'cursor');
  const parseOptionalNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const pagesInput = parseOptionalNumber(req.query.pages);
  const perPageInput = parseOptionalNumber(req.query.perPage);
  const stepsInput = parseOptionalNumber(req.query.steps);
  const delayInput = parseOptionalNumber(req.query.delayMs);
  const suspiciousLikeMode = mode === 'suspicious' || mode === 'suspicious-targeted';
  const candidateMode = mode === 'suspicious-candidates';
  const actionProbeMode = mode === 'action-chain-probe';
  const targetFamily = suspiciousLikeMode ? String(req.query.family || req.query.target || '').trim().toLowerCase() || null : null;
  const defaultPerPage = candidateMode || actionProbeMode
    ? 100
    : suspiciousLikeMode ? (mode === 'suspicious-targeted' ? 100 : 25) : (mode === 'cursor' ? 50 : 100);
  const defaultSteps = candidateMode || actionProbeMode
    ? 20
    : suspiciousLikeMode ? (mode === 'suspicious-targeted' ? 20 : 1) : 5;
  const defaultDelayMs = (suspiciousLikeMode || candidateMode || actionProbeMode) ? 0 : 750;
  const pages = Math.max(1, Math.min(pagesInput ?? 3, 10));
  const perPage = Math.max(10, Math.min(perPageInput ?? defaultPerPage, 200));
  const steps = Math.max(1, Math.min(stepsInput ?? defaultSteps, 20));
  const delayMs = Math.max(0, Math.min(delayInput ?? defaultDelayMs, 5000));
  const targetedJobName = mode === 'suspicious-targeted' && targetFamily
    ? `moltbook-suspicious-targeted-${targetFamily}`
    : null;
  const jobName = mode === 'suspicious'
    ? 'moltbook-suspicious-ingest'
    : mode === 'suspicious-targeted'
      ? (targetedJobName || 'moltbook-suspicious-targeted')
      : mode === 'suspicious-candidates'
        ? 'moltbook-suspicious-candidates'
        : mode === 'action-chain-probe'
          ? 'moltbook-action-chain-probe'
          : 'moltbook-expanded-ingest';
  const savedJob = (mode === 'cursor' || suspiciousLikeMode || candidateMode || actionProbeMode) ? await getIngestionJob(jobName) : null;
  const savedCursor = savedJob?.cursor_json?.nextCursor || null;
  const hasExplicitCursorParam = Object.prototype.hasOwnProperty.call(req.query || {}, 'cursor');
  const rawCursor = hasExplicitCursorParam ? req.query.cursor : undefined;
  const cursor = hasExplicitCursorParam
    ? (rawCursor === '' || rawCursor === 'reset' ? null : String(rawCursor))
    : savedCursor;
  const phaseStartedAt = Date.now();
  const phaseTimings = [];
  const liveProbePhases = [];
  const markPhase = async (phase, extra = {}) => {
    phaseTimings.push({ phase, ms: Date.now() - phaseStartedAt, ...extra });
    if (!(suspiciousLikeMode || candidateMode || actionProbeMode)) return;
    await upsertIngestionJob({
      job_name: jobName,
      status: 'running',
      cursor_json: { mode, nextCursor: savedCursor || null, steps, perPage, hasMore: true },
      last_run_at: new Date().toISOString(),
      stats_json: {
        phase,
        phaseTimings,
        probePhases: liveProbePhases,
        pages,
        perPage,
        steps,
        delayMs,
        ...extra
      }
    }).catch(() => null);
  };
  const markProbePhase = async (phase, extra = {}) => {
    if (!(suspiciousLikeMode || candidateMode || actionProbeMode)) return;
    liveProbePhases.push({ phase, ms: Date.now() - phaseStartedAt, ...extra });
    await upsertIngestionJob({
      job_name: jobName,
      status: 'running',
      cursor_json: { mode, nextCursor: savedCursor || null, steps, perPage, hasMore: true },
      last_run_at: new Date().toISOString(),
      stats_json: {
        phase: 'inside_probe',
        probePhase: phase,
        phaseTimings,
        probePhases: liveProbePhases,
        pages,
        perPage,
        steps,
        delayMs,
        ...extra
      }
    }).catch(() => null);
  };

  await markPhase('start', { resumedFromSavedCursor: !!savedCursor });
  await markPhase('before_sample_fetch', { mode, cursor: cursor || null, perPage, steps, delayMs });

  const sample = mode === 'page'
    ? await fetchPaginatedUniverseSample({ pages, perPage })
    : candidateMode
      ? await fetchSuspiciousCandidateSample({ cursor, limit: perPage, steps, delayMs, onProgress: markProbePhase })
      : actionProbeMode
        ? await fetchActionChainProbeSample({ cursor, limit: perPage, steps, delayMs, onProgress: markProbePhase })
        : suspiciousLikeMode
          ? await fetchSuspiciousLanguageProbe({ cursor, limit: perPage, steps, delayMs, onProgress: markProbePhase, filterFamily: targetFamily })
          : await fetchCursorBackfillSample({ cursor, limit: perPage, steps, delayMs });

  await markPhase('before_sample_fetched_write', {
    sampledPosts: (sample.posts || []).length,
    suspiciousMatchedCount: sample.suspiciousMatchedCount || null,
    matchedPostPreview: sample.matchedPostPreview || null,
    firstCursorStat: sample.firstCursorStat || null,
    probePhases: sample.probePhases || null,
    familyCounts: sample.familyCounts || null,
    errors: sample.errors || [],
    nextCursor: sample.nextCursor || null,
    hasMore: !!sample.hasMore
  });

  await markPhase('sample_fetched', {
    sampledPosts: (sample.posts || []).length,
    suspiciousMatchedCount: sample.suspiciousMatchedCount || null,
    matchedPostPreview: sample.matchedPostPreview || null,
    firstCursorStat: sample.firstCursorStat || null,
    probePhases: sample.probePhases || null,
    familyCounts: sample.familyCounts || null,
    errors: sample.errors || [],
    nextCursor: sample.nextCursor || null,
    hasMore: !!sample.hasMore
  });

  await markPhase('after_sample_fetched_write', {
    sampledPosts: (sample.posts || []).length,
    suspiciousMatchedCount: sample.suspiciousMatchedCount || null,
    matchedPostPreview: sample.matchedPostPreview || null,
    familyCounts: sample.familyCounts || null
  });

  const posts = sample.posts || [];
  const authors = buildAuthorCoverage(posts);
  const communities = buildCommunityIndex(posts);
  const submolts = buildSubmoltIndex(posts);

  await markPhase('indexes_built', {
    sampledPosts: posts.length,
    authors: authors.length,
    communities: communities.length,
    submolts: submolts.length,
    familyCounts: sample.familyCounts || null
  });

  let upsertedAuthors = [];
  let upsertedPosts = [];
  let upsertedCommunities = [];
  let upsertedSubmolts = [];
  let searchDocs = [];

  if (isSupabaseStorageEnabled()) {
    upsertedAuthors = await upsertAuthors(authors.map((row) => ({
      authorId: row.authorId,
      authorName: row.authorName,
      description: row.description,
      isClaimed: row.isClaimed,
      isActive: row.isActive,
      karma: row.karma,
      postCount: row.observedPosts,
      totalComments: 0,
      totalScore: 0,
      signalScore: row.observedPosts,
      fitScore: row.observedPosts,
      reason: `Expanded coverage from public Moltbook sampling across ${row.surfaces.join(', ')}`,
    })));
    await markPhase('authors_upserted', { upsertedAuthors: upsertedAuthors.length });
    const authorIdMap = new Map(upsertedAuthors.map((row) => [String(row.source_author_id || ''), row.id]));
    upsertedPosts = await upsertPosts(posts, authorIdMap);
    await markPhase('posts_upserted', { upsertedPosts: upsertedPosts.length });
    upsertedCommunities = await upsertCommunities(communities);
    upsertedSubmolts = await upsertSubmolts(submolts);
    await markPhase('communities_submolts_upserted', { upsertedCommunities: upsertedCommunities.length, upsertedSubmolts: upsertedSubmolts.length });

    if (suspiciousLikeMode || candidateMode) {
      searchDocs = [];
    } else {
      searchDocs = await upsertSearchDocuments([
        ...upsertedAuthors.map((row) => ({ entity_type: 'author', entity_id: row.id, title: row.author_name, subtitle: row.label || 'author', body: row.description || row.reason || '', keywords: `${row.author_name} ${row.reason || ''}`, popularity_score: row.fit_score || 0, freshness_score: row.signal_score || 0, live_score: row.signal_score || 0 })),
        ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, title: row.name, subtitle: 'community', body: row.description || '', keywords: `${row.name} ${row.title || ''}`, popularity_score: row.post_count || 0, freshness_score: 0, live_score: 0 })),
        ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, title: row.name, subtitle: 'group', body: '', keywords: row.name, popularity_score: row.post_count || 0, freshness_score: row.avg_score_per_post || 0, live_score: 0 }))
      ]);
      await upsertEntityRiskScores([
        ...buildPersistableAuthorRiskRows({ posts, upsertedAuthors }),
        ...upsertedCommunities.map((row) => ({ entity_type: 'community', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.title, description: row.description, postCount: row.post_count }) })),
        ...upsertedSubmolts.map((row) => ({ entity_type: 'submolt', entity_id: row.id, ...scoreCommunityRisk({ name: row.name, title: row.name, description: '', postCount: row.post_count }) }))
      ]);
    }
  }

  const nextCursor = sample.nextCursor || null;
  const job = await upsertIngestionJob({
    job_name: jobName,
    status: 'ok',
    cursor_json: (mode === 'cursor' || suspiciousLikeMode || candidateMode || actionProbeMode) ? { mode, targetFamily, nextCursor, steps, perPage, hasMore: !!sample.hasMore } : { mode, pages, perPage },
    last_run_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    stats_json: {
      sampledPosts: posts.length,
      authors: authors.length,
      communities: communities.length,
      submolts: submolts.length,
      indexed: searchDocs.length,
      pageStats: sample.pageStats || [],
      cursorStats: sample.cursorStats || [],
      familyCounts: sample.familyCounts || null,
      cueCounts: sample.cueCounts || null,
      scoredCounts: sample.scoredCounts || null,
      matchedPostPreview: sample.matchedPostPreview || null,
      candidatePreview: sample.candidatePreview || null,
      matchPreview: sample.matchPreview || null,
      errors: sample.errors || []
    }
  });

  res.json({ phase: PHASE, ok: true, mode, targetFamily, pages, perPage, steps, delayMs, resumedFromSavedCursor: (mode === 'cursor' || suspiciousLikeMode || candidateMode || actionProbeMode) && !req.query.cursor && !!savedCursor, nextCursor, hasMore: !!sample.hasMore, sampledPosts: posts.length, candidateCount: sample.candidateCount || null, matchCount: sample.matchCount || null, authors: authors.length, communities: communities.length, submolts: submolts.length, indexed: searchDocs.length, pageStats: sample.pageStats || [], cursorStats: sample.cursorStats || [], familyCounts: sample.familyCounts || null, cueCounts: sample.cueCounts || null, scoredCounts: sample.scoredCounts || null, matchedPostPreview: sample.matchedPostPreview || [], candidatePreview: sample.candidatePreview || [], matchPreview: sample.matchPreview || [], errors: sample.errors || [], job });
});
app.get('/moltbook/export/authors.csv', async (_req, res) => { const intel = await getMoltbookIntel(); res.type('text/csv').send(authorsToCsv(intel.authors ?? [])); });
app.get('/moltbook/export/snapshots.csv', async (_req, res) => { const intel = await getMoltbookIntel(); res.type('text/csv').send(snapshotsToCsv(intel.snapshots ?? [])); });
app.get('/moltbook/export/report.json', async (_req, res) => { const intel = await getMoltbookIntel(); res.json({ phase: PHASE, intel, growth: buildGrowthMetrics(intel) }); });
app.get('/moltbook/scheduler', (_req, res) => res.json({ phase: PHASE, ...getSchedulerState() }));
app.get('/moltbook/storage/status', (_req, res) => res.json({ phase: PHASE, provider: 'supabase', enabled: isSupabaseStorageEnabled() }));
app.get('/moltbook/probe/fetch', async (req, res) => {
  const sort = String(req.query.sort || 'new');
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 25, 100));
  const timeoutMs = Math.max(250, Math.min(Number(req.query.timeoutMs) || 3500, 10000));
  const cursor = req.query.cursor ? String(req.query.cursor) : null;
  const params = new URLSearchParams({ sort, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const url = `${MOLTBOOK_BASE}?${params.toString()}`;
  const startedAt = Date.now();
  try {
    const payload = await fetchJson(url, timeoutMs);
    const posts = normalizePosts(payload);
    res.json({
      phase: PHASE,
      ok: true,
      started: true,
      timeoutHit: false,
      elapsedMs: Date.now() - startedAt,
      status: 'ok',
      sort,
      limit,
      timeoutMs,
      usedCursor: cursor,
      count: posts.length,
      nextCursor: payload?.next_cursor || null,
      hasMore: Boolean(payload?.has_more)
    });
  } catch (error) {
    const message = String(error?.message || error || 'unknown');
    const timeoutHit = /aborted|abort|timed out|timeout/i.test(message);
    res.status(timeoutHit ? 504 : 502).json({
      phase: PHASE,
      ok: false,
      started: true,
      timeoutHit,
      elapsedMs: Date.now() - startedAt,
      status: 'error',
      sort,
      limit,
      timeoutMs,
      usedCursor: cursor,
      error: message
    });
  }
});

app.get('/moltbook/storage/debug', async (_req, res) => {
  const intel = await getMoltbookIntel();
  res.json({
    phase: PHASE,
    provider: 'supabase',
    enabled: isSupabaseStorageEnabled(),
    lastFetchedAt: intel.lastFetchedAt,
    authorCount: intel.authorCount,
    postCount: intel.postCount,
    topicCount: intel?.signals?.topicClusters?.length || 0,
    submoltCount: intel?.discovery?.submolts?.length || intel?.signals?.topSubmolts?.length || 0
  });
});
app.post('/moltbook/scheduler/start', async (req, res) => { const everyMs = Number(req.query.everyMs || 15 * 60 * 1000); const state = startScheduler(runMoltbookRefreshJob, everyMs); res.json({ phase: PHASE, ok: true, ...state }); });
app.post('/moltbook/scheduler/stop', (_req, res) => { stopScheduler(); res.json({ phase: PHASE, ok: true, ...getSchedulerState() }); });
app.post('/moltbook/refresh', async (req, res) => {
  const mode = String(req.query.mode || 'default');
  const source = String(req.query.source || 'manual');
  res.json({ phase: PHASE, ...(await runMoltbookRefreshJob({ mode, source })) });
});
app.post('/waitlist', (req, res) => { const { email = '', name = '', useCase = '', source = 'site' } = req.body || {}; if (!String(email).includes('@')) return res.status(400).json({ ok: false, error: 'valid_email_required' }); appendJsonl(WAITLIST_FILE, { createdAt: new Date().toISOString(), email: String(email).trim(), name: String(name).trim(), useCase: String(useCase).trim(), source }); res.json({ ok: true }); });
app.post('/topic-interest', (req, res) => { const { email = '', topics = [], note = '', source = 'site' } = req.body || {}; appendJsonl(INTEREST_FILE, { createdAt: new Date().toISOString(), email: String(email).trim(), topics: Array.isArray(topics) ? topics.map((x) => String(x)) : [], note: String(note).trim(), source }); res.json({ ok: true }); });
app.post('/analytics/event', (req, res) => { const { event = 'unknown', meta = {} } = req.body || {}; appendJsonl(ANALYTICS_FILE, { createdAt: new Date().toISOString(), event: String(event), meta }); res.json({ ok: true }); });
app.get('/analytics/pixel', (req, res) => {
  const event = String(req.query?.event || 'unknown');
  let meta = {};
  try { meta = req.query?.meta ? JSON.parse(String(req.query.meta)) : {}; } catch {}
  appendJsonl(ANALYTICS_FILE, { createdAt: new Date().toISOString(), event, meta });
  res.status(204).end();
});
app.get('/analytics/summary', (req, res) => {
  const rows = readJsonl(ANALYTICS_FILE);
  const windowValue = String(req.query?.window || 'all');
  res.json({ ok: true, ...buildAnalyticsSummary(rows, windowValue) });
});
app.get('/hook', async (_req, res) => res.json(await getNextAgentHook()));
app.get('/preload', async (req, res) => { const requested = Number.parseInt(req.query.count, 10); const count = Number.isFinite(requested) && requested > 0 ? Math.min(requested, DEFAULT_PRELOAD_COUNT) : DEFAULT_PRELOAD_COUNT; res.json({ phase: PHASE, count, hooks: await getNextAgentHooks(count) }); });
app.get('/response', (req, res) => { const agentId = String(req.query.agentId || 'ego-destroyer'); const userText = String(req.query.userText || ''); const response = getResponse(agentId, userText); res.json({ phase: PHASE, agentId, userText, response: { type: 'response', agentId, text: response.text, validation: response.validation } }); });
app.get('/live/enabled', (_req, res) => res.json({ phase: PHASE, enabled: liveSessionsEnabled() }));
app.get('/credits/enabled', (_req, res) => res.json({ phase: PHASE, enabled: creditsEnabled() }));
app.get('/wallet', async (req, res) => {
  const userId = String(req.query.userId || 'demo-user');
  const wallet = await getWallet(userId);
  const transactions = await listCreditTransactions(userId);
  res.json({ phase: PHASE, ok: true, wallet, transactions, spendRules: getSpendRules() });
});
app.get('/credits/products', async (_req, res) => {
  await ensureCreditProducts();
  res.json({ phase: PHASE, ok: true, products: await listCreditProducts() });
});
app.post('/credits/checkout', async (req, res) => {
  const { productCode, userId = 'demo-user' } = req.body || {};
  res.json({ phase: PHASE, ...(await createCheckoutSession({ productCode, userId })) });
});
app.post('/credits/grant', async (req, res) => {
  const { userId = 'demo-user', amount = 25, reason = 'manual-grant', sessionId = null } = req.body || {};
  res.json({ phase: PHASE, ok: true, ...(await grantCredits({ userId, amount, reason, sessionId })) });
});
app.post('/credits/unlock-ai-chat', async (req, res) => {
  const { userId = 'demo-user' } = req.body || {};
  if (String(userId) === 'demo-user') {
    return res.status(403).json({ phase: PHASE, ok: false, error: 'premium_demo_disabled', message: 'Premium AI unlock requires a real paid account.' });
  }
  const result = await spendCredits({ userId, sessionId: null, actionCode: 'chat_unlock' });
  if (!result.ok) return res.status(400).json({ phase: PHASE, ...result });
  res.json({ phase: PHASE, ...result });
});
app.post('/live/session/create', async (req, res) => {
  const { agentName = 'Agent', agentAuthorId = null, entrySource = 'direct', mode = 'free', ttsEnabled = true, transcriptEnabled = true } = req.body || {};
  const created = await createLiveSession({ agentName, agentAuthorId, entrySource, mode, ttsEnabled, transcriptEnabled });
  res.json({ phase: PHASE, ok: true, ...created });
});
app.get('/live/session/:id', async (req, res) => res.json({ phase: PHASE, ok: true, ...(await getLiveSession(req.params.id)) }));
app.post('/live/session/:id/message', async (req, res) => {
  const sessionId = req.params.id;
  const text = String(req.body?.text || '').trim();
  const state = await getLiveSession(sessionId);
  const transcript = await listTranscript(sessionId);
  const agentName = state?.session?.agent_name || 'Agent';
  const mode = String(state?.session?.mode || '').toLowerCase();
  const userMessage = await addLiveMessage(sessionId, { role: 'user', messageType: 'typed', text });

  if (mode === 'chat') {
    return res.json({
      phase: PHASE,
      ok: true,
      userMessage,
      agentReply: null,
      humanChatDefault: true,
      waitingForPeer: true,
    });
  }

  const agentText = await createOpenAiChatCompletion({ agentName, userText: text, transcript });
  const agentReply = await addLiveMessage(sessionId, {
    role: 'agent',
    messageType: 'tts-text',
    text: agentText,
    meta: { generated: true, provider: 'openai', model: OPENAI_MODEL }
  });
  res.json({ phase: PHASE, ok: true, userMessage, agentReply });
});

app.post('/live/session/:id/message/attachment', async (req, res) => {
  const sessionId = req.params.id;
  const attachment = req.body?.attachment || null;
  const text = String(req.body?.text || '').trim();
  if (!attachment?.name || !attachment?.dataUrl) {
    return res.status(400).json({ phase: PHASE, ok: false, error: 'attachment_required' });
  }
  const userMessage = await addLiveMessage(sessionId, {
    role: 'user',
    messageType: 'attachment',
    text,
    meta: {
      attachment: {
        name: String(attachment.name || 'file'),
        type: String(attachment.type || 'application/octet-stream'),
        size: Number(attachment.size || 0),
        dataUrl: String(attachment.dataUrl || '')
      }
    }
  });
  res.json({ phase: PHASE, ok: true, userMessage });
});

app.post('/live/session/:id/message/stream', async (req, res) => {
  const sessionId = req.params.id;
  const text = String(req.body?.text || '').trim();
  const state = await getLiveSession(sessionId);
  const transcript = await listTranscript(sessionId);
  const agentName = state?.session?.agent_name || 'Agent';
  const mode = String(state?.session?.mode || '').toLowerCase();
  const userMessage = await addLiveMessage(sessionId, { role: 'user', messageType: 'typed', text });

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('user', { userMessage });

  if (mode === 'chat') {
    sendEvent('waiting', {
      humanChatDefault: true,
      waitingForPeer: true,
      text: 'Your message was sent. Human chat is the default here, so this session is waiting for another person to join.'
    });
    sendEvent('done', { userMessage, agentReply: null, humanChatDefault: true, waitingForPeer: true });
    return res.end();
  }

  if (mode === 'chat-ai') {
    sendEvent('waiting', {
      premiumLocked: true,
      text: 'Premium AI requires verified paid entitlement before chat can start.'
    });
    sendEvent('done', { userMessage, agentReply: null, premiumLocked: true, error: 'premium_entitlement_required' });
    return res.end();
  }

  const agentText = await createOpenAiChatCompletion({ agentName, userText: text, transcript });
  const words = agentText.split(/(\s+)/).filter(Boolean);
  let built = '';
  for (const word of words) {
    built += word;
    sendEvent('chunk', { text: built });
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  const agentReply = await addLiveMessage(sessionId, {
    role: 'agent',
    messageType: 'tts-text',
    text: agentText,
    meta: { generated: true, streamed: true, provider: 'openai', model: OPENAI_MODEL }
  });

  sendEvent('done', { userMessage, agentReply });
  res.end();
});
app.post('/live/session/:id/presence', async (req, res) => res.json({ phase: PHASE, ok: true, presence: await updateLivePresence(req.params.id, req.body || {}) }));
app.post('/live/session/:id/end', async (req, res) => res.json({ phase: PHASE, ok: true, session: await endLiveSession(req.params.id) }));
app.post('/live/session/:id/spend', async (req, res) => {
  const { actionCode, userId = 'demo-user' } = req.body || {};
  if (String(userId) === 'demo-user' && actionCode === 'chat_unlock') {
    return res.status(403).json({ phase: PHASE, ok: false, error: 'premium_demo_disabled', message: 'Premium AI unlock requires a real paid account.' });
  }
  const result = await spendCredits({ userId, sessionId: req.params.id, actionCode });
  if (!result.ok) return res.status(400).json({ phase: PHASE, ...result });
  await addLiveMessage(req.params.id, {
    role: 'system',
    messageType: 'credit-event',
    text: result.launchFree ? `${actionCode} unlocked free during launch. Credits are not required right now.` : `${actionCode} unlocked for ${result.cost} credits. Balance is now ${result.balance}.`,
    meta: { actionCode, cost: result.cost, balance: result.balance, launchFree: !!result.launchFree, normalCost: result.normalCost || result.cost }
  });
  res.json({ phase: PHASE, ...result });
});
app.get('/live/session/:id/transcript', async (req, res) => res.json({ phase: PHASE, ok: true, messages: await listTranscript(req.params.id) }));
app.get('/live/session/:id/export', async (req, res) => {
  const format = String(req.query?.format || 'txt').toLowerCase();
  const text = await exportTranscriptText(req.params.id);
  const sessionId = req.params.id;

  if (format === 'html') {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>molt-live-${sessionId}</title><style>body{font-family:Arial,sans-serif;padding:32px;line-height:1.6;color:#1b1917}h1{margin:0 0 8px}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>Molt Live Transcript</h1><p>Session: ${sessionId}</p><pre>${String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre></body></html>`;
    res.setHeader('Content-Disposition', `attachment; filename="molt-live-${sessionId}.html"`);
    return res.type('text/html').send(html);
  }

  if (format === 'doc') {
    const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"><title>molt-live-${sessionId}</title></head><body><h1>Molt Live Transcript</h1><p>Session: ${sessionId}</p><pre>${String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre></body></html>`;
    res.setHeader('Content-Disposition', `attachment; filename="molt-live-${sessionId}.doc"`);
    return res.type('application/msword').send(htmlDoc);
  }

  res.setHeader('Content-Disposition', `attachment; filename="molt-live-${sessionId}.txt"`);
  res.type('text/plain').send(text);
});

export default app;
