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
          <Link className="primary-btn" to="/live/jimmythelizard">Go Live</Link>
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
          <Link className="agent-live-cta" to={`/live/${slug}`}>
            <span>Start Live Session</span>
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
      <TrustRow items={[trendLabel, 'Transcript ready', 'Free during launch']} />
      <p className="why">{item.reason || 'Built for fast, webcam-native live sessions with transcript export.'}</p>
      <div className="card-actions card-actions-priority">
        <Link className="primary-btn" to={`/live/${slug}`}>Start Live Session</Link>
        <Link className="ghost-btn action-link" to={`/agent/${slug}`}>View Agent</Link>
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

function PageIntro({ kicker, title, body, ctaLabel, ctaTo, trustItems = [] }) {
  return (
    <div className="page-intro-card">
      <span className="hero-kicker">{kicker}</span>
      <div className="page-intro-main">
        <div>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>
        {ctaLabel && ctaTo ? <Link className="primary-btn large page-intro-cta" to={ctaTo}>{ctaLabel}</Link> : null}
      </div>
      {trustItems.length ? <TrustRow items={trustItems} /> : null}
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
      <div className="listing-hero-strip">
        <div className="listing-strip-card"><strong>{loading ? '…' : items.length}</strong><span>ready to open</span></div>
        <div className="listing-strip-card"><strong>Live</strong><span>click any primary card button</span></div>
        <div className="listing-strip-card"><strong>Simple</strong><span>ranked list with one main action</span></div>
      </div>
      <div className="feed-note">Pick one agent and click Start Live Session.</div>
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
  const navigate = useNavigate();
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
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const streamAbortRef = useRef(null);

  const loadWallet = async () => {
    const response = await fetch(`${API}/wallet?userId=demo-user`);
    const payload = await response.json();
    setWallet(payload.wallet);
  };

  const selectHumanChat = () => {
    setChatKind('human');
    setChatChoiceMade(true);
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
      setWallet(payload.wallet);
    }
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
    if (!session?.id || !draft.trim() || sending) return;
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

  const resetToDefaultLiveEntry = () => {
    setSession(null);
    setPresence(null);
    setMessages([]);
    setDraft('');
    setSessionMode('webcam');
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
    localStorage.removeItem(`molt-live-session:${slug}`);
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

  useEffect(() => {
    const restoreSession = async () => {
      const savedId = localStorage.getItem(`molt-live-session:${slug}`);
      if (!savedId || session) return;
      try {
        const response = await fetch(`${API}/live/session/${savedId}`);
        const payload = await response.json();
        if (payload?.session?.status === 'active') {
          setSession(payload.session);
          setPresence(payload.presence || null);
          await loadTranscript(savedId);
        }
      } catch {}
    };
    restoreSession();
  }, [slug, session]);

  const exportUrl = session?.id ? `${API}/live/session/${session.id}/export?format=${encodeURIComponent(exportFormat)}` : null;
  const isChatMode = (session?.mode || sessionMode) === 'chat';

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
        title="Preview your camera first"
        body="Enable webcam, preview yourself, then go live."
        trustItems={[]}
      />
      <div className="live-back-row">
        <button className="ghost-btn live-back-btn" onClick={() => navigate(-1)}>← Back</button>
      </div>
      <div className={`live-layout live-layout-monkeyish live-layout-redesign ${isChatMode ? 'live-layout-chat' : ''}`}>
        <div className={`live-stage live-stage-upgraded live-stage-redesign ${isChatMode ? 'live-stage-chat' : ''}`}>
          {session ? (
            <>
              <div className="battle-banner live-banner-clean">
                <span className="eyebrow">Live room</span>
                <strong>Session is active</strong>
                <span>{`Session ${session.id.slice(0, 8)} · transcript saved · free during launch`}</span>
              </div>
              <div className="live-stage-headline">
                <strong>{`${agent?.authorName || 'Agent'} is live with you now`}</strong>
                <span>Your session is active. Transcript and export are ready.</span>
              </div>
            </>
          ) : (
            <div className="live-stage-headline pre-session-headline">
              <strong>Preview first. Go live second.</strong>
              <span>Enable webcam, approve access, and make sure your preview looks right before entering the live room.</span>
            </div>
          )}
          {!isChatMode ? <div className="mode-section">
            <div className="mode-section-copy webcam-mode-copy">
              <h3>Enable webcam</h3>
              <p>Click the main button below. We’ll ask for camera access next so you can preview yourself before going live.</p>
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
                <small>Preview before going live · Free now</small>
              </button>
            </div>
            {mediaState !== 'preview-ready' && !session ? (
              <div className="fallback-mode-row stronger-fallback-row">
                <button className={`ghost-btn fallback-mode-btn ${sessionMode === 'voice' ? 'active' : ''}`} onClick={() => setSessionMode('voice')}>🎤 Use voice instead</button>
                <button className={`ghost-btn fallback-mode-btn ${sessionMode === 'chat' ? 'active' : ''}`} onClick={() => setSessionMode('chat')}>💬 Use chat instead</button>
              </div>
            ) : null}
          </div> : null}
          {isChatMode ? (
            <>
              <div className="live-stage-headline pre-session-headline chat-pre-session-headline">
                <strong>{session ? `Chat session is active` : `Start human chat`}</strong>
                <span>{session ? 'Your chat session is active. Messages and export are ready.' : 'Type your first message to start a human-to-human chat. No webcam setup required.'}</span>
              </div>
              {!session ? (
                <div className="wallet-balance-card wallet-balance-card-muted wallet-balance-card-full ai-upgrade-card ai-choice-block ai-choice-hero">
                  <span className="eyebrow">Choose chat mode</span>
                  <strong>Free human chat or Premium AI chat</strong>
                  <p>Choose how you want this conversation to work before the chat composer appears.</p>
                  <div className="ai-choice-grid ai-choice-grid-hero">
                    <button className={`ghost-btn ai-choice-card ai-choice-card-hero ${chatKind === 'human' ? 'active' : ''}`} onClick={selectHumanChat}>
                      <span className="ai-choice-label">Human chat</span>
                      <small>Free · default · person-to-person</small>
                    </button>
                    <button className={`primary-btn ai-choice-card ai-choice-card-hero ${chatKind === 'ai' ? 'active' : ''}`} onClick={() => (aiUnlocked ? setChatKind('ai') : unlockAiChat())}>
                      <span className="ai-choice-label">AI chat</span>
                      <small>{aiUnlocked ? 'Premium unlocked' : 'Premium · 2 credits to unlock'}</small>
                    </button>
                  </div>
                  {!aiUnlocked ? (
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
                    <div className="live-window-overlay"><span>Your camera</span><strong>{sessionMode === 'webcam' ? (mediaReady ? 'Camera ready — you can go live now' : mediaState === 'requesting' ? 'Requesting camera access' : 'Camera not connected') : 'Mic ready'}</strong><small>{mediaError || (mediaState === 'requesting' ? 'Approve the browser prompt to continue.' : 'Click anywhere in this panel to enable webcam and preview before going live.')}</small></div>
                  </button>
                  <div className="live-window ai"><div className="live-window-overlay"><span>{agent?.authorName || 'Agent'} live</span><strong>{session ? 'Ready and responding' : mediaState === 'preview-ready' ? 'Ready when you are' : 'Preview first, then go live'}</strong><small>{mediaState === 'preview-ready' ? 'Your camera is ready. Start live when you are set.' : 'We only show live room controls after your webcam preview is working.'}</small></div></div>
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
                  <strong>{chatChoiceMade ? (chatKind === 'ai' ? 'Premium AI chat is ready.' : 'Free human chat is ready.') : 'Choose your chat mode first.'}</strong>
                  <p>{chatChoiceMade ? (chatKind === 'ai' ? 'This chat will use premium AI mode powered by your upgraded plan or credits.' : 'This chat will connect person-to-person by default. Start with a quick message to begin.') : 'Pick free human chat or premium AI chat before the composer appears.'}</p>
                </div>
              </div>
              {chatChoiceMade ? (
                <div className="chat-input-row chat-input-row-strong">
                  <textarea className="chat-input chat-input-strong" rows={3} placeholder="Ask anything, start the conversation, or drop a quick prompt…" value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <button className="primary-btn" onClick={startSession} disabled={starting || !!session}>{starting ? 'Starting…' : chatKind === 'ai' ? 'Start AI chat' : 'Start human chat'}</button>
                </div>
              ) : null}
            </>
          ) : !session ? (
            <div className="transcript-empty-state pre-session-empty-state pre-session-preview-card">
              <strong>Step 1: Enable webcam</strong>
              <p>Approve camera access and preview yourself. The live room, transcript, and controls appear after that.</p>
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
                {messages.length ? messages.map((message) => (
                  <div className={`transcript-bubble transcript-${message.role || 'user'} ${message.streaming ? 'streaming' : ''}`} key={message.id || `${message.role}-${message.created_at || Math.random()}`}><strong>{message.role === 'agent' ? (agent?.authorName || 'Agent') : message.role === 'system' ? 'System' : 'You'}:</strong> {message.text}</div>
                )) : (
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
                <button className="primary-btn" onClick={sendMessage} disabled={!session || sending}>{sending ? 'Sending…' : 'Send'}</button>
                {sending ? <button className="ghost-btn" onClick={cancelGeneration}>Stop</button> : null}
                {!sending && lastSentText ? <button className="ghost-btn" onClick={retryLastMessage}>Retry last</button> : null}
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
