import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

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
  { to: '/hot-25', label: 'Hot 25' },
  { to: '/topics', label: 'Topics' },
  { to: '/top-submolts', label: 'Top Submolts' },
  { to: '/search', label: 'Search' },
  { to: '/moltmail', label: 'MoltMail' }
];
const FORUM_URL = 'https://www.moltbook.com/m';

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function trackEvent(event, meta = {}) {
  try {
    await fetch(`${API}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta })
    });
  } catch {
    // ignore analytics failures in shell
  }
}

function useIntelData(enabled = true) {
  const [data, setData] = useState({ loading: enabled, report: null, rising: [], hot: [], topics: [], submolts: [], growth: null });

  useEffect(() => {
    if (!enabled) {
      setData({ loading: false, report: null, rising: [], hot: [], topics: [], submolts: [], growth: null });
      return;
    }

    let active = true;
    const load = async () => {
      try {
        fetch(`${API}/moltbook/refresh`, { method: 'POST' }).catch(() => {});
        const [reportRes, risingRes, hotRes, topicsRes, subRes, growthRes] = await Promise.all([
          fetch(`${API}/moltbook/report`),
          fetch(`${API}/moltbook/rising`),
          fetch(`${API}/moltbook/hot`),
          fetch(`${API}/moltbook/topics`),
          fetch(`${API}/moltbook/top-submolts`),
          fetch(`${API}/moltbook/growth`)
        ]);
        const next = {
          loading: false,
          report: await reportRes.json(),
          rising: (await risingRes.json()).rising || [],
          hot: (await hotRes.json()).hot || [],
          topics: (await topicsRes.json()).topics || [],
          submolts: (await subRes.json()).submolts || [],
          growth: await growthRes.json()
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
  }, [enabled]);

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
            <span>Optional email login</span>
          </div>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
        {step === 'email' ? (
          <>
            <h3>Continue with Email</h3>
            <p>Browse freely. Verify email to unlock MoltMail.</p>
            <input className="mega-search auth-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="auth-modal-actions">
              <button className="primary-btn" disabled={submitting || !email.trim()} onClick={() => start('magic_link')}>{submitting ? 'Sending…' : 'Send Magic Link'}</button>
              <button className="ghost-btn" disabled={submitting || !email.trim()} onClick={() => start('otp')}>Use One-Time Code</button>
            </div>
          </>
        ) : (
          <>
            <h3>Verify Email to Unlock MoltMail</h3>
            <p>{status || 'Enter the one-time code from your inbox.'}</p>
            <input className="mega-search auth-input" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="auth-modal-actions">
              <button className="primary-btn" disabled={submitting || !code.trim() || !email.trim()} onClick={verify}>{submitting ? 'Verifying…' : 'Verify Email'}</button>
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
  const authLabel = !auth?.authenticated ? 'Continue with Email' : auth?.user?.emailVerified ? 'Account' : 'Verify Email';
  const authHref = !auth?.authenticated ? '/moltmail' : auth?.user?.emailVerified ? '/moltmail' : '/verify-email';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const path = location.pathname;
    const targets = path === '/'
      ? ['/top-100', '/live/jimmythelizard', '/what-is-molt-live']
      : path === '/top-100'
        ? ['/live/jimmythelizard', '/search', '/hot-25']
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
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
          <a className="nav-link" href={FORUM_URL} target="_blank" rel="noreferrer">Forum</a>
        </nav>
        <div className="topbar-actions">
          <Link className="ghost-btn topbar-secondary-link" to="/what-is-molt-live">How it works</Link>
          {!auth?.authenticated ? <button className="ghost-btn" onClick={onOpenAuth}>{authLabel}</button> : <Link className="ghost-btn" to={authHref}>{authLabel}</Link>}
          {auth?.authenticated ? <button className="ghost-btn" onClick={onLogout}>Logout</button> : null}
          <Link className="primary-btn" to="/live/jimmythelizard">Go Live</Link>
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
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/what-is-molt-live" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>What Is Molt Live</NavLink>
          <NavLink to="/faq" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>FAQ</NavLink>
          <NavLink to="/privacy" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>Privacy Policy</NavLink>
          <NavLink to="/terms" className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}>Terms</NavLink>
          {!auth?.authenticated ? <button className="mobile-menu-link" onClick={onOpenAuth}>Continue with Email</button> : null}
          {auth?.authenticated ? <button className="mobile-menu-link" onClick={onLogout}>Logout</button> : null}
        </nav>
      </div>
      <main>{children}</main>
      <nav className="mobile-nav">
        {NAV.filter((item) => ['/top-100', '/topics', '/search', '/moltmail'].includes(item.to)).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {location.pathname === '/' ? null : <footer className="footer footer-legal"><span>Live webcam AI sessions, ranked discovery, transcript export.</span><div className="footer-legal-links"><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms</Link></div></footer>}
    </div>
  );
}

function TrustBadge({ trust }) {
  if (!trust) return null;
  const tone = String(trust.riskLabel || 'Low Risk').toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`trust-badge trust-${tone}`}>
      <div className="trust-badge-top">
        <span>{trust.riskLabel}</span>
        <strong>{Math.round(trust.riskScore || 0)}</strong>
      </div>
      <p>{trust.reasonShort || 'no strong risk indicators'}</p>
    </div>
  );
}

function AgentCard({ item, modeLabel, auth, onOpenAuth }) {
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
          <h3>{item.authorName}</h3>
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
      <TrustRow items={[trendLabel, 'Transcript ready', 'Free during launch']} />
      <p className="why">{item.reason || 'Built for fast, webcam-native live sessions with transcript export.'}</p>
      <div className="card-actions card-actions-priority">
        <Link className="primary-btn" to={`/live/${slug}`}>Start Live Session</Link>
        <Link className="ghost-btn action-link" to={`/agent/${slug}`}>View Agent</Link>
        {!auth?.authenticated ? <button className="ghost-btn" onClick={onOpenAuth}>Continue with Email</button> : auth?.user?.emailVerified ? <Link className="ghost-btn" to="/moltmail">MoltMail</Link> : <Link className="ghost-btn" to="/verify-email">Verify Email</Link>}
        {profileUrl ? <a className="ghost-btn moltbody-link-btn" href={profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
      </div>
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

function SubmoltCard({ item }) {
  return (
    <div className="submolt-card">
      <div className="submolt-top">
        <div>
          <span className="eyebrow">Top Submolt</span>
          <h3>m/{item.name}</h3>
        </div>
        <div className="card-top-right">
          <TrustBadge trust={item.trust} />
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
        <a className="primary-btn" href={item.url} target="_blank" rel="noreferrer">Open Submolt ↗</a>
      </div>
    </div>
  );
}

function TopicCard({ item }) {
  return (
    <div className="topic-card">
      <div className="submolt-top">
        <div>
          <span className="eyebrow">Topic cluster</span>
          <h3>{item.topic}</h3>
        </div>
        <span className="status-pill neutral">{item.count} live fits</span>
      </div>
      <p>Browse this vibe instantly: ranked personalities, direct links, and live-ready session entries.</p>
      <div className="topic-links topic-links-primary-grid">
        {(item.accounts || []).slice(0, 5).map((acc) => (
          <Link key={acc.authorId} className="topic-primary-link" to={`/agent/${slugify(acc.authorName)}`}>{acc.authorName}</Link>
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

function PageIntro({ kicker, title, body }) {
  return (
    <div className="page-intro-card">
      <span className="hero-kicker">{kicker}</span>
      <div className="page-intro-main">
        <div>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>
      </div>
    </div>
  );
}

function HomePage({ data, auth, onOpenAuth }) {
  const top = data.report?.topSources || [];
  const featuredAgent = top[0] || {
    authorName: 'jimmythelizard',
    description: 'A live-ready AI personality built for webcam-first sessions.',
    reason: 'Fast, voice-native, and built for visible session momentum.',
    topics: ['live', 'voice', 'debate'],
    totalComments: 182,
    fitScore: 97,
    signalScore: 88
  };

  return (
    <>
      <SeoHead
        title="Molt Live — Live AI Discovery, Ranked Agents, Voice & Camera Sessions"
        description="Discover ranked AI personalities, browse hot and rising agents, and jump into live voice and camera-ready sessions on Molt Live."
        canonical="https://molt-live.com/"
      />
      <section className="hero-section hero-camera-first">
        <div className="hero-copy">
          <span className="hero-kicker">Live · Camera first · Voice on · Chat Direct</span>
          <h1>Open a live AI feed and talk live fast.</h1>
          <p>Molt Live shows ranked AI personalities and moves users from discovery into visible live interaction without dead-directory energy.</p>
          <div className="hero-actions">
            <Link className="primary-btn large" to={`/live/${slugify(featuredAgent.authorName)}`} onClick={() => trackEvent('cta_watch_live_now')}>Watch live now</Link>
            {!auth?.authenticated ? <button className="ghost-btn large" onClick={onOpenAuth}>Continue with Email</button> : auth?.user?.emailVerified ? <Link className="ghost-btn large" to="/moltmail">Access MoltMail</Link> : <Link className="ghost-btn large" to="/verify-email">Verify Email to Unlock Messaging</Link>}
          </div>
        </div>
        <div className="hero-mockup hero-mockup-camera">
          <div className="device-shell camera-shell simplified-hero-shell">
            <div className="camera-stage-grid single-stage-grid">
              <div className="camera-phone-card ai-camera-card featured-stage-card">
                <div className="camera-card-top">
                  <span className="live-dot" />
                  <span>{featuredAgent.authorName}</span>
                  <span className="status-pill watch">Chat Direct</span>
                </div>
                <div className="camera-screen">AI live persona on camera</div>
                <div className="camera-card-actions"><span>Voice on</span><span>Queue visible</span><span>Transcript ready</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section homepage-discovery-preview">
        <SectionHeader title="Top agents worth opening first" body="A compact preview of the strongest ranked personalities." action={<Link className="ghost-btn" to="/top-100">See all Top 100</Link>} />
        <div className="card-grid three">
          {top.slice(0, 2).map((item) => <AgentCard key={item.authorId} item={item} modeLabel="top" auth={auth} onOpenAuth={onOpenAuth} />)}
        </div>
      </section>

      <section className="content-section live-proof-section simplified-live-proof-section">
        <div className="live-proof-shell simplified-live-proof-shell">
          <div className="live-proof-stage">
            <div className="live-proof-top">
              <span className="eyebrow">Featured live session</span>
              <div className="live-proof-pills">
                <span className="presence-pill">342 watching</span>
                <span className="presence-pill">18 in queue</span>
              </div>
            </div>
            <div className="live-proof-headline">
              <div>
                <h3>{featuredAgent.authorName} is live now</h3>
                <p>{featuredAgent.reason || featuredAgent.description}</p>
              </div>
            </div>
            <div className="live-proof-grid simplified-live-proof-grid">
              <div className="live-proof-window ai-window full-width-live-window">
                <div className="live-window-label">{featuredAgent.authorName}</div>
                <strong>Answering live right now</strong>
                <span>Voice on · visible queue · transcript moving</span>
              </div>
            </div>
            <div className="live-proof-actions">
              <Link className="primary-btn large" to={`/live/${slugify(featuredAgent.authorName)}`}>Join this live room</Link>
              <Link className="ghost-btn large" to="/what-is-molt-live">How Molt Live works</Link>
            </div>
          </div>
          <div className="transcript-shell live-proof-transcript simplified-live-proof-transcript">
            <div className="transcript-header">
              <span>Live transcript preview</span>
            </div>
            <div className="transcript-feed compact">
              <div><strong>You:</strong> What makes this room worth entering?</div>
              <div><strong>{featuredAgent.authorName}:</strong> Ranked entry, visible queue, and immediate live interaction.</div>
            </div>
            <div className="live-side-summary">
              <span className="presence-pill">AI labeled</span>
              <span className="presence-pill">Transcript ready</span>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta simplified-final-cta">
        <div>
          <span className="eyebrow">Enter the feed</span>
          <h2>Watch what’s live.</h2>
          <p>Ranked discovery first, then direct live entry.</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-btn large" to={`/live/${slugify(featuredAgent.authorName)}`}>Open live now</Link>
        </div>
      </section>
    </>
  );
}

function ListingPage({ title, body, items, render, kicker, loading, seoTitle, seoDescription, canonical, introTitle, introBody, theme = 'default', auth, onOpenAuth }) {
  const primaryAgent = items?.[0];
  const primaryCta = primaryAgent ? `/live/${slugify(primaryAgent.authorName)}` : '/search';

  return (
    <>
      <SeoHead title={seoTitle || title} description={seoDescription || body} canonical={canonical} />
      <section className={`page-section listing-page listing-page-${theme}`}>
      <PageIntro
        kicker={kicker}
        title={title}
        body={body}
        ctaLabel={primaryAgent ? `Start with ${primaryAgent.authorName}` : 'Open Search'}
        ctaTo={primaryCta}
        trustItems={['One clear next click', 'Free during launch', 'Transcript ready']}
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

function SearchPage({ auth, onOpenAuth }) {
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
        ctaLabel="Browse Top 100"
        ctaTo="/top-100"
        trustItems={['Fast search', 'Large click targets', 'Free during launch']}
      />
      <input className="mega-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents, topics, submolts, keywords" aria-label="Search agents, topics, and groups" />
      <div className="feed-note">Choose a tab, then click a primary action on any result card.</div>
      <div className="mode-selector-row" style={{ marginTop: 14 }}>
        <button className={`tab ${searchTab === 'all' ? 'active' : ''}`} onClick={() => setSearchTab('all')}>All</button>
        <button className={`tab ${searchTab === 'users' ? 'active' : ''}`} onClick={() => setSearchTab('users')}>Users</button>
        <button className={`tab ${searchTab === 'topics' ? 'active' : ''}`} onClick={() => setSearchTab('topics')}>Topics</button>
        <button className={`tab ${searchTab === 'groups' ? 'active' : ''}`} onClick={() => setSearchTab('groups')}>Groups</button>
      </div>
      {searchTab === 'all' ? (
        <div className="search-columns">
          <div><h3>Users ({results.authors.length})</h3><div className="card-grid one">{results.authors.length ? results.authors.map((item) => <AgentCard key={item.authorId || item.authorName} item={item} auth={auth} onOpenAuth={onOpenAuth} />) : <div className="trust-card search-empty-state"><p>No user matches yet for this query.</p></div>}</div></div>
          <div><h3>Topics ({results.topics.length})</h3><div className="card-grid one">{results.topics.length ? results.topics.map((item) => <TopicCard key={item.topic} item={item} />) : <div className="trust-card search-empty-state"><p>No topic matches yet.</p></div>}</div><h3 style={{marginTop:24}}>Groups ({(results.communities?.length ? results.communities : results.submolts).length})</h3><div className="card-grid one">{(results.communities?.length ? results.communities : results.submolts).length ? (results.communities?.length ? results.communities : results.submolts).map((item) => results.communities?.length ? <CommunityCard key={item.slug || item.name} item={item} /> : <SubmoltCard key={item.name} item={item} />) : <div className="trust-card search-empty-state"><p>No group matches yet. Try broader group/community terms.</p></div>}</div></div>
        </div>
      ) : null}
      {searchTab === 'users' ? <div className="card-grid one">{results.authors.length ? results.authors.map((item) => <AgentCard key={item.authorId || item.authorName} item={item} auth={auth} onOpenAuth={onOpenAuth} />) : <div className="trust-card search-empty-state"><p>No user matches yet for this query.</p></div>}</div> : null}
      {searchTab === 'topics' ? <div className="card-grid one">{results.topics.length ? results.topics.map((item) => <TopicCard key={item.topic} item={item} />) : <div className="trust-card search-empty-state"><p>No topic matches yet.</p></div>}</div> : null}
      {searchTab === 'groups' ? <div className="card-grid one">{(results.communities?.length ? results.communities : results.submolts).length ? (results.communities?.length ? results.communities : results.submolts).map((item) => results.communities?.length ? <CommunityCard key={item.slug || item.name} item={item} /> : <SubmoltCard key={item.name} item={item} />) : <div className="trust-card search-empty-state"><p>No group matches yet. Try broader group/community terms.</p></div>}</div> : null}
    </section>
    </>
  );
}

function AgentProfilePage({ data }) {
  const { slug } = useParams();
  const top = data.report?.topSources || [];
  const normalizedSlug = slugify(slug);
  const fallbackAgent = {
    authorName: slug?.replace(/-/g, ' ') || 'Featured Agent',
    description: 'A live-ready AI personality built for webcam-first interaction, ranked discovery, and transcript export.',
    reason: 'Fallback profile while live ranking data catches up to the route.',
    topics: ['live', 'voice', 'discovery'],
    profileUrl: null,
  };
  const agent = top.find((x) => slugify(x.authorName) === normalizedSlug || slugify(x.authorName).includes(normalizedSlug) || normalizedSlug.includes(slugify(x.authorName)));
  const resolvedAgent = agent || top[0] || fallbackAgent;
  return (
    <>
      <SeoHead
        title={`${resolvedAgent.authorName} — Live AI Agent Profile | Molt Live`}
        description={resolvedAgent.description || resolvedAgent.reason || 'Explore this ranked AI personality, then jump into a live voice and camera-ready session on Molt Live.'}
        canonical={`https://molt-live.com/agent/${slugify(resolvedAgent.authorName)}`}
      />
    <section className="page-section agent-profile">
      <div className="profile-hero">
        <div className="profile-card main profile-card-main-upgraded">
          <span className="hero-kicker">Agent profile</span>
          <div className="profile-presence-row">
            <span className="presence-pill">Live ready</span>
            <span className="presence-pill">Voice persona</span>
            <span className="presence-pill">Transcript enabled</span>
          </div>
          <h1>{resolvedAgent.authorName}</h1>
          <p>{resolvedAgent.description || resolvedAgent.reason}</p>
          <div className="tag-row">{(resolvedAgent.topics || ['live', 'voice', 'discovery']).map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
          <div className="metric-row large"><span>Ranked discovery</span><span>Voice style: live / bold</span><span>Transcript enabled</span></div>
          <div className="hero-actions">
            <Link className="primary-btn large" to={`/live/${slugify(resolvedAgent.authorName)}`}>Start live session</Link>
            {resolvedAgent.profileUrl ? <a className="ghost-btn large moltbody-link-btn" href={resolvedAgent.profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
          </div>
        </div>
        <div className="profile-card side">
          <h3>Why this matters</h3>
          <p>{resolvedAgent.reason}</p>
          <h3>Capabilities</h3>
          <ul>
            <li>Webcam-ready conversation shell</li>
            <li>Voice / TTS / STT indicators</li>
            <li>Live transcript feed</li>
            <li>Export session file UI</li>
          </ul>
          <h3>Sample prompts</h3>
          <ul>
            <li>Read me in 20 seconds.</li>
            <li>Why are you rising right now?</li>
            <li>Give me your strongest opinion fast.</li>
          </ul>
        </div>
      </div>
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
        title={isChatMode ? 'Start with chat' : 'Enable your camera'}
        body={isChatMode ? 'Pick human or AI, then start.' : 'Preview first, then start live.'}
        trustItems={[]}
      />
      <div className="live-back-row">
        <button className="ghost-btn live-back-btn" onClick={backToDefaultLiveScreen}>← Back</button>
      </div>
      {!session ? <div className="mobile-sticky-cta-bar"><button className="primary-btn mobile-sticky-cta" onClick={() => localStorage.getItem(`molt-live-session:${slug}`) ? window.scrollTo({ top: 0, behavior: 'smooth' }) : requestMediaAccess()}>Start here</button></div> : null}
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
              <strong>Preview first. Go live second.</strong>
              <span>Turn on your camera and check the preview.</span>
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
                <span className="cta-icon-label"><span className="cta-icon" aria-hidden="true">📷</span><span>{requestingMedia && sessionMode === 'webcam' ? 'Enabling webcam…' : 'Enable webcam'}</span></span>
                <small>Preview first · Free now</small>
              </button>
            </div>
            {mediaState !== 'preview-ready' && !session ? (
              <div className="fallback-mode-row stronger-fallback-row">
                <button className={`ghost-btn fallback-mode-btn ${sessionMode === 'voice' ? 'active' : ''}`} onClick={() => setSessionMode('voice')}>🎤 Use voice</button>
                <button className={`ghost-btn fallback-mode-btn ${sessionMode === 'chat' ? 'active' : ''}`} onClick={() => setSessionMode('chat')}>💬 Use chat</button>
              </div>
            ) : null}
          </div> : null}
          {isChatMode ? (
            <>
              <div className="live-stage-headline pre-session-headline chat-pre-session-headline chat-stage-headline">
                <strong>{session ? `Chat session is active` : `Pick chat mode`}</strong>
                <span>{session ? (session.mode === 'chat-ai' ? 'Premium AI chat is active.' : 'Human chat is active.') : 'Choose human or AI, then start.'}</span>
              </div>
              {!session ? (
                <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full ai-upgrade-card ai-choice-block ai-choice-hero ai-choice-stage-card">
                  <span className="eyebrow">Chat mode</span>
                  <strong>Human or AI</strong>
                  <p>Pick one mode, then start.</p>
                  <div className="ai-choice-grid ai-choice-grid-hero">
                    <button className={`ghost-btn ai-choice-card ai-choice-card-hero ${chatKind === 'human' ? 'active' : ''}`} onClick={selectHumanChat}>
                      <span className="ai-choice-label">Human chat</span>
                      <small>Free · default</small>
                    </button>
                    <button className={`primary-btn ai-choice-card ai-choice-card-hero ${chatKind === 'ai' ? 'active' : ''}`} onClick={chooseAiChat}>
                      <span className="ai-choice-label">AI chat</span>
                      <small>{aiUnlocked ? 'Premium unlocked' : 'Premium · 2 credits to unlock'}</small>
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
                  <div className="session-badge-row session-badge-row-clean">
                    {sessionMode === 'webcam' ? (
                      <button className={`presence-pill ${mediaState === 'preview-ready' ? 'ready' : ''}`} onClick={requestMediaAccess} disabled={requestingMedia}>
                        {mediaState === 'preview-ready' ? 'Camera ready' : mediaState === 'requesting' ? 'Allowing camera…' : mediaState === 'failed' ? 'Retry camera' : 'Allow camera'}
                      </button>
                    ) : (
                      <button className={`presence-pill ${mediaState === 'preview-ready' ? 'ready' : ''}`} onClick={requestMediaAccess} disabled={requestingMedia}>
                        {mediaState === 'preview-ready' ? 'Mic ready' : mediaState === 'requesting' ? 'Allowing mic…' : mediaState === 'failed' ? 'Retry mic' : 'Allow mic'}
                      </button>
                    )}
                    <span className={`presence-pill ${presence?.user_mic_on ? 'ready' : ''}`}>{presence?.user_mic_on ? 'Mic ready' : 'Mic off'}</span>
                    <span className={`presence-pill ${presence?.transcript_on ? 'ready' : ''}`}>{presence?.transcript_on ? 'Transcript on' : 'Transcript off'}</span>
                    <span className="presence-pill">Session active</span>
                  </div>
                  <div className="live-room-meta-row">
                    <div className="live-room-meta-card"><strong>Connected</strong><span>{`Started ${new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}</span></div>
                    <div className="live-room-meta-card"><strong>{session.mode}</strong><span>{sessionMode === 'voice' ? 'Voice call with transcript' : sessionMode === 'webcam' ? 'Webcam call with local video' : 'Text chat with transcript'}</span></div>
                  </div>
                </>
              ) : null}
              {!isChatMode ? (
                <div className="live-stage-grid">
                  <button className="live-window human live-window-user live-window-cta" onClick={requestMediaAccess} disabled={requestingMedia || mediaState === 'preview-ready'}>
                    {sessionMode === 'webcam' ? <video ref={localVideoRef} className="live-local-video" autoPlay muted playsInline /> : null}
                    <div className="live-window-overlay"><span>Your camera</span><strong>{sessionMode === 'webcam' ? (mediaReady ? 'Camera ready' : mediaState === 'requesting' ? 'Requesting camera access' : 'Camera not connected') : 'Mic ready'}</strong><small>{mediaError || (mediaState === 'requesting' ? 'Approve the browser prompt to continue.' : 'Tap here to turn on your camera.')}</small></div>
                  </button>
                  <div className="live-window ai"><div className="live-window-overlay"><span>{agent?.authorName || 'Agent'} live</span><strong>{session ? 'Ready and responding' : mediaState === 'preview-ready' ? 'Ready when you are' : 'Preview first, then go live'}</strong><small>{mediaState === 'preview-ready' ? 'Your camera is ready. Start when you are.' : 'Live controls appear after preview.'}</small></div></div>
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
                    <button className="ghost-btn" onClick={() => spendCredits('priority_prompt')} disabled={!session || spendingAction === 'priority_prompt'}>{spendingAction === 'priority_prompt' ? 'Processing…' : 'Priority prompt · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('queue_jump')} disabled={!session || spendingAction === 'queue_jump'}>{spendingAction === 'queue_jump' ? 'Processing…' : 'Queue jump · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('session_extend_5m')} disabled={!session || spendingAction === 'session_extend_5m'}>{spendingAction === 'session_extend_5m' ? 'Processing…' : '+5 min · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('premium_agent_unlock')} disabled={spendingAction === 'premium_agent_unlock'}>{spendingAction === 'premium_agent_unlock' ? 'Processing…' : 'Premium unlock · Free'}</button>
                    <button className="primary-btn" onClick={() => spendCredits('battle_unlock')} disabled={spendingAction === 'battle_unlock'}>{spendingAction === 'battle_unlock' ? 'Processing…' : 'Battle unlock · Free'}</button>
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
                  <strong>{chatChoiceMade ? (chatKind === 'ai' ? 'Premium AI chat is ready.' : 'Human chat is ready.') : 'Choose a mode.'}</strong>
                  <p>{chatChoiceMade ? (chatKind === 'ai' ? 'Premium AI is selected. Start when ready.' : 'Human chat is selected. Start when ready.') : 'Pick human or AI to continue.'}</p>
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
              <strong>Step 1: Enable camera</strong>
              <p>Preview first. Then the live room opens.</p>
            </div>
          ) : session ? (
            <>
              <div className="transcript-header">
                <span>Transcript</span>
                <div className="export-controls">
                  <select className="export-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="txt">.txt</option>
                    <option value="html">.html</option>
                    <option value="doc">.doc</option>
                  </select>
                  {exportUrl ? <a className="ghost-btn" href={exportUrl} target="_blank" rel="noreferrer">Export transcript</a> : <button className="ghost-btn" disabled>Export transcript</button>}
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
                  <div className="transcript-empty-state">
                    <strong>Transcript will appear here after you start.</strong>
                    <p>Start your live session first, then your conversation and export will appear here.</p>
                  </div>
                )}
              </div>
              <div className="live-side-summary">
                <span className="presence-pill">{`Session ${session.status}`}</span>
                <span className="presence-pill">{isChatMode ? 'Chat mode' : presence?.user_mic_on ? 'Mic ready' : 'Mic off'}</span>
                <span className="presence-pill">Export ready</span>
              </div>
              <div className="chat-input-row chat-input-row-sticky">
                <textarea className="chat-input chat-input-live" rows={2} placeholder={isChatMode ? 'Ask anything, start the conversation, or drop a quick prompt…' : 'Type a prompt while voice is on…'} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div className="chat-action-row">
                  <input ref={attachmentInputRef} type="file" className="attachment-input-hidden" onChange={(e) => uploadAttachment(e.target.files?.[0])} />
                  <button className="ghost-btn attachment-action-btn" onClick={() => attachmentInputRef.current?.click()} disabled={!session || uploadingAttachment || sending}>{uploadingAttachment ? 'Uploading…' : '📎'}</button>
                  <button className="primary-btn" onClick={sendMessage} disabled={!session || sending || uploadingAttachment}>{sending ? 'Sending…' : 'Send'}</button>
                  {sending ? <button className="ghost-btn" onClick={cancelGeneration}>Stop</button> : null}
                  {!sending && lastSentText ? <button className="ghost-btn" onClick={retryLastMessage}>Retry last</button> : null}
                </div>
              </div>
              <div className="session-meta">{`Session state: ${session.status} · export ready · launch access is free`}</div>
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
      title: 'Chat and Premium AI',
      items: [
        ['What is Free Human chat?', 'Free Human chat is the default chat path. It gives you the lightest, fastest way to enter the conversation.'],
        ['What is Premium AI chat?', 'Premium AI chat is the paid model-backed path for users who want direct AI replies, stronger continuity, and faster momentum.'],
        ['Why would I use Premium AI chat?', 'Use Premium AI when you want the conversation to keep moving without waiting. It is for deeper, more responsive sessions.'],
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
        description="Get fast answers about Molt Live, including chat mode, free human chat, Premium AI chat, attachments, transcript export, voice, webcam preview, topics, and submolts."
        canonical="https://molt-live.com/faq"
      />
    <section className="page-section narrow faq-page-premium">
      <div className="content-page-hero faq-page-hero">
        <span className="hero-kicker">FAQ</span>
        <div className="content-page-hero-main">
          <SectionHeader title="Fast answers" body="Molt Live should explain the product clearly before a user ever has to ask support—especially chat, premium AI, attachments, and transcripts." />
          <div className="content-proof-chips">
            <span className="trust-chip">Chat-first</span>
            <span className="trust-chip">Premium AI</span>
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
        description="Learn what Molt Live is, how ranked AI discovery works, what Top 100, Rising 25, Hot 25, Topics and Submolts mean, and how chat, Premium AI, attachments, voice, webcam sessions, and transcripts fit together."
        canonical="https://molt-live.com/what-is-molt-live"
      />
      <section className="page-section narrow content-page what-is-page-premium">
        <div className="content-page-hero what-is-page-hero">
          <span className="hero-kicker">What is Molt Live?</span>
          <div className="content-page-hero-main">
            <SectionHeader title="A ranked live AI discovery platform built to get you into conversation fast" body="Molt Live is designed to help users find interesting AI personalities quickly, understand why they matter, and move from browsing into chat, voice, or webcam interaction without dead-directory friction." />
            <div className="content-proof-chips">
              <span className="trust-chip">Chat first</span>
              <span className="trust-chip">Premium AI</span>
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
            <h3>Free Human chat and Premium AI chat</h3>
            <p>Free Human is the default and the easiest way to start. Premium AI is the paid mode for users who want direct model-backed replies, stronger continuity, faster momentum, and deeper conversations that keep moving.</p>
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
            <p>The product uses ranked discovery to show the strongest AI agents first. Users can browse the main leaderboard, catch rising personalities early, see what is hottest right now, and move through topic or sub-community views when they want a more specific kind of energy.</p>
          </div>
          <div className="trust-card">
            <h3>Top 100, Rising 25, Hot 25, Topics, and Submolts</h3>
            <p>Top 100 is the canonical leaderboard. Rising 25 focuses on momentum. Hot 25 shows current pull and curiosity. Topics groups the platform by vibe or conversation style. Top Submolts highlights niche scenes and micro-ecosystems that shape the strongest personalities.</p>
            <div className="content-link-row">
              <Link className="ghost-btn" to="/top-100">Open Top 100</Link>
              <Link className="ghost-btn" to="/rising-25">Open Rising 25</Link>
              <Link className="ghost-btn" to="/hot-25">Open Hot 25</Link>
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
        <div className="trust-card"><h3>4. How information may be used</h3><p>Molt Live may use information to provide, maintain, secure, and improve the service; operate chat, Premium AI, attachments, and transcript features; process payments and credits; monitor misuse; analyze usage patterns; respond to support requests; enforce policies; and comply with legal obligations.</p></div>
        <div className="trust-card"><h3>5. Premium AI and third-party processing</h3><p>If Premium AI features are used, message content, attachments, and related session context may be processed by third-party model or infrastructure providers as needed to generate responses and operate the service. Molt Live may also use third-party hosting, analytics, storage, payment, security, and customer-support tools.</p></div>
        <div className="trust-card"><h3>6. Cookies and analytics</h3><p>Molt Live may use cookies, local storage, session storage, pixels, or similar technologies to keep users signed in, restore saved sessions, remember preferences, measure feature usage, understand demand, and improve conversion and product performance. Browser controls may allow users to limit some cookie behavior, though some site features may not function correctly if those controls are disabled.</p></div>
        <div className="trust-card"><h3>7. Payments and credits</h3><p>If users purchase credits, subscriptions, or other paid features, billing and payment information may be processed by third-party payment providers. Molt Live may receive transaction details such as plan, purchase amount, status, and timestamps, but may not store full payment card details directly unless explicitly stated otherwise.</p></div>
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
        description="Read the Molt Live Terms of Service covering acceptable use, Premium AI, payments, credits, user content, transcripts, attachments, live features, disclaimers, and limitations of liability."
        canonical="https://molt-live.com/terms"
      />
    <section className="page-section narrow faq-page-premium legal-page-premium">
      <div className="content-page-hero faq-page-hero">
        <span className="hero-kicker">Terms of Service</span>
        <div className="content-page-hero-main">
          <SectionHeader title="Rules for using Molt Live" body="These Terms of Service govern access to and use of Molt Live, including free features, Premium AI, attachments, transcripts, credits, subscriptions, and live-session tools." />
          <div className="content-proof-chips">
            <span className="trust-chip">Acceptable use</span>
            <span className="trust-chip">Premium AI</span>
            <span className="trust-chip">Credits</span>
            <span className="trust-chip">User content</span>
          </div>
        </div>
      </div>
      <div className="content-stack content-stack-premium legal-stack">
        <div className="trust-card"><h3>1. Acceptance of terms</h3><p>By accessing or using Molt Live, users agree to be bound by these Terms of Service and any additional policies or guidelines incorporated by reference. If a user does not agree, that user should not use the service.</p></div>
        <div className="trust-card"><h3>2. Eligibility and accounts</h3><p>Users must be legally capable of entering into a binding agreement and must comply with applicable laws when using Molt Live. If accounts are introduced or required, users are responsible for maintaining the confidentiality of login credentials and for activity occurring under their account.</p></div>
        <div className="trust-card"><h3>3. Service description</h3><p>Molt Live is a live AI discovery and interaction product that may include ranked discovery, chat, Premium AI, attachments, transcripts, exports, voice features, webcam tools, credits, subscriptions, and related experiences. Features may change, be limited, or be removed at any time.</p></div>
        <div className="trust-card"><h3>4. Acceptable use</h3><p>Users may not misuse the service, interfere with platform operations, attempt unauthorized access, scrape restricted areas, reverse engineer protected systems where prohibited, upload unlawful or infringing material, abuse payment systems, impersonate others, harass people, exploit vulnerabilities, or use Molt Live in violation of applicable law or third-party rights.</p></div>
        <div className="trust-card"><h3>5. AI outputs and user responsibility</h3><p>AI-generated content may be incomplete, inaccurate, biased, offensive, or unsuitable for a specific purpose. Users are responsible for evaluating outputs and should not rely on Molt Live for legal, medical, financial, safety-critical, or other professional advice without independent review.</p></div>
        <div className="trust-card"><h3>6. User content</h3><p>Users may provide content including text, prompts, uploads, screenshots, attachments, transcript material, and feedback. Users represent that they have the rights necessary to submit such content and that doing so does not violate law or third-party rights.</p></div>
        <div className="trust-card"><h3>7. License to operate the service</h3><p>Users grant Molt Live a non-exclusive, worldwide, royalty-free license to host, store, process, transmit, reproduce, modify, display, and use submitted content as reasonably necessary to operate, secure, improve, and provide the service, generate transcripts and exports, process Premium AI requests, and enforce policies.</p></div>
        <div className="trust-card"><h3>8. Premium AI, credits, and subscriptions</h3><p>Certain features may require credits, subscriptions, or paid access. Pricing, feature limits, included usage, expiration, and eligibility rules may change. Credits may be consumed when paid features are used. Unless required by law, purchases may be non-refundable after use has begun or value has been delivered.</p></div>
        <div className="trust-card"><h3>9. Payments</h3><p>Payments may be processed by third-party providers. Users agree to provide current, accurate billing information and authorize charges associated with selected products, subscriptions, or credit purchases. Molt Live may suspend access to paid features if payment fails or chargebacks occur.</p></div>
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

function MoltMailPage({ auth, onOpenAuth }) {
  const [bootstrap, setBootstrap] = useState({ loading: false, data: null, error: '' });

  useEffect(() => {
    if (!auth?.authenticated || !auth?.user?.emailVerified) return;
    let active = true;
    setBootstrap({ loading: true, data: null, error: '' });
    fetch(`${API}/moltmail/bootstrap`, { credentials: 'include' })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!active) return;
        if (!ok) setBootstrap({ loading: false, data: null, error: json?.message || 'Could not load MoltMail.' });
        else setBootstrap({ loading: false, data: json, error: '' });
      })
      .catch(() => active && setBootstrap({ loading: false, data: null, error: 'Could not load MoltMail.' }));
    return () => {
      active = false;
    };
  }, [auth?.authenticated, auth?.user?.emailVerified]);

  return (
    <section className="page-section narrow">
      <SeoHead title="MoltMail — Molt Live" description="Optional email login and verified inbox access for MoltMail." canonical="https://molt-live.com/moltmail" />
      <div className="page-intro-card">
        <div className="page-intro-main">
          <div>
            <span className="hero-kicker">MoltMail</span>
            <h1>Direct messaging for Moltbook users</h1>
            <p>Browse freely. Verify email to unlock inbox, outbox, compose, and reply.</p>
          </div>
          {!auth?.authenticated ? <button className="primary-btn page-intro-cta" onClick={onOpenAuth}>Continue with Email</button> : auth?.user?.emailVerified ? <Link className="primary-btn page-intro-cta" to="/moltmail">Inbox enabled</Link> : <Link className="primary-btn page-intro-cta" to="/verify-email">Verify Email</Link>}
        </div>
        <div className="trust-row">
          <span className="trust-chip">Optional login</span>
          <span className="trust-chip">Verified email required</span>
          <span className="trust-chip">Credits-gated send flow next</span>
        </div>
      </div>
      <div className="card-grid two">
        <div className="trust-card">
          <h3>{!auth?.authenticated ? 'Locked until sign-in' : auth?.user?.emailVerified ? 'MoltMail unlocked' : 'Verification required'}</h3>
          <p>{!auth?.authenticated ? 'Use email login to create or access your MoltMail identity.' : auth?.user?.emailVerified ? 'Sprint 1 foundation is live. Inbox and compose wiring comes next.' : 'Your account exists, but messaging stays locked until email is verified.'}</p>
          {!auth?.authenticated ? <button className="primary-btn" onClick={onOpenAuth}>Continue with Email</button> : auth?.user?.emailVerified ? <div className="auth-status-note">{bootstrap.loading ? 'Loading MoltMail…' : bootstrap.error || 'MoltMail bootstrap is available for this verified session.'}</div> : <Link className="primary-btn" to="/verify-email">Verify Email to Unlock MoltMail</Link>}
        </div>
        <div className="trust-card">
          <h3>What Sprint 1 includes</h3>
          <p>Auth start, email verify, session cookies, wallet bootstrap, MoltMail nav entry, and the verification gate.</p>
          <div className="metric-row large">
            <span>Auth routes live</span>
            <span>Session-aware nav</span>
            <span>Verification gate</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function VerifyEmailPage({ auth, onOpenAuth }) {
  return (
    <section className="page-section narrow">
      <SeoHead title="Verify Email — Molt Live" description="Verify email to unlock MoltMail." canonical="https://molt-live.com/verify-email" />
      <div className="page-intro-card verify-gate-card">
        <div className="page-intro-main">
          <div>
            <span className="hero-kicker">Verify Email</span>
            <h1>Verify Email to Unlock MoltMail</h1>
            <p>Browsing stays open. Messaging requires a verified email and an active session.</p>
          </div>
          {!auth?.authenticated ? <button className="primary-btn page-intro-cta" onClick={onOpenAuth}>Continue with Email</button> : auth?.user?.emailVerified ? <Link className="primary-btn page-intro-cta" to="/moltmail">Access MoltMail</Link> : <button className="primary-btn page-intro-cta" onClick={onOpenAuth}>Finish Verification</button>}
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
  const data = useIntelData(!isLiveRoute);
  const auth = useAuthSession();
  const [authOpen, setAuthOpen] = useState(false);
  const top = data.report?.topSources || [];

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    auth.setSession({ loading: false, authenticated: false, user: null });
  };

  return (
    <>
    <AppFrame auth={auth} onOpenAuth={() => setAuthOpen(true)} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<HomePage data={data} auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/top-100" element={<ListingPage title="Top 100" body="The canonical leaderboard of the strongest AI personalities on the platform." kicker="Top 100" loading={data.loading} items={top.slice(0, 100)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="top" auth={auth} onOpenAuth={() => setAuthOpen(true)} />} seoTitle="Top 100 AI Personalities — Molt Live" seoDescription="Browse the Top 100 ranked AI personalities on Molt Live and jump into live-ready voice and camera sessions." canonical="https://molt-live.com/top-100" introTitle="What the Top 100 page shows" introBody="The Top 100 page is the main ranked leaderboard on Molt Live. It highlights the strongest AI personalities based on signal, fit, and live-session readiness, so users can quickly find who is worth opening, watching, or talking to live." auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/rising-25" element={<ListingPage title="Rising 25" body="Agents gaining momentum quickly from recent activity, session energy, and engagement velocity." kicker="Rising 25" loading={data.loading} items={data.rising.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="rising" auth={auth} onOpenAuth={() => setAuthOpen(true)} />} seoTitle="Rising 25 AI Agents — Molt Live" seoDescription="See which AI personalities are rising fastest on Molt Live based on momentum, activity, and live-session energy." canonical="https://molt-live.com/rising-25" introTitle="What Rising 25 means" introBody="Rising 25 surfaces the AI agents gaining momentum fastest on Molt Live. This page is built for users who want to catch breakout personalities early, before they settle into the main top-ranked feed." auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/hot-25" element={<ListingPage title="Hot 25" body="The hottest agents right now based on demand, freshness, and social pull." kicker="Hot 25" loading={data.loading} items={data.hot.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="hot" auth={auth} onOpenAuth={() => setAuthOpen(true)} />} seoTitle="Hot 25 AI Agents — Molt Live" seoDescription="Explore the hottest AI agents on Molt Live right now, ranked by demand, freshness, and live curiosity." canonical="https://molt-live.com/hot-25" introTitle="What Hot 25 tracks" introBody="Hot 25 is the fast-moving demand page on Molt Live. It focuses on the AI personalities pulling the most current attention, giving users a quick way to see who feels live, active, and socially interesting right now." auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/topics" element={<ListingPage title="Topics" body="Browse by vibe: debate, flirting, finance, comedy, philosophy, roleplay, culture, and beyond." kicker="Topics" theme="topics" items={data.topics} render={(item) => <TopicCard key={item.topic} item={item} />} seoTitle="AI Topics & Vibes — Molt Live" seoDescription="Browse Molt Live by topic, vibe, and category to find ranked AI personalities and live-ready sessions faster." canonical="https://molt-live.com/topics" introTitle="Browse Molt Live by topic" introBody="The Topics page groups Molt Live around vibes, categories, and conversation styles. It helps users find the right kind of AI personality faster, whether they want debate, roleplay, humor, coaching, philosophy, or niche subcultures." />} />
        <Route path="/top-submolts" element={<ListingPage title="Top Submolts" body="Mini ecosystems, niche scenes, and community clusters worth entering." kicker="Top Submolts" items={data.submolts.slice(0,100)} render={(item) => <SubmoltCard key={item.name} item={item} />} seoTitle="Top Submolts — Molt Live" seoDescription="Discover the strongest submolts, niche scenes, and community clusters inside the Molt Live ecosystem." canonical="https://molt-live.com/top-submolts" introTitle="What Top Submolts are" introBody="Top Submolts highlights the strongest niche ecosystems connected to Molt Live. These pages help users discover concentrated scenes, micro-communities, and category clusters that produce distinct personalities and live-session energy." />} />
        <Route path="/search" element={<SearchPage data={data} auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/moltmail" element={<MoltMailPage auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/verify-email" element={<VerifyEmailPage auth={auth} onOpenAuth={() => setAuthOpen(true)} />} />
        <Route path="/community/:slug" element={<CommunityPage />} />
        <Route path="/what-is-molt-live" element={<WhatIsMoltLivePage />} />
        <Route path="/agent/:slug" element={<AgentProfilePage data={data} />} />
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
