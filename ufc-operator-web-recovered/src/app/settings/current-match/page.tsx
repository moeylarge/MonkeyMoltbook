'use client';

import { useEffect, useState } from 'react';

type Row = {
  fight: string;
  fighterName: string;
  opponentName: string;
  currentBook: string | null;
  currentOdds: number | null;
  opponentOdds: number | null;
  updatedAt: string | null;
};

type LiveBoardResponse = {
  ok: boolean;
  rows?: Row[];
  error?: string;
};

function fmtOdds(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return value > 0 ? `+${value}` : `${value}`;
}

function fmtTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

export default function CurrentMatchPage() {
  const [data, setData] = useState<LiveBoardResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/live-board', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (error: any) {
        if (!cancelled) setData({ ok: false, error: error?.message ?? 'live_fetch_failed' });
      }
    };
    load();
    const id = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const row = data?.rows?.[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">Settings</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Current live / upcoming match</h1>
      </div>

      <section className="card p-5">
        {!data?.ok ? (
          <div className="text-sm text-red-300">Unavailable{data?.error ? `: ${data.error}` : ''}</div>
        ) : !row ? (
          <div className="text-sm text-zinc-400">No live/upcoming tracked match right now.</div>
        ) : (
          <div className="space-y-3 text-sm text-zinc-300">
            <div><span className="text-zinc-500">Fight:</span> <span className="text-white">{row.fight}</span></div>
            <div><span className="text-zinc-500">Status:</span> <span className="text-white">live / upcoming</span></div>
            <div><span className="text-zinc-500">Current live odds:</span> <span className="text-white">{fmtOdds(row.currentOdds)}</span></div>
            <div><span className="text-zinc-500">Opponent odds:</span> <span className="text-white">{fmtOdds(row.opponentOdds)}</span></div>
            <div><span className="text-zinc-500">Book:</span> <span className="text-white">{row.currentBook ?? '—'}</span></div>
            <div><span className="text-zinc-500">Last updated:</span> <span className="text-white">{fmtTime(row.updatedAt)}</span></div>
          </div>
        )}
      </section>
    </div>
  );
}
