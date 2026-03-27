import React, { useEffect, useMemo, useState } from 'react';

const API = 'http://127.0.0.1:8787';
const TABS = ['top', 'rising', 'hot', 'topics', 'submolts'];

function Stat({ label, value }) {
  return <div className="stat"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>;
}

function AccountCard({ item }) {
  return (
    <div className="card">
      <div className="card-top">
        <div>
          <div className="card-title">{item.authorName}</div>
          <div className="card-meta">Fit {item.fitScore} · Signal {Math.round(item.signalScore || 0)} · Posts {item.postCount}</div>
        </div>
        <div className={`badge badge-${item.label || 'watch'}`}>{(item.label || 'watch').toUpperCase()}</div>
      </div>
      <div className="card-body">{item.description || item.reason}</div>
      <div className="card-why">{item.reason}</div>
      <div className="card-footer">
        <span>{(item.topics || []).join(' · ')}</span>
        {item.profileUrl ? <a href={item.profileUrl} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
      </div>
    </div>
  );
}

function TopicCard({ item }) {
  return (
    <div className="card">
      <div className="card-top">
        <div className="card-title">{item.topic}</div>
        <div className="badge badge-neutral">{item.count} accounts</div>
      </div>
      <div className="topic-list">
        {(item.accounts || []).slice(0, 6).map((acc) => (
          <a key={acc.authorId} href={acc.profileUrl} target="_blank" rel="noreferrer">{acc.authorName}</a>
        ))}
      </div>
    </div>
  );
}

function SubmoltCard({ item }) {
  return (
    <div className="card">
      <div className="card-top">
        <div>
          <div className="card-title">m/{item.name}</div>
          <div className="card-meta">Posts {item.postCount} · Avg score {Math.round(item.avgScorePerPost || 0)} · Authors {item.authors?.length || 0}</div>
        </div>
        <div className="badge badge-neutral">Forum</div>
      </div>
      <div className="card-body">{item.sampleTitles?.[0] ? `Why this matters: ${item.sampleTitles[0]}` : 'Active public forum cluster.'}</div>
      <div className="card-footer">
        <span>{(item.authors || []).slice(0, 3).join(' · ')}</span>
        {item.url ? <a href={item.url} target="_blank" rel="noreferrer">Open on Moltbook ↗</a> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('top');
  const [report, setReport] = useState(null);
  const [rising, setRising] = useState([]);
  const [hot, setHot] = useState([]);
  const [topics, setTopics] = useState([]);
  const [submolts, setSubmolts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetch(`${API}/moltbook/refresh`, { method: 'POST' });
      const [reportRes, risingRes, hotRes, topicsRes, subRes] = await Promise.all([
        fetch(`${API}/moltbook/report`),
        fetch(`${API}/moltbook/rising`),
        fetch(`${API}/moltbook/hot`),
        fetch(`${API}/moltbook/topics`),
        fetch(`${API}/moltbook/top-submolts`),
      ]);
      setReport(await reportRes.json());
      setRising((await risingRes.json()).rising || []);
      setHot((await hotRes.json()).hot || []);
      setTopics((await topicsRes.json()).topics || []);
      setSubmolts((await subRes.json()).submolts || []);
      setLoading(false);
    };
    load();
  }, []);

  const top = report?.topSources || [];

  const filteredTop = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return top;
    return top.filter((x) => `${x.authorName} ${x.description} ${x.reason}`.toLowerCase().includes(q));
  }, [top, query]);

  const content = {
    top: filteredTop.map((item) => <AccountCard key={item.authorId} item={item} />),
    rising: rising.map((item) => <AccountCard key={item.authorId} item={item} />),
    hot: hot.map((item) => <AccountCard key={item.authorId} item={item} />),
    topics: topics.map((item) => <TopicCard key={item.topic} item={item} />),
    submolts: submolts.map((item) => <SubmoltCard key={item.name} item={item} />),
  };

  return (
    <div className="page">
      <div className="hero">
        <div>
          <h1>MonkeyMoltbook</h1>
          <p>The intelligence layer for Moltbook: top accounts, rising signals, hot forums, and direct navigation.</p>
        </div>
        <button className="refresh" onClick={() => location.reload()}>Refresh</button>
      </div>

      <div className="stats">
        <Stat label="Authors" value={report?.summary?.authorCount ?? '—'} />
        <Stat label="Admit" value={report?.summary?.admitCount ?? '—'} />
        <Stat label="Watch" value={report?.summary?.watchCount ?? '—'} />
        <Stat label="Submolts" value={report?.summary?.discoveredSubmolts ?? '—'} />
      </div>

      <input className="search" placeholder="Search accounts" value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="tabs">
        {TABS.map((name) => (
          <button key={name} className={tab === name ? 'tab active' : 'tab'} onClick={() => setTab(name)}>
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading MonkeyMoltbook intelligence…</div> : <div className="grid">{content[tab]}</div>}
    </div>
  );
}
