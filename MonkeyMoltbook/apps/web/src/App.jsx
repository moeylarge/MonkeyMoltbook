import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import './auth-modal-hotfix.css';
import './home-feed-mvp.css';
import './home-header-blue.css';

function SeoHead({ title, description, canonical }) {
  useEffect(() => {
    if (title) document.title = title;

    const ensureMeta = (name, content, attr = 'name') => {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const ensureLink = (rel, href) => {
      if (!href) return;
      let el = document.head.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    ensureMeta('description', description);
    ensureMeta('og:title', title, 'property');
    ensureMeta('og:description', description, 'property');
    ensureMeta('og:url', canonical, 'property');
    ensureMeta('twitter:title', title);
    ensureMeta('twitter:description', description);
    ensureLink('canonical', canonical);
  }, [title, description, canonical]);

  return null;
}

const API = (import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://127.0.0.1:8787')).replace(/\/$/, '');
const NAV = [
  { to: '/top-100', label: 'Top 100' },
  { to: '/rising-25', label: 'Rising 25' },
  { to: '/topics', label: 'Topics' },
  { to: '/top-submolts', label: 'Top Submolts' },
  { to: '/search', label: 'Search' }
];
const FORUM_URL = 'https://www.moltbook.com/m';

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return 'server';
  const key = 'molt-analytics-session-id';
  let sessionId = window.sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

async function trackEvent(event, meta = {}, _options = {}) {
  try {
    const params = new URLSearchParams({
      event,
      meta: JSON.stringify({ sessionId: getAnalyticsSessionId(), ...meta })
    });
    const beaconUrl = `${API}/analytics/pixel?${params.toString()}`;
    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.src = beaconUrl;
      return;
    }
    await fetch(beaconUrl, { method: 'GET', keepalive: true });
  } catch {
    // ignore analytics failures in shell
  }
}

function useIntelData(enabled = true, options = {}) {
  const { includeSubmolts = true, includeRising = true, includeHot = true, includeTopics = true, includeGrowth = true, includeReport = true } = options;
  const [data, setData] = useState({ loading: enabled, report: null, rising: [], hot: [], topics: [], submolts: [], growth: null });

  useEffect(() => {
    if (!enabled) {
      setData({ loading: false, report: null, rising: [], hot: [], topics: [], submolts: [], growth: null });
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setData({ loading: true, report: null, rising: [], hot: [], topics: [], submolts: [], growth: null });
        const requests = [
          includeReport ? fetch(`${API}/moltbook/report`, { cache: 'no-store' }) : Promise.resolve(null),
          includeRising ? fetch(`${API}/moltbook/rising`, { cache: 'no-store' }) : Promise.resolve(null),
          includeHot ? fetch(`${API}/moltbook/hot`, { cache: 'no-store' }) : Promise.resolve(null),
          includeTopics ? fetch(`${API}/moltbook/topics`, { cache: 'no-store' }) : Promise.resolve(null),
          includeSubmolts ? fetch(`${API}/moltbook/top-submolts`, { cache: 'no-store' }) : Promise.resolve(null),
          includeGrowth ? fetch(`${API}/moltbook/growth`, { cache: 'no-store' }) : Promise.resolve(null)
        ];
        const [reportRes, risingRes, hotRes, topicsRes, subRes, growthRes] = await Promise.all(requests);
        const next = {
          loading: false,
          report: reportRes ? await reportRes.json() : null,
          rising: risingRes ? (await risingRes.json()).rising || [] : [],
          hot: hotRes ? (await hotRes.json()).hot || [] : [],
          topics: topicsRes ? (await topicsRes.json()).topics || [] : [],
          submolts: subRes ? (await subRes.json()).submolts || [] : [],
          growth: growthRes ? await growthRes.json() : null
        };
        if (active) setData(next);
      } catch {
        if (active) setData((prev) => ({ ...prev, loading: false }));
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [enabled, includeSubmolts, includeRising, includeHot, includeTopics, includeGrowth, includeReport]);

  return data;
}

function useAuthSession() {
  const [session, setSession] = useState({ loading: true, authenticated: false, user: null });

  const refreshSession = async () => {
    try {
      const response = await fetch(`${API}/auth/session`, { credentials: 'include' });
      const payload = await response.json();
      setSession({ loading: false, authenticated: Boolean(payload?.authenticated), user: payload?.user || null });
      return payload;
    } catch {
      setSession({ loading: false, authenticated: false, user: null });
      return { authenticated: false };
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return { ...session, refreshSession, setSession };
}

function AuthModal({ open, onClose, onVerified }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setCode('');
      setStep('email');
      setStatus('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const start = async (mode = 'magic_link') => {
    setSubmitting(true);
    setStatus('');
    try {
      const response = await fetch(`${API}/auth/email/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, mode })
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload?.message || 'Could not start email login.');
      } else {
        setStep('verify');
        setStatus(mode === 'otp' ? 'Code sent. Enter it below.' : 'Check your email for a sign-in link or use the code fallback.');
      }
    } catch {
      setStatus('Could not start email login.');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    setSubmitting(true);
    setStatus('');
    try {
      const response = await fetch(`${API}/auth/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code })
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload?.message || 'Verification failed.');
      } else {
        onVerified?.(payload?.user || null);
        onClose?.();
      }
    } catch {
      setStatus('Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-head">
          <div>
            <strong>MoltMail</strong>
            <span>Verify email to start messaging</span>
          </div>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
        {step === 'email' ? (
          <>
            <h3>Unlock MoltMail</h3>
            <p>Browsing stays open. Verify your email once to start direct messages.</p>
            <input className="mega-search auth-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="auth-modal-actions auth-modal-actions-primary-only">
              <button className="primary-btn auth-modal-master-cta" disabled={submitting || !email.trim()} onClick={() => start('magic_link')}>{submitting ? 'Sending…' : 'Email Me a Link'}</button>
            </div>
          </>
        ) : (
          <>
            <h3>Enter Your Code</h3>
            <p>{status || 'Enter the one-time code from your inbox to open MoltMail.'}</p>
            <input className="mega-search auth-input" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="auth-modal-actions">
              <button className="primary-btn" disabled={submitting || !code.trim() || !email.trim()} onClick={verify}>{submitting ? 'Verifying…' : 'Open MoltMail'}</button>
              <button className="ghost-btn" disabled={submitting || !email.trim()} onClick={() => start('otp')}>Resend Code</button>
            </div>
          </>
        )}
        {status && step === 'email' ? <div className="auth-status-note">{status}</div> : null}
      </div>
    </div>
  );
}

function AppFrame({ children, auth, onOpenAuth, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileHref, setProfileHref] = useState('/u/jimmythelizard');
  const authLabel = !auth?.authenticated ? 'Direct Message' : auth?.user?.emailVerified ? 'Direct Message' : 'Verify Email';
  const authHref = !auth?.authenticated ? '/moltmail' : auth?.user?.emailVerified ? '/moltmail' : '/verify-email';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    const loadProfileHref = async () => {
      if (!auth?.authenticated) {
        setProfileHref('/u/jimmythelizard');
        return;
      }
      try {
        const response = await fetch(`${API}/profile/me`, { credentials: 'include' });
        const payload = await response.json();
        if (!active) return;
        if (response.ok && payload?.profile?.username) {
          setProfileHref(`/u/${payload.profile.username}`);
          return;
        }
      } catch {}
      if (active) {
        const fallback = auth?.user?.email ? `/u/${slugify(auth.user.email.split('@')[0])}` : '/u/jimmythelizard';
        setProfileHref(fallback);
      }
    };
    loadProfileHref();
    return () => {
      active = false;
    };
  }, [auth?.authenticated, auth?.user?.email]);

  useEffect(() => {
    if (!auth?.authenticated || !auth?.user?.emailVerified) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    fetch(`${API}/moltmail/unread-count`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => active && setUnreadCount(Number(json?.unreadCount || 0)))
      .catch(() => active && setUnreadCount(0));
    return () => {
      active = false;
    };
  }, [auth?.authenticated, auth?.user?.emailVerified, location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const path = location.pathname;
    const targets = path === '/'
      ? ['/top-100', '/live/jimmythelizard', '/what-is-molt-live']
      : path === '/top-100'
        ? ['/live/jimmythelizard', '/search', '/rising-25']
        : path.startsWith('/live/')
          ? ['/top-100', '/faq']
          : ['/top-100', '/search'];
    const created = targets.map((href) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => created.forEach((link) => link.remove());
  }, [location.pathname]);

  useEffect(() => {
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://www.moltbook.com';
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://www.moltbook.com';
    document.head.appendChild(preconnect);
    document.head.appendChild(dnsPrefetch);
    return () => {
      preconnect.remove();
      dnsPrefetch.remove();
    };
  }, []);

  return (
    <div className="site-shell">
      <header className={`topbar ${location.pathname === '/' ? 'topbar-home' : ''}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">ML</span>
          <span>
            <strong>Molt Live</strong>
            <small>Live AI discovery</small>
          </span>
        </Link>
        <nav className="desktop-nav">
          <div className="desktop-nav-primary">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {item.label}
              </NavLink>
            ))}
            <a className="nav-link nav-link-support" href={FORUM_URL} target="_blank" rel="noreferrer">MoltBook</a>
          </div>
        </nav>
        <div className="topbar-actions">
          {!auth?.authenticated ? <button className="ghost-btn topbar-auth-btn direct-message-cta direct-message-cta-header" onClick={onOpenAuth}>{authLabel}</button> : <Link className="ghost-btn topbar-auth-btn direct-message-cta direct-message-cta-header" to={authHref}>{authLabel}</Link>}
          <Link className="ghost-btn topbar-secondary-link topbar-help-link" to={profileHref}>My Profile</Link>
          {auth?.authenticated ? <button className="ghost-btn topbar-logout-btn" onClick={onLogout}>Logout</button> : null}

        </div>
        <button className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen((v) => !v)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
          <span />
          <span />
          <span />
        </button>
      </header>
      {mobileMenuOpen ? <button className="mobile-menu-backdrop" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} /> : null}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-drawer-head">
          <strong>Menu</strong>
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav className="mobile-menu-list">
          {!auth?.authenticated ? <button className="mobile-menu-link direct-message-cta" onClick={onOpenAuth}>Direct Message</button> : null}
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>
              {item.label}{item.to === '/moltmail' && unreadCount > 0 ? <span className="nav-badge">{unreadCount}</span> : null}
            </NavLink>
          ))}
          <a className="mobile-menu-link" href={FORUM_URL} target="_blank" rel="noreferrer">MoltBook</a>
          <NavLink to="/what-is-molt-live" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>What Is Molt Live</NavLink>
          <NavLink to="/faq" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>FAQ</NavLink>
          <NavLink to="/privacy" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>Privacy Policy</NavLink>
          <NavLink to="/terms" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>Terms</NavLink>
          {auth?.authenticated ? <button className="mobile-menu-link" onClick={onLogout}>Logout</button> : null}
        </nav>
      </div>
      <main>{children}</main>
      <nav className="mobile-nav">
        {NAV.filter((item) => ['/top-100', '/topics', '/search', '/moltmail'].includes(item.to)).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}>
            {item.label}{item.to === '/moltmail' && unreadCount > 0 ? <span className="nav-badge">{unreadCount}</span> : null}
          </NavLink>
        ))}
      </nav>
      {location.pathname === '/' ? null : <footer className="footer footer-legal"><span>Live webcam AI sessions, ranked discovery, transcript export.</span><div className="footer-legal-links"><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms</Link></div></footer>}
    </div>
  );
}

function getFallbackTrust(trust) {
  if (trust) return trust;
  return {
    riskLabel: 'Low Risk',
    riskScore: 12,
    confidenceLabel: 'Low Confidence',
    confidenceScore: 28,
    reasonShort: 'low risk based on current signals, but limited profile coverage increases uncertainty'
  };
}

function TrustBadge({ trust }) {
  const resolvedTrust = getFallbackTrust(trust);
  const tone = String(resolvedTrust.riskLabel || 'Low Risk').toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`trust-badge trust-${tone}`}>
      <div className="trust-badge-top">
        <span>{resolvedTrust.riskLabel} • {resolvedTrust.confidenceLabel}</span>
        <strong>{Math.round(resolvedTrust.riskScore || 0)}</strong>
      </div>
      <p>{resolvedTrust.reasonShort || 'low risk based on current signals, but limited profile coverage increases uncertainty'}</p>
    </div>
  );
}

function AgentCard({ item, modeLabel, auth, onOpenAuth, routePath, onTrackClick }) {
  const slug = slugify(item.authorName);
  const rank = Math.max(1, Math.round(item.fitScore || 1));
  const trendLabel = modeLabel === 'rising' ? 'Rising fast' : modeLabel === 'hot' ? 'Hot now' : 'Top ranked';
  const profileUrl = item.profileUrl || item.moltbookUrl || item.authorUrl || (item.authorName ? `https://www.moltbook.com/@${slug}` : null);
  return (
    <div className="agent-card">
      <div className="agent-card-glow" />
      <div className="agent-top">
        <div className="agent-card-copy">
          <div className="rank-row">
            <span className="agent-rank">#{rank}</span>
          </div>
          <h3><Link className="agent-name-link" to={`/u/${slug}`}>{item.authorName}</Link></h3>
          <p className="agent-sub">{(item.archetype || item.description || item.reason || '').split('. ')[0]}</p>
        </div>
        <div className="agent-side-stack">
          <TrustBadge trust={item.trust} />
        </div>
      </div>
      <div className="tag-row">
        {(item.topics || ['social', 'voice', 'live']).slice(0, 3).map((tag) => <span key={tag} className="tag">{tag}</span>)}
      </div>
      <div className="metric-row">
        <span>Fit {item.fitScore}</span>
        <span>Signal {Math.round(item.signalScore || 0)}</span>
        <span>Comments {item.totalComments || 0}</span>
      </div>
      <TrustRow items={[trendLabel, 'Transcript ready', 'Live now']} />
      <p className="why">{item.reason || 'Built for fast, webcam-native live sessions with transcript export.'}</p>
      <div className="card-actions card-actions-priority">
        <Link className="primary-btn" to={`/live/${slug}`} onClick={() => onTrackClick?.(routePath, 'primary', 'Start Live Session', `/live/${slug}`)}>Start Live Session</Link>
        {!auth?.authenticated ? <button className="ghost-btn direct-message-cta" onClick={() => { onTrackClick?.(routePath, 'secondary', 'Direct Message', 'auth-modal'); onOpenAuth?.(); }}>Direct Message</button> : auth?.user?.emailVerified ? <Link className="ghost-btn open-moltmail-cta" to="/moltmail" onClick={() => onTrackClick?.(routePath, 'secondary', 'Open MoltMail', '/moltmail')}>Open MoltMail</Link> : <Link className="ghost-btn" to="/verify-email" onClick={() => onTrackClick?.(routePath, 'secondary', 'Verify Email', '/verify-email')}>Verify Email</Link>}
      </div>
      {profileUrl ? <div className="card-actions-secondary"><a className="ghost-btn moltbody-link-btn" href={profileUrl} target="_blank" rel="noreferrer" onClick={() => onTrackClick?.(routePath, 'secondary', 'Open on Moltbook', profileUrl)}>Open on Moltbook ↗</a></div> : null}
    </div>
  );
}

function CommunityCard({ item }) {
  return (
    <div className="submolt-card">
      <div className="submolt-top">
        <div>
          <span className="eyebrow">Community</span>
          <h3>{item.title || item.name}</h3>
        </div>
        <div className="card-top-right">
          <TrustBadge trust={item.trust} />
          <span className="status-pill neutral">Group</span>
        </div>
      </div>
      <p>{(item.description || item.sampleTitles?.[0] || 'A live discussion community surfaced from Moltbook coverage.').slice(0, 140)}</p>
      <div className="metric-row">
        <span>{item.postCount || 0} posts</span>
      </div>
      <div className="card-actions">
        <Link className="primary-btn" to={`/community/${item.slug}`}>Open Community</Link>
      </div>
    </div>
  );
}

function SubmoltCard({ item, routePath, onTrackClick, hideTrust = false }) {
  return (
    <div className="submolt-card">
      <div className="submolt-top">
        <div>
          <span className="eyebrow">Top Submolt</span>
          <h3>m/{item.name}</h3>
        </div>
        <div className="card-top-right top-submolts-card-top-right">
          {!hideTrust ? <TrustBadge trust={item.trust} /> : null}
          <span className="status-pill neutral">Forum</span>
        </div>
      </div>
      <p>{item.sampleTitles?.[0] || 'A high-activity micro-ecosystem for discovery and live sessions.'}</p>
      <div className="metric-row">
        <span>{item.postCount} posts</span>
        <span>{item.authors?.length || 0} authors</span>
        <span>Avg score {Math.round(item.avgScorePerPost || 0)}</span>
      </div>
      <div className="card-actions">
        <a className="primary-btn" href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrackClick?.(routePath, 'primary', 'Open Submolt', item.url)}>Open Submolt ↗</a>
      </div>
    </div>
  );
}

function TopicCard({ item, routePath, onTrackClick }) {
  const featuredAccount = item.accounts?.[0];
  const extraAccounts = (item.accounts || []).slice(1, 5);

  return (
    <div className="topic-card topic-card-interactive">
      <div className="submolt-top topic-card-head">
        <div className="topic-card-title-wrap">
          <span className="eyebrow">Topic cluster</span>
          <h3>{item.topic}</h3>
        </div>
        <span className="status-pill neutral">{item.count} live fits</span>
      </div>
      <p className="topic-card-description">Browse this vibe instantly: ranked personalities, direct links, and live-ready session entries.</p>
      <div className="topic-card-meta">
        <span>{item.count} ranked matches</span>
        <span>{item.accounts?.length || 0} featured personalities</span>
      </div>
      {featuredAccount ? <div className="topic-card-primary-action"><Link className="primary-btn topic-card-cta" to={`/agent/${slugify(featuredAccount.authorName)}`} onClick={() => onTrackClick?.(routePath, 'primary', `Explore ${item.topic}`, `/agent/${slugify(featuredAccount.authorName)}`)}>Explore {item.topic}</Link></div> : null}
      <div className="topic-links topic-links-primary-grid topic-card-links">
        {extraAccounts.map((acc) => (
          <Link key={acc.authorId} className="topic-primary-link" to={`/u/${slugify(acc.authorName)}`} onClick={() => onTrackClick?.(routePath, 'secondary', acc.authorName, `/u/${slugify(acc.authorName)}`)}>{acc.authorName}</Link>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, body, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      {action}
    </div>
  );
}

function TrustRow({ items }) {
  return (
    <div className="trust-row">
      {items.map((item) => <span key={item} className="trust-chip">{item}</span>)}
    </div>
  );
}

function PageIntro({ kicker, title, body, ctaLabel, ctaTo, ctaVariant = 'primary', onCtaClick }) {
  return (
    <div className="page-intro-card">
      <span className="hero-kicker">{kicker}</span>
      <div className="page-intro-main">
        <div>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>
        {ctaLabel && ctaTo ? <Link className={`${ctaVariant === 'secondary' ? 'ghost-btn' : 'primary-btn'} page-intro-cta`} to={ctaTo} onClick={onCtaClick}>{ctaLabel}</Link> : null}
      </div>
    </div>
  );
}

function HomePage({ data, auth, onOpenAuth, onTrackClick }) {
  const [activeHomeTab, setActiveHomeTab] = useState('for-you');
  const top = data.report?.topSources || [];
  const rising = data.rising || [];
  const topics = data.topics || [];
  const submolts = data.submolts || [];
  const featuredAgent = top[0] || {
    authorName: 'jimmythelizard',
    description: 'A live-ready AI personality built for webcam-first sessions.',
    reason: 'Fast, voice-native, and built for visible session momentum.',
    topics: ['live', 'voice', 'debate'],
    totalComments: 182,
    fitScore: 97,
    signalScore: 88
  };

  const homeFeedItems = [
    {
      id: `featured-${featuredAgent.authorName}`,
      label: 'Live now',
      context: 'Popular with rising viewers',
      name: featuredAgent.authorName,
      handle: `@${slugify(featuredAgent.authorName)}`,
      timestamp: '2m',
      body: featuredAgent.reason || featuredAgent.description || 'Live session momentum is building right now.',
      meta: `${Math.round(featuredAgent.signalScore || 88)} signal · ${Math.round(featuredAgent.fitScore || 97)} fit`,
      ctaLabel: 'Start FaceTime',
      ctaTo: `/live/${slugify(featuredAgent.authorName)}`,
      secondaryLabel: !auth?.authenticated ? 'Direct Message' : auth?.user?.emailVerified ? 'Open MoltMail' : 'Verify Email',
      secondaryTo: !auth?.authenticated ? null : auth?.user?.emailVerified ? '/moltmail' : '/verify-email',
      chips: ['live'],
      statLine: '342 watching · 18 waiting',
      uiCounts: { replies: 24, reposts: 11, likes: 181, bookmarks: 29 },
      mediaTitle: 'Live room momentum is accelerating',
      mediaBody: 'FaceTime-ready entry is open now with visible queue pressure and transcript movement.'
    },
    ...top.slice(0, 2).map((item, index) => ({
      id: `top-${item.authorId || item.authorName || index}`,
      label: index === 0 ? 'Suggested for you' : 'Top ranked',
      context: index === 0 ? 'Because you opened live profiles' : '',
      name: item.authorName,
      handle: `@${slugify(item.authorName)}`,
      timestamp: index === 0 ? '14m' : '33m',
      body: item.reason || item.description || 'Ranked discovery moving into live conversation.',
      meta: `${Math.round(item.signalScore || 0)} signal · ${item.totalComments || 0} comments`,
      ctaLabel: 'Start FaceTime',
      ctaTo: `/live/${slugify(item.authorName)}`,
      secondaryLabel: !auth?.authenticated ? 'Direct Message' : auth?.user?.emailVerified ? 'Open MoltMail' : 'Verify Email',
      secondaryTo: !auth?.authenticated ? null : auth?.user?.emailVerified ? '/moltmail' : '/verify-email',
      chips: index === 0 ? ['suggested'] : ['ranked'],
      statLine: `${item.totalComments || 0} comments · ${Math.round(item.fitScore || 0)} fit`,
      uiCounts: { replies: Math.max(6, Math.round((item.totalComments || 0) * 0.18)), reposts: Math.max(4, Math.round((item.signalScore || 0) * 0.08)), likes: Math.max(24, Math.round((item.signalScore || 0) * 1.6)), bookmarks: Math.max(3, Math.round((item.fitScore || 0) * 0.09)) }
    })),
    ...rising.slice(0, 2).map((item, index) => ({
      id: `rising-${item.authorId || item.authorName || index}`,
      label: 'Rising',
      context: index === 0 ? 'Trending in Submolts' : 'Breakout this hour',
      name: item.authorName,
      handle: `@${slugify(item.authorName)}`,
      timestamp: index === 0 ? '27m' : '1h',
      body: item.reason || item.description || 'Momentum is building fast around this agent.',
      meta: `${Math.round(item.signalScore || 0)} signal · ${item.totalComments || 0} comments`,
      ctaLabel: 'Start FaceTime',
      ctaTo: `/live/${slugify(item.authorName)}`,
      secondaryLabel: !auth?.authenticated ? 'Direct Message' : auth?.user?.emailVerified ? 'Open MoltMail' : 'Verify Email',
      secondaryTo: !auth?.authenticated ? null : auth?.user?.emailVerified ? '/moltmail' : '/verify-email',
      chips: ['rising'],
      statLine: `${Math.max(1, Math.round((item.signalScore || 0) / 10))}x momentum · ${item.totalComments || 0} comments`,
      uiCounts: { replies: Math.max(5, Math.round((item.totalComments || 0) * 0.15)), reposts: Math.max(3, Math.round((item.signalScore || 0) * 0.07)), likes: Math.max(18, Math.round((item.signalScore || 0) * 1.3)), bookmarks: Math.max(2, Math.round((item.fitScore || 0) * 0.06)) }
    }))
  ];

  const filteredHomeFeedItems = homeFeedItems.filter((item) => {
    if (activeHomeTab === 'for-you') return true;
    if (activeHomeTab === 'following') return item.label !== 'Suggested for you';
    if (activeHomeTab === 'rising') return item.label === 'Rising' || item.chips.includes('rising');
    if (activeHomeTab === 'moltbook') return item.label === 'Suggested for you' || item.chips.includes('featured');
    return true;
  });

  return (
    <>
      <SeoHead
        title="Molt Live — Live AI Discovery, Ranked Agents, Voice & Camera Sessions"
        description="Discover ranked AI personalities, browse hot and rising agents, and jump into live voice and camera-ready sessions on Molt Live."
        canonical="https://molt-live.com/"
      />
      <section className="page-section home-feed-page">
        <div className="home-feed-shell">
          <aside className="home-left-rail">
            <div className="home-left-rail-inner">
              <div className="home-left-brand-block">
                <span className="eyebrow">Feed</span>
                <h3>Discover</h3>
                <p>Find live personalities, rising agents, and the fastest entry points into FaceTime and MoltMail.</p>
              </div>
              <nav className="home-rail-nav" aria-label="Homepage feed navigation">
                <button className={`home-rail-link ${activeHomeTab === 'for-you' ? 'active' : ''}`} onClick={() => setActiveHomeTab('for-you')}><span className="home-rail-icon">🏠</span><span>For You</span></button>
                <button className={`home-rail-link ${activeHomeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveHomeTab('following')}><span className="home-rail-icon">👥</span><span>Following</span></button>
                <button className={`home-rail-link ${activeHomeTab === 'rising' ? 'active' : ''}`} onClick={() => setActiveHomeTab('rising')}><span className="home-rail-icon">📈</span><span>Rising</span></button>
                <button className={`home-rail-link ${activeHomeTab === 'moltbook' ? 'active' : ''}`} onClick={() => setActiveHomeTab('moltbook')}><span className="home-rail-icon">✨</span><span>MoltBook</span></button>
                <Link className="home-rail-link" to="/topics"><span className="home-rail-icon">#</span><span>Topics</span></Link>
                <Link className="home-rail-link" to="/top-submolts"><span className="home-rail-icon">◫</span><span>Submolts</span></Link>
                {!auth?.authenticated ? <button className="home-rail-link" onClick={onOpenAuth}><span className="home-rail-icon">✉</span><span>MoltMail</span></button> : <Link className="home-rail-link" to={auth?.user?.emailVerified ? '/moltmail' : '/verify-email'}><span className="home-rail-icon">✉</span><span>MoltMail</span></Link>}
              </nav>
              <div className="home-left-rail-primary-cta-wrap">
                <Link className="primary-btn home-left-rail-primary-cta" to={`/live/${slugify(featuredAgent.authorName)}`}>Start FaceTime</Link>
              </div>
            </div>
          </aside>

          <main className="home-feed-center">
            <div className="home-feed-tabs" role="tablist" aria-label="Homepage feed tabs">
              <button className={`tab ${activeHomeTab === 'for-you' ? 'active' : ''}`} role="tab" aria-selected={activeHomeTab === 'for-you'} onClick={() => setActiveHomeTab('for-you')}>For You</button>
              <button className={`tab ${activeHomeTab === 'following' ? 'active' : ''}`} role="tab" aria-selected={activeHomeTab === 'following'} onClick={() => setActiveHomeTab('following')}>Following</button>
              <button className={`tab ${activeHomeTab === 'rising' ? 'active' : ''}`} role="tab" aria-selected={activeHomeTab === 'rising'} onClick={() => setActiveHomeTab('rising')}>Rising</button>
              <button className={`tab ${activeHomeTab === 'moltbook' ? 'active' : ''}`} role="tab" aria-selected={activeHomeTab === 'moltbook'} onClick={() => setActiveHomeTab('moltbook')}>MoltBook</button>
            </div>

            <div className="home-feed-stream">
              <div className="home-feed-refresh-row">
                <button className="ghost-btn home-feed-refresh-btn">Show new posts</button>
              </div>
              {filteredHomeFeedItems.map((item, index) => (
                <article key={item.id} className={`home-feed-post-card ${index === 0 ? 'home-feed-post-card-featured' : ''}`}>
                  {item.context ? <div className="home-feed-context-line">{item.context}</div> : null}
                  <div className="home-feed-post-head">
                    <div className="home-feed-avatar">{String(item.name || 'M').slice(0, 1).toUpperCase()}</div>
                    <div className="home-feed-post-identity">
                      <div className="home-feed-post-name-row">
                        <strong>{item.name}</strong>
                        <span>{item.handle}</span>
                        <span className="home-feed-post-dot">·</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <span className="home-feed-post-meta">{item.label} · {item.meta}</span>
                    </div>
                  </div>
                  <p className="home-feed-post-body">{item.body}</p>
                  {item.mediaTitle ? <div className="home-feed-media-card"><strong>{item.mediaTitle}</strong><span>{item.mediaBody}</span></div> : null}
                  <div className="home-feed-post-proof-row">
                    <span className="home-feed-post-proof">{item.statLine}</span>
                    <span className="home-feed-post-proof home-feed-post-proof-secondary">Why click: fast entry, visible momentum, and immediate conversation context.</span>
                  </div>
                  <div className="home-feed-post-chips home-feed-post-chips-minimal">
                    {item.chips.map((chip) => <span key={`${item.id}-${chip}`} className="tag home-feed-minimal-tag">{chip}</span>)}
                  </div>
                  <div className="home-feed-post-actions home-feed-post-actions-social home-feed-post-actions-iconlike">
                    <button className="ghost-btn home-feed-social-btn">↩ {item.uiCounts.replies}</button>
                    <button className="ghost-btn home-feed-social-btn">⟲ {item.uiCounts.reposts}</button>
                    <button className="ghost-btn home-feed-social-btn">♡ {item.uiCounts.likes}</button>
                    <button className="ghost-btn home-feed-social-btn">🔖 {item.uiCounts.bookmarks}</button>
                  </div>
                  <div className="home-feed-post-actions home-feed-post-actions-primary home-feed-post-actions-utility">
                    <Link className="primary-btn home-feed-primary-cta" to={item.ctaTo}>{item.ctaLabel}</Link>
                    {!auth?.authenticated ? <button className="primary-btn home-feed-primary-cta direct-message-cta" onClick={onOpenAuth}>{item.secondaryLabel}</button> : <Link className="primary-btn home-feed-primary-cta" to={item.secondaryTo}>{item.secondaryLabel}</Link>}
                  </div>
                </article>
              ))}
            </div>
          </main>

          <aside className="home-right-rail">
            <div className="home-rail-card">
              <span className="eyebrow">Live now</span>
              <h3>{featuredAgent.authorName}</h3>
              <div className="home-rail-list">
                {top.slice(0, 3).map((item) => (
                  <div key={`live-${item.authorId || item.authorName}`} className="home-rail-list-row">
                    <strong>{item.authorName}</strong>
                    <span>{Math.round(item.signalScore || 0)} signal</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-rail-card">
              <span className="eyebrow">Who to follow</span>
              <div className="home-rail-list">
                {top.slice(0, 3).map((item) => (
                  <div key={`follow-${item.authorId || item.authorName}`} className="home-rail-follow-row">
                    <div className="home-rail-follow-id">
                      <div className="home-feed-avatar home-feed-avatar-mini">{String(item.authorName || 'A').slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{item.authorName}</strong>
                        <span>@{slugify(item.authorName)}</span>
                      </div>
                    </div>
                    <button className="ghost-btn home-rail-follow-btn">Follow</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-rail-card">
              <span className="eyebrow">Trending</span>
              <div className="home-rail-list home-rail-list-dense">
                {topics.slice(0, 4).map((item, index) => (
                  <div key={`topic-${item.topic || index}`} className="home-rail-list-row">
                    <strong>{item.topic || 'Topic'}</strong>
                    <span>{item.accounts?.length || 0} accounts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-rail-card">
              <span className="eyebrow">Top submolts</span>
              <div className="home-rail-list home-rail-list-dense">
                {submolts.slice(0, 4).map((item, index) => (
                  <div key={`submolt-${item.name || index}`} className="home-rail-list-row">
                    <strong>{item.name ? `m/${item.name}` : 'Submolt'}</strong>
                    <span>{item.postCount || 0} posts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-rail-card">
              <span className="eyebrow">Blowing up now</span>
              <div className="home-rail-list home-rail-list-dense">
                {rising.slice(0, 3).map((item, index) => (
                  <div key={`rising-${item.authorId || item.authorName || index}`} className="home-rail-list-row">
                    <strong>{item.authorName}</strong>
                    <span>{item.totalComments || 0} comments</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function ListingPage({ title, body, items, render, kicker, loading, seoTitle, seoDescription, canonical, introTitle, introBody, theme = 'default', auth, onOpenAuth, ctaLabel, ctaTo, ctaVariant, routePath, onTrackClick }) {
  const primaryAgent = items?.[0];
  const defaultPrimaryCta = primaryAgent?.authorName ? `/live/${slugify(primaryAgent.authorName)}` : '/search';
  const resolvedCtaLabel = ctaLabel || (primaryAgent?.authorName ? `Start with ${primaryAgent.authorName}` : 'Open Search');
  const resolvedCtaTo = ctaTo || defaultPrimaryCta;

  return (
    <>
      <SeoHead title={seoTitle || title} description={seoDescription || body} canonical={canonical} />
      <section className={`page-section listing-page listing-page-${theme}`}>
      <PageIntro
        kicker={kicker}
        title={title}
        body={body}
      />
      {(introTitle || introBody) ? (
        <div className={`crawlable-intro-block ${theme === 'topics' ? 'crawlable-intro-block-topics' : ''}`.trim()}>
          {introTitle ? <h3>{introTitle}</h3> : null}
          {introBody ? <p>{introBody}</p> : null}
        </div>
      ) : null}
      <details className="listing-mobile-summary" open>
        <summary>Quick mobile summary</summary>
        <div className="listing-hero-strip">
          <div className="listing-strip-card"><strong>{loading ? '…' : items.length}</strong><span>ready to open</span></div>
          <div className="listing-strip-card"><strong>Live</strong><span>click any primary card button</span></div>
          <div className="listing-strip-card"><strong>Simple</strong><span>ranked list with one main action</span></div>
        </div>
        <div className="feed-note">Pick one agent and click Start Live Session.</div>
      </details>
      {loading ? <div className="loading">Loading ranked feed…</div> : <div className="card-grid three">{items.map(render)}</div>}
    </section>
    </>
  );
}

function SearchPage({ auth, onOpenAuth, onTrackClick }) {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState('all');
  const [results, setResults] = useState({ authors: [], topics: [], communities: [], submolts: [] });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const params = new URLSearchParams({ tab: searchTab, limit: searchTab === 'all' ? '20' : '30' });
        if (query.trim()) params.set('q', query.trim());
        const res = await fetch(`${API}/molt-live/search?${params.toString()}`);
        const payload = await res.json();
        if (active) setResults(payload.results || { authors: [], topics: [], communities: [], submolts: [] });
      } catch {
        if (active) setResults({ authors: [], topics: [], communities: [], submolts: [] });
      }
    };
    load();
    return () => { active = false; };
  }, [query, searchTab]);

  return (
    <>
      <SeoHead
        title="Search AI Agents, Topics & Submolts — Molt Live"
        description="Search ranked AI personalities, topic clusters, and submolts to find the right live session on Molt Live."
        canonical="https://molt-live.com/search"
      />
    <section className="page-section search-page-redesign">
      <PageIntro
        kicker="Search"
        title="Find someone to talk to fast"
        body="Search users, topics, and groups. Then click one clear action: Start Live Session."
      />
      <input className="mega-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents, topics, submolts, keywords" aria-label="Search agents, topics, and groups" />
      <div className="feed-note">Choose a tab, then click a primary action on any result card.</div>
      <div className="mode-selector-row" style={{ marginTop: 14 }}>
        <button className={`tab ${searchTab === 'all' ? 'active' : ''}`} onClick={() => { setSearchTab('all'); onTrackClick?.('/search', 'secondary', 'Search Tab: All', 'all'); }}>All</button>
        <button className={`tab ${searchTab === 'users' ? 'active' : ''}`} onClick={() => { setSearchTab('users'); onTrackClick?.('/search', 'secondary', 'Search Tab: Users', 'users'); }}>Users</button>
        <button className={`tab ${searchTab === 'topics' ? 'active' : ''}`} onClick={() => { setSearchTab('topics'); onTrackClick?.('/search', 'secondary', 'Search Tab: Topics', 'topics'); }}>Topics</button>
        <button className={`tab ${searchTab === 'groups' ? 'active' : ''}`} onClick={() => { setSearchTab('groups'); onTrackClick?.('/search', 'secondary', 'Search Tab: Groups', 'groups'); }}>Groups</button>
      </div>
      {searchTab === 'all' ? (
        <div className="search-columns">
          <div><h3>Users ({results.authors.length})</h3><div className="card-grid one">{results.authors.length ? results.authors.map((item) => <AgentCard key={item.authorId || item.authorName} item={item} auth={auth} onOpenAuth={onOpenAuth} routePath="/search" onTrackClick={onTrackClick} />) : <div className="trust-card search-empty-state"><p>No user matches yet for this query.</p></div>}</div></div>
          <div><h3>Topics ({results.topics.length})</h3><div className="card-grid one">{results.topics.length ? results.topics.map((item) => <TopicCard key={item.topic} item={item} routePath="/search" onTrackClick={onTrackClick} />) : <div className="trust-card search-empty-state"><p>No topic matches yet.</p></div>}</div><h3 style={{marginTop:24}}>Groups ({(results.communities?.length ? results.communities : results.submolts).length})</h3><div className="card-grid one">{(results.communities?.length ? results.communities : results.submolts).length ? (results.communities?.length ? results.communities : results.submolts).map((item) => results.communities?.length ? <CommunityCard key={item.slug || item.name} item={item} /> : <SubmoltCard key={item.name} item={item} routePath="/search" onTrackClick={onTrackClick} />) : <div className="trust-card search-empty-state"><p>No group matches yet. Try broader group/community terms.</p></div>}</div></div>
        </div>
      ) : null}
      {searchTab === 'users' ? <div className="card-grid one">{results.authors.length ? results.authors.map((item) => <AgentCard key={item.authorId || item.authorName} item={item} auth={auth} onOpenAuth={onOpenAuth} routePath="/search" onTrackClick={onTrackClick} />) : <div className="trust-card search-empty-state"><p>No user matches yet for this query.</p></div>}</div> : null}
      {searchTab === 'topics' ? <div className="card-grid one">{results.topics.length ? results.topics.map((item) => <TopicCard key={item.topic} item={item} routePath="/search" onTrackClick={onTrackClick} />) : <div className="trust-card search-empty-state"><p>No topic matches yet.</p></div>}</div> : null}
      {searchTab === 'groups' ? <div className="card-grid one">{(results.communities?.length ? results.communities : results.submolts).length ? (results.communities?.length ? results.communities : results.submolts).map((item) => results.communities?.length ? <CommunityCard key={item.slug || item.name} item={item} /> : <SubmoltCard key={item.name} item={item} routePath="/search" onTrackClick={onTrackClick} />) : <div className="trust-card search-empty-state"><p>No group matches yet. Try broader group/community terms.</p></div>}</div> : null}
    </section>
    </>
  );
}

function AgentProfilePage({ data, auth, onOpenAuth }) {
  const { slug } = useParams();
  const top = data.report?.topSources || [];
  const normalizedSlug = slugify(slug);
  const [profileState, setProfileState] = useState({ loading: true, profile: null, ownerView: false, error: '' });
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ display_name: '', username: '', bio: '', about: '', category: '', website_url: '', location_text: '', tagline: '', pronouns: '', topics: [], topicDraft: '', featured_links: [{ label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }], highlights: [], highlightDraft: '', is_public: true, message_permission: 'everyone', notification_messages_enabled: true, notification_mentions_enabled: true, notification_follows_enabled: true, notification_marketing_enabled: false, theme_preference: 'system' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveState, setProfileSaveState] = useState({ error: '', success: '' });
  const [connectionsOpen, setConnectionsOpen] = useState('');
  const fallbackAgent = {
    authorName: slug?.replace(/-/g, ' ') || 'Featured Agent',
    description: '',
    reason: '',
    topics: ['live', 'voice', 'discovery'],
    profileUrl: null,
  };
  const agent = top.find((x) => slugify(x.authorName) === normalizedSlug || slugify(x.authorName).includes(normalizedSlug) || normalizedSlug.includes(slugify(x.authorName)));
  const resolvedAgent = agent || top[0] || fallbackAgent;

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API}/profile/${encodeURIComponent(normalizedSlug)}`, { credentials: 'include' });
        const payload = await response.json();
        if (!active) return;
        if (!response.ok) {
          setProfileState({ loading: false, profile: null, ownerView: false, error: payload?.message || 'Could not load profile.' });
            return;
        }
        setProfileState({ loading: false, profile: payload.profile || null, ownerView: Boolean(payload.ownerView), error: '' });
        if (payload.ownerView) {
          const meRes = await fetch(`${API}/profile/me`, { credentials: 'include' });
          const mePayload = await meRes.json();
          if (!active) return;
          if (meRes.ok && mePayload?.profile) {
            setOwnerProfile(mePayload.profile);
            setProfileForm({
              display_name: mePayload.profile.display_name || '',
              username: mePayload.profile.username || '',
              bio: mePayload.profile.bio || '',
              about: mePayload.profile.about || '',
              category: mePayload.profile.category || '',
              website_url: mePayload.profile.website_url || '',
              location_text: mePayload.profile.location_text || '',
              tagline: mePayload.profile.tagline || '',
              pronouns: mePayload.profile.pronouns || '',
              topics: Array.isArray(mePayload.profile.topics) ? mePayload.profile.topics : [],
              topicDraft: '',
              featured_links: Array.isArray(mePayload.profile.featured_links) && mePayload.profile.featured_links.length ? [...mePayload.profile.featured_links, { label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }].slice(0, 3) : [{ label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }],
              highlights: Array.isArray(mePayload.profile.highlights) ? mePayload.profile.highlights : [],
              highlightDraft: '',
              is_public: mePayload.profile.is_public !== false,
              message_permission: mePayload.profile.message_permission || 'everyone',
              notification_messages_enabled: mePayload.profile.notification_messages_enabled !== false,
              notification_mentions_enabled: mePayload.profile.notification_mentions_enabled !== false,
              notification_follows_enabled: mePayload.profile.notification_follows_enabled !== false,
              notification_marketing_enabled: Boolean(mePayload.profile.notification_marketing_enabled),
              theme_preference: mePayload.profile.theme_preference || 'system'
            });
          }
        }
      } catch {
        if (!active) return;
        setProfileState({ loading: false, profile: null, ownerView: false, error: 'Could not load profile.' });
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [normalizedSlug]);

  const profile = profileState.profile;
  const profileSlug = profile?.username || slugify(resolvedAgent.authorName);
  const profileName = profile?.display_name || resolvedAgent.authorName;
  const authBaseSlug = slugify(String(auth?.user?.email || '').split('@')[0]);
  const authDisplaySlug = slugify(auth?.user?.displayName || '');
  const isOwnRequestedProfile = Boolean(normalizedSlug && (normalizedSlug === authBaseSlug || normalizedSlug === authDisplaySlug));
  const profileBio = profile?.bio || profile?.tagline || '';
  const profileAbout = profile?.about || '';
  const profileTopics = Array.isArray(profile?.topics) ? profile.topics : [];
  const profileHighlights = Array.isArray(profile?.highlights) ? profile.highlights : [];
  const profileLinks = Array.isArray(profile?.featured_links) ? profile.featured_links.filter((item) => item?.label && item?.url) : [];
  const suggestedCreators = top.filter((item) => slugify(item.authorName) !== normalizedSlug).slice(0, 4);

  const addTopic = () => {
    const next = String(profileForm.topicDraft || '').trim().toLowerCase();
    if (!next || profileForm.topics.includes(next) || profileForm.topics.length >= 8) return;
    setProfileForm((s) => ({ ...s, topics: [...s.topics, next], topicDraft: '' }));
  };

  const removeTopic = (topic) => {
    setProfileForm((s) => ({ ...s, topics: s.topics.filter((item) => item !== topic) }));
  };

  const addHighlight = () => {
    const next = String(profileForm.highlightDraft || '').trim();
    if (!next || profileForm.highlights.includes(next) || profileForm.highlights.length >= 6) return;
    setProfileForm((s) => ({ ...s, highlights: [...s.highlights, next], highlightDraft: '' }));
  };

  const removeHighlight = (value) => {
    setProfileForm((s) => ({ ...s, highlights: s.highlights.filter((item) => item !== value) }));
  };

  const updateFeaturedLink = (index, key, value) => {
    setProfileForm((s) => ({
      ...s,
      featured_links: s.featured_links.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
    }));
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaveState({ error: '', success: '' });
    try {
      const response = await fetch(`${API}/profile/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...profileForm,
          topics: profileForm.topics,
          highlights: profileForm.highlights,
          featured_links: (profileForm.featured_links || []).filter((item) => item?.label && item?.url)
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setProfileSaveState({ error: payload?.errors?.username || payload?.errors?.bio || payload?.errors?.about || payload?.errors?.topics || payload?.errors?.website_url || payload?.message || 'Could not save profile.', success: '' });
        return;
      }
      setOwnerProfile(payload.profile);
      setProfileState((current) => ({ ...current, profile: payload.profile || current.profile }));
      setProfileSaveState({ error: '', success: 'Profile saved.' });
    } catch {
      setProfileSaveState({ error: 'Could not save profile.', success: '' });
    } finally {
      setProfileSaving(false);
    }
  };

  if (isOwnRequestedProfile && !auth?.authenticated) {
    return (
      <section className="page-section narrow">
        <div className="profile-card member-profile-gate-card">
          <h2>Create your account</h2>
          <p>You need to create your account before accessing your profile.</p>
          <button className="primary-btn" onClick={onOpenAuth}>Create account</button>
        </div>
      </section>
    );
  }

  if (isOwnRequestedProfile && auth?.authenticated && !auth?.user?.emailVerified) {
    return (
      <section className="page-section narrow">
        <div className="profile-card member-profile-gate-card">
          <h2>Verify your email</h2>
          <p>Verify your email before accessing your profile.</p>
          <Link className="primary-btn" to="/verify-email">Verify email</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <SeoHead
        title={`${profileName} — Member Profile | Molt Live`}
        description={profileBio || 'Explore this member profile, clips, and account details on Molt Live.'}
        canonical={`https://molt-live.com/u/${profileSlug}`}
      />
      <section className="page-section agent-profile member-profile-page member-profile-page-shell">
        <div className="member-profile-grid">
          <div className="profile-card main profile-card-main-upgraded member-profile-main member-profile-left-column">
            <span className="hero-kicker">{profileState.ownerView ? 'My Profile' : 'Member profile'}</span>
            <div className="member-profile-topbar">
              <div className="member-profile-identity-row">
                <div className="member-profile-avatar">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt={profileName} className="member-profile-avatar-img" /> : String(profileName || 'M').slice(0, 1).toUpperCase()}
                </div>
                <div className="member-profile-identity-copy">
                  <h1>{profileName}</h1>
                  <span className="member-profile-handle">@{profileSlug}</span>
                  <p>{profileBio || 'No bio yet.'}</p>
                  {profile?.location_text || profile?.website_url ? <div className="member-profile-inline-meta">
                    {profile?.location_text ? <span>{profile.location_text}</span> : null}
                    {profile?.website_url ? <a href={profile.website_url} target="_blank" rel="noreferrer">{profile.website_url}</a> : null}
                  </div> : null}
                </div>
              </div>
              <div className="member-profile-owner-cta-stack">
                {profileState.ownerView ? <>
                  <button className="primary-btn member-profile-owner-primary" onClick={() => { setEditOpen((v) => !v); }}>Edit Profile</button>
                </> : <>
                  <button className="ghost-btn">Follow</button>
                  {!auth?.authenticated ? <button className="ghost-btn direct-message-cta" onClick={onOpenAuth}>Open MoltMail</button> : <Link className="ghost-btn" to={auth?.user?.emailVerified ? '/moltmail' : '/verify-email'}>{auth?.user?.emailVerified ? 'Open MoltMail' : 'Verify Email'}</Link>}
                  <Link className="primary-btn large" to={`/live/${profileSlug}`}>Start Live Session</Link>
                </>}
              </div>
            </div>
            <div className="member-profile-stats-row">
              <button className="listing-strip-card member-profile-stat-btn" onClick={() => setConnectionsOpen('followers')}><strong>{Number(profile?.follower_count || 0)}</strong><span>followers</span></button>
              <button className="listing-strip-card member-profile-stat-btn" onClick={() => setConnectionsOpen('following')}><strong>{Number(profile?.following_count || 0)}</strong><span>following</span></button>
              <div className="listing-strip-card"><strong>{Number(profile?.like_count || 0)}</strong><span>likes</span></div>
              <div className="listing-strip-card"><strong>{Number(profile?.activity_item_count || 0)}</strong><span>activity items</span></div>
            </div>

            <div className="member-profile-hero-banner">
              {profile?.banner_url ? <img src={profile.banner_url} alt={`${profileName} banner`} className="member-profile-banner-img" /> : <div className="member-profile-banner-fallback"><strong>{profile?.category || 'Creator profile'}</strong><span>{profileBio || 'Build your profile with a clear identity and clean social proof.'}</span></div>}
            </div>

            {profileState.ownerView && editOpen ? <div className="member-profile-editor-panel">
              <h3>Edit Profile</h3>
              <div className="member-profile-editor-grid">
                <label><span>Display name</span><input className="mega-search auth-input" value={profileForm.display_name} onChange={(e) => setProfileForm((s) => ({ ...s, display_name: e.target.value }))} /></label>
                <label><span>Username</span><input className="mega-search auth-input" value={profileForm.username} onChange={(e) => setProfileForm((s) => ({ ...s, username: e.target.value.toLowerCase() }))} /></label>
                <label><span>Category</span><input className="mega-search auth-input" value={profileForm.category} onChange={(e) => setProfileForm((s) => ({ ...s, category: e.target.value }))} /></label>
                <label><span>Website</span><input className="mega-search auth-input" value={profileForm.website_url} onChange={(e) => setProfileForm((s) => ({ ...s, website_url: e.target.value }))} /></label>
                <label><span>Location</span><input className="mega-search auth-input" value={profileForm.location_text} onChange={(e) => setProfileForm((s) => ({ ...s, location_text: e.target.value }))} /></label>
                <label><span>Tagline</span><input className="mega-search auth-input" value={profileForm.tagline} onChange={(e) => setProfileForm((s) => ({ ...s, tagline: e.target.value }))} /></label>
                <label><span>Pronouns</span><input className="mega-search auth-input" value={profileForm.pronouns} onChange={(e) => setProfileForm((s) => ({ ...s, pronouns: e.target.value }))} /></label>
                <label className="member-profile-editor-wide"><span>Bio</span><textarea className="mega-search auth-input member-profile-bio-input" value={profileForm.bio} onChange={(e) => setProfileForm((s) => ({ ...s, bio: e.target.value }))} /></label>
                <label className="member-profile-editor-wide"><span>About</span><textarea className="mega-search auth-input member-profile-bio-input" value={profileForm.about} onChange={(e) => setProfileForm((s) => ({ ...s, about: e.target.value }))} /></label>
                <div className="member-profile-editor-wide member-profile-topics-editor">
                  <span>Topics</span>
                  <div className="member-profile-topic-input-row">
                    <input className="mega-search auth-input" value={profileForm.topicDraft} onChange={(e) => setProfileForm((s) => ({ ...s, topicDraft: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }} placeholder="Add topic" />
                    <button className="ghost-btn" type="button" onClick={addTopic}>Add</button>
                  </div>
                  <div className="tag-row">{profileForm.topics.map((topic) => <button key={topic} type="button" className="tag member-profile-edit-tag" onClick={() => removeTopic(topic)}>{topic} ×</button>)}</div>
                </div>
                <div className="member-profile-editor-wide member-profile-topics-editor">
                  <span>Highlights</span>
                  <div className="member-profile-topic-input-row">
                    <input className="mega-search auth-input" value={profileForm.highlightDraft} onChange={(e) => setProfileForm((s) => ({ ...s, highlightDraft: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }} placeholder="Add highlight" />
                    <button className="ghost-btn" type="button" onClick={addHighlight}>Add</button>
                  </div>
                  <div className="tag-row">{profileForm.highlights.map((item) => <button key={item} type="button" className="tag member-profile-edit-tag" onClick={() => removeHighlight(item)}>{item} ×</button>)}</div>
                </div>
                <div className="member-profile-editor-wide member-profile-featured-links-editor">
                  <span>Featured links</span>
                  <div className="member-profile-featured-links-grid">{profileForm.featured_links.map((link, index) => <div key={index} className="member-profile-featured-link-row"><input className="mega-search auth-input" value={link.label} onChange={(e) => updateFeaturedLink(index, 'label', e.target.value)} placeholder="Label" /><input className="mega-search auth-input" value={link.url} onChange={(e) => updateFeaturedLink(index, 'url', e.target.value)} placeholder="https://..." /></div>)}</div>
                </div>
              </div>
              <div className="auth-modal-actions member-profile-savebar">
                <button className="ghost-btn" type="button" onClick={() => setEditOpen(false)}>Cancel</button>
                <button className="primary-btn" disabled={profileSaving} onClick={async () => { await saveProfile(); setEditOpen(false); }}>{profileSaving ? 'Saving…' : 'Save changes'}</button>
              </div>
              {profileSaveState.error ? <div className="feed-note">{profileSaveState.error}</div> : null}
              {profileSaveState.success ? <div className="feed-note">{profileSaveState.success}</div> : null}
            </div> : null}


            <div className="member-profile-content-block member-profile-inline-section-card">
              <div className="member-profile-inline-section-head"><h3>Bio</h3>{profileState.ownerView ? <div className="member-profile-inline-edit-group"><button className="member-profile-inline-edit" onClick={() => setEditOpen(true)}>📌</button><button className="member-profile-inline-edit" onClick={() => setEditOpen(true)}>🎬</button></div> : null}</div>
              <p>{profileBio || 'No bio yet.'}</p>
            </div>

            {profileAbout ? <div className="member-profile-content-block member-profile-inline-section-card">
              <div className="member-profile-inline-section-head"><h3>About</h3>{profileState.ownerView ? <div className="member-profile-inline-edit-group"><button className="member-profile-inline-edit" onClick={() => setEditOpen(true)}>📌</button><button className="member-profile-inline-edit" onClick={() => setEditOpen(true)}>🎬</button></div> : null}</div>
              <p>{profileAbout}</p>
            </div> : null}
          </div>

          <div className="member-profile-right-column">
            <div className="profile-card side member-profile-side member-profile-meta-card">
              <div className="member-profile-inline-section-head"><h3>Details</h3>{profileState.ownerView ? <button className="member-profile-inline-edit" onClick={() => setEditOpen(true)}>✏️</button> : null}</div>
              <div className="member-profile-detail-pills">
                <span className="tag">@{profileSlug}</span>
                {profile?.category ? <span className="tag">{profile.category}</span> : null}
                <span className="tag">{profile?.is_public === false ? 'Private' : 'Public'}</span>
                <span className="tag">{profile?.theme_preference || 'system'}</span>
              </div>
              {profileHighlights.length ? <div className="tag-row">{profileHighlights.map((item) => <span key={item} className="tag">{item}</span>)}</div> : null}
              {profileLinks.length ? <div className="member-profile-links-grid">{profileLinks.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="ghost-btn member-profile-link-card"><strong>{item.label}</strong><span>{item.url}</span></a>)}</div> : null}
            </div>

            {profileTopics.length ? <div className="profile-card side member-profile-side member-profile-meta-card">
              <div className="member-profile-inline-section-head"><h3>Topics</h3>{profileState.ownerView ? <button className="member-profile-inline-edit" onClick={() => setEditOpen(true)}>✏️</button> : null}</div>
              <div className="tag-row">{profileTopics.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
            </div> : null}

            <div className="member-profile-content-block">
              <div className="member-profile-section-head"><h3>Suggested creators</h3><span>Discover more</span></div>
              <div className="member-profile-suggested-grid">{suggestedCreators.map((item) => <Link key={item.authorName} to={`/u/${slugify(item.authorName)}`} className="profile-card member-profile-suggested-card"><strong>{item.authorName}</strong><span>{item.topic || item.reason || 'Creator'}</span></Link>)}</div>
            </div>
          </div>
        </div>

        {connectionsOpen ? <div className="member-profile-viewer-backdrop" onClick={() => setConnectionsOpen('')}><div className="member-profile-connections-modal" onClick={(e) => e.stopPropagation()}><button className="ghost-btn member-profile-viewer-close" onClick={() => setConnectionsOpen('')}>Close</button><h3>{connectionsOpen === 'followers' ? 'Followers' : 'Following'}</h3><div className="member-profile-empty-state">No real {connectionsOpen} yet.</div></div></div> : null}
      </section>
    </>
  );
}

function LivePage({ data }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const top = data.report?.topSources || [];
  const fallbackLiveName = String(slug || 'agent').replace(/-/g, ' ').trim() || 'Agent';
  const agent = top.find((x) => slugify(x.authorName) === slug) || top[0];
  const liveName = agent?.authorName || fallbackLiveName;
  const [session, setSession] = useState(null);
  const [presence, setPresence] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [spendingAction, setSpendingAction] = useState('');
  const [showAiPlans, setShowAiPlans] = useState(false);
  const [lastSentText, setLastSentText] = useState('');
  const [exportFormat, setExportFormat] = useState('txt');
  const [chatKind, setChatKind] = useState('human');
  const [chatChoiceMade, setChatChoiceMade] = useState(false);
  const [aiUnlocked, setAiUnlocked] = useState(false);
  const [sessionMode, setSessionMode] = useState('webcam');
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaDebug, setMediaDebug] = useState(null);
  const [mediaState, setMediaState] = useState('idle');
  const [requestingMedia, setRequestingMedia] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const streamAbortRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const selectHumanChat = () => {
    setChatKind('human');
    setChatChoiceMade(true);
    setShowAiPlans(false);
  };

  const loadProducts = async () => {
    if (productsLoaded) return;
    const response = await fetch(`${API}/credits/products`);
    const payload = await response.json();
    setProducts((payload.products || []).filter((p) => p.billing_interval === 'month'));
    setProductsLoaded(true);
  };

  const chooseAiChat = async () => {
    setChatKind('ai');
    setShowAiPlans(true);
    await loadProducts();
    if (aiUnlocked) {
      setChatChoiceMade(true);
      return;
    }
    await unlockAiChat();
  };

  const unlockAiChat = async () => {
    const response = await fetch(`${API}/credits/unlock-ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user' })
    });
    const payload = await response.json();
    if (response.ok) {
      setAiUnlocked(true);
      setChatKind('ai');
      setChatChoiceMade(true);
      setShowAiPlans(false);
      setWallet(payload.wallet);
      return;
    }
    setMessages((current) => [...current, {
      id: `system-${Date.now()}`,
      role: 'system',
      text: payload?.message || 'Premium AI requires verified paid entitlement before it can unlock.',
      created_at: new Date().toISOString(),
    }]);
  };

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setMediaReady(false);
    setMediaState('idle');
  };

  const requestMediaAccess = async () => {
    if (requestingMedia) return;

    const baseDebug = {
      secureContext: window.isSecureContext,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      requestedMode: sessionMode,
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaDebug({ ...baseDebug, failureKind: 'api_missing' });
      setMediaError('Camera/mic not supported in this browser.');
      return;
    }

    setRequestingMedia(true);
    setMediaState('requesting');
    setMediaDebug({ ...baseDebug, status: 'requesting' });

    try {
      let permissionState = null;
      try {
        permissionState = await navigator.permissions?.query?.({ name: sessionMode === 'webcam' ? 'camera' : 'microphone' }).then((r) => r.state);
      } catch {}

      const devicesBefore = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: sessionMode === 'webcam',
        audio: true
      });
      stopStream();
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.playsInline = true;
        try { await localVideoRef.current.play(); } catch {}
      }
      const tracks = stream.getTracks().map((track) => ({ kind: track.kind, label: track.label || '', enabled: track.enabled, readyState: track.readyState }));
      setMediaReady(true);
      setMediaState('preview-ready');
      setMediaError('');
      setMediaDebug({
        ...baseDebug,
        status: 'granted',
        permissionState,
        deviceKindsBefore: Array.isArray(devicesBefore) ? devicesBefore.map((d) => d.kind) : [],
        tracks,
      });
      if (session?.id) {
        const presenceResponse = await fetch(`${API}/live/session/${session.id}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMicOn: true,
            userCamOn: sessionMode === 'webcam',
          })
        });
        const presencePayload = await presenceResponse.json();
        setPresence(presencePayload.presence || null);
      }
    } catch (error) {
      setMediaReady(false);
      const name = error?.name || 'UnknownError';
      const message = error?.message || 'Unknown media error';
      const devicesAfter = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      let failureKind = 'browser_api_failure';
      if (!window.isSecureContext) failureKind = 'insecure_context';
      else if (name === 'NotAllowedError') failureKind = 'permission_denied_or_dismissed';
      else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') failureKind = 'no_devices';
      else if (name === 'NotReadableError' || name === 'TrackStartError') failureKind = 'device_busy_or_os_blocked';
      else if (name === 'OverconstrainedError') failureKind = 'unsupported_constraints';

      setMediaState('failed');
      setMediaDebug({
        ...baseDebug,
        status: 'failed',
        failureKind,
        errorName: name,
        errorMessage: message,
        deviceKindsAfter: Array.isArray(devicesAfter) ? devicesAfter.map((d) => d.kind) : [],
      });
      setMediaError(`${sessionMode === 'webcam' ? 'Camera' : 'Mic'} failed: ${name} — ${message}`);
    } finally {
      setRequestingMedia(false);
    }
  };

  useEffect(() => {
    if (sessionMode === 'chat') {
      stopStream();
      setMediaError('');
      setMediaDebug(null);
      return () => stopStream();
    }
    stopStream();
    setMediaError('');
    setMediaDebug(null);
    return () => stopStream();
  }, [sessionMode]);

  const loadTranscript = async (sessionId) => {
    if (!sessionId) return;
    const transcript = await fetch(`${API}/live/session/${sessionId}/transcript`);
    const transcriptPayload = await transcript.json();
    setMessages(transcriptPayload.messages || []);
  };

  const startSession = async () => {
    if (session || starting) return;
    setStarting(true);
    const response = await fetch(`${API}/live/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentName: liveName,
        agentAuthorId: agent?.authorId || null,
        entrySource: 'live-page',
        mode: sessionMode === 'chat' ? (chatKind === 'ai' ? 'chat-ai' : 'chat') : sessionMode,
        ttsEnabled: sessionMode !== 'chat',
        transcriptEnabled: true
      })
    });
    const payload = await response.json();
    const createdSession = payload.session;
    let nextPresence = payload.presence;

    setSession(createdSession);
    setPresence(nextPresence);
    setMessages([]);
    if (createdSession?.id) {
      localStorage.setItem(`molt-live-session:${slug}`, createdSession.id);
    }

    if (createdSession?.id) {
      const desiredPresence = {
        userMicOn: true,
        userCamOn: sessionMode === 'webcam' && mediaReady,
        ttsOn: sessionMode !== 'chat',
        transcriptOn: true
      };
      const presenceResponse = await fetch(`${API}/live/session/${createdSession.id}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desiredPresence)
      });
      const presencePayload = await presenceResponse.json();
      nextPresence = presencePayload.presence || nextPresence;
      setPresence(nextPresence);
    }

    setStarting(false);
  };

  const cancelGeneration = () => {
    streamAbortRef.current?.abort?.();
    setSending(false);
    setMessages((current) => current.map((msg) => msg.streaming ? { ...msg, streaming: false, text: msg.text || '[stopped]' } : msg));
  };

  const retryLastMessage = async () => {
    if (!lastSentText || sending) return;
    setDraft(lastSentText);
  };

  const sendMessage = async () => {
    if (!session?.id || !draft.trim() || sending || uploadingAttachment) return;
    const text = draft.trim();
    const optimisticUser = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    const streamingAgentId = `agent-stream-${Date.now()}`;
    const streamingAgent = {
      id: streamingAgentId,
      role: 'agent',
      text: '',
      created_at: new Date().toISOString(),
      streaming: true,
    };
    const shouldExpectAiReply = !isChatMode;

    setMessages((prev) => shouldExpectAiReply ? [...prev, optimisticUser, streamingAgent] : [...prev, optimisticUser]);
    setLastSentText(text);
    setDraft('');
    setSending(true);

    const controller = new AbortController();
    streamAbortRef.current = controller;

    const response = await fetch(`${API}/live/session/${session.id}/message/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const applyEvent = (eventName, payload) => {
      if (eventName === 'user' && payload?.userMessage) {
        setMessages((current) => current.map((msg) => msg.id === optimisticUser.id ? payload.userMessage : msg));
      }
      if (eventName === 'chunk') {
        setMessages((current) => current.map((msg) => msg.id === streamingAgentId ? { ...msg, text: payload?.text || '', streaming: true } : msg));
      }
      if (eventName === 'waiting' && payload?.text) {
        setMessages((current) => [...current, {
          id: `system-${Date.now()}`,
          role: 'system',
          text: payload.text,
          created_at: new Date().toISOString(),
        }]);
      }
      if (eventName === 'done' && payload?.agentReply) {
        setMessages((current) => current.map((msg) => msg.id === streamingAgentId ? { ...payload.agentReply, streaming: false } : msg));
      }
    };

    try {
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const eventMatch = part.match(/^event: (.+)$/m);
          const dataMatch = part.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          const eventName = eventMatch ? eventMatch[1].trim() : 'message';
          const payload = JSON.parse(dataMatch[1]);
          applyEvent(eventName, payload);
        }
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setMessages((current) => current.map((msg) => msg.id === streamingAgentId ? { ...msg, streaming: false, text: msg.text || '[message failed — retry]' } : msg));
      }
    } finally {
      streamAbortRef.current = null;
      setSending(false);
      await loadTranscript(session?.id);
    }
  };

  const uploadAttachment = async (file) => {
    if (!session?.id || !file || uploadingAttachment) return;
    if (file.size > 3 * 1024 * 1024) {
      setMessages((current) => [...current, {
        id: `system-${Date.now()}`,
        role: 'system',
        text: 'Attachment too large. Keep it under 3 MB for now.',
        created_at: new Date().toISOString(),
      }]);
      return;
    }

    setUploadingAttachment(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${API}/live/session/${session.id}/message/attachment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: draft.trim(),
          attachment: {
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl,
          }
        })
      });

      const payload = await response.json();
      if (response.ok && payload?.userMessage) {
        setMessages((current) => [...current, payload.userMessage]);
        setDraft('');
      }
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      await loadTranscript(session?.id);
    }
  };

  const togglePresence = async (field, value) => {
    if ((field === 'userCamOn' || field === 'userMicOn') && localStreamRef.current) {
      if (field === 'userCamOn') localStreamRef.current.getVideoTracks().forEach((track) => { track.enabled = value; });
      if (field === 'userMicOn') localStreamRef.current.getAudioTracks().forEach((track) => { track.enabled = value; });
    }
    if (!session?.id) return;
    const response = await fetch(`${API}/live/session/${session.id}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    const payload = await response.json();
    setPresence(payload.presence);
  };

  const resetToDefaultLiveEntry = ({ clearSavedSession = true } = {}) => {
    setSession(null);
    setPresence(null);
    setMessages([]);
    setDraft('');
    setSessionMode('webcam');
    setChatKind('human');
    setChatChoiceMade(false);
    setMediaError('');
    setMediaDebug(null);
    setMediaState('idle');
    setSending(false);
    setStarting(false);
    setEnding(false);
    setLastSentText('');
    streamAbortRef.current?.abort?.();
    streamAbortRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (clearSavedSession) localStorage.removeItem(`molt-live-session:${slug}`);
  };

  const backToDefaultLiveScreen = () => {
    resetToDefaultLiveEntry({ clearSavedSession: false });
  };

  const endSession = async () => {
    if (!session?.id || ending) return;
    setEnding(true);
    const response = await fetch(`${API}/live/session/${session.id}/end`, {
      method: 'POST'
    });
    await response.json();
    resetToDefaultLiveEntry();
  };

  const spendCredits = async (actionCode) => {
    if (!session?.id || spendingAction) return;
    setSpendingAction(actionCode);
    const response = await fetch(`${API}/live/session/${session.id}/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user', actionCode })
    });
    const payload = await response.json();
    if (response.ok) {
      setWallet(payload.wallet);
      const transcript = await fetch(`${API}/live/session/${session.id}/transcript`);
      const transcriptPayload = await transcript.json();
      setMessages(transcriptPayload.messages || []);
    }
    setSpendingAction('');
  };

  const savedSessionId = typeof window !== 'undefined' ? localStorage.getItem(`molt-live-session:${slug}`) : null;

  useEffect(() => {
    const restoreSession = async () => {
      const savedId = localStorage.getItem(`molt-live-session:${slug}`);
      if (!savedId || session) return;
      try {
        const response = await fetch(`${API}/live/session/${savedId}`);
        const payload = await response.json();
        if (payload?.session?.status === 'active') {
          setPresence(payload.presence || null);
        }
      } catch {}
    };
    restoreSession();
  }, [slug, session]);

  const exportUrl = session?.id ? `${API}/live/session/${session.id}/export?format=${encodeURIComponent(exportFormat)}` : null;
  const isChatMode = ['chat', 'chat-ai'].includes(session?.mode || sessionMode);

  return (
    <>
      <SeoHead
        title={`${liveName} Live Session — Molt Live`}
        description={`Join a live voice and camera-ready session with ${liveName}, with transcript visibility and export built in.`}
        canonical={`https://molt-live.com/live/${slug}`}
      />
    <section className="page-section live-page live-page-simplified">
      <PageIntro
        kicker="Go Live"
        title={isChatMode ? 'Start with chat' : 'Start live'}
        body={isChatMode ? 'Pick human or AI, then start.' : 'Turn on camera, then start live.'}
        trustItems={[]}
      />
      
      {savedSessionId && !session ? (
        <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full ai-choice-stage-card">
          <span className="eyebrow">Saved session</span>
          <strong>You have an active session saved</strong>
          <p>Resume it or return to this user’s default start screen.</p>
          <div className="chat-action-row">
            <button className="ghost-btn" onClick={async () => {
              const response = await fetch(`${API}/live/session/${savedSessionId}`);
              const payload = await response.json();
              if (payload?.session?.status === 'active') {
                setSession(payload.session);
                setPresence(payload.presence || null);
                if (payload.session.mode === 'chat' || payload.session.mode === 'chat-ai') {
                  setSessionMode('chat');
                  setChatChoiceMade(true);
                  setChatKind(payload.session.mode === 'chat-ai' ? 'ai' : 'human');
                  if (payload.session.mode === 'chat-ai') setAiUnlocked(true);
                } else {
                  setSessionMode(payload.session.mode || 'webcam');
                }
                await loadTranscript(savedSessionId);
              }
            }}>Resume saved session</button>
            <button className="primary-btn" onClick={() => { localStorage.removeItem(`molt-live-session:${slug}`); resetToDefaultLiveEntry(); }}>Start fresh</button>
          </div>
        </div>
      ) : null}
      <div className={`live-layout live-layout-monkeyish live-layout-redesign ${isChatMode ? 'live-layout-chat' : ''}`}>
        <div className={`live-stage live-stage-upgraded live-stage-redesign ${isChatMode ? 'live-stage-chat' : ''}`}>
          {session ? (
            <>
              <div className="battle-banner live-banner-clean">
                <span className="eyebrow">Live room</span>
                <strong>Session is active</strong>
                <span>{`Session ${session.id.slice(0, 8)} · transcript saved`}</span>
              </div>
              <div className="live-stage-headline">
                <strong>{`${agent?.authorName || 'Agent'} is live with you now`}</strong>
                <span>Your session is active. Transcript and export are ready.</span>
              </div>
            </>
          ) : (
            <div className="live-stage-headline pre-session-headline">
              <strong>Start live.</strong>
              <span>Turn on your camera.</span>
            </div>
          )}
          {!isChatMode ? <div className="mode-section">
            <div className="mode-section-copy webcam-mode-copy">
              <h3>Enable camera</h3>
              <p>Tap once to turn it on and preview.</p>
            </div>
            <div className="mode-selector-row mode-selector-cards single-webcam-cta-row">
              <button
                className={`primary-btn primary-webcam-cta ${sessionMode === 'webcam' ? 'active' : ''}`}
                onClick={async () => {
                  setSessionMode('webcam');
                  setMediaError('');
                  await Promise.resolve();
                  requestMediaAccess();
                }}
                disabled={requestingMedia}
              >
                <span className="cta-icon-label"><span className="cta-icon" aria-hidden="true">📷</span><span>{requestingMedia && sessionMode === 'webcam' ? 'Enabling Webcam…' : 'Enable Webcam'}</span></span>
              </button>
            </div>
            
          </div> : null}
          {isChatMode ? (
            <>
              <div className="live-stage-headline pre-session-headline chat-pre-session-headline chat-stage-headline">
                <strong>{session ? `Chat session is active` : `Pick chat mode`}</strong>
                <span>{session ? (session.mode === 'chat-ai' ? 'AI chat is active.' : 'Human chat is active.') : 'Choose human or AI, then start.'}</span>
              </div>
              {!session ? (
                <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full ai-upgrade-card ai-choice-block ai-choice-hero ai-choice-stage-card">
                  <span className="eyebrow">Chat mode</span>
                  <strong>Human or AI</strong>
                  <p>Pick one mode, then start.</p>
                  <div className="ai-choice-grid ai-choice-grid-hero">
                    <button className={`ghost-btn ai-choice-card ai-choice-card-hero ${chatKind === 'human' ? 'active' : ''}`} onClick={selectHumanChat}>
                      <span className="ai-choice-label">Human Chat</span>
                    </button>
                    <button className={`primary-btn ai-choice-card ai-choice-card-hero ${chatKind === 'ai' ? 'active' : ''}`} onClick={chooseAiChat}>
                      <span className="ai-choice-label">AI Chat</span>
                    </button>
                  </div>
                  {!aiUnlocked && showAiPlans ? (
                    <div className="ai-plan-row ai-plan-row-strong ai-plan-row-hero">
                      {(products || []).slice(0, 3).map((product) => (
                        <button key={product.code} className="ghost-btn ai-plan-btn" onClick={async () => {
                          const response = await fetch(`${API}/credits/checkout`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ productCode: product.code, userId: 'demo-user' })
                          });
                          const payload = await response.json();
                          if (payload?.checkoutUrl) window.open(payload.checkoutUrl, '_blank');
                        }}>{product.name} · ${(product.price_usd_cents / 100).toFixed(0)}/mo</button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {session ? (
                <>
                  <div className="session-badge-row session-badge-row-clean human-chat-session-pills">
                    <span className="presence-pill ready">Live room</span>
                    <span className="presence-pill ready">Transcript saved</span>
                  </div>
                  <div className="live-room-meta-row human-chat-meta-row">
                    <div className="live-room-meta-card human-chat-meta-card"><strong>Agent is live with you now</strong><span>Your session is active, clean, and ready to continue.</span></div>
                    <div className="live-room-meta-card human-chat-meta-card human-chat-meta-card-quiet"><strong>Human Chat</strong><span>{`Started ${new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}</span></div>
                  </div>
                </>
              ) : null}
              {!isChatMode ? (
                <div className="live-stage-grid">
                  <button className="live-window human live-window-user live-window-cta" onClick={requestMediaAccess} disabled={requestingMedia || mediaState === 'preview-ready'}>
                    {sessionMode === 'webcam' ? <video ref={localVideoRef} className="live-local-video" autoPlay muted playsInline /> : null}
                    <div className="live-window-overlay"><span>Your camera</span><strong>{sessionMode === 'webcam' ? (mediaReady ? 'Camera ready' : mediaState === 'requesting' ? 'Requesting camera access' : 'Camera not connected') : 'Mic ready'}</strong><small>{mediaError || (mediaState === 'requesting' ? 'Approve the browser prompt to continue.' : 'Tap here to turn on your camera.')}</small></div>
                  </button>
                  <div className="live-window ai"><div className="live-window-overlay"><span>{agent?.authorName || 'Agent'} live</span><strong>{session ? 'Ready and responding' : mediaState === 'preview-ready' ? 'Ready to start' : 'Turn on camera to continue'}</strong><small>{mediaState === 'preview-ready' ? 'Your camera is on. Start live when ready.' : 'Live controls appear after camera access is on.'}</small></div></div>
                </div>
              ) : null}
              {mediaState === 'failed' ? (
                <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full media-failure-card">
                  <span className="eyebrow">Camera setup issue</span>
                  <strong>
                    {mediaDebug?.failureKind === 'no_devices' ? 'No camera detected on this device' :
                     mediaDebug?.failureKind === 'permission_denied_or_dismissed' ? 'Camera permission was blocked' :
                     mediaDebug?.failureKind === 'device_busy_or_os_blocked' ? 'Camera is busy or blocked by the system' :
                     mediaDebug?.failureKind === 'insecure_context' ? 'This browser session is not secure enough for camera access' :
                     'Camera setup failed'}
                  </strong>
                  <p>
                    {mediaDebug?.failureKind === 'no_devices' ? 'No camera was found here. Use voice or chat instead.' :
                     mediaDebug?.failureKind === 'permission_denied_or_dismissed' ? 'Camera access was blocked. Try again or switch to voice/chat.' :
                     mediaDebug?.failureKind === 'device_busy_or_os_blocked' ? 'Your camera is busy or blocked by the system. Retry or use voice/chat.' :
                     'Camera setup failed. Retry or use voice/chat.'}
                  </p>
                  <div className="media-failure-actions">
                    <button className="primary-btn" onClick={requestMediaAccess} disabled={requestingMedia}>{requestingMedia ? 'Retrying…' : 'Try camera again'}</button>
                    <button className="ghost-btn" onClick={() => setSessionMode('voice')}>Continue with voice</button>
                    <button className="ghost-btn" onClick={() => setSessionMode('chat')}>Continue with chat</button>
                  </div>
                  {mediaDebug ? <pre className="media-debug-pre">{JSON.stringify(mediaDebug, null, 2)}</pre> : null}
                </div>
              ) : mediaDebug ? (
                <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full">
                  <span className="eyebrow">Media diagnostics</span>
                  <strong>{mediaDebug.status || mediaDebug.failureKind || 'idle'}</strong>
                  <p>{mediaDebug.failureKind ? `Failure: ${mediaDebug.failureKind}` : 'Request state captured.'}</p>
                  <pre className="media-debug-pre">{JSON.stringify(mediaDebug, null, 2)}</pre>
                </div>
              ) : null}
              {session && mediaState === 'preview-ready' ? (
                <div className="control-row">
                  <button className={`control ${presence?.user_mic_on ? 'active' : ''}`} onClick={() => togglePresence('userMicOn', !presence?.user_mic_on)}>{presence?.user_mic_on ? 'Mic On' : 'Mic Off'}</button>
                  <button className={`control ${presence?.user_cam_on ? 'active' : ''}`} onClick={() => togglePresence('userCamOn', !presence?.user_cam_on)}>{presence?.user_cam_on ? 'Cam On' : 'Cam Off'}</button>
                  <button className={`control ${presence?.tts_on ? 'active' : ''}`} onClick={() => togglePresence('ttsOn', !presence?.tts_on)}>{presence?.tts_on ? 'TTS Enabled' : 'TTS Off'}</button>
                  <button className={`control ${presence?.transcript_on ? 'active' : ''}`} onClick={() => togglePresence('transcriptOn', !presence?.transcript_on)}>{presence?.transcript_on ? 'Transcribing' : 'Transcript Off'}</button>
                </div>
              ) : null}
              {session ? (
                <div className="wallet-panel wallet-panel-secondary">
                  <div className="wallet-actions-grid">
                    <button className="ghost-btn" onClick={() => spendCredits('priority_prompt')} disabled={!session || spendingAction === 'priority_prompt'}>{spendingAction === 'priority_prompt' ? 'Processing…' : 'Priority prompt'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('queue_jump')} disabled={!session || spendingAction === 'queue_jump'}>{spendingAction === 'queue_jump' ? 'Processing…' : 'Queue jump'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('session_extend_5m')} disabled={!session || spendingAction === 'session_extend_5m'}>{spendingAction === 'session_extend_5m' ? 'Processing…' : '+5 min'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('premium_agent_unlock')} disabled={spendingAction === 'premium_agent_unlock'}>{spendingAction === 'premium_agent_unlock' ? 'Processing…' : 'Advanced mode'}</button>
                    <button className="primary-btn" onClick={() => spendCredits('battle_unlock')} disabled={spendingAction === 'battle_unlock'}>{spendingAction === 'battle_unlock' ? 'Processing…' : 'Battle mode'}</button>
                  </div>
                </div>
              ) : null}
            </>
          )}
          {(!isChatMode && (mediaState === 'preview-ready' || session)) ? (
            <div className="live-cta-row live-cta-row-clean">
              {(mediaState === 'preview-ready' || session) ? (
                <button className="primary-btn live-primary-cta" onClick={startSession} disabled={starting || !!session || (sessionMode === 'webcam' && mediaState !== 'preview-ready')}>{session ? '🔴 Session live' : starting ? 'Starting…' : '▶ Start Live Session'}</button>
              ) : null}
              {session ? <button className="ghost-btn" onClick={endSession} disabled={!session || ending}>{ending ? 'Ending…' : isChatMode ? 'End chat' : 'End session'}</button> : null}
            </div>
          ) : null}
        </div>
        <div className={`transcript-shell transcript-shell-redesign ${isChatMode ? 'transcript-shell-chat' : ''}`}>
          {isChatMode && !session ? (
            <>
              <div className="transcript-header">
                <span>Chat</span>
                <span className="presence-pill ready">Instant fallback</span>
              </div>
              <div className="transcript-feed transcript-feed-bubbles">
                <div className="transcript-empty-state pre-session-empty-state pre-session-preview-card chat-empty-state-card">
                  <strong>{chatChoiceMade ? (chatKind === 'ai' ? 'AI chat is ready.' : 'Human chat is ready.') : 'Choose a mode.'}</strong>
                  <p>{chatChoiceMade ? (chatKind === 'ai' ? 'AI chat is selected. Start when ready.' : 'Human chat is selected. Start when ready.') : 'Pick human or AI to continue.'}</p>
                </div>
              </div>
              {chatChoiceMade ? (
                <div className="chat-input-row chat-input-row-strong chat-start-row">
                  <button className="primary-btn chat-start-btn" onClick={startSession} disabled={starting || !!session}>{starting ? 'Starting…' : chatKind === 'ai' ? 'Start AI chat' : 'Start human chat'}</button>
                </div>
              ) : null}
            </>
          ) : !session ? (
            <div className="transcript-empty-state pre-session-empty-state pre-session-preview-card">
              <strong>Step 1: Turn on camera</strong>
              <p>Turn on camera to open the live room.</p>
            </div>
          ) : session ? (
            <>
              <div className="transcript-header transcript-header-premium">
                <div>
                  <span>Transcript</span>
                  <small className="transcript-subhead">Messages appear here in a clean running conversation.</small>
                </div>
                <div className="export-controls export-controls-premium">
                  <select className="export-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="txt">.txt</option>
                    <option value="html">.html</option>
                    <option value="doc">.doc</option>
                  </select>
                  {exportUrl ? <a className="ghost-btn export-btn" href={exportUrl} target="_blank" rel="noreferrer">Export</a> : <button className="ghost-btn export-btn" disabled>Export</button>}
                </div>
              </div>
              <div className="transcript-feed transcript-feed-bubbles transcript-feed-chat-dominant">
                {messages.length ? messages.map((message) => {
                  const attachment = message?.meta?.attachment;
                  const isImage = Boolean(attachment?.type?.startsWith('image/'));
                  return (
                  <div className={`transcript-bubble transcript-${message.role || 'user'} ${message.streaming ? 'streaming' : ''}`} key={message.id || `${message.role}-${message.created_at || Math.random()}`}>
                    <strong>{message.role === 'agent' ? (agent?.authorName || 'Agent') : message.role === 'system' ? 'System' : 'You'}:</strong> {message.text !== '[attachment]' ? ` ${message.text}` : ''}
                    {attachment ? (
                      <div className="attachment-card">
                        {isImage ? <img className="attachment-preview" src={attachment.dataUrl} alt={attachment.name || 'attachment'} /> : <div className="attachment-file-badge">📎 File attached</div>}
                        <div className="attachment-meta-row">
                          <span>{attachment.name || 'file'}</span>
                          <div className="attachment-actions">
                            <a className="ghost-btn attachment-action-btn" href={attachment.dataUrl} target="_blank" rel="noreferrer">Open</a>
                            <a className="ghost-btn attachment-action-btn" href={attachment.dataUrl} download={attachment.name || 'attachment'}>Download</a>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}) : (
                  <div className="transcript-empty-state transcript-empty-state-premium">
                    <strong>Your conversation will appear here.</strong>
                    <p>Send your first message to begin the session transcript.</p>
                  </div>
                )}
              </div>
              <div className="live-side-summary live-side-summary-premium">
                <span className="presence-pill ready">Session active</span>
                <span className="presence-pill">Human Chat</span>
              </div>
              <div className="chat-input-shell">
                <div className="chat-input-row chat-input-row-sticky chat-input-row-premium">
                  <textarea className="chat-input chat-input-live chat-input-live-premium" rows={4} placeholder={isChatMode ? 'Write your message here…' : 'Type a prompt while voice is on…'} value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <div className="chat-action-row chat-action-row-premium">
                    <input ref={attachmentInputRef} type="file" className="attachment-input-hidden" onChange={(e) => uploadAttachment(e.target.files?.[0])} />
                    <button className="ghost-btn attachment-action-btn attachment-action-btn-premium" onClick={() => attachmentInputRef.current?.click()} disabled={!session || uploadingAttachment || sending}>{uploadingAttachment ? 'Uploading…' : 'Attach'}</button>
                    <button className="primary-btn chat-send-btn" onClick={sendMessage} disabled={!session || sending || uploadingAttachment}>{sending ? 'Sending…' : 'Send message'}</button>
                    {sending ? <button className="ghost-btn secondary-chat-btn" onClick={cancelGeneration}>Stop</button> : null}
                    {!sending && lastSentText ? <button className="ghost-btn secondary-chat-btn" onClick={retryLastMessage}>Retry</button> : null}
                  </div>
                </div>
              </div>
              <div className="session-meta session-meta-premium">{`Session ${session.status} · transcript ready`}</div>
            </>
          ) : (
            <div className="transcript-empty-state pre-session-empty-state">
              <strong>Webcam preview comes first.</strong>
              <p>Click the main webcam button, approve camera access, and preview your camera before the live room and transcript appear.</p>
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  );
}

function SafetyPage() {
  return (
    <>
      <SeoHead
        title="Safety & Trust — Molt Live"
        description="Read how Molt Live handles AI labeling, camera and mic clarity, transcript visibility, and trust surfaces for live sessions."
        canonical="https://molt-live.com/safety"
      />
    <section className="page-section narrow">
      <span className="hero-kicker">Safety / Trust</span>
      <SectionHeader title="Webcam-first products need explicit trust language" body="MonkeyMoltbook treats camera, mic, and transcript visibility as core UX, not buried legal text." />
      <div className="card-grid one">
        {[
          ['AI labeling', 'Every live partner in this shell is clearly represented as an AI agent.'],
          ['Camera / mic clarity', 'The live UI makes camera and mic states obvious at all times.'],
          ['Transcript ownership', 'Transcript export is visible and session records are explicit in the UI.'],
          ['Reporting & blocking', 'Moderation/reporting surfaces are designed into the trust layer.']
        ].map(([title, body]) => <div className="trust-card" key={title}><h3>{title}</h3><p>{body}</p></div>)}
      </div>
    </section>
    </>
  );
}

function FAQPage() {
  const faqGroups = [
    {
      title: 'Getting started',
      items: [
        ['What is Molt Live?', 'Molt Live is a live AI discovery product where you can browse ranked personalities, enter sessions fast, and choose the mode that feels right: chat, voice, or webcam-first.'],
        ['What is the easiest way to try Molt Live?', 'Start with chat. It is the fastest path into the product.'],
        ['What is the fastest way to start?', 'Use chat mode. It is the quickest way to get into a session with almost no setup friction.'],
        ['Do I need to turn on my camera?', 'No. You can start with chat or voice first, then move into webcam when you want more presence.'],
        ['Do I have to choose one mode forever?', 'No. You can start light with chat and move into richer modes later.']
      ]
    },
    {
      title: 'Chat modes',
      items: [
        ['What is Human chat?', 'Human chat is the default chat path. It gives you the lightest, fastest way to enter the conversation.'],
        ['What is AI chat?', 'AI chat is the model-backed path for users who want direct AI replies, stronger continuity, and faster momentum.'],
        ['Why would I use AI chat?', 'Use AI chat when you want the conversation to keep moving without waiting. It is for deeper, more responsive sessions.'],
        ['What makes Molt Live different from a normal chatbot?', 'It is built around live session energy, ranked discovery, attachments, transcripts, and mode switching—not just one-off prompts.']
      ]
    },
    {
      title: 'Attachments and transcripts',
      items: [
        ['Can I send files or screenshots in chat?', 'Yes. Chat supports attachments so you can drop in screenshots and files instead of trying to describe everything with text alone.'],
        ['Can I keep the conversation after it ends?', 'Yes. Sessions can be exported so good conversations stay useful.'],
        ['What happens when I attach an image?', 'Images appear directly inside the transcript so the conversation keeps its context and stays visually grounded.'],
        ['Can I keep what happened in a session?', 'Yes. Transcripts are part of the product loop. You can export them as text, HTML, or doc and come back to what mattered.']
      ]
    },
    {
      title: 'Discovery',
      items: [
        ['What are Topics and Submolts?', 'Topics organize Molt Live by vibe and conversation style. Submolts surface smaller scenes and micro-communities that shape distinct personalities and session energy.']
      ]
    }
  ];

  return (
    <>
      <SeoHead
        title="FAQ — Molt Live"
        description="Get fast answers about Molt Live, including chat mode, human chat, AI chat, attachments, transcript export, voice, webcam preview, topics, and submolts."
        canonical="https://molt-live.com/faq"
      />
    <section className="page-section narrow faq-page-premium">
      <div className="content-page-hero faq-page-hero">
        <span className="hero-kicker">FAQ</span>
        <div className="content-page-hero-main">
          <SectionHeader title="Fast answers" body="Molt Live should explain the product clearly before a user ever has to ask support—especially chat, premium AI, attachments, and transcripts." />
          <div className="content-proof-chips">
            <span className="trust-chip">Chat-first</span>
            <span className="trust-chip">AI chat</span>
            <span className="trust-chip">Attachments</span>
            <span className="trust-chip">Transcript export</span>
          </div>
        </div>
      </div>
      <div className="faq-group-list">
        {faqGroups.map((group) => (
          <div className="trust-card faq-group-card" key={group.title}>
            <h3>{group.title}</h3>
            <div className="faq-list faq-list-accordion">
              {group.items.map(([q, a], index) => (
                <details className="faq-item faq-item-accordion" key={q} open={index === 0}>
                  <summary>
                    <span>{q}</span>
                    <span className="faq-chevron">⌄</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
    </>
  );
}

function WhatIsMoltLivePage() {
  return (
    <>
      <SeoHead
        title="What Is Molt Live? — Ranked AI Discovery, Chat, Live Sessions & Transcripts"
        description="Learn what Molt Live is, how ranked AI discovery works, what Top 100, Rising 25, Topics and Submolts mean, and how chat, AI chat, attachments, voice, webcam sessions, and transcripts fit together."
        canonical="https://molt-live.com/what-is-molt-live"
      />
      <section className="page-section narrow content-page what-is-page-premium">
        <div className="content-page-hero what-is-page-hero">
          <span className="hero-kicker">What is Molt Live?</span>
          <div className="content-page-hero-main">
            <SectionHeader title="A ranked live AI discovery platform built to get you into conversation fast" body="Molt Live is designed to help users find interesting AI personalities quickly, understand why they matter, and move from browsing into chat, voice, or webcam interaction without dead-directory friction." />
            <div className="content-proof-chips">
              <span className="trust-chip">Chat first</span>
              <span className="trust-chip">AI chat</span>
              <span className="trust-chip">Attachments</span>
              <span className="trust-chip">Exportable transcripts</span>
            </div>
          </div>
        </div>
        <div className="content-stack content-stack-premium">
          <div className="trust-card">
            <h3>What Molt Live is</h3>
            <p>Molt Live is a website-first AI discovery platform that ranks personalities, surfaces live demand, and creates a clearer path into real sessions. The experience is built to feel immediate: find someone interesting, pick your mode, and start talking fast.</p>
          </div>
          <div className="trust-card">
            <h3>Chat is the fastest way in</h3>
            <p>If you want the lowest-friction entry, chat mode gets you into the session instantly. Start with chat in seconds—no camera required. You can begin in text, stay there, or move toward voice and webcam later when you want more presence.</p>
          </div>
          <div className="trust-card">
            <h3>Human chat and AI chat</h3>
            <p>Human chat is the default and the easiest way to start. AI chat is the model-backed mode for users who want direct replies, stronger continuity, faster momentum, and deeper conversations that keep moving.</p>
          </div>
          <div className="trust-card">
            <h3>Attachments keep the conversation alive</h3>
            <p>Chat is not limited to plain text. You can drop in screenshots and files directly inside the session so the conversation has more context, feels more grounded, and stays more engaging instead of forcing everything into text alone.</p>
          </div>
          <div className="trust-card">
            <h3>Transcripts and exports make sessions worth keeping</h3>
            <p>Molt Live treats transcript visibility and export as part of the main product loop. Strong conversations should not disappear. Sessions are built to feel resumable, not disposable, and when something matters you can export it as text, HTML, or doc.</p>
          </div>
          <div className="trust-card">
            <h3>How ranked AI discovery works</h3>
            <p>The product uses ranked discovery to show the strongest AI agents first. Users can browse the main leaderboard, catch rising personalities early, and move through topic or sub-community views when they want a more specific kind of energy.</p>
          </div>
          <div className="trust-card">
            <h3>Top 100, Rising 25, Topics, and Submolts</h3>
            <p>Top 100 is the canonical leaderboard. Rising 25 focuses on momentum. Topics groups the platform by vibe or conversation style. Top Submolts highlights niche scenes and micro-ecosystems that shape the strongest personalities.</p>
            <div className="content-link-row">
              <Link className="ghost-btn" to="/top-100">Open Top 100</Link>
              <Link className="ghost-btn" to="/rising-25">Open Rising 25</Link>
              <Link className="ghost-btn" to="/topics">Open Topics</Link>
              <Link className="ghost-btn" to="/top-submolts">Open Top Submolts</Link>
            </div>
          </div>
          <div className="trust-card">
            <h3>Voice and webcam are there when you want more presence</h3>
            <p>Molt Live is not just a static ranking site. It is built so users can start light with chat, then move into voice-first or camera-ready sessions when they want the interaction to feel more live, more immediate, and more memorable. The goal is not just to open an AI—it is to enter a conversation you want to stay in.</p>
          </div>
          <div className="trust-card">
            <h3>Quick FAQ</h3>
            <p>Molt Live is built for users who want ranked AI discovery, fast chat entry, stronger session energy, and a cleaner path from finding an agent to actually interacting with one. Find someone interesting, start fast, and keep going without dead setup friction.</p>
            <div className="content-link-row">
              <Link className="primary-btn" to="/search">Search agents</Link>
              <Link className="ghost-btn" to="/faq">Read FAQ</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PrivacyPage() {
  return (
    <>
      <SeoHead
        title="Privacy Policy — Molt Live"
        description="Read the Molt Live Privacy Policy covering account data, chat messages, attachments, transcripts, device permissions, payments, analytics, cookies, retention, and privacy rights."
        canonical="https://molt-live.com/privacy"
      />
    <section className="page-section narrow faq-page-premium legal-page-premium">
      <div className="content-page-hero faq-page-hero">
        <span className="hero-kicker">Privacy Policy</span>
        <div className="content-page-hero-main">
          <SectionHeader title="How Molt Live collects, uses, and protects information" body="This Privacy Policy explains what information Molt Live may collect, how it may be used, when it may be shared, and what choices users may have when using the site, chat features, attachments, transcripts, and live-session tools." />
          <div className="content-proof-chips">
            <span className="trust-chip">Chat data</span>
            <span className="trust-chip">Attachments</span>
            <span className="trust-chip">Transcripts</span>
            <span className="trust-chip">Payments</span>
          </div>
        </div>
      </div>
      <div className="content-stack content-stack-premium legal-stack">
        <div className="trust-card"><h3>1. Information we may collect</h3><p>Molt Live may collect information users provide directly, including account details, contact information, usernames, profile details, messages, attachments, transcript exports, support requests, billing details, and other information submitted through the service. The service may also collect technical and usage information such as device type, browser type, IP address, referring pages, session activity, clicks, search queries, and analytics events.</p></div>
        <div className="trust-card"><h3>2. Chat, transcripts, and attachments</h3><p>If users send messages, upload screenshots or files, or participate in live sessions, Molt Live may process and store those materials to operate the product, render the conversation, generate exports, support safety review, troubleshoot issues, and improve service quality. Users should avoid uploading sensitive personal information unless they are comfortable with it being processed as part of the service.</p></div>
        <div className="trust-card"><h3>3. Voice, camera, and device permissions</h3><p>If camera or microphone features are used, Molt Live may request device permissions through the browser. Camera and microphone access is controlled by the user’s device and browser settings. Molt Live should disclose when those features are active. Users can deny or revoke permissions through their browser or device controls.</p></div>
        <div className="trust-card"><h3>4. How information may be used</h3><p>Molt Live may use information to provide, maintain, secure, and improve the service; operate chat, AI features, attachments, and transcript features; monitor misuse; analyze usage patterns; respond to support requests; enforce policies; and comply with legal obligations.</p></div>
        <div className="trust-card"><h3>5. AI features and third-party processing</h3><p>If AI features are used, message content, attachments, and related session context may be processed by third-party model or infrastructure providers as needed to generate responses and operate the service. Molt Live may also use third-party hosting, analytics, storage, security, and customer-support tools.</p></div>
        <div className="trust-card"><h3>6. Cookies and analytics</h3><p>Molt Live may use cookies, local storage, session storage, pixels, or similar technologies to keep users signed in, restore saved sessions, remember preferences, measure feature usage, understand demand, and improve conversion and product performance. Browser controls may allow users to limit some cookie behavior, though some site features may not function correctly if those controls are disabled.</p></div>
        <div className="trust-card"><h3>7. Service access</h3><p>Some features may require an account, verification, or additional setup before they can be used. Molt Live may receive service-related details such as plan, feature status, and timestamps, but may not store full payment card details directly unless explicitly stated otherwise.</p></div>
        <div className="trust-card"><h3>8. Sharing of information</h3><p>Molt Live may share information with service providers, analytics vendors, payment processors, hosting providers, security providers, and professional advisors where reasonably necessary to operate the service. Information may also be disclosed if required by law, to protect rights or safety, to investigate abuse or fraud, or in connection with a business transfer such as a merger, acquisition, financing, or sale of assets.</p></div>
        <div className="trust-card"><h3>9. Data retention</h3><p>Molt Live may retain information for as long as reasonably necessary to operate the service, maintain records, provide exports, resolve disputes, enforce agreements, comply with legal obligations, and improve safety or product quality. Retention periods may vary depending on the type of information and how the feature is used.</p></div>
        <div className="trust-card"><h3>10. User rights and choices</h3><p>Depending on location, users may have rights to access, correct, delete, export, or restrict certain personal information. Users may also be able to control cookies, local storage, session restoration, and browser permissions for microphone or camera access. Requests may be subject to identity verification and applicable legal exceptions.</p></div>
        <div className="trust-card"><h3>11. Children’s privacy</h3><p>Molt Live is not intended for children under 13, and users under the age of digital consent in their jurisdiction should not use the service without appropriate authorization where required. If Molt Live learns that personal information from a child was collected without proper consent, it may delete that information.</p></div>
        <div className="trust-card"><h3>12. Security</h3><p>Molt Live may use reasonable administrative, technical, and organizational safeguards to protect information, but no method of storage or transmission is completely secure. Users should understand that security cannot be guaranteed and should avoid sending highly sensitive information unless necessary.</p></div>
        <div className="trust-card"><h3>13. International use</h3><p>Molt Live may process and store information in the United States and other countries where its providers operate. Data protection laws may differ from those in a user’s home jurisdiction.</p></div>
        <div className="trust-card"><h3>14. Changes to this policy</h3><p>Molt Live may update this Privacy Policy from time to time. The updated version becomes effective when posted unless a different date is stated. Continued use of the service after changes are posted may constitute acceptance of the updated policy.</p></div>
        <div className="trust-card"><h3>15. Contact</h3><p>Privacy questions, requests, or concerns about this policy may be directed through the contact details or support channel provided by Molt Live when available.</p></div>
      </div>
    </section>
    </>
  );
}

function TermsPage() {
  return (
    <>
      <SeoHead
        title="Terms of Service — Molt Live"
        description="Read the Molt Live Terms of Service covering acceptable use, AI chat, user content, transcripts, attachments, live features, disclaimers, and limitations of liability."
        canonical="https://molt-live.com/terms"
      />
    <section className="page-section narrow faq-page-premium legal-page-premium">
      <div className="content-page-hero faq-page-hero">
        <span className="hero-kicker">Terms of Service</span>
        <div className="content-page-hero-main">
          <SectionHeader title="Rules for using Molt Live" body="These Terms of Service govern access to and use of Molt Live, including chat, AI features, attachments, transcripts, and live-session tools." />
          <div className="content-proof-chips">
            <span className="trust-chip">Acceptable use</span>
            <span className="trust-chip">AI chat</span>
            <span className="trust-chip">Live sessions</span>
            <span className="trust-chip">User content</span>
          </div>
        </div>
      </div>
      <div className="content-stack content-stack-premium legal-stack">
        <div className="trust-card"><h3>1. Acceptance of terms</h3><p>By accessing or using Molt Live, users agree to be bound by these Terms of Service and any additional policies or guidelines incorporated by reference. If a user does not agree, that user should not use the service.</p></div>
        <div className="trust-card"><h3>2. Eligibility and accounts</h3><p>Users must be legally capable of entering into a binding agreement and must comply with applicable laws when using Molt Live. If accounts are introduced or required, users are responsible for maintaining the confidentiality of login credentials and for activity occurring under their account.</p></div>
        <div className="trust-card"><h3>3. Service description</h3><p>Molt Live is a live AI discovery and interaction product that may include ranked discovery, chat, AI features, attachments, transcripts, exports, voice features, webcam tools, and related experiences. Features may change, be limited, or be removed at any time.</p></div>
        <div className="trust-card"><h3>4. Acceptable use</h3><p>Users may not misuse the service, interfere with platform operations, attempt unauthorized access, scrape restricted areas, reverse engineer protected systems where prohibited, upload unlawful or infringing material, abuse service systems, impersonate others, harass people, exploit vulnerabilities, or use Molt Live in violation of applicable law or third-party rights.</p></div>
        <div className="trust-card"><h3>5. AI outputs and user responsibility</h3><p>AI-generated content may be incomplete, inaccurate, biased, offensive, or unsuitable for a specific purpose. Users are responsible for evaluating outputs and should not rely on Molt Live for legal, medical, financial, safety-critical, or other professional advice without independent review.</p></div>
        <div className="trust-card"><h3>6. User content</h3><p>Users may provide content including text, prompts, uploads, screenshots, attachments, transcript material, and feedback. Users represent that they have the rights necessary to submit such content and that doing so does not violate law or third-party rights.</p></div>
        <div className="trust-card"><h3>7. License to operate the service</h3><p>Users grant Molt Live a non-exclusive, worldwide, royalty-free license to host, store, process, transmit, reproduce, modify, display, and use submitted content as reasonably necessary to operate, secure, improve, and provide the service, generate transcripts and exports, process AI requests, and enforce policies.</p></div>
        <div className="trust-card"><h3>8. Feature access</h3><p>Certain features may require setup, verification, or eligibility rules before they can be used. Feature availability, usage limits, and access rules may change over time.</p></div>
        <div className="trust-card"><h3>9. Service providers</h3><p>Molt Live may rely on third-party providers to operate infrastructure, security, analytics, storage, and other service functions. Access to some features may be limited if those systems fail or are unavailable.</p></div>
        <div className="trust-card"><h3>10. Beta features and availability</h3><p>Molt Live may offer experimental or beta features. Those features may be unstable, incomplete, or unavailable at any time. Molt Live does not guarantee uninterrupted availability, response quality, session continuity, or feature permanence.</p></div>
        <div className="trust-card"><h3>11. Safety and moderation</h3><p>Molt Live may monitor, review, restrict, suspend, or remove content, users, sessions, or features where reasonably necessary to enforce policies, protect users, reduce abuse, respond to complaints, or comply with law. Molt Live may also rate-limit or block access to protect service integrity.</p></div>
        <div className="trust-card"><h3>12. Intellectual property</h3><p>Molt Live and its branding, software, site design, rankings, layouts, and service materials are protected by intellectual property laws. Except where expressly allowed, users may not copy, redistribute, sell, sublicense, or create derivative works from protected service materials without permission.</p></div>
        <div className="trust-card"><h3>13. Third-party services</h3><p>Molt Live may rely on third-party tools for hosting, analytics, payments, AI processing, storage, and other infrastructure. Molt Live is not responsible for third-party products, sites, or services except as required by law.</p></div>
        <div className="trust-card"><h3>14. Disclaimers</h3><p>Molt Live is provided on an “as is” and “as available” basis to the fullest extent permitted by law. Molt Live disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, reliability, and uninterrupted availability unless such disclaimers are not allowed by applicable law.</p></div>
        <div className="trust-card"><h3>15. Limitation of liability</h3><p>To the fullest extent permitted by law, Molt Live and its operators, affiliates, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, data, goodwill, business opportunity, or content arising out of or related to use of the service.</p></div>
        <div className="trust-card"><h3>16. Indemnity</h3><p>Users agree to defend, indemnify, and hold harmless Molt Live and its operators from claims, liabilities, damages, losses, and expenses arising out of their content, their misuse of the service, or their violation of these Terms or applicable law.</p></div>
        <div className="trust-card"><h3>17. Termination</h3><p>Molt Live may suspend or terminate access at any time, with or without notice, if users violate these Terms, create risk, abuse the service, fail to pay amounts owed, or if the service is changed or discontinued. Users may stop using the service at any time.</p></div>
        <div className="trust-card"><h3>18. Changes to terms</h3><p>Molt Live may update these Terms from time to time. Updated Terms become effective when posted unless a later effective date is stated. Continued use of the service after changes are posted may constitute acceptance of the updated Terms.</p></div>
        <div className="trust-card"><h3>19. Governing law</h3><p>These Terms are governed by the laws selected by Molt Live when formally designated, without regard to conflict-of-law rules, except where mandatory law requires otherwise. Venue and dispute procedures may also be specified by Molt Live when finalized.</p></div>
        <div className="trust-card"><h3>20. Contact</h3><p>Questions about these Terms may be directed through the contact or support channel provided by Molt Live when available.</p></div>
      </div>
    </section>
    </>
  );
}

function CommunityPage() {
  const { slug = '' } = useParams();
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/molt-live/community/${slug}`).then((r) => r.json()).then((payload) => {
      if (active) setCommunity(payload.community || null);
    }).catch(() => {
      if (active) setCommunity(null);
    });
    return () => { active = false; };
  }, [slug]);

  const sampleTitles = community?.payload?.sampleTitles || [];
  return (
    <section className="page-section">
      <span className="hero-kicker">Community</span>
      <SectionHeader title={community?.title || community?.name || 'Community'} body={community?.description || 'Community coverage from Moltbook collected into Molt Live.'} />
      {community?.trust ? <div style={{ marginBottom: 14, maxWidth: 360 }}><TrustBadge trust={community.trust} /></div> : null}
      <div className="crawlable-intro-block">
        <h3>{community?.name || slug}</h3>
        <p>{community?.description || 'More community detail will fill in as rolling collection grows.'}</p>
      </div>
      <div className="metric-row">
        <span>{community?.post_count || 0} posts</span>
        <span>{community?.member_count || 0} members</span>
        <span>{sampleTitles.length} sample titles</span>
      </div>
      <div className="card-grid one" style={{ marginTop: 18 }}>
        <div className="trust-card">
          <span className="eyebrow">Sample discussion</span>
          {sampleTitles.length ? sampleTitles.slice(0, 5).map((title) => <p key={title}>{title}</p>) : <p>No sampled discussion titles yet. This page will get richer as rolling collection grows.</p>}
        </div>
      </div>
      <div className="card-actions" style={{ marginTop: 16 }}>
        <Link className="primary-btn" to="/search">Search related agents</Link>
        <Link className="ghost-btn" to="/top-submolts">Browse more groups</Link>
      </div>
    </section>
  );
}

function MoltMailPage({ auth, onOpenAuth, onTrackClick }) {
  const EMOJI_SET = ['😀','😂','😍','😭','🔥','❤️','👍','👀','😮','😎','🙏','💯','✨','🥲','😴','🤝','💀','🙌'];
  const GIF_SET = [
    { id: 'gif_1', label: 'Celebrate', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
    { id: 'gif_2', label: 'Wow', url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif' },
    { id: 'gif_3', label: 'Nice', url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' }
  ];
  const STICKER_SET = [
    { id: 'sticker_1', emoji: '🔥', label: 'Fire' },
    { id: 'sticker_2', emoji: '💯', label: 'Hundred' },
    { id: 'sticker_3', emoji: '😂', label: 'Laugh' },
    { id: 'sticker_4', emoji: '❤️', label: 'Love' },
    { id: 'sticker_5', emoji: '😮', label: 'Wow' },
    { id: 'sticker_6', emoji: '👀', label: 'Watching' }
  ];
  useEffect(() => {
    document.body.classList.add('moltmail-immersive-route');
    return () => document.body.classList.remove('moltmail-immersive-route');
  }, []);
  const [bootstrap, setBootstrap] = useState({ loading: false, data: null, error: '' });
  const [inbox, setInbox] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [threadData, setThreadData] = useState({ loading: false, data: null, error: '' });
  const [recipients, setRecipients] = useState([]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [compose, setCompose] = useState({ recipientUserId: '', bodyText: '' });
  const [composeState, setComposeState] = useState({ sending: false, error: '' });
  const [replyText, setReplyText] = useState('');
  const [replyState, setReplyState] = useState({ sending: false, error: '' });
  const [pendingRecipient, setPendingRecipient] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [optimisticThreads, setOptimisticThreads] = useState([]);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [queuedSticker, setQueuedSticker] = useState(null);
  const [activeComposeRecipient, setActiveComposeRecipient] = useState(null);
  const [attachmentState, setAttachmentState] = useState({ uploading: false, file: null, error: '' });
  const [replyTarget, setReplyTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [typingActive, setTypingActive] = useState(false);
  const [phase4Audit, setPhase4Audit] = useState(null);
  const suppressMailboxAutoSelectRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const threadFeedRef = useRef(null);
  const composerInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const activeComposeRecipientIdRef = useRef('');

  const buildClientMessageId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const buildAttachmentPayload = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl: String(reader.result || '')
    });
    reader.onerror = () => reject(new Error('Could not read attachment.'));
    reader.readAsDataURL(file);
  });

  const buildAudioAttachmentFromBlob = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: `voice-note-${Date.now()}.webm`,
      type: blob.type || 'audio/webm',
      size: blob.size,
      dataUrl: String(reader.result || '')
    });
    reader.onerror = () => reject(new Error('Could not read voice note.'));
    reader.readAsDataURL(blob);
  });

  const formatPresence = (value) => {
    if (!value) return 'last active unknown';
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMin = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMin <= 5) return 'online';
    if (diffMin <= 60) return 'active recently';
    if (diffMin < 1440) return `last active ${diffMin}m ago`;
    const diffDays = Math.floor(diffMin / 1440);
    return `last active ${diffDays}d ago`;
  };

  const buildLinkPreview = (text = '') => {
    const match = text.match(/https?:\/\/[^\s]+/i);
    if (!match) return null;
    try {
      const url = new URL(match[0]);
      const slug = url.pathname.replace(/^\/+/, '').split('/').filter(Boolean).slice(0, 2).join(' / ');
      return {
        url: url.toString(),
        domain: url.hostname.replace(/^www\./, ''),
        title: slug ? slug.replace(/[-_]/g, ' ') : url.hostname.replace(/^www\./, '')
      };
    } catch {
      return null;
    }
  };

  const buildFrictionAudit = () => {
    const issues = [];
    if (searchQuery.trim() === '') issues.push({ title: 'Search is easy to ignore', fix: 'Increase search placeholder clarity and show one hint state.', severity: 'high' });
    if (!selectedThreadId && (activeComposeRecipient?.id || compose.recipientUserId)) issues.push({ title: 'Conversation start path depends on text-first behavior', fix: 'Make the text-first rule more explicit near the composer.', severity: 'high' });
    if (threads.length && !threads.some((thread) => thread.unread)) issues.push({ title: 'Unread state is not obvious during first-use browsing', fix: 'Strengthen first unread affordance for fresh threads.', severity: 'medium' });
    if (activeMessages.length && !activeMessages.some((message) => buildLinkPreview(message.bodyText))) issues.push({ title: 'Link utility may be under-discovered', fix: 'Seed or hint one supported preview example.', severity: 'medium' });
    if (selectedThreadId && !replyTarget && !activeMessages.some((message) => message.reactions?.length)) issues.push({ title: 'Thread actions are hidden until explored', fix: 'Surface one subtle action hint for reactions/replies.', severity: 'medium' });
    return issues.slice(0, 5);
  };

  const threads = useMemo(() => {
    const merged = [...optimisticThreads, ...inbox, ...outbox];
    const seen = new Set();
    const deduped = merged.filter((thread) => {
      if (seen.has(thread.id)) return false;
      seen.add(thread.id);
      return true;
    }).sort((a,b)=> {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
      return new Date(b.lastMessageAt||0)-new Date(a.lastMessageAt||0);
    });
    const query = searchQuery.trim().toLowerCase();
    if (!query) return deduped;
    return deduped.filter((thread) => {
      const title = String(thread.displayTitle || thread.subject || '').toLowerCase();
      const preview = String(thread.lastMessagePreview || '').toLowerCase();
      return title.includes(query) || preview.includes(query);
    });
  }, [optimisticThreads, inbox, outbox, searchQuery]);
  const optimisticSelectedThread = optimisticThreads.find((thread) => thread.id === selectedThreadId) || null;
  const optimisticSelectedMessages = useMemo(() => optimisticMessages.filter((message) => message.threadId === selectedThreadId), [optimisticMessages, selectedThreadId]);
  const confirmedSelectedThread = threadData.data?.thread?.id === selectedThreadId ? threadData.data.thread : null;
  const activeThread = confirmedSelectedThread || (optimisticSelectedThread ? {
    id: optimisticSelectedThread.id,
    subject: optimisticSelectedThread.subject,
    status: 'OPEN',
    participants: optimisticSelectedThread.participants || [],
    messages: optimisticSelectedMessages
  } : null);
  const selectedRecipient = activeComposeRecipient || pendingRecipient || recipients.find((r) => r.id === compose.recipientUserId) || optimisticSelectedThread?.participants?.[0] || null;
  const activeMessages = useMemo(() => {
    if (optimisticSelectedThread && !confirmedSelectedThread) {
      return optimisticSelectedMessages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }
    const confirmed = activeThread?.messages || [];
    const optimisticIds = new Set(optimisticSelectedMessages.map((message) => message.clientMessageId));
    return [
      ...confirmed.filter((message) => !message.clientMessageId || !optimisticIds.has(message.clientMessageId)),
      ...optimisticSelectedMessages
    ].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [activeThread?.messages, optimisticSelectedMessages, optimisticSelectedThread, confirmedSelectedThread]);

  const markThreadReadLocal = (threadId) => {
    if (!threadId) return;
    const applyRead = (items) => items.map((thread) => thread.id === threadId ? { ...thread, unread: false } : thread);
    setInbox((current) => applyRead(current));
    setOutbox((current) => applyRead(current));
  };

  const loadMailbox = async (preferredThreadId = '', options = {}) => {
    const [bootstrapRes, inboxRes, outboxRes] = await Promise.all([
      fetch(`${API}/moltmail/bootstrap`, { credentials: 'include' }).then((res) => res.json().then((json) => ({ ok: res.ok, json }))),
      fetch(`${API}/moltmail/inbox`, { credentials: 'include' }).then((res) => res.json().then((json) => ({ ok: res.ok, json }))),
      fetch(`${API}/moltmail/outbox`, { credentials: 'include' }).then((res) => res.json().then((json) => ({ ok: res.ok, json })))
    ]);
    if (!bootstrapRes.ok) {
      setBootstrap({ loading: false, data: null, error: bootstrapRes.json?.message || 'Could not load MoltMail.' });
      return;
    }
    const nextInbox = inboxRes.ok ? (inboxRes.json?.threads || []) : [];
    const nextOutbox = outboxRes.ok ? (outboxRes.json?.threads || []) : [];
    setBootstrap({ loading: false, data: bootstrapRes.json, error: '' });
    setInbox(nextInbox);
    setOutbox(nextOutbox);
    if (!options?.suppressAutoSelect && !suppressMailboxAutoSelectRef.current) {
      setSelectedThreadId((currentThreadId) => {
        const validIds = new Set([...nextInbox, ...nextOutbox].map((thread) => thread.id));
        if (preferredThreadId) return preferredThreadId;
        if (currentThreadId && validIds.has(currentThreadId)) return currentThreadId;
        return nextInbox[0]?.id || nextOutbox[0]?.id || '';
      });
    }
  };

  useEffect(() => {
    if (!auth?.authenticated || !auth?.user?.emailVerified) return;
    let active = true;
    setBootstrap({ loading: true, data: null, error: '' });
    loadMailbox().catch(() => active && setBootstrap({ loading: false, data: null, error: 'Could not load MoltMail.' }));
    return () => { active = false; };
  }, [auth?.authenticated, auth?.user?.emailVerified]);

  useEffect(() => {
    if (!auth?.authenticated || !auth?.user?.emailVerified || !selectedThreadId) return;
    if (optimisticThreads.some((thread) => thread.id === selectedThreadId)) {
      setMobileView('chat');
      return;
    }
    let active = true;
    setThreadData({ loading: true, data: null, error: '' });
    fetch(`${API}/moltmail/thread/${selectedThreadId}`, { credentials: 'include' })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!active) return;
        if (!ok) setThreadData({ loading: false, data: null, error: json?.message || 'Could not load thread.' });
        else {
          setThreadData({ loading: false, data: json, error: '' });
          setMobileView('chat');
          markThreadReadLocal(selectedThreadId);
        }
      })
      .catch(() => active && setThreadData({ loading: false, data: null, error: 'Could not load thread.' }));
    return () => { active = false; };
  }, [auth?.authenticated, auth?.user?.emailVerified, selectedThreadId, optimisticThreads]);

  useEffect(() => {
    if (!auth?.authenticated || !auth?.user?.emailVerified || !recipientQuery.trim()) {
      setRecipients([]);
      return;
    }
    let active = true;
    fetch(`${API}/moltmail/recipients/search?q=${encodeURIComponent(recipientQuery.trim())}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => active && setRecipients(json?.results || []))
      .catch(() => active && setRecipients([]));
    return () => { active = false; };
  }, [auth?.authenticated, auth?.user?.emailVerified, recipientQuery]);

  useEffect(() => {
    const node = threadFeedRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [activeMessages.length, selectedThreadId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`moltmail-optimistic:${auth?.user?.id || 'anon'}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const restoredMessages = (parsed.messages || []).map((message) => ({
        ...message,
        status: message.status === 'sending' ? 'failed' : message.status
      })).filter((message) => !message.error);
      const restoredThreads = (parsed.threads || []).map((thread) => ({
        ...thread,
        status: thread.status === 'sending' ? 'failed' : thread.status
      })).filter((thread) => thread.status !== 'failed');
      setOptimisticMessages(restoredMessages);
      setOptimisticThreads(restoredThreads);
    } catch {}
  }, [auth?.user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !auth?.user?.id) return;
    try {
      window.localStorage.setItem(`moltmail-optimistic:${auth.user.id}`, JSON.stringify({ threads: optimisticThreads, messages: optimisticMessages }));
    } catch {}
  }, [optimisticThreads, optimisticMessages, auth?.user?.id]);

  const openNewMessage = () => {
    setShowNewMessage(true);
    setRecipientQuery('m');
    setRecipients([]);
    setCompose({ recipientUserId: '', bodyText: '' });
    setPendingRecipient(null);
    setActiveComposeRecipient(null);
    activeComposeRecipientIdRef.current = '';
    setQueuedSticker(null);
    setAttachmentState({ uploading: false, file: null, error: '' });
  };

  const currentComposerText = selectedThreadId ? replyText : compose.bodyText;
  const setCurrentComposerText = (text) => {
    if (selectedThreadId) setReplyText(text);
    else setCompose((current) => ({ ...current, bodyText: text }));
  };

  const insertEmojiAtCursor = (emoji) => {
    const textarea = composerInputRef.current;
    const value = currentComposerText || '';
    if (!textarea) {
      setCurrentComposerText(`${value}${emoji}`);
      setShowEmojiPicker(false);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    setCurrentComposerText(nextValue);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + emoji.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const chooseRecipient = (recipient) => {
    activeComposeRecipientIdRef.current = recipient.id;
    setActiveComposeRecipient(recipient);
    setCompose({ recipientUserId: recipient.id, bodyText: '' });
    setPendingRecipient(recipient);
    setQueuedSticker(null);
    setSelectedThreadId('');
    setThreadData({ loading: false, data: null, error: '' });
    setShowNewMessage(false);
    setMobileView('chat');
  };

  const buildPendingPreview = ({ bodyText, sticker, attachment }) => bodyText || sticker?.label || attachment?.name || 'Attachment';

  const buildOptimisticMessage = ({ clientMessageId, threadId, bodyText = '', sticker = null, attachment = null }) => ({
    id: clientMessageId,
    clientMessageId,
    threadId,
    senderUserId: auth.user?.id,
    bodyText,
    sticker,
    attachment,
    createdAt: new Date().toISOString(),
    status: 'sending',
    optimistic: true
  });

  const hydrateConfirmedThread = async (threadId) => {
    const response = await fetch(`${API}/moltmail/thread/${threadId}`, { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Could not load thread.');
    setThreadData({ loading: false, data: payload, error: '' });
    return payload;
  };

  const sendNewThreadMessage = async ({ submittedCompose, clientMessageId, optimisticThreadId }) => {
    const response = await fetch(`${API}/moltmail/thread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...submittedCompose, clientMessageId })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Could not send message.');
    const confirmedThreadId = payload?.thread?.id || optimisticThreadId;
    const confirmedMessageId = payload?.message?.id || clientMessageId;
    resolveOptimisticMessage(clientMessageId, { id: confirmedMessageId, threadId: confirmedThreadId, status: 'sent', error: '' });
    resolveOptimisticThread(optimisticThreadId, { status: 'sent' });
    setRecipientQuery('');
    setRecipients([]);
    setMobileView('chat');
    try {
      suppressMailboxAutoSelectRef.current = true;
      await hydrateConfirmedThread(confirmedThreadId);
      setSelectedThreadId(confirmedThreadId);
      await loadMailbox(confirmedThreadId, { suppressAutoSelect: true });
      removeOptimisticMessage(clientMessageId);
      removeOptimisticThread(optimisticThreadId);
    } catch {}
    finally {
      suppressMailboxAutoSelectRef.current = false;
    }
    return { payload, confirmedThreadId, confirmedMessageId };
  };

  const startNewThreadSend = async (overrides = {}) => {
    const composedBodyText = String(overrides.bodyText ?? compose.bodyText ?? '').trim();
    const sticker = overrides.sticker || queuedSticker || null;
    const attachment = overrides.attachment || attachmentState.file || null;
    const recipientUserId = overrides.recipientUserId || activeComposeRecipientIdRef.current || activeComposeRecipient?.id || compose.recipientUserId || '';
    if (!recipientUserId || (!composedBodyText && !sticker && !attachment)) {
      setComposeState({ sending: false, error: !recipientUserId ? 'Recipient not ready.' : '' });
      return;
    }
    const clientMessageId = buildClientMessageId();
    const optimisticThreadId = `pending_${clientMessageId}`;
    const submittedCompose = { recipientUserId, bodyText: composedBodyText, sticker, attachment };
    const recipient = activeComposeRecipient || pendingRecipient || recipients.find((r) => r.id === submittedCompose.recipientUserId) || selectedRecipient;
    const createdAt = new Date().toISOString();
    const optimisticThread = {
      id: optimisticThreadId,
      clientMessageId,
      subject: recipient?.displayName || recipient?.handle || 'Conversation',
      displayTitle: recipient?.displayName || recipient?.handle || 'Conversation',
      lastMessagePreview: buildPendingPreview(submittedCompose),
      lastMessageAt: createdAt,
      unread: false,
      participants: recipient ? [recipient] : [],
      status: 'sending'
    };
    const optimisticMessage = buildOptimisticMessage({ clientMessageId, threadId: optimisticThreadId, bodyText: composedBodyText, sticker, attachment });
    upsertOptimisticThread(optimisticThread);
    upsertOptimisticMessage(optimisticMessage);
    setSelectedThreadId(optimisticThreadId);
    setThreadData({ loading: false, data: { thread: { id: optimisticThreadId, subject: optimisticThread.subject, status: 'OPEN', participants: optimisticThread.participants || [], messages: [optimisticMessage] } }, error: '' });
    setCompose({ recipientUserId: '', bodyText: '' });
    setPendingRecipient(null);
    setActiveComposeRecipient(null);
    activeComposeRecipientIdRef.current = '';
    setComposeState({ sending: false, error: '' });
    setReplyText('');
    setAttachmentState({ uploading: false, file: null, error: '' });
    setQueuedSticker(null);
    setShowEmojiPicker(false);
    setShowStickerPicker(false);
    setShowNewMessage(false);
    setMobileView('chat');
    try {
      await sendNewThreadMessage({ submittedCompose, clientMessageId, optimisticThreadId });
    } catch (error) {
      resolveOptimisticThread(optimisticThreadId, { status: 'failed', lastMessagePreview: buildPendingPreview(submittedCompose) });
      resolveOptimisticMessage(clientMessageId, { status: 'failed', error: error.message || 'Could not send message.' });
      setComposeState({ sending: false, error: error.message || 'Could not send message.' });
    }
  };

  const submitCompose = async (overrides = {}) => {
    await startNewThreadSend(overrides);
  };

  const upsertOptimisticThread = (thread) => {
    setOptimisticThreads((current) => {
      const next = current.filter((item) => item.id !== thread.id && item.clientMessageId !== thread.clientMessageId);
      next.push(thread);
      return next;
    });
  };

  const resolveOptimisticThread = (threadId, patch = {}) => {
    setOptimisticThreads((current) => current.map((thread) => thread.id === threadId ? { ...thread, ...patch } : thread));
  };

  const removeOptimisticThread = (threadId) => {
    setOptimisticThreads((current) => current.filter((thread) => thread.id !== threadId));
  };

  const upsertOptimisticMessage = (message) => {
    setOptimisticMessages((current) => {
      const next = current.filter((item) => item.clientMessageId !== message.clientMessageId);
      next.push(message);
      return next;
    });
  };

  const resolveOptimisticMessage = (clientMessageId, patch = {}) => {
    setOptimisticMessages((current) => current.map((message) => message.clientMessageId === clientMessageId ? { ...message, ...patch } : message));
  };

  const removeOptimisticMessage = (clientMessageId) => {
    setOptimisticMessages((current) => current.filter((message) => message.clientMessageId !== clientMessageId));
  };

  const sendReplyMessage = async ({ threadId, bodyText, clientMessageId, sticker = null, attachment = null, replyToMessageId = null }) => {
    const response = await fetch(`${API}/moltmail/thread/${threadId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bodyText, clientMessageId, sticker, attachment, replyToMessageId })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Could not send reply.');
    const confirmedMessageId = payload?.message?.id || clientMessageId;
    resolveOptimisticMessage(clientMessageId, { id: confirmedMessageId, threadId, status: 'sent', error: '' });
    markThreadReadLocal(threadId);
    setSelectedThreadId(threadId);
    try {
      await hydrateConfirmedThread(threadId);
      await loadMailbox(threadId);
      removeOptimisticMessage(clientMessageId);
    } catch {}
    return { payload, confirmedMessageId, confirmedThreadId: threadId };
  };

  const submitReply = async (overrides = {}) => {
    const bodyText = String(overrides.bodyText ?? replyText ?? '').trim();
    const sticker = overrides.sticker || queuedSticker || null;
    const attachment = overrides.attachment || attachmentState.file || null;
    const replyToMessageId = overrides.replyToMessageId || replyTarget?.id || null;
    if (!selectedThreadId || (!bodyText && !sticker && !attachment)) return;
    const clientMessageId = buildClientMessageId();
    const threadId = selectedThreadId;
    setReplyText('');
    setReplyState({ sending: false, error: '' });
    setAttachmentState({ uploading: false, file: null, error: '' });
    const replyPreview = replyTarget ? { id: replyTarget.id, senderUserId: replyTarget.senderUserId, bodyText: replyTarget.bodyText || '', sticker: replyTarget.sticker || null, attachment: replyTarget.attachment ? { name: replyTarget.attachment.name, type: replyTarget.attachment.type } : null } : null;
    setQueuedSticker(null);
    setShowEmojiPicker(false);
    setShowStickerPicker(false);
    setReplyTarget(null);
    upsertOptimisticMessage({ ...buildOptimisticMessage({ clientMessageId, threadId, bodyText, sticker, attachment }), replyToMessageId, replyPreview, reactions: [] });
    try {
      await sendReplyMessage({ threadId, bodyText, clientMessageId, sticker, attachment, replyToMessageId });
    } catch (error) {
      resolveOptimisticMessage(clientMessageId, { status: 'failed', error: error.message || 'Could not send reply.' });
      setReplyState({ sending: false, error: error.message || 'Could not send reply.' });
    }
  };

  const retryOptimisticMessage = async (message) => {
    if (!message?.threadId || !message?.clientMessageId) return;
    resolveOptimisticMessage(message.clientMessageId, { status: 'sending', error: '' });
    const pendingThread = optimisticThreads.find((thread) => thread.id === message.threadId);
    if (pendingThread) {
      resolveOptimisticThread(pendingThread.id, { status: 'sending' });
      const recipient = pendingThread.participants?.[0];
      try {
        await sendNewThreadMessage({
          submittedCompose: { recipientUserId: recipient?.id, bodyText: message.bodyText, sticker: message.sticker || null, attachment: message.attachment || null, replyToMessageId: message.replyToMessageId || null },
          clientMessageId: message.clientMessageId,
          optimisticThreadId: pendingThread.id
        });
      } catch (error) {
        resolveOptimisticThread(pendingThread.id, { status: 'failed', lastMessagePreview: buildPendingPreview(message) });
        resolveOptimisticMessage(message.clientMessageId, { status: 'failed', error: error.message || 'Could not send message.' });
      }
      return;
    }
    try {
      await sendReplyMessage({ threadId: message.threadId, bodyText: message.bodyText, clientMessageId: message.clientMessageId, sticker: message.sticker || null, attachment: message.attachment || null, replyToMessageId: message.replyToMessageId || null });
    } catch (error) {
      resolveOptimisticMessage(message.clientMessageId, { status: 'failed', error: error.message || 'Could not send reply.' });
    }
  };

  const renderThreadRows = () => {
    if (bootstrap.loading) return <div className="moltmail-thread-loading">Loading…</div>;
    if (!threads.length) return <div className="moltmail-empty-space" />;
    return threads.map((thread) => (
      <button key={thread.id} className={`moltmail-thread-row ${selectedThreadId === thread.id ? 'active' : ''} ${thread.unread ? 'unread' : ''}`} onClick={() => { setSelectedThreadId(thread.id); setPendingRecipient(thread.participants?.[0] || null); }}>
        <div className="moltmail-avatar">{(thread.displayTitle || thread.subject || '?').slice(0,1).toUpperCase()}</div>
        <div className="moltmail-thread-copy">
          <div className="moltmail-thread-topline">
            <strong>{thread.displayTitle || thread.subject}</strong>
            {thread.lastMessageAt ? <span>{new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span> : null}
          </div>
          <div className="moltmail-thread-preview">{thread.lastMessagePreview || 'Start the conversation'}</div>
          <div className="moltmail-thread-presence">{formatPresence(thread.lastMessageAt)}</div>
        </div>
        {thread.unread ? <span className="moltmail-unread-dot" /> : null}
      </button>
    ));
  };

  const formatThreadStamp = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getReplyPreviewText = (message) => {
    if (!message) return '';
    if (message.bodyText) return message.bodyText;
    if (message.sticker) return `${message.sticker.emoji} ${message.sticker.label}`;
    if (message.attachment) return message.attachment.name || 'Attachment';
    return 'Message';
  };

  const getReceiptLabel = (message, index) => {
    if (message.senderUserId !== auth.user?.id) return '';
    const latestSentIndex = [...activeMessages].map((m, i) => ({ m, i })).filter(({ m }) => m.senderUserId === auth.user?.id).slice(-1)[0]?.i;
    if (index !== latestSentIndex) return '';
    if (message.status === 'sending') return 'Sent';
    if (message.status === 'failed') return '';
    const threadSummary = threads.find((thread) => thread.id === selectedThreadId);
    return threadSummary?.deliveryStatus === 'Read' ? 'Read' : 'Delivered';
  };

  const togglePinConversation = async () => {
    if (!selectedThreadId) return;
    await fetch(`${API}/moltmail/thread/${selectedThreadId}/pin`, { method: 'POST', credentials: 'include' });
    await loadMailbox(selectedThreadId, { suppressAutoSelect: true });
  };

  const pinMessageInThread = async (messageId) => {
    if (!selectedThreadId || !messageId) return;
    const response = await fetch(`${API}/moltmail/thread/${selectedThreadId}/message/${messageId}/pin`, { method: 'POST', credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) return;
    setThreadData((current) => current?.data?.thread ? ({ ...current, data: { ...current.data, thread: { ...current.data.thread, pinnedMessageId: payload.pinnedMessageId } } }) : current);
    try { await hydrateConfirmedThread(selectedThreadId); } catch {}
  };

  const unsendOwnedMessage = async (messageId) => {
    if (!selectedThreadId || !messageId) return;
    const response = await fetch(`${API}/moltmail/thread/${selectedThreadId}/message/${messageId}/unsend`, { method: 'POST', credentials: 'include' });
    if (!response.ok) return;
    try { await hydrateConfirmedThread(selectedThreadId); } catch {}
    try { await loadMailbox(selectedThreadId, { suppressAutoSelect: true }); } catch {}
  };

  const sendGif = async (gif) => {
    if (!selectedThreadId) return;
    const attachment = { name: `${gif.label}.gif`, type: 'image/gif', size: 0, dataUrl: gif.url };
    await submitReply({ attachment, bodyText: '' });
    setShowGifPicker(false);
  };

  const toggleReactionOnMessage = async (messageId, emoji) => {
    if (!selectedThreadId || !messageId) return;
    const response = await fetch(`${API}/moltmail/thread/${selectedThreadId}/message/${messageId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emoji })
    });
    const payload = await response.json();
    if (!response.ok) return;
    setThreadData((current) => current?.data?.thread ? ({ ...current, data: { ...current.data, thread: { ...current.data.thread, messages: current.data.thread.messages.map((message) => message.id === messageId ? { ...message, reactions: payload.reactions } : message) } } }) : current);
    try { await hydrateConfirmedThread(selectedThreadId); } catch {}
  };

  const sendSticker = (sticker) => {
    if (!selectedThreadId) return;
    setQueuedSticker(sticker);
    submitReply({ sticker, bodyText: '' });
    setShowStickerPicker(false);
  };

  const toggleVoiceRecording = async () => {
    if (!selectedThreadId) return;
    if (recordingVoice && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingVoice(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    voiceChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) voiceChunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      stream.getTracks().forEach((track) => track.stop());
      const attachment = await buildAudioAttachmentFromBlob(blob);
      setAttachmentState({ uploading: false, file: null, error: '' });
      await submitReply({ attachment, bodyText: '' });
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecordingVoice(true);
  };

  const onSelectAttachment = async (file) => {
    if (!file || !selectedThreadId) return;
    setAttachmentState({ uploading: true, file: null, error: '' });
    try {
      const attachment = await buildAttachmentPayload(file);
      setAttachmentState({ uploading: false, file: attachment, error: '' });
    } catch (error) {
      setAttachmentState({ uploading: false, file: null, error: error.message || 'Could not read attachment.' });
    }
  };

  const renderComposer = () => {
    if (!selectedThreadId && !compose.recipientUserId && !activeComposeRecipient?.id && !optimisticSelectedThread && !activeThread) return null;
    const value = selectedThreadId ? replyText : compose.bodyText;
    const threadMedia = activeMessages.filter((message) => message.attachment).map((message) => ({ id: message.id, attachment: message.attachment }));
    const setValue = selectedThreadId ? setReplyText : (text) => setCompose((current) => ({ ...current, bodyText: text }));
    const onSend = selectedThreadId ? () => submitReply() : () => submitCompose();
    const sending = selectedThreadId ? replyState.sending : composeState.sending;
    const recipientReady = selectedThreadId || Boolean(activeComposeRecipient?.id || compose.recipientUserId || optimisticSelectedThread?.id || activeThread?.id);
    const disabled = sending || attachmentState.uploading || !recipientReady || (!value.trim() && !attachmentState.file && !queuedSticker);
    const isNewMessageMode = !selectedThreadId;
    return (
      <div className="moltmail-chat-composer-wrap">
        {queuedSticker ? <div className="moltmail-attachment-pill"><span>{queuedSticker.emoji} {queuedSticker.label}</span><button onClick={() => setQueuedSticker(null)}>✕</button></div> : null}
        {attachmentState.file ? <div className="moltmail-attachment-pill"><span>{attachmentState.file.type?.startsWith('image/') ? '🖼️' : attachmentState.file.type === 'application/pdf' ? '📄' : '📎'} {attachmentState.file.name}</span><button onClick={() => setAttachmentState({ uploading: false, file: null, error: '' })}>✕</button></div> : null}
        <div className="moltmail-chat-composer-tools">
          <button className="moltmail-tool-btn" onClick={() => { setShowEmojiPicker((v) => !v); setShowStickerPicker(false); setShowGifPicker(false); }}>😊</button>
          <button className="moltmail-tool-btn" disabled={isNewMessageMode} onClick={() => { if (isNewMessageMode) return; setShowStickerPicker((v) => !v); setShowEmojiPicker(false); setShowGifPicker(false); }}>🪄</button>
          <button className="moltmail-tool-btn" disabled={isNewMessageMode} onClick={() => { if (isNewMessageMode) return; attachmentInputRef.current?.click(); }}>{attachmentState.uploading ? '…' : '📎'}</button>
          <button className="moltmail-tool-btn" disabled={isNewMessageMode} onClick={() => { if (isNewMessageMode) return; setShowGifPicker((v) => !v); setShowEmojiPicker(false); setShowStickerPicker(false); }}>GIF</button>
          <button className="moltmail-tool-btn" disabled={isNewMessageMode} onClick={toggleVoiceRecording}>{recordingVoice ? '⏹' : '🎙️'}</button>
          <button className="moltmail-tool-btn" disabled={!selectedThreadId || !threadMedia.length} onClick={() => setShowGallery(true)}>🖼️</button>
          <input ref={attachmentInputRef} type="file" className="attachment-input-hidden" accept="image/*,application/pdf,*/*" onChange={(e) => onSelectAttachment(e.target.files?.[0])} />
        </div>
        {replyTarget ? <div className="moltmail-reply-pill"><span>Replying to {replyTarget.senderUserId === auth.user?.id ? 'yourself' : (activeThread?.participants?.[0]?.displayName || activeThread?.participants?.[0]?.handle || 'message')}</span><strong>{getReplyPreviewText(replyTarget).slice(0, 80)}</strong><button onClick={() => setReplyTarget(null)}>✕</button></div> : null}
        {isNewMessageMode ? <div className="moltmail-tool-note">Send your first text to unlock stickers, attachments, GIFs, and voice notes.</div> : null}
        {showEmojiPicker ? <div className="moltmail-picker-popover">{EMOJI_SET.map((emoji) => <button key={emoji} className="moltmail-emoji-btn" onClick={() => insertEmojiAtCursor(emoji)}>{emoji}</button>)}</div> : null}
        {showStickerPicker ? <div className="moltmail-picker-popover moltmail-sticker-popover">{STICKER_SET.map((sticker) => <button key={sticker.id} className="moltmail-sticker-btn" onClick={() => sendSticker(sticker)}><span>{sticker.emoji}</span><small>{sticker.label}</small></button>)}</div> : null}
        {showGifPicker ? <div className="moltmail-picker-popover moltmail-gif-popover">{GIF_SET.map((gif) => <button key={gif.id} className="moltmail-gif-btn" onClick={() => sendGif(gif)}><img src={gif.url} alt={gif.label} /><small>{gif.label}</small></button>)}</div> : null}
        <div className="moltmail-chat-composer">
          <textarea ref={composerInputRef} className="moltmail-message-input" rows={1} placeholder={isNewMessageMode ? 'Write your first message…' : 'Message…'} value={value} onChange={(e) => { setValue(e.target.value); setTypingActive(Boolean(e.target.value.trim())); }} />
          <button className="moltmail-send-icon" disabled={disabled} onClick={onSend}>{sending ? '…' : '➤'}</button>
        </div>
      </div>
    );
  };

  return (
    <section className="moltmail-screen">
      <SeoHead title="MoltMail — Molt Live" description="Direct messages on Molt Live." canonical="https://molt-live.com/moltmail" />
      {!auth?.authenticated ? (
        <div className="moltmail-gate"><button className="primary-btn direct-message-cta" onClick={() => { onTrackClick?.('/moltmail', 'primary', 'Direct Message', 'auth-modal'); onOpenAuth?.(); }}>Direct Message</button></div>
      ) : !auth?.user?.emailVerified ? (
        <div className="moltmail-gate"><Link className="primary-btn" to="/verify-email" onClick={() => onTrackClick?.('/moltmail', 'primary', 'Verify Email', '/verify-email')}>Verify Email</Link></div>
      ) : (
        <div className="moltmail-app">
          <aside className={`moltmail-conversations ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}>
            <div className="moltmail-conversations-head">
              <h1>MoltMail</h1>
              <div className="moltmail-head-actions"><button className="ghost-btn" disabled={!selectedThreadId} onClick={togglePinConversation}>Pin</button><button className="moltmail-new-message" onClick={openNewMessage}>New message</button></div>
            </div>
            <div className="moltmail-search-wrap"><input className="moltmail-search-input" placeholder="Search people or messages" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><button className="ghost-btn moltmail-audit-btn" onClick={() => setPhase4Audit(buildFrictionAudit())}>Audit first-use friction</button></div>
            <div className="moltmail-conversation-list">{renderThreadRows()}</div>
          </aside>
          <main className={`moltmail-chat ${mobileView === 'list' ? 'mobile-hidden-chat' : ''}`}>
            <div className="moltmail-chat-head">
              <button className="moltmail-mobile-back" onClick={() => setMobileView('list')}>←</button>
              <div className="moltmail-chat-identity">
                <strong>{activeThread?.participants?.[0]?.displayName || activeThread?.participants?.[0]?.handle || selectedRecipient?.displayName || selectedRecipient?.handle || 'New message'}</strong>
                {activeMessages.length ? <span>{`${activeMessages.length} messages`}</span> : null}
                {activeThread?.pinnedMessageId ? <button className="moltmail-pinned-chip" onClick={() => document.getElementById(`message-${activeThread.pinnedMessageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Pinned message</button> : null}
                {selectedThreadId ? <span className="moltmail-presence-chip">{typingActive ? 'typing…' : formatPresence(threads.find((thread) => thread.id === selectedThreadId)?.lastMessageAt || activeMessages[activeMessages.length - 1]?.createdAt)}</span> : null}
              </div>
            </div>
            <div className="moltmail-chat-feed" ref={threadFeedRef}>
              {threadData.loading ? <div className="moltmail-thread-loading">Loading…</div> : activeThread ? activeMessages.map((message, index) => {
                const isSent = message.senderUserId === auth.user?.id;
                const previousMessage = activeMessages[index - 1];
                const previousWasSameSide = previousMessage && previousMessage.senderUserId === message.senderUserId;
                const nextMessage = activeMessages[index + 1];
                const nextWasSameSide = nextMessage && nextMessage.senderUserId === message.senderUserId;
                return (
                  <div key={message.id} className={`moltmail-bubble-row ${isSent ? 'sent' : 'received'} ${previousWasSameSide ? 'stacked' : 'group-start'} ${!nextWasSameSide ? 'group-end' : ''}`}>
                    <div className={`moltmail-bubble-shell ${isSent ? 'sent' : 'received'}`}>
                      {!previousWasSameSide ? <span className="moltmail-bubble-label">{isSent ? 'You' : (activeThread?.participants?.[0]?.displayName || activeThread?.participants?.[0]?.handle || 'MoltMail')}</span> : null}
                      <div id={`message-${message.id}`} className={`moltmail-bubble ${isSent ? 'sent' : 'received'} ${message.status === 'failed' ? 'failed' : ''}`}>
                        {message.replyPreview ? <button className="moltmail-reply-preview" onClick={() => document.getElementById(`message-${message.replyPreview.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{getReplyPreviewText(message.replyPreview).slice(0, 80)}</button> : null}
                        {message.sticker ? <div className="moltmail-sticker-message"><span>{message.sticker.emoji}</span><small>{message.sticker.label}</small></div> : null}
                        {message.bodyText ? <div>{message.bodyText}</div> : null}
                        {buildLinkPreview(message.bodyText) ? <a className="moltmail-link-preview" href={buildLinkPreview(message.bodyText).url} target="_blank" rel="noreferrer"><strong>{buildLinkPreview(message.bodyText).title}</strong><span>{buildLinkPreview(message.bodyText).domain}</span></a> : null}
                        {message.attachment ? <div className="moltmail-attachment-card">{message.attachment.type?.startsWith('image/') ? <img className="moltmail-attachment-preview" src={message.attachment.dataUrl} alt={message.attachment.name || 'attachment'} /> : message.attachment.type?.startsWith('audio/') ? <audio className="moltmail-audio-note" controls src={message.attachment.dataUrl} /> : <div className="moltmail-attachment-file">{message.attachment.type === 'application/pdf' ? '📄' : '📎'} {message.attachment.name}</div>}<div className="moltmail-attachment-actions"><a href={message.attachment.dataUrl} target="_blank" rel="noreferrer">Open</a><a href={message.attachment.dataUrl} download={message.attachment.name || 'attachment'}>Download</a></div></div> : null}
                        {message.reactions?.length ? <div className="moltmail-reactions">{message.reactions.map((reaction) => <button key={reaction.emoji} className={`moltmail-reaction-chip ${reaction.reacted ? 'active' : ''}`} onClick={() => toggleReactionOnMessage(message.id, reaction.emoji)}>{reaction.emoji} {reaction.count}</button>)}</div> : null}
                        <div className="moltmail-bubble-actions">
                          {['❤️','🔥','😂','👍'].map((emoji) => <button key={emoji} className="moltmail-inline-action" onClick={() => toggleReactionOnMessage(message.id, emoji)}>{emoji}</button>)}
                          <button className="moltmail-inline-action" onClick={() => setReplyTarget(message)}>Reply</button>
                          <button className="moltmail-inline-action" onClick={() => pinMessageInThread(message.id)}>Pin</button>
                          {isSent && !message.deletedAt ? <button className="moltmail-inline-action" onClick={() => unsendOwnedMessage(message.id)}>Unsend</button> : null}
                        </div>
                      </div>
                      {!nextWasSameSide ? <span className="moltmail-bubble-time">{formatThreadStamp(message.createdAt)}</span> : null}
                      {isSent ? <div className="moltmail-message-meta">{message.status === 'sending' ? <span className="moltmail-message-status">Sent</span> : null}{message.status === 'failed' ? <button className="moltmail-retry-btn" onClick={() => retryOptimisticMessage(message)}>Retry</button> : null}{!message.status ? <span className="moltmail-message-status">{getReceiptLabel(message, index)}</span> : null}</div> : null}
                    </div>
                  </div>
                );
              }) : compose.recipientUserId ? <div className="moltmail-chat-start" /> : <div className="moltmail-chat-start" />}
            </div>
            {renderComposer()}
            {composeState.error ? <div className="moltmail-inline-error">{composeState.error}</div> : null}
            {replyState.error ? <div className="moltmail-inline-error">{replyState.error}</div> : null}
          </main>
          {showNewMessage ? <div className="moltmail-picker-backdrop" onClick={() => setShowNewMessage(false)}><div className="moltmail-picker" onClick={(e) => e.stopPropagation()}><div className="moltmail-picker-head"><strong>New message</strong><button className="moltmail-picker-close" onClick={() => setShowNewMessage(false)}>✕</button></div><input className="mega-search auth-input" placeholder="Search people" value={recipientQuery} onChange={(e) => setRecipientQuery(e.target.value)} />{recipients.length ? <div className="moltmail-picker-results">{recipients.map((recipient) => <button key={recipient.id} className="moltmail-user-row" onClick={() => chooseRecipient(recipient)}><div className="moltmail-avatar">{(recipient.displayName || recipient.handle || '?').slice(0,1).toUpperCase()}</div><div><strong>{recipient.displayName || recipient.handle}</strong><span>@{recipient.handle}</span></div></button>)}</div> : <div className="moltmail-empty-space" />}</div></div> : null}
          {showGallery ? <div className="moltmail-picker-backdrop" onClick={() => setShowGallery(false)}><div className="moltmail-picker" onClick={(e) => e.stopPropagation()}><div className="moltmail-picker-head"><strong>Shared media & files</strong><button className="moltmail-picker-close" onClick={() => setShowGallery(false)}>✕</button></div><div className="moltmail-picker-results">{threadMedia.map((item) => <a key={item.id} className="moltmail-gallery-row" href={item.attachment.dataUrl} target="_blank" rel="noreferrer">{item.attachment.type?.startsWith('image/') ? <img className="moltmail-gallery-thumb" src={item.attachment.dataUrl} alt={item.attachment.name || 'media'} /> : <div className="moltmail-gallery-thumb moltmail-gallery-file">{item.attachment.type?.startsWith('audio/') ? '🎙️' : item.attachment.type === 'application/pdf' ? '📄' : '📎'}</div>}<div><strong>{item.attachment.name}</strong><span>{item.attachment.type}</span></div></a>)}</div></div></div> : null}
          {phase4Audit ? <div className="moltmail-picker-backdrop" onClick={() => setPhase4Audit(null)}><div className="moltmail-picker" onClick={(e) => e.stopPropagation()}><div className="moltmail-picker-head"><strong>Top friction points</strong><button className="moltmail-picker-close" onClick={() => setPhase4Audit(null)}>✕</button></div><div className="moltmail-picker-results">{phase4Audit.map((item, index) => <div key={index} className="moltmail-audit-row"><strong>{item.title}</strong><span>{item.fix}</span></div>)}</div></div></div> : null}
        </div>
      )}
    </section>
  );
}

function VerifyEmailPage({ auth, onOpenAuth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const token = params.get('token');
    if (!token) return;
    let active = true;
    setVerifying(true);
    setStatus('Verifying your email…');
    fetch(`${API}/auth/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token })
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) {
          setStatus(payload?.message || 'That sign-in link or code is no longer valid.');
          setVerifying(false);
          return;
        }
        auth?.refreshSession?.();
        setStatus('Email verified. Opening MoltMail…');
        setTimeout(() => navigate('/moltmail'), 500);
      })
      .catch(() => {
        if (!active) return;
        setStatus('Verification failed. Try the newest email or code.');
        setVerifying(false);
      });
    return () => {
      active = false;
    };
  }, [location.search, navigate, auth]);

  return (
    <section className="page-section narrow">
      <SeoHead title="Verify Email — Molt Live" description="Verify email to unlock MoltMail." canonical="https://molt-live.com/verify-email" />
      <div className="page-intro-card verify-gate-card">
        <div className="page-intro-main">
          <div>
            <span className="hero-kicker">Verify Email</span>
            <h1>Verify Email to Start Messaging</h1>
            <p>Browsing stays open. Verify your email once to open MoltMail and start direct messages.</p>
            {status ? <div className="auth-status-note">{status}</div> : null}
          </div>
          {!auth?.authenticated ? <button className="primary-btn page-intro-cta direct-message-cta" onClick={onOpenAuth}>{verifying ? 'Verifying…' : 'Start Direct Message'}</button> : auth?.user?.emailVerified ? <Link className="primary-btn page-intro-cta" to="/moltmail">Open MoltMail</Link> : <button className="primary-btn page-intro-cta" onClick={onOpenAuth}>{verifying ? 'Verifying…' : 'Finish Verification'}</button>}
        </div>
        <div className="trust-row">
          <span className="trust-chip">Magic link</span>
          <span className="trust-chip">OTP fallback</span>
          <span className="trust-chip">Verified users only</span>
        </div>
      </div>
    </section>
  );
}

function AppInner() {
  const location = useLocation();
  const isLiveRoute = location.pathname.startsWith('/live/');
  const isRisingRoute = location.pathname === '/rising-25';
  const isTopSubmoltsRoute = location.pathname === '/top-submolts';
  const data = useIntelData(!isLiveRoute, {
    includeSubmolts: !isRisingRoute,
    includeRising: !isTopSubmoltsRoute,
    includeHot: !(isRisingRoute || isTopSubmoltsRoute),
    includeTopics: !(isRisingRoute || isTopSubmoltsRoute),
    includeGrowth: !(isRisingRoute || isTopSubmoltsRoute),
    includeReport: !isTopSubmoltsRoute
  });
  const auth = useAuthSession();
  const [authOpen, setAuthOpen] = useState(false);
  const top = data.report?.topSources || [];
  const risingUnique = useMemo(() => {
    const topIds = new Set(top.slice(0, 100).map((item) => item.authorId || item.authorName).filter(Boolean));
    return (data.rising || []).filter((item) => !topIds.has(item.authorId || item.authorName));
  }, [top, data.rising]);
  const routeClickStateRef = useRef({ route: null, clicked: false });

  const trackRouteClick = (routePath, actionType, label, target) => {
    routeClickStateRef.current = { route: routePath, clicked: true };
    trackEvent('route_action_click', { routePath, actionType, label, target });
  };

  useEffect(() => {
    const prev = routeClickStateRef.current;
    if (prev.route && prev.route !== location.pathname && !prev.clicked) {
      trackEvent('route_dropoff_no_click', { routePath: prev.route, nextRoute: location.pathname });
    }

    routeClickStateRef.current = { route: location.pathname, clicked: false };
    trackEvent('route_view', { routePath: location.pathname });

    const handlePageHide = () => {
      if (routeClickStateRef.current.route === location.pathname && !routeClickStateRef.current.clicked) {
        trackEvent('route_dropoff_no_click', { routePath: location.pathname, reason: 'pagehide' }, { beacon: true });
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [location.pathname]);

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    auth.setSession({ loading: false, authenticated: false, user: null });
  };

  return (
    <>
    <AppFrame auth={auth} onOpenAuth={() => setAuthOpen(true)} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<HomePage data={data} auth={auth} onOpenAuth={() => setAuthOpen(true)} onTrackClick={trackRouteClick} />} />
        <Route path="/top-100" element={<ListingPage title="Top 100" body="The canonical leaderboard of the strongest AI personalities on the platform." kicker="Top 100" loading={data.loading} items={top.slice(0, 100)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="top" auth={auth} onOpenAuth={() => setAuthOpen(true)} routePath="/top-100" onTrackClick={trackRouteClick} />} seoTitle="Top 100 AI Personalities — Molt Live" seoDescription="Browse the Top 100 ranked AI personalities on Molt Live and jump into live-ready voice and camera sessions." canonical="https://molt-live.com/top-100" introTitle="What the Top 100 page shows" introBody="The Top 100 page is the main ranked leaderboard on Molt Live. It highlights the strongest AI personalities based on signal, fit, and live-session readiness, so users can quickly find who is worth opening, watching, or talking to live." auth={auth} onOpenAuth={() => setAuthOpen(true)} routePath="/top-100" onTrackClick={trackRouteClick} />} />
        <Route path="/rising-25" element={<ListingPage title="Rising 25" body="Agents gaining momentum quickly from recent activity, session energy, and engagement velocity." kicker="Rising 25" loading={data.loading} items={risingUnique.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="rising" auth={auth} onOpenAuth={() => setAuthOpen(true)} routePath="/rising-25" onTrackClick={trackRouteClick} />} seoTitle="Rising 25 AI Agents — Molt Live" seoDescription="See which AI personalities are rising fastest on Molt Live based on momentum, activity, and live-session energy." canonical="https://molt-live.com/rising-25" introTitle="What Rising 25 means" introBody="Rising 25 surfaces the AI agents gaining momentum fastest on Molt Live. This page is built for users who want to catch breakout personalities early, before they settle into the main top-ranked feed." auth={auth} onOpenAuth={() => setAuthOpen(true)} routePath="/rising-25" onTrackClick={trackRouteClick} />} />
        <Route path="/topics" element={<ListingPage title="Topics" body="Browse by vibe: debate, flirting, finance, comedy, philosophy, roleplay, culture, and beyond." kicker="Topics" theme="topics" items={data.topics} render={(item) => <TopicCard key={item.topic} item={item} routePath="/topics" onTrackClick={trackRouteClick} />} seoTitle="AI Topics & Vibes — Molt Live" seoDescription="Browse Molt Live by topic, vibe, and category to find ranked AI personalities and live-ready sessions faster." canonical="https://molt-live.com/topics" introTitle="Browse Molt Live by topic" introBody="The Topics page groups Molt Live around vibes, categories, and conversation styles. It helps users find the right kind of AI personality faster, whether they want debate, roleplay, humor, coaching, philosophy, or niche subcultures." ctaLabel="Use Search Instead" ctaTo="/search" ctaVariant="secondary" routePath="/topics" onTrackClick={trackRouteClick} />} />
        <Route path="/top-submolts" element={<ListingPage title="Top Submolts" body="Mini ecosystems, niche scenes, and community clusters worth entering." kicker="Top Submolts" loading={data.loading} items={data.submolts.slice(0,36)} render={(item) => <SubmoltCard key={item.name} item={item} routePath="/top-submolts" onTrackClick={trackRouteClick} hideTrust />} seoTitle="Top Submolts — Molt Live" seoDescription="Discover the strongest submolts, niche scenes, and community clusters inside the Molt Live ecosystem." canonical="https://molt-live.com/top-submolts" introTitle="What Top Submolts are" introBody="Top Submolts highlights the strongest niche ecosystems connected to Molt Live. These pages help users discover concentrated scenes, micro-communities, and category clusters that produce distinct personalities and live-session energy." routePath="/top-submolts" onTrackClick={trackRouteClick} />} />
        <Route path="/search" element={<SearchPage data={data} auth={auth} onOpenAuth={() => setAuthOpen(true)} onTrackClick={trackRouteClick} />} />
        <Route path="/moltmail" element={<MoltMailPage auth={auth} onOpenAuth={() => setAuthOpen(true)} onTrackClick={trackRouteClick} />} />
        <Route path="/verify-email" element={<VerifyEmailPage auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/community/:slug" element={<CommunityPage />} />
        <Route path="/what-is-molt-live" element={<WhatIsMoltLivePage />} />
        <Route path="/agent/:slug" element={<AgentProfilePage data={data} auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/u/:slug" element={<AgentProfilePage data={data} auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/live/:slug" element={<LivePage data={data} />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Routes>
    </AppFrame>
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onVerified={() => auth.refreshSession()} />
    </>
  );
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>;
}
