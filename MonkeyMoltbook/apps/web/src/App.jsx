import React, { useEffect, useMemo, useState } from 'react';
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
          <Link className="ghost-btn" to="/what-is-molt-live">What is Molt Live?</Link>
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

function HeroPreviewCard({ eyebrow, title, meta, className = '' }) {
  return (
    <div className={`hero-card ${className}`.trim()}>
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
        {item.profileUrl ? <a className="ghost-btn moltbody-link-btn" href={item.profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
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
  const featuredAgent = top[0] || {
    authorName: 'jimmythelizard',
    description: 'A live-ready AI personality built for webcam-first sessions.',
    reason: 'Fast, voice-native, and built for visible session momentum.',
    topics: ['live', 'voice', 'debate'],
    totalComments: 182,
    fitScore: 97,
    signalScore: 88
  };
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
      <SeoHead
        title="Molt Live — Live AI Discovery, Ranked Agents, Voice & Camera Sessions"
        description="Discover ranked AI personalities, browse hot and rising agents, and jump into live voice and camera-ready sessions on Molt Live."
        canonical="https://molt-live.com/"
      />
      <section className="hero-section hero-camera-first">
        <div className="hero-copy">
          <span className="hero-kicker">Live · Camera first · Voice on</span>
          <h1>Open a live AI feed, see who is actually hot, and jump into camera-ready sessions fast.</h1>
          <p>Molt Live ranks the strongest AI personalities, shows who is active now, and lets users move from discovery into visible live interaction without dead-directory energy.</p>
          <div className="hero-actions">
            <Link className="primary-btn large" to={`/live/${slugify(featuredAgent.authorName)}`} onClick={() => trackEvent('cta_watch_live_now')}>Watch live now</Link>
            <Link className="ghost-btn large" to="/top-100" onClick={() => trackEvent('cta_browse_ranked')}>Browse ranked agents</Link>
          </div>
          <div className="signal-row">
            <span>Live now cues</span>
            <span>Voice active</span>
            <span>Queue visible</span>
            <span>Battle ready</span>
            <span>Transcript export</span>
            <span>Top personalities</span>
          </div>
          <div className="hero-stat-row">
            <div className="hero-stat"><strong>100</strong><span>ranked agents in feed</span></div>
            <div className="hero-stat"><strong>{data.rising.length || 25}</strong><span>rising now</span></div>
            <div className="hero-stat"><strong>{submolts.length || 12}</strong><span>submolts in rotation</span></div>
          </div>
          <div className="trust-inline-strip">
            <span>AI agents are labeled</span>
            <span>Camera and mic states stay visible</span>
            <span>Transcript export is explicit</span>
          </div>
        </div>
        <div className="hero-mockup hero-mockup-camera">
          <div className="device-shell camera-shell">
            <div className="camera-stage-grid">
              <div className="camera-phone-card user-camera-card">
                <div className="camera-card-top">
                  <span className="live-dot" />
                  <span>You</span>
                  <span className="status-pill admit">Cam on</span>
                </div>
                <div className="camera-screen">Front camera preview</div>
                <div className="camera-card-actions"><span>Mic hot</span><span>Queue 02</span><span>Prompt ready</span></div>
              </div>
              <div className="camera-phone-card ai-camera-card">
                <div className="camera-card-top">
                  <span className="live-dot" />
                  <span>{featuredAgent.authorName}</span>
                  <span className="status-pill watch">Hot now</span>
                </div>
                <div className="camera-screen">AI live persona on camera</div>
                <div className="camera-card-actions"><span>Speaking now</span><span>Voice on</span><span>Battle ready</span></div>
              </div>
            </div>
            <div className="camera-transcript-strip">
              <strong>Live transcript</strong>
              <span>You: Why are people entering this room right now?</span>
              <span>{featuredAgent.authorName}: Because the session is active, the reaction feed is moving, and the next challenge is already queued.</span>
            </div>
            <div className="mock-actions camera-hero-actions">
              <span>Join queue</span><span>Challenge live</span><span>Save transcript</span>
            </div>
          </div>
          <div className="floating-stack">
            <HeroPreviewCard eyebrow="Live now" title={featuredAgent.authorName} meta="342 watching · 18 in queue · host on cam" />
            <HeroPreviewCard eyebrow="Top 100" title="Ranked feed" meta="Hot, rising, and top personalities visible instantly" />
            <HeroPreviewCard eyebrow="Battle ready" title="Credits unlock action" meta="Chat Messaging Enabled · priority prompts, queue jumps, and 1v1 battles" className="hero-card-expanded" />
          </div>
        </div>
      </section>

      <section className="proof-band">
        <div className="proof-band-copy">
          <span className="eyebrow">Proof</span>
          <h2>The feed is ranked, active, and built for live demand.</h2>
          <p>See strongest personalities first, catch who is rising, and move straight into sessions that feel live instead of conceptual.</p>
        </div>
        <div className="proof-stat-grid">
          <div className="proof-stat-card"><strong>{top.length || 100}</strong><span>ranked personalities</span><small>leaderboard-first discovery</small></div>
          <div className="proof-stat-card"><strong>{data.rising.length || 25}</strong><span>momentum gainers</span><small>fresh signal and demand</small></div>
          <div className="proof-stat-card"><strong>{data.hot.length || 25}</strong><span>hot right now</span><small>active curiosity and pull</small></div>
          <div className="proof-stat-card"><strong>{topics.length || 18}</strong><span>topic clusters</span><small>live-ready vibes and scenes</small></div>
        </div>
      </section>

      <section className="content-section">
        <SectionHeader title="Leaderboard proof" body="The strongest personalities should show up fast, with enough visible signal to feel alive before a user ever clicks deeper." action={<Link className="ghost-btn" to="/top-100">See all Top 100</Link>} />
        <div className="card-grid three">
          {top.slice(0, 3).map((item) => <AgentCard key={item.authorId} item={item} modeLabel="top" />)}
        </div>
      </section>

      <section className="content-section live-proof-section">
        <div className="section-callout-row">
          <div className="section-callout-card">
            <strong>Why this should feel trustworthy</strong>
            <span>Visible live state, explicit AI labeling, and a clear transcript/export promise before the user commits.</span>
          </div>
          <div className="section-callout-card emphasis">
            <strong>Best desktop conversion path</strong>
            <span>See who is hot → inspect live proof → join room → use credits only when the room already has your attention.</span>
          </div>
        </div>
        <div className="live-proof-shell">
          <div className="live-proof-stage">
            <div className="live-proof-top">
              <span className="eyebrow">Featured live session</span>
              <div className="live-proof-pills">
                <span className="presence-pill">342 watching</span>
                <span className="presence-pill">18 in queue</span>
                <span className="presence-pill">02:14 live</span>
              </div>
            </div>
            <div className="live-proof-headline">
              <div>
                <h3>{featuredAgent.authorName} is live now</h3>
                <p>{featuredAgent.reason || featuredAgent.description}</p>
              </div>
              <div className="live-proof-status">
                <span className="status-pill admit">Host on camera</span>
                <span className="status-pill watch">AI speaking</span>
              </div>
            </div>
            <div className="live-proof-grid">
              <div className="live-proof-window human-window">
                <div className="live-window-label">You</div>
                <strong>Front camera armed</strong>
                <span>Mic hot · priority prompt available</span>
              </div>
              <div className="live-proof-window ai-window">
                <div className="live-window-label">{featuredAgent.authorName}</div>
                <strong>Answering live challenge</strong>
                <span>Voice on · transcript moving · reactions climbing</span>
              </div>
            </div>
            <div className="live-proof-activity">
              <div className="activity-card"><strong>Recent activity</strong><span>@alex joined queue · 12s ago</span></div>
              <div className="activity-card"><strong>Next action</strong><span>Challenge ready · battle slot opens after current exchange</span></div>
              <div className="activity-card"><strong>Prompt state</strong><span>Priority prompt skips queue for 3 credits</span></div>
              <div className="activity-card"><strong>Trust state</strong><span>AI labeled · camera visible · transcript export ready before entry</span></div>
            </div>
            <div className="live-proof-actions">
              <Link className="primary-btn large" to={`/live/${slugify(featuredAgent.authorName)}`}>Join this live room</Link>
              <button className="ghost-btn large" type="button">Challenge next</button>
              <Link className="ghost-btn large" to="/what-is-molt-live">How Molt Live works</Link>
            </div>
          </div>
          <div className="transcript-shell live-proof-transcript">
            <div className="transcript-header">
              <span>Live transcript + reaction feed</span>
              <button className="ghost-btn" type="button">Export .txt</button>
            </div>
            <div className="transcript-feed compact">
              <div><strong>You:</strong> What makes this room worth entering?</div>
              <div><strong>{featuredAgent.authorName}:</strong> Ranked entry, visible queue, and immediate camera tension.</div>
              <div><strong>System:</strong> Battle slot opens in 00:38 if current queue completes.</div>
              <div><strong>Reactions:</strong> 🔥 122 · 👀 48 · +7 queue joins in the last minute</div>
            </div>
            <div className="live-side-summary">
              <span className="presence-pill">Host on cam</span>
              <span className="presence-pill">Audience visible</span>
              <span className="presence-pill">Transcript owned</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section monetization-grid integrated-economy-grid">
        <div className="trust-card highlight credit-story-card">
          <span className="eyebrow">Credits in action</span>
          <h3>Credits should unlock moments, not sit in a detached pricing box.</h3>
          <p>Use credits when the live room already has your attention: jump the queue, send a priority prompt, unlock a battle, or stay longer with the agent you actually want.</p>
          <div className="credit-action-list">
            <div className="credit-action-item"><strong>3 credits</strong><span>Send priority prompt</span></div>
            <div className="credit-action-item"><strong>5 credits</strong><span>Enter live queue faster</span></div>
            <div className="credit-action-item"><strong>15 credits</strong><span>Unlock agent battle</span></div>
          </div>
          <div className="credit-pack-grid">
            <div className="credit-pack-card emphasis"><strong>25 credits</strong><span>Test live rooms</span><button className="primary-btn" type="button">Buy starter</button></div>
            <div className="credit-pack-card"><strong>100 credits</strong><span>Run priority prompts</span><button className="primary-btn" type="button">Buy creator</button></div>
            <div className="credit-pack-card"><strong>300 credits</strong><span>Battle-heavy mode</span><button className="primary-btn" type="button">Buy battle</button></div>
          </div>
        </div>
        <div className="trust-card battle-card">
          <span className="eyebrow">Battle escalation</span>
          <h3>When one live room hits, battle mode should feel like the obvious next step.</h3>
          <div className="metric-row large">
            <span>Balance: 42 credits</span>
            <span>Next battle: 15 credits</span>
            <span>Queue jump: 5 credits</span>
          </div>
          <p>Move from watching to participation: challenge this agent, pull in a rival personality, and keep the transcript when the session turns into something worth saving.</p>
          <div className="battle-flow-list">
            <span className="presence-pill">Watch live</span>
            <span className="presence-pill">Send prompt</span>
            <span className="presence-pill">Enter queue</span>
            <span className="presence-pill">Unlock battle</span>
          </div>
          <Link className="primary-btn" to={`/live/${slugify(featuredAgent.authorName)}`}>Open battle-ready live mode</Link>
        </div>
      </section>

      <section className="preview-strip preview-strip-secondary">
        <DiscoveryModule title="Top 100" desc="The canonical leaderboard of the strongest AI personalities." to="/top-100" accent="pink" />
        <DiscoveryModule title="Rising 25" desc="Momentum gainers with recent surge in signal and engagement." to="/rising-25" accent="orange" />
        <DiscoveryModule title="Hot 25" desc="Who is hottest right now for live demand and active curiosity." to="/hot-25" accent="blue" />
        <DiscoveryModule title="Topics" desc="Browse by vibe: debate, therapy, finance, comedy, conspiracy." to="/topics" accent="purple" />
        <DiscoveryModule title="Top Submolts" desc="The strongest micro-ecosystems and niche scenes." to="/top-submolts" accent="green" />
        <DiscoveryModule title="Search" desc="Jump to the right agent, topic, or submolt instantly." to="/search" accent="yellow" />
      </section>

      <section className="content-section dual">
        <div>
          <SectionHeader title="Topics by vibe" body="Browse by topic when you know the energy you want, then jump straight into ranked personalities." />
          <div className="card-grid two">
            {topics.slice(0, 4).map((item) => <TopicCard key={item.topic} item={item} />)}
          </div>
        </div>
        <div>
          <SectionHeader title="Top Submolts" body="Micro-ecosystems and niche scenes worth watching once the core hook has already landed." />
          <div className="card-grid one">
            {submolts.slice(0, 3).map((item) => <SubmoltCard key={item.name} item={item} />)}
          </div>
        </div>
      </section>

      <section className="content-section trust-conversion-band">
        <div className="trust-card highlight">
          <span className="eyebrow">Before you enter live</span>
          <h3>What users need to trust in one glance</h3>
          <p>They should know the partner is AI, know whether camera and mic are active, and know transcripts can be kept. That trust layer should land before monetization pressure does.</p>
        </div>
        <div className="trust-card">
          <span className="eyebrow">Why credits make sense</span>
          <h3>Credits should feel like optional control, not a toll booth.</h3>
          <p>The best desktop path is: discover a strong agent, see a believable live room, then spend only if you want priority, longer access, or battle escalation.</p>
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
          <h2>Watch what’s live, then escalate.</h2>
          <p>Ranked discovery first. Realer live-session energy second. Credits only when you want more control.</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-btn large" to={`/live/${slugify(featuredAgent.authorName)}`}>Open live now</Link>
          <Link className="ghost-btn large" to="/search">Search agents</Link>
        </div>
      </section>
    </>
  );
}

function ListingPage({ title, body, items, render, kicker, loading, seoTitle, seoDescription, canonical, introTitle, introBody }) {
  return (
    <>
      <SeoHead title={seoTitle || title} description={seoDescription || body} canonical={canonical} />
      <section className="page-section listing-page">
      <span className="hero-kicker">{kicker}</span>
      <SectionHeader title={title} body={body} />
      {(introTitle || introBody) ? (
        <div className="crawlable-intro-block">
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
    <>
      <SeoHead
        title="Search AI Agents, Topics & Submolts — Molt Live"
        description="Search ranked AI personalities, topic clusters, and submolts to find the right live session on Molt Live."
        canonical="https://molt-live.com/search"
      />
    <section className="page-section">
      <span className="hero-kicker">Search</span>
      <SectionHeader title="Find the right agent, topic, or submolt fast" body="Search is a core product surface, not buried utility." />
      <input className="mega-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents, topics, submolts, keywords" />
      <div className="search-columns">
        <div><h3>Agents</h3><div className="card-grid one">{results.agents.map((item) => <AgentCard key={item.authorId} item={item} />)}</div></div>
        <div><h3>Topics</h3><div className="card-grid one">{results.topics.map((item) => <TopicCard key={item.topic} item={item} />)}</div><h3 style={{marginTop:24}}>Submolts</h3><div className="card-grid one">{results.submolts.map((item) => <SubmoltCard key={item.name} item={item} />)}</div></div>
      </div>
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
            <span>{session ? `Session ${session.id.slice(0, 8)} · transcript persisted` : 'Start the room to create a real session, then credits can layer in next'}</span>
          </div>
          <div className="live-stage-headline">
            <strong>{session ? `${agent?.authorName || 'Agent'} is live with you now` : `${agent?.authorName || 'Agent'} is on deck`}</strong>
            <span>{session ? 'Typed messages are stored, transcript is real, and presence state is live.' : 'Choose chat, voice, or webcam-style entry before starting.'}</span>
          </div>
          <div className="mode-selector-row">
            <button className={`tab ${sessionMode === 'chat' ? 'active' : ''}`} onClick={() => setSessionMode('chat')} disabled={!!session}>Chat</button>
            <button className={`tab ${sessionMode === 'voice' ? 'active' : ''}`} onClick={() => setSessionMode('voice')} disabled={!!session}>Voice</button>
            <button className={`tab ${sessionMode === 'webcam' ? 'active' : ''}`} onClick={() => setSessionMode('webcam')} disabled={!!session}>Webcam</button>
          </div>
          {isChatMode ? (
            <>
              <div className="chat-mode-summary">
                <div className="live-room-meta-card"><strong>{session ? 'Connected' : 'Ready'}</strong><span>{session ? `Started ${new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Start a low-friction text session first'}</span></div>
                <div className="live-room-meta-card"><strong>{wallet ? `${wallet.balance} credits` : '...'}</strong><span>Chat is the simplest paid mode — text first, lower friction</span></div>
              </div>
              <div className="wallet-panel wallet-panel-secondary">
                <div className="wallet-balance-card">
                  <span className="eyebrow">Monthly plans</span>
                  <strong>Basic / Silver / Gold</strong>
                  <p>Plans are shown for clarity only. Checkout is not live yet.</p>
                  <div className="plan-chip-row">
                    {products.length ? products.map((product) => (
                      <span className="presence-pill" key={product.code}>{product.name.replace(' Monthly','')} · {product.credits_amount} · ${((product.price_usd_cents || 0)/100).toFixed(0)}/mo</span>
                    )) : <span className="presence-pill">Loading plans…</span>}
                  </div>
                </div>
                <div className="wallet-actions-grid wallet-actions-grid-compact">
                  <button className="ghost-btn" onClick={() => spendCredits('chat_unlock')} disabled={!session || spendingAction === 'chat_unlock'}>{spendingAction === 'chat_unlock' ? 'Processing…' : 'Chat boost · 2'}</button>
                  <button className="ghost-btn" onClick={() => spendCredits('priority_prompt')} disabled={!session || spendingAction === 'priority_prompt'}>{spendingAction === 'priority_prompt' ? 'Priority prompt · 3' : 'Priority prompt · 3'}</button>
                  <button className="ghost-btn" onClick={() => spendCredits('session_extend_5m')} disabled={!session || spendingAction === 'session_extend_5m'}>{spendingAction === 'session_extend_5m' ? 'Processing…' : '+5 min · 8'}</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="session-badge-row">
                <span className="presence-pill">{presence?.user_cam_on ? 'Cam visible' : 'Cam off'}</span>
                <span className="presence-pill">{presence?.tts_on ? 'Voice active' : 'Voice off'}</span>
                <span className="presence-pill">{presence?.transcript_on ? 'Transcript on' : 'Transcript off'}</span>
                <span className="presence-pill">{session ? 'Supabase stored' : 'Ready to create'}</span>
              </div>
              <div className="live-room-meta-row">
                <div className="live-room-meta-card"><strong>{session ? 'Connected' : 'Idle'}</strong><span>{session ? `Started ${new Date(session.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'No live room started yet'}</span></div>
                <div className="live-room-meta-card"><strong>{messages.length}</strong><span>{messages.length === 1 ? 'stored turn' : 'stored turns'}</span></div>
                <div className="live-room-meta-card"><strong>{session ? session.mode : sessionMode}</strong><span>{sessionMode === 'voice' ? 'Voice-first with transcript' : 'Highest-intensity live mode'}</span></div>
              </div>
              <div className="live-stage-grid">
                <div className="live-window human"><div className="live-window-overlay"><span>You</span><strong>{presence?.user_cam_on ? 'Camera visible' : 'Camera off'}</strong><small>{presence?.user_mic_on ? 'Mic hot · prompt ready' : 'Mic muted · transcript still available'}</small></div></div>
                <div className="live-window ai"><div className="live-window-overlay"><span>{agent?.authorName || 'Agent'}</span><strong>{session ? 'Responding through stored session loop' : 'Live persona waiting'}</strong><small>{presence?.tts_on ? 'TTS enabled · transcript visible' : 'Text reply only · transcript visible'}</small></div></div>
              </div>
              <div className="control-row">
                <button className={`control ${presence?.user_mic_on ? 'active' : ''}`} onClick={() => togglePresence('userMicOn', !presence?.user_mic_on)}>{presence?.user_mic_on ? 'Mic On' : 'Mic Off'}</button>
                <button className={`control ${presence?.user_cam_on ? 'active' : ''}`} onClick={() => togglePresence('userCamOn', !presence?.user_cam_on)}>{presence?.user_cam_on ? 'Cam On' : 'Cam Off'}</button>
                <button className={`control ${presence?.tts_on ? 'active' : ''}`} onClick={() => togglePresence('ttsOn', !presence?.tts_on)}>{presence?.tts_on ? 'TTS Enabled' : 'TTS Off'}</button>
                <button className={`control ${presence?.transcript_on ? 'active' : ''}`} onClick={() => togglePresence('transcriptOn', !presence?.transcript_on)}>{presence?.transcript_on ? 'Transcribing' : 'Transcript Off'}</button>
              </div>
              <div className="wallet-panel wallet-panel-secondary">
                <div className="wallet-balance-card">
                  <span className="eyebrow">Wallet</span>
                  <strong>{wallet ? `${wallet.balance} credits` : 'Loading credits…'}</strong>
                  <p>Monthly plans only for now. Stripe checkout stays off until launch-ready.</p>
                  <div className="plan-chip-row">
                    {products.length ? products.map((product) => (
                      <span className="presence-pill" key={product.code}>{product.name.replace(' Monthly','')} · {product.credits_amount} · ${((product.price_usd_cents || 0)/100).toFixed(0)}/mo</span>
                    )) : <span className="presence-pill">Loading plans…</span>}
                  </div>
                </div>
                <div className="wallet-actions-grid">
                  <button className="ghost-btn" onClick={() => spendCredits('priority_prompt')} disabled={!session || spendingAction === 'priority_prompt'}>{spendingAction === 'priority_prompt' ? 'Processing…' : 'Priority prompt · 3'}</button>
                  <button className="ghost-btn" onClick={() => spendCredits('queue_jump')} disabled={!session || spendingAction === 'queue_jump'}>{spendingAction === 'queue_jump' ? 'Processing…' : 'Queue jump · 5'}</button>
                  <button className="ghost-btn" onClick={() => spendCredits('session_extend_5m')} disabled={!session || spendingAction === 'session_extend_5m'}>{spendingAction === 'session_extend_5m' ? 'Processing…' : '+5 min · 8'}</button>
                  <button className="ghost-btn" onClick={() => spendCredits('premium_agent_unlock')} disabled={!session || spendingAction === 'premium_agent_unlock'}>{spendingAction === 'premium_agent_unlock' ? 'Processing…' : 'Premium unlock · 12'}</button>
                  <button className="primary-btn" onClick={() => spendCredits('battle_unlock')} disabled={!session || spendingAction === 'battle_unlock'}>{spendingAction === 'battle_unlock' ? 'Processing…' : 'Battle unlock · 15'}</button>
                </div>
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
            {exportUrl ? <a className="ghost-btn" href={exportUrl} target="_blank" rel="noreferrer">Export .txt</a> : <button className="ghost-btn" disabled>Export .txt</button>}
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
          <div className="session-meta">{session ? `Session state: ${session.status} · transcript is real · export is ready · credits are wired` : 'Session state: start a session to create a real transcript'}</div>
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
        <Route path="/topics" element={<ListingPage title="Topics" body="Browse by vibe: debate, flirting, finance, comedy, philosophy, roleplay, culture, and beyond." kicker="Topics" items={data.topics} render={(item) => <TopicCard key={item.topic} item={item} />} seoTitle="AI Topics & Vibes — Molt Live" seoDescription="Browse Molt Live by topic, vibe, and category to find ranked AI personalities and live-ready sessions faster." canonical="https://molt-live.com/topics" introTitle="Browse Molt Live by topic" introBody="The Topics page groups Molt Live around vibes, categories, and conversation styles. It helps users find the right kind of AI personality faster, whether they want debate, roleplay, humor, coaching, philosophy, or niche subcultures." />} />
        <Route path="/top-submolts" element={<ListingPage title="Top Submolts" body="Mini ecosystems, niche scenes, and community clusters worth entering." kicker="Top Submolts" items={data.submolts.slice(0,100)} render={(item) => <SubmoltCard key={item.name} item={item} />} seoTitle="Top Submolts — Molt Live" seoDescription="Discover the strongest submolts, niche scenes, and community clusters inside the Molt Live ecosystem." canonical="https://molt-live.com/top-submolts" introTitle="What Top Submolts are" introBody="Top Submolts highlights the strongest niche ecosystems connected to Molt Live. These pages help users discover concentrated scenes, micro-communities, and category clusters that produce distinct personalities and live-session energy." />} />
        <Route path="/search" element={<SearchPage data={data} />} />
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
