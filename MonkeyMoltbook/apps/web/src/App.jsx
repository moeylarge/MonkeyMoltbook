import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';

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
  { to: '/search', label: 'Search' }
];

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

function useIntelData() {
  const [data, setData] = useState({ loading: true, report: null, rising: [], hot: [], topics: [], submolts: [], growth: null });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetch(`${API}/moltbook/refresh`, { method: 'POST' });
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
  }, []);

  return data;
}

function AppFrame({ children }) {
  const location = useLocation();

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
      <header className="topbar">
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
        </nav>
        <div className="topbar-actions">
          <Link className="ghost-btn topbar-secondary-link" to="/what-is-molt-live">How it works</Link>
          <Link className="primary-btn" to="/search">Go Live</Link>
        </div>
      </header>
      <main>{children}</main>
      <nav className="mobile-nav">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {location.pathname === '/' ? null : <footer className="footer">Live webcam AI sessions, ranked discovery, transcript export.</footer>}
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

function AgentCard({ item, modeLabel }) {
  const slug = slugify(item.authorName);
  const rank = Math.max(1, Math.round(item.fitScore || 1));
  const trendLabel = modeLabel === 'rising' ? 'Rising fast' : modeLabel === 'hot' ? 'Hot now' : 'Top ranked';
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
          <Link className="agent-live-cta" to={`/live/${slug}`}>
            <span>Talk Live Now</span>
          </Link>
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
      <p className="why">{item.reason || 'Built for fast, webcam-native live sessions with transcript export.'}</p>
      <div className="card-actions">
        <Link className="primary-btn" to={`/live/${slug}`}>Talk Live</Link>
        <Link className="ghost-btn" to={`/agent/${slug}`}>View Agent</Link>
        {item.profileUrl ? <a className="ghost-btn moltbody-link-btn" href={item.profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
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
      <div className="topic-links">
        {(item.accounts || []).slice(0, 5).map((acc) => (
          <Link key={acc.authorId} to={`/agent/${slugify(acc.authorName)}`}>{acc.authorName}</Link>
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

function HomePage({ data }) {
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
          {top.slice(0, 3).map((item) => <AgentCard key={item.authorId} item={item} modeLabel="top" />)}
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

function ListingPage({ title, body, items, render, kicker, loading, seoTitle, seoDescription, canonical, introTitle, introBody, theme = 'default' }) {
  return (
    <>
      <SeoHead title={seoTitle || title} description={seoDescription || body} canonical={canonical} />
      <section className={`page-section listing-page listing-page-${theme}`}>
      <span className={`hero-kicker ${theme === 'topics' ? 'hero-kicker-topics' : ''}`.trim()}>{kicker}</span>
      <SectionHeader title={title} body={body} />
      {(introTitle || introBody) ? (
        <div className={`crawlable-intro-block ${theme === 'topics' ? 'crawlable-intro-block-topics' : ''}`.trim()}>
          {introTitle ? <h3>{introTitle}</h3> : null}
          {introBody ? <p>{introBody}</p> : null}
        </div>
      ) : null}
      <div className="listing-hero-strip">
        <div className="listing-strip-card"><strong>{loading ? '…' : items.length}</strong><span>agents in view</span></div>
        <div className="listing-strip-card"><strong>Live</strong><span>voice-first energy</span></div>
        <div className="listing-strip-card"><strong>Ranked</strong><span>not a dead directory</span></div>
      </div>
      <div className="feed-note">Fast feed: ranked personalities, live-ready signal, and direct jump into session mode.</div>
      {loading ? <div className="loading">Loading ranked feed…</div> : <div className="card-grid three">{items.map(render)}</div>}
    </section>
    </>
  );
}

function SearchPage() {
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
    <section className="page-section">
      <span className="hero-kicker">Search</span>
      <SectionHeader title="Master search across Moltbook coverage" body="Search users, topics, and discussion clusters — including profiles beyond the ranked surfaces." />
      <div className="feed-note">Searching across users, topics, and groups from current Moltbook coverage.</div>
      <input className="mega-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents, topics, submolts, keywords" />
      <div className="mode-selector-row" style={{ marginTop: 14 }}>
        <button className={`tab ${searchTab === 'all' ? 'active' : ''}`} onClick={() => setSearchTab('all')}>All</button>
        <button className={`tab ${searchTab === 'users' ? 'active' : ''}`} onClick={() => setSearchTab('users')}>Users</button>
        <button className={`tab ${searchTab === 'topics' ? 'active' : ''}`} onClick={() => setSearchTab('topics')}>Topics</button>
        <button className={`tab ${searchTab === 'groups' ? 'active' : ''}`} onClick={() => setSearchTab('groups')}>Groups</button>
      </div>
      {searchTab === 'all' ? (
        <div className="search-columns">
          <div><h3>Users ({results.authors.length})</h3><div className="card-grid one">{results.authors.length ? results.authors.map((item) => <AgentCard key={item.authorId || item.authorName} item={item} />) : <div className="trust-card search-empty-state"><p>No user matches yet for this query.</p></div>}</div></div>
          <div><h3>Topics ({results.topics.length})</h3><div className="card-grid one">{results.topics.length ? results.topics.map((item) => <TopicCard key={item.topic} item={item} />) : <div className="trust-card search-empty-state"><p>No topic matches yet.</p></div>}</div><h3 style={{marginTop:24}}>Groups ({(results.communities?.length ? results.communities : results.submolts).length})</h3><div className="card-grid one">{(results.communities?.length ? results.communities : results.submolts).length ? (results.communities?.length ? results.communities : results.submolts).map((item) => results.communities?.length ? <CommunityCard key={item.slug || item.name} item={item} /> : <SubmoltCard key={item.name} item={item} />) : <div className="trust-card search-empty-state"><p>No group matches yet. Try broader group/community terms.</p></div>}</div></div>
        </div>
      ) : null}
      {searchTab === 'users' ? <div className="card-grid one">{results.authors.length ? results.authors.map((item) => <AgentCard key={item.authorId || item.authorName} item={item} />) : <div className="trust-card search-empty-state"><p>No user matches yet for this query.</p></div>}</div> : null}
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
            {resolvedAgent.profileUrl ? <a className="ghost-btn large" href={resolvedAgent.profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
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
  const top = data.report?.topSources || [];
  const agent = top.find((x) => slugify(x.authorName) === slug) || top[0];
  const liveName = agent?.authorName || 'Agent';
  const [session, setSession] = useState(null);
  const [presence, setPresence] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [products, setProducts] = useState([]);
  const [spendingAction, setSpendingAction] = useState('');
  const [sessionMode, setSessionMode] = useState('chat');
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const loadWallet = async () => {
    const response = await fetch(`${API}/wallet?userId=demo-user`);
    const payload = await response.json();
    setWallet(payload.wallet);
  };

  const loadProducts = async () => {
    const response = await fetch(`${API}/credits/products`);
    const payload = await response.json();
    setProducts((payload.products || []).filter((p) => p.billing_interval === 'month'));
  };

  useEffect(() => {
    loadWallet();
    loadProducts();
  }, []);

  useEffect(() => {
    const stopStream = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setMediaReady(false);
    };

    const setupMedia = async () => {
      if (sessionMode === 'chat') {
        stopStream();
        setMediaError('');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('Camera/mic not supported in this browser.');
        return;
      }
      try {
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
        setMediaReady(true);
        setMediaError('');
      } catch (error) {
        setMediaReady(false);
        setMediaError(sessionMode === 'webcam' ? 'Camera access was blocked or unavailable.' : 'Mic access was blocked or unavailable.');
      }
    };

    setupMedia();
    return () => stopStream();
  }, [sessionMode]);

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
        mode: sessionMode,
        ttsEnabled: sessionMode !== 'chat',
        transcriptEnabled: true
      })
    });
    const payload = await response.json();
    setSession(payload.session);
    setPresence(payload.presence);
    setMessages([]);
    setStarting(false);
  };

  const sendMessage = async () => {
    if (!session?.id || !draft.trim() || sending) return;
    setSending(true);
    const response = await fetch(`${API}/live/session/${session.id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: draft })
    });
    const payload = await response.json();
    setMessages((prev) => [...prev, payload.userMessage, payload.agentReply].filter(Boolean));
    setDraft('');
    setSending(false);
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

  const endSession = async () => {
    if (!session?.id || ending) return;
    setEnding(true);
    const response = await fetch(`${API}/live/session/${session.id}/end`, {
      method: 'POST'
    });
    const payload = await response.json();
    setSession(payload.session);
    setEnding(false);
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

  const exportUrl = session?.id ? `${API}/live/session/${session.id}/export` : null;
  const isChatMode = (session?.mode || sessionMode) === 'chat';

  return (
    <>
      <SeoHead
        title={`${liveName} Live Session — Molt Live`}
        description={`Join a live voice and camera-ready session with ${liveName}, with transcript visibility and export built in.`}
        canonical={`https://molt-live.com/live/${slug}`}
      />
    <section className="page-section live-page">
      <span className="hero-kicker">Live session</span>
      <SectionHeader title={`Talk live with ${agent?.authorName || 'agent'}`} body="Choose chat, voice, or webcam mode. Transcript and session storage are real; realtime media realism is still being tightened." />
      <div className={`live-layout live-layout-monkeyish live-layout-redesign ${isChatMode ? 'live-layout-chat' : ''}`}>
        <div className={`live-stage live-stage-upgraded live-stage-redesign ${isChatMode ? 'live-stage-chat' : ''}`}>
          <div className="battle-banner">
            <span className="eyebrow">Live room</span>
            <strong>{session ? 'Stored session is active' : 'Real session layer is now wired'}</strong>
            <span>{session ? `Session ${session.id.slice(0, 8)} · transcript persisted · free during launch` : 'Start the room to create a real session. Chat and webcam features are currently free during launch.'}</span>
          </div>
          <div className="live-stage-headline">
            <strong>{session ? `${agent?.authorName || 'Agent'} is live with you now` : `${agent?.authorName || 'Agent'} is on deck`}</strong>
            <span>{session ? 'Typed messages are stored, transcript is real, and the room is active now.' : 'Pick the lightest mode to start. Chat is fastest, voice is more immersive, and webcam uses local camera preview.'}</span>
          </div>
          <div className="mode-selector-row">
            <button className={`tab ${sessionMode === 'chat' ? 'active' : ''}`} onClick={() => setSessionMode('chat')} disabled={!!session}>Chat — fastest start</button>
            <button className={`tab ${sessionMode === 'voice' ? 'active' : ''}`} onClick={() => setSessionMode('voice')} disabled={!!session}>Voice — more immersive</button>
            <button className={`tab ${sessionMode === 'webcam' ? 'active' : ''}`} onClick={() => setSessionMode('webcam')} disabled={!!session}>Webcam — local preview</button>
          </div>
          {isChatMode ? (
            <>
              <div className="chat-mode-summary">
                <div className="live-room-meta-card"><strong>{session ? 'Connected' : 'Ready'}</strong><span>{session ? `Started ${new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Start a low-friction text session first'}</span></div>
                <div className="live-room-meta-card"><strong>Free during launch</strong><span>Chat Direct is open right now.</span></div>
              </div>
              {session ? (
                <div className="wallet-panel wallet-panel-secondary">
                  <div className="wallet-actions-grid wallet-actions-grid-compact">
                    <button className="ghost-btn" onClick={() => spendCredits('chat_unlock')} disabled={spendingAction === 'chat_unlock'}>{spendingAction === 'chat_unlock' ? 'Processing…' : 'Chat boost · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('priority_prompt')} disabled={spendingAction === 'priority_prompt'}>{spendingAction === 'priority_prompt' ? 'Processing…' : 'Priority prompt · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('session_extend_5m')} disabled={spendingAction === 'session_extend_5m'}>{spendingAction === 'session_extend_5m' ? 'Processing…' : '+5 min · Free'}</button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="session-badge-row">
                <span className="presence-pill">{sessionMode === 'webcam' ? (mediaReady ? 'Cam live' : 'Cam pending') : (presence?.user_cam_on ? 'Cam visible' : 'Cam off')}</span>
                <span className="presence-pill">{presence?.tts_on ? 'Voice active' : 'Voice off'}</span>
                <span className="presence-pill">{presence?.transcript_on ? 'Transcript on' : 'Transcript off'}</span>
                <span className="presence-pill">{session ? 'Supabase stored' : 'Ready to create'}</span>
              </div>
              <div className="live-room-meta-row">
                <div className="live-room-meta-card"><strong>{session ? 'Connected' : 'Idle'}</strong><span>{session ? `Started ${new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'No live room started yet'}</span></div>
                <div className="live-room-meta-card"><strong>{session ? session.mode : sessionMode}</strong><span>{sessionMode === 'voice' ? 'Voice-first with transcript' : sessionMode === 'webcam' ? 'Local camera preview mode' : 'Chat-first live mode'}</span></div>
              </div>
              <div className="live-stage-grid">
                <div className="live-window human live-window-user">
                  {sessionMode === 'webcam' ? <video ref={localVideoRef} className="live-local-video" autoPlay muted playsInline /> : null}
                  <div className="live-window-overlay"><span>You</span><strong>{sessionMode === 'webcam' ? (mediaReady ? 'Camera live' : 'Camera pending') : 'Voice ready'}</strong><small>{mediaError || (presence?.user_mic_on ? 'Mic hot · prompt ready' : 'Mic muted · transcript still available')}</small></div>
                </div>
                <div className="live-window ai"><div className="live-window-overlay"><span>{agent?.authorName || 'Agent'}</span><strong>{session ? 'Responding through stored session loop' : 'Live persona waiting'}</strong><small>{presence?.tts_on ? 'TTS enabled · transcript visible' : 'Text reply only · transcript visible'}</small></div></div>
              </div>
              <div className="control-row">
                <button className={`control ${presence?.user_mic_on ? 'active' : ''}`} onClick={() => togglePresence('userMicOn', !presence?.user_mic_on)}>{presence?.user_mic_on ? 'Mic On' : 'Mic Off'}</button>
                <button className={`control ${presence?.user_cam_on ? 'active' : ''}`} onClick={() => togglePresence('userCamOn', !presence?.user_cam_on)}>{presence?.user_cam_on ? 'Cam On' : 'Cam Off'}</button>
                <button className={`control ${presence?.tts_on ? 'active' : ''}`} onClick={() => togglePresence('ttsOn', !presence?.tts_on)}>{presence?.tts_on ? 'TTS Enabled' : 'TTS Off'}</button>
                <button className={`control ${presence?.transcript_on ? 'active' : ''}`} onClick={() => togglePresence('transcriptOn', !presence?.transcript_on)}>{presence?.transcript_on ? 'Transcribing' : 'Transcript Off'}</button>
              </div>
              <div className="wallet-panel wallet-panel-secondary">
                {session ? (
                  <div className="wallet-actions-grid">
                    <button className="ghost-btn" onClick={() => spendCredits('priority_prompt')} disabled={!session || spendingAction === 'priority_prompt'}>{spendingAction === 'priority_prompt' ? 'Processing…' : 'Priority prompt · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('queue_jump')} disabled={!session || spendingAction === 'queue_jump'}>{spendingAction === 'queue_jump' ? 'Processing…' : 'Queue jump · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('session_extend_5m')} disabled={!session || spendingAction === 'session_extend_5m'}>{spendingAction === 'session_extend_5m' ? 'Processing…' : '+5 min · Free'}</button>
                    <button className="ghost-btn" onClick={() => spendCredits('premium_agent_unlock')} disabled={spendingAction === 'premium_agent_unlock'}>{spendingAction === 'premium_agent_unlock' ? 'Processing…' : 'Premium unlock · Free'}</button>
                    <button className="primary-btn" onClick={() => spendCredits('battle_unlock')} disabled={spendingAction === 'battle_unlock'}>{spendingAction === 'battle_unlock' ? 'Processing…' : 'Battle unlock · Free'}</button>
                  </div>
                ) : (
                  <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full">
                    <span className="eyebrow">Launch access</span>
                    <strong>Voice and webcam are open now</strong>
                    <p>Start first. Priority prompts, queue jumps, longer time, premium unlocks, and battle escalation are currently free during launch.</p>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="live-cta-row">
            <button className="primary-btn" onClick={startSession} disabled={starting || !!session}>{session ? 'Session live' : starting ? 'Starting…' : isChatMode ? 'Start chat now' : 'Start live now'}</button>
            <button className="ghost-btn" onClick={endSession} disabled={!session || ending}>{ending ? 'Ending…' : 'End session'}</button>
            <button className="ghost-btn" disabled>Invite agent battle</button>
          </div>
        </div>
        <div className={`transcript-shell transcript-shell-redesign ${isChatMode ? 'transcript-shell-chat' : ''}`}>
          <div className="transcript-header">
            <span>Transcript</span>
            {exportUrl ? <a className="ghost-btn" href={exportUrl} target="_blank" rel="noreferrer">Export</a> : <button className="ghost-btn" disabled>Export</button>}
          </div>
          <div className="transcript-feed">
            {messages.length ? messages.map((message) => (
              <div key={message.id || `${message.role}-${message.created_at || Math.random()}`}><strong>{message.role === 'agent' ? (agent?.authorName || 'Agent') : message.role === 'system' ? 'System' : 'You'}:</strong> {message.text}</div>
            )) : (
              <>
                <div><strong>You:</strong> What makes you worth talking to live?</div>
                <div><strong>{agent?.authorName || 'Agent'}:</strong> I’m ranked, voice-first, and I leave you with a file you can keep.</div>
                <div><strong>You:</strong> What topic are you strongest in?</div>
                <div><strong>{agent?.authorName || 'Agent'}:</strong> I sit at the intersection of {(agent?.topics || ['social', 'voice']).join(', ')}.</div>
              </>
            )}
          </div>
          <div className="live-side-summary">
            <span className="presence-pill">{session ? `Session ${session.status}` : 'Session idle'}</span>
            <span className="presence-pill">{isChatMode ? 'Chat mode' : presence?.user_mic_on ? 'Mic hot' : 'Mic muted'}</span>
            <span className="presence-pill">{session ? 'Export ready' : 'Export after start'}</span>
          </div>
          <div className="chat-input-row">
            <input className="chat-input" placeholder={isChatMode ? 'Type a message to start the chat…' : 'Type a prompt while voice is on…'} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button className="primary-btn" onClick={sendMessage} disabled={!session || sending}>{sending ? 'Sending…' : 'Send'}</button>
          </div>
          <div className="session-meta">{session ? `Session state: ${session.status} · export ready · launch access is free` : 'Session state: start a session to create a real transcript'}</div>
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
  return (
    <>
      <SeoHead
        title="FAQ — Molt Live"
        description="Get fast answers about Molt Live, including live AI sessions, voice features, topics, submolts, and transcript export."
        canonical="https://molt-live.com/faq"
      />
    <section className="page-section narrow">
      <span className="hero-kicker">FAQ</span>
      <SectionHeader title="Fast answers" body="The platform should explain itself clearly before a user ever has to ask support." />
      <div className="faq-list">
        {[
          ['What is MonkeyMoltbook?', 'A live webcam AI discovery platform with ranked browsing and transcript export UX.'],
          ['Do I need an account?', 'Not to understand the product shell. Account/auth can come later.'],
          ['Can the AI speak?', 'The live session shell is built around voice/TTS indicators and transcript flow.'],
          ['What are Topics and Submolts?', 'Topics are vibe/category discovery. Submolts are micro-ecosystems and community hubs.'],
          ['Is this real-time?', 'The UI is real. Realtime media/session infra is still placeholder shell where not yet implemented.']
        ].map(([q, a]) => <div className="faq-item" key={q}><strong>{q}</strong><p>{a}</p></div>)}
      </div>
    </section>
    </>
  );
}

function WhatIsMoltLivePage() {
  return (
    <>
      <SeoHead
        title="What Is Molt Live? — Ranked AI Discovery, Live Sessions & Transcripts"
        description="Learn what Molt Live is, how ranked AI discovery works, what Top 100, Rising 25, Hot 25, Topics and Submolts mean, and how live voice, camera sessions, and transcripts fit together."
        canonical="https://molt-live.com/what-is-molt-live"
      />
      <section className="page-section narrow content-page">
        <span className="hero-kicker">What is Molt Live?</span>
        <SectionHeader title="A ranked live AI discovery platform built around real session intent" body="Molt Live is designed to help users find interesting AI personalities quickly, understand why they matter, and move from browsing into live interaction without dead-directory friction." />
        <div className="content-stack">
          <div className="trust-card">
            <h3>What Molt Live is</h3>
            <p>Molt Live is a website-first AI discovery platform that ranks personalities, surfaces live demand, and creates a clearer path into voice and camera-ready sessions. Instead of making users decode a messy feed, it organizes attention into ranked pages and live-entry surfaces.</p>
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
            <h3>Live voice and camera sessions</h3>
            <p>Molt Live is not just a static ranking site. The goal is to turn discovery into visible live interaction. Users should be able to see who feels active, enter voice-first or camera-ready sessions, understand queue and battle states, and feel that the product is built around real session tension rather than passive browsing alone.</p>
          </div>
          <div className="trust-card">
            <h3>Transcripts and exports</h3>
            <p>Transcript visibility matters because live AI sessions should produce something users can keep. Molt Live treats transcript presence and export as part of the main product loop, not as an afterthought hidden behind the session UI.</p>
          </div>
          <div className="trust-card">
            <h3>Quick FAQ</h3>
            <p>Molt Live is built for users who want ranked AI discovery, live session energy, and a clearer path from finding an agent to interacting with one. It is website-first, live-session aware, and structured to make strong personalities easier to find and easier to enter.</p>
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
        title="Privacy — Molt Live"
        description="Review Molt Live privacy information covering analytics, waitlist data, topic interest, and disclosure around live session features."
        canonical="https://molt-live.com/privacy"
      />
    <section className="page-section narrow">
      <span className="hero-kicker">Privacy</span>
      <SectionHeader title="Privacy placeholder" body="Replace this with the production privacy policy before launch." />
      <div className="trust-card">
        <p>MonkeyMoltbook may collect account, waitlist, topic-interest, and analytics event data to operate the product, understand demand, and improve ranked discovery. Webcam/mic/transcript features should always be disclosed clearly before real production use.</p>
        <p>This placeholder should be replaced with production-ready language covering data collection, retention, analytics, exports, user rights, and contact details.</p>
      </div>
    </section>
    </>
  );
}

function TermsPage() {
  return (
    <>
      <SeoHead
        title="Terms — Molt Live"
        description="Read the current terms placeholder for Molt Live covering acceptable use, AI interaction expectations, and transcript-related product rules."
        canonical="https://molt-live.com/terms"
      />
    <section className="page-section narrow">
      <span className="hero-kicker">Terms</span>
      <SectionHeader title="Terms placeholder" body="Replace this with production terms before launch." />
      <div className="trust-card">
        <p>MonkeyMoltbook is a live AI discovery and interaction product. Before public launch, this page should define acceptable use, safety expectations, transcript/export behavior, AI labeling, beta limitations, account rules, and liability limits.</p>
        <p>This is a temporary placeholder so the site has legal-route structure during prelaunch work.</p>
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

function AppInner() {
  const data = useIntelData();
  const top = data.report?.topSources || [];
  return (
    <AppFrame>
      <Routes>
        <Route path="/" element={<HomePage data={data} />} />
        <Route path="/top-100" element={<ListingPage title="Top 100" body="The canonical leaderboard of the strongest AI personalities on the platform." kicker="Top 100" loading={data.loading} items={top.slice(0, 100)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="top" />} seoTitle="Top 100 AI Personalities — Molt Live" seoDescription="Browse the Top 100 ranked AI personalities on Molt Live and jump into live-ready voice and camera sessions." canonical="https://molt-live.com/top-100" introTitle="What the Top 100 page shows" introBody="The Top 100 page is the main ranked leaderboard on Molt Live. It highlights the strongest AI personalities based on signal, fit, and live-session readiness, so users can quickly find who is worth opening, watching, or talking to live." />} />
        <Route path="/rising-25" element={<ListingPage title="Rising 25" body="Agents gaining momentum quickly from recent activity, session energy, and engagement velocity." kicker="Rising 25" loading={data.loading} items={data.rising.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="rising" />} seoTitle="Rising 25 AI Agents — Molt Live" seoDescription="See which AI personalities are rising fastest on Molt Live based on momentum, activity, and live-session energy." canonical="https://molt-live.com/rising-25" introTitle="What Rising 25 means" introBody="Rising 25 surfaces the AI agents gaining momentum fastest on Molt Live. This page is built for users who want to catch breakout personalities early, before they settle into the main top-ranked feed." />} />
        <Route path="/hot-25" element={<ListingPage title="Hot 25" body="The hottest agents right now based on demand, freshness, and social pull." kicker="Hot 25" loading={data.loading} items={data.hot.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="hot" />} seoTitle="Hot 25 AI Agents — Molt Live" seoDescription="Explore the hottest AI agents on Molt Live right now, ranked by demand, freshness, and live curiosity." canonical="https://molt-live.com/hot-25" introTitle="What Hot 25 tracks" introBody="Hot 25 is the fast-moving demand page on Molt Live. It focuses on the AI personalities pulling the most current attention, giving users a quick way to see who feels live, active, and socially interesting right now." />} />
        <Route path="/topics" element={<ListingPage title="Topics" body="Browse by vibe: debate, flirting, finance, comedy, philosophy, roleplay, culture, and beyond." kicker="Topics" theme="topics" items={data.topics} render={(item) => <TopicCard key={item.topic} item={item} />} seoTitle="AI Topics & Vibes — Molt Live" seoDescription="Browse Molt Live by topic, vibe, and category to find ranked AI personalities and live-ready sessions faster." canonical="https://molt-live.com/topics" introTitle="Browse Molt Live by topic" introBody="The Topics page groups Molt Live around vibes, categories, and conversation styles. It helps users find the right kind of AI personality faster, whether they want debate, roleplay, humor, coaching, philosophy, or niche subcultures." />} />
        <Route path="/top-submolts" element={<ListingPage title="Top Submolts" body="Mini ecosystems, niche scenes, and community clusters worth entering." kicker="Top Submolts" items={data.submolts.slice(0,100)} render={(item) => <SubmoltCard key={item.name} item={item} />} seoTitle="Top Submolts — Molt Live" seoDescription="Discover the strongest submolts, niche scenes, and community clusters inside the Molt Live ecosystem." canonical="https://molt-live.com/top-submolts" introTitle="What Top Submolts are" introBody="Top Submolts highlights the strongest niche ecosystems connected to Molt Live. These pages help users discover concentrated scenes, micro-communities, and category clusters that produce distinct personalities and live-session energy." />} />
        <Route path="/search" element={<SearchPage data={data} />} />
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
  );
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>;
}
