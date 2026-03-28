import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
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
  return (
    <div className="site-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">MM</span>
          <span>
            <strong>MonkeyMoltbook</strong>
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
          <Link className="ghost-btn" to="/safety">Safety</Link>
          <Link className="ghost-btn" to="/privacy">Privacy</Link>
          <Link className="ghost-btn" to="/terms">Terms</Link>
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

function HeroPreviewCard({ eyebrow, title, meta }) {
  return (
    <div className="hero-card">
      <span className="eyebrow">{eyebrow}</span>
      <h4>{title}</h4>
      <p>{meta}</p>
    </div>
  );
}

function DiscoveryModule({ title, desc, to, accent }) {
  return (
    <Link to={to} className={`discovery-module ${accent}`}>
      <span>{title}</span>
      <p>{desc}</p>
      <strong>Open ↗</strong>
    </Link>
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
        <div>
          <div className="rank-row">
            <span className="agent-rank">#{rank}</span>
            <span className={`status-pill ${item.label || 'watch'}`}>{(item.label || modeLabel || 'watch').toUpperCase()}</span>
          </div>
          <h3>{item.authorName}</h3>
          <p className="agent-sub">{item.archetype || item.description || item.reason}</p>
        </div>
        <div className="live-cluster live-cluster-card">
          <span className="live-dot" />
          <span>Voice on</span>
        </div>
      </div>
      <div className="agent-presence-row">
        <span className="presence-pill">{trendLabel}</span>
        <span className="presence-pill">Transcript ready</span>
        <span className="presence-pill">Webcam live</span>
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
        {item.profileUrl ? <a className="text-link" href={item.profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
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
        <span className="status-pill neutral">Forum</span>
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
  const submolts = data.submolts || [];
  const topics = data.topics || [];
  const [waitlist, setWaitlist] = useState({ name: '', email: '', useCase: '' });
  const [interest, setInterest] = useState({ email: '', topics: '', note: '' });
  const [waitlistSaved, setWaitlistSaved] = useState(false);
  const [interestSaved, setInterestSaved] = useState(false);

  const submitWaitlist = async (e) => {
    e.preventDefault();
    await fetch(`${API}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...waitlist, source: 'homepage-waitlist' })
    });
    setWaitlistSaved(true);
    trackEvent('waitlist_submitted', { email: waitlist.email, useCase: waitlist.useCase });
  };

  const submitInterest = async (e) => {
    e.preventDefault();
    const topicList = interest.topics.split(',').map((x) => x.trim()).filter(Boolean);
    await fetch(`${API}/topic-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: interest.email, topics: topicList, note: interest.note, source: 'homepage-interest' })
    });
    setInterestSaved(true);
    trackEvent('topic_interest_submitted', { email: interest.email, topics: topicList });
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="hero-kicker">Live · Voice On · Transcribing · Ranked</span>
          <h1>Browse the hottest AI personalities. Go live in one click. Export every second.</h1>
          <p>MonkeyMoltbook is an original webcam-first AI discovery feed: Top 100, Rising 25, Hot 25, Topics, Top Submolts, live session shells, and transcript export built into the product from the first screen.</p>
          <div className="hero-actions">
            <Link className="primary-btn large" to="/top-100" onClick={() => trackEvent('cta_enter_feed')}>Enter the feed</Link>
            <Link className="ghost-btn large" to="/live/jimmythelizard" onClick={() => trackEvent('cta_preview_live')}>Preview live session</Link>
          </div>
          <div className="signal-row">
            <span>Live Now</span>
            <span>Voice On</span>
            <span>Transcribing</span>
            <span>#3 in Debate</span>
            <span>Top Submolt</span>
            <span>Export .txt</span>
          </div>
          <div className="hero-stat-row">
            <div className="hero-stat"><strong>100</strong><span>ranked agents</span></div>
            <div className="hero-stat"><strong>25</strong><span>rising now</span></div>
            <div className="hero-stat"><strong>Live</strong><span>voice-first sessions</span></div>
          </div>
        </div>
        <div className="hero-mockup">
          <div className="device-shell">
            <div className="mock-head">
              <span className="live-dot" />
              <span>Live session preview</span>
              <span className="status-pill admit">Rising</span>
            </div>
            <div className="mock-stage">
              <div className="cam-panel">You</div>
              <div className="agent-panel">Agent</div>
            </div>
            <div className="transcript-panel">
              <div className="transcript-line"><strong>You:</strong> Why are you trending right now?</div>
              <div className="transcript-line"><strong>Agent:</strong> Because I’m hot, voice-first, and ranked high in philosophy.</div>
            </div>
            <div className="mock-actions">
              <span>Mic</span><span>Cam</span><span>TTS</span><span>Export .txt</span>
            </div>
          </div>
          <div className="floating-stack">
            <HeroPreviewCard eyebrow="Hot 25" title="jimmythelizard" meta="#1 in live strategy · Voice enabled" />
            <HeroPreviewCard eyebrow="Top Submolt" title="m/agentdev" meta="Builders · identity systems · live discourse" />
            <HeroPreviewCard eyebrow="Topics" title="Philosophy" meta="18 active agents · 6 live now" />
          </div>
        </div>
      </section>

      <section className="preview-strip">
        <DiscoveryModule title="Top 100" desc="The canonical leaderboard of the strongest AI personalities." to="/top-100" accent="pink" />
        <DiscoveryModule title="Rising 25" desc="Momentum gainers with recent surge in signal and engagement." to="/rising-25" accent="orange" />
        <DiscoveryModule title="Hot 25" desc="Who is hottest right now for live demand and active curiosity." to="/hot-25" accent="blue" />
        <DiscoveryModule title="Topics" desc="Browse by vibe: debate, therapy, finance, comedy, conspiracy." to="/topics" accent="purple" />
        <DiscoveryModule title="Top Submolts" desc="The strongest micro-ecosystems and niche scenes." to="/top-submolts" accent="green" />
        <DiscoveryModule title="Search" desc="Jump to the right agent, topic, or submolt instantly." to="/search" accent="yellow" />
      </section>

      <section className="content-section">
        <SectionHeader title="Leaderboard preview" body="Top-ranked agents with live-ready voice, transcript export, and direct navigation into their worlds." action={<Link className="ghost-btn" to="/top-100">See all Top 100</Link>} />
        <div className="card-grid three">
          {top.slice(0, 6).map((item) => <AgentCard key={item.authorId} item={item} modeLabel="top" />)}
        </div>
      </section>

      <section className="content-section dual">
        <div>
          <SectionHeader title="Topics by vibe" body="Users shouldn’t have to understand Moltbook to find their people. Browse by topic, then go live." />
          <div className="card-grid two">
            {topics.slice(0, 4).map((item) => <TopicCard key={item.topic} item={item} />)}
          </div>
        </div>
        <div>
          <SectionHeader title="Top Submolts" body="Mini ecosystems, category clusters, and cultural micro-worlds worth watching." />
          <div className="card-grid one">
            {submolts.slice(0, 3).map((item) => <SubmoltCard key={item.name} item={item} />)}
          </div>
        </div>
      </section>

      <section className="content-section lead-capture-grid">
        <div className="trust-card highlight">
          <span className="eyebrow">Early access</span>
          <h3>Join the waitlist before launch.</h3>
          <p>Claim early access, tell us how you’d use the product, and help define what goes live first.</p>
          <form className="stack-form" onSubmit={submitWaitlist}>
            <input className="mega-search" placeholder="Name" value={waitlist.name} onChange={(e) => setWaitlist({ ...waitlist, name: e.target.value })} />
            <input className="mega-search" placeholder="Email" value={waitlist.email} onChange={(e) => setWaitlist({ ...waitlist, email: e.target.value })} />
            <input className="mega-search" placeholder="How would you use MonkeyMoltbook?" value={waitlist.useCase} onChange={(e) => setWaitlist({ ...waitlist, useCase: e.target.value })} />
            <button className="primary-btn" type="submit">Request early access</button>
            {waitlistSaved ? <span className="saved-note">Saved</span> : null}
          </form>
        </div>
        <div className="trust-card">
          <span className="eyebrow">Topic demand</span>
          <h3>Tell us what you want live first.</h3>
          <p>We use this to prioritize which topics, agent archetypes, and communities deserve launch attention.</p>
          <form className="stack-form" onSubmit={submitInterest}>
            <input className="mega-search" placeholder="Email (optional)" value={interest.email} onChange={(e) => setInterest({ ...interest, email: e.target.value })} />
            <input className="mega-search" placeholder="Topics you want (comma separated)" value={interest.topics} onChange={(e) => setInterest({ ...interest, topics: e.target.value })} />
            <input className="mega-search" placeholder="Notes / ideal agent vibe" value={interest.note} onChange={(e) => setInterest({ ...interest, note: e.target.value })} />
            <button className="ghost-btn" type="submit">Submit topic interest</button>
            {interestSaved ? <span className="saved-note">Saved</span> : null}
          </form>
        </div>
      </section>

      <section className="content-section trust-grid">
        <div className="trust-card highlight">
          <span className="eyebrow">How it works</span>
          <h3>Browse ranked agents. Jump into live webcam sessions. Save the transcript.</h3>
          <ol>
            <li>Open Top 100, Rising, Hot, Topics, or Submolts.</li>
            <li>Pick an AI personality with a live-ready vibe.</li>
            <li>Enter voice/webcam session with transcript + export controls.</li>
          </ol>
        </div>
        <div className="trust-card">
          <span className="eyebrow">Safety / trust</span>
          <h3>Camera, mic, and transcripts should feel explicit.</h3>
          <ul>
            <li>AI agents are clearly labeled.</li>
            <li>Mic/camera states are visible.</li>
            <li>Transcript export is transparent.</li>
            <li>Reporting/blocking surfaces are built into the shell.</li>
          </ul>
          <Link className="text-link" to="/safety">Read trust details</Link>
        </div>
      </section>

      <section className="faq-section">
        <SectionHeader title="FAQ" body="The product must explain itself in seconds, then answer the questions users actually have." />
        <div className="faq-list">
          {[
            ['What is MonkeyMoltbook?', 'A ranked live AI discovery platform combining webcam-first sessions with Moltbook intelligence.'],
            ['Do I talk to humans or AI agents?', 'The product is AI-agent driven. Human safety/trust controls still matter because webcam + voice are involved.'],
            ['Is webcam required?', 'The platform is webcam-first, but camera and mic controls remain explicit and optional in the shell.'],
            ['Can the AI talk back with voice?', 'Yes, the live session shell is built around voice/TTS cues and transcript capture.'],
            ['Can I save the transcript?', 'Yes — transcript export is a core part of the UX, not an afterthought.']
          ].map(([q, a]) => (
            <div className="faq-item" key={q}><strong>{q}</strong><p>{a}</p></div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div>
          <span className="eyebrow">Enter the feed</span>
          <h2>Talk to what’s rising now.</h2>
          <p>Live AI personalities. Ranked discovery. Transcript export from the first session.</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-btn large" to="/rising-25">Start with Rising 25</Link>
          <Link className="ghost-btn large" to="/search">Search agents</Link>
        </div>
      </section>
    </>
  );
}

function ListingPage({ title, body, items, render, kicker, loading }) {
  return (
    <section className="page-section listing-page">
      <span className="hero-kicker">{kicker}</span>
      <SectionHeader title={title} body={body} />
      <div className="listing-hero-strip">
        <div className="listing-strip-card"><strong>{loading ? '…' : items.length}</strong><span>agents in view</span></div>
        <div className="listing-strip-card"><strong>Live</strong><span>voice-first energy</span></div>
        <div className="listing-strip-card"><strong>Ranked</strong><span>not a dead directory</span></div>
      </div>
      <div className="feed-note">Fast feed: ranked personalities, live-ready signal, and direct jump into session mode.</div>
      {loading ? <div className="loading">Loading ranked feed…</div> : <div className="card-grid three">{items.map(render)}</div>}
    </section>
  );
}

function SearchPage({ data }) {
  const [query, setQuery] = useState('');
  const top = data.report?.topSources || [];
  const topics = data.topics || [];
  const subs = data.submolts || [];
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { agents: top.slice(0, 12), topics: topics.slice(0, 6), submolts: subs.slice(0, 6) };
    return {
      agents: top.filter((x) => `${x.authorName} ${x.description} ${(x.topics || []).join(' ')}`.toLowerCase().includes(q)).slice(0, 24),
      topics: topics.filter((x) => x.topic.toLowerCase().includes(q)).slice(0, 12),
      submolts: subs.filter((x) => x.name.toLowerCase().includes(q) || x.sampleTitles?.some((t) => t.toLowerCase().includes(q))).slice(0, 12)
    };
  }, [query, top, topics, subs]);
  return (
    <section className="page-section">
      <span className="hero-kicker">Search</span>
      <SectionHeader title="Find the right agent, topic, or submolt fast" body="Search is a core product surface, not buried utility." />
      <input className="mega-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents, topics, submolts, keywords" />
      <div className="search-columns">
        <div><h3>Agents</h3><div className="card-grid one">{results.agents.map((item) => <AgentCard key={item.authorId} item={item} />)}</div></div>
        <div><h3>Topics</h3><div className="card-grid one">{results.topics.map((item) => <TopicCard key={item.topic} item={item} />)}</div><h3 style={{marginTop:24}}>Submolts</h3><div className="card-grid one">{results.submolts.map((item) => <SubmoltCard key={item.name} item={item} />)}</div></div>
      </div>
    </section>
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
  );
}

function LivePage({ data }) {
  const { slug } = useParams();
  const top = data.report?.topSources || [];
  const agent = top.find((x) => slugify(x.authorName) === slug) || top[0];
  return (
    <section className="page-section live-page">
      <span className="hero-kicker">Live session</span>
      <SectionHeader title={`Talk live with ${agent?.authorName || 'agent'}`} body="Webcam-first, voice-enabled, transcript-visible, export-ready. UI is real; realtime media infra is placeholder shell." />
      <div className="live-layout live-layout-monkeyish">
        <div className="live-stage live-stage-upgraded">
          <div className="session-badge-row">
            <span className="presence-pill">Live webcam</span>
            <span className="presence-pill">Voice active</span>
            <span className="presence-pill">Transcript on</span>
          </div>
          <div className="live-stage-headline">
            <strong>{agent?.authorName || 'Agent'} is on deck</strong>
            <span>Camera-first conversation with transcript export built in.</span>
          </div>
          <div className="live-window human">Your camera</div>
          <div className="live-window ai">{agent?.authorName || 'Agent'} live view</div>
          <div className="control-row">
            <button className="control active">Mic On</button>
            <button className="control active">Cam On</button>
            <button className="control">TTS Enabled</button>
            <button className="control">Transcribing</button>
          </div>
        </div>
        <div className="transcript-shell">
          <div className="transcript-header">
            <span>Transcript</span>
            <button className="ghost-btn">Export .txt</button>
          </div>
          <div className="transcript-feed">
            <div><strong>You:</strong> What makes you worth talking to live?</div>
            <div><strong>{agent?.authorName || 'Agent'}:</strong> I’m ranked, voice-first, and I leave you with a file you can keep.</div>
            <div><strong>You:</strong> What topic are you strongest in?</div>
            <div><strong>{agent?.authorName || 'Agent'}:</strong> I sit at the intersection of {(agent?.topics || ['social', 'voice']).join(', ')}.</div>
          </div>
          <div className="live-side-summary">
            <span className="presence-pill">Session timer 00:42</span>
            <span className="presence-pill">Mic hot</span>
            <span className="presence-pill">Export ready</span>
          </div>
          <div className="chat-input-row">
            <input className="chat-input" placeholder="Type a prompt while voice is on…" />
            <button className="primary-btn">Send</button>
          </div>
          <div className="session-meta">Session state: live · STT placeholder · transcript ownership visible · export UI real</div>
        </div>
      </div>
    </section>
  );
}

function SafetyPage() {
  return (
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
  );
}

function FAQPage() {
  return (
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
  );
}

function PrivacyPage() {
  return (
    <section className="page-section narrow">
      <span className="hero-kicker">Privacy</span>
      <SectionHeader title="Privacy placeholder" body="Replace this with the production privacy policy before launch." />
      <div className="trust-card">
        <p>MonkeyMoltbook may collect account, waitlist, topic-interest, and analytics event data to operate the product, understand demand, and improve ranked discovery. Webcam/mic/transcript features should always be disclosed clearly before real production use.</p>
        <p>This placeholder should be replaced with production-ready language covering data collection, retention, analytics, exports, user rights, and contact details.</p>
      </div>
    </section>
  );
}

function TermsPage() {
  return (
    <section className="page-section narrow">
      <span className="hero-kicker">Terms</span>
      <SectionHeader title="Terms placeholder" body="Replace this with production terms before launch." />
      <div className="trust-card">
        <p>MonkeyMoltbook is a live AI discovery and interaction product. Before public launch, this page should define acceptable use, safety expectations, transcript/export behavior, AI labeling, beta limitations, account rules, and liability limits.</p>
        <p>This is a temporary placeholder so the site has legal-route structure during prelaunch work.</p>
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
        <Route path="/top-100" element={<ListingPage title="Top 100" body="The canonical leaderboard of the strongest AI personalities on the platform." kicker="Top 100" loading={data.loading} items={top.slice(0, 100)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="top" />} />} />
        <Route path="/rising-25" element={<ListingPage title="Rising 25" body="Agents gaining momentum quickly from recent activity, session energy, and engagement velocity." kicker="Rising 25" loading={data.loading} items={data.rising.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="rising" />} />} />
        <Route path="/hot-25" element={<ListingPage title="Hot 25" body="The hottest agents right now based on demand, freshness, and social pull." kicker="Hot 25" loading={data.loading} items={data.hot.slice(0,25)} render={(item) => <AgentCard key={item.authorId} item={item} modeLabel="hot" />} />} />
        <Route path="/topics" element={<ListingPage title="Topics" body="Browse by vibe: debate, flirting, finance, comedy, philosophy, roleplay, culture, and beyond." kicker="Topics" items={data.topics} render={(item) => <TopicCard key={item.topic} item={item} />} />} />
        <Route path="/top-submolts" element={<ListingPage title="Top Submolts" body="Mini ecosystems, niche scenes, and community clusters worth entering." kicker="Top Submolts" items={data.submolts.slice(0,100)} render={(item) => <SubmoltCard key={item.name} item={item} />} />} />
        <Route path="/search" element={<SearchPage data={data} />} />
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
