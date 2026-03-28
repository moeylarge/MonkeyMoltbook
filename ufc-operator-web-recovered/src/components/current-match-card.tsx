'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Row = {
  fight: string;
  fighterName: string;
  opponentName: string;
  sportsbookUsed: string;
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
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function CurrentMatchCard() {
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
    <section className="card p-5">
      <div className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-500">Current live / upcoming match</div>
      {!data?.ok ? (
        <div className="text-sm text-red-300">Unavailable{data?.error ? `: ${data.error}` : ''}</div>
      ) : !row ? (
        <div className="text-sm text-zinc-400">No live/upcoming tracked match right now.</div>
      ) : (
        <>
          <div className="text-xl font-semibold text-white">{row.fight}</div>
          <div className="mt-2 text-sm text-zinc-300">Status: live / upcoming</div>
          <div className="mt-2 text-sm text-zinc-300">Current live odds: {fmtOdds(row.currentOdds)}</div>
          <div className="mt-1 text-sm text-zinc-300">Opponent odds: {fmtOdds(row.opponentOdds)}</div>
          <div className="mt-1 text-sm text-zinc-300">Last updated: {fmtTime(row.updatedAt)}</div>
          <div className="mt-4">
            <Link href="/settings/current-match" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
              Open current match
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
