'use client';

import { useEffect, useState } from 'react';

type LiveRow = {
  fight: string;
  sportsbookUsed: string;
  entryOdds: number;
  stakeUnits: number;
  currentBook: string | null;
  currentOdds: number | null;
  opponentOdds: number | null;
  updatedAt: string | null;
};

type LiveBoardResponse = {
  ok: boolean;
  fetchedAt?: string;
  rows?: LiveRow[];
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

export function LiveBoard() {
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

  return (
    <section className="card p-5">
      <h2 className="mb-2 text-lg font-semibold text-white">Live board (60s API)</h2>
      <div className="mb-4 text-xs text-cyan-300">
        Last API fetch: {fmtTime(data?.fetchedAt)}
      </div>
      {!data?.ok ? (
        <div className="text-sm text-red-300">Live board unavailable{data?.error ? `: ${data.error}` : ''}</div>
      ) : !data.rows?.length ? (
        <div className="text-sm text-zinc-400">No pending fights found for today.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-zinc-400">
              <tr>
                <th className="pb-2 pr-4">Fight</th>
                <th className="pb-2 pr-4">Entry</th>
                <th className="pb-2 pr-4">Live</th>
                <th className="pb-2 pr-4">Opp live</th>
                <th className="pb-2 pr-4">Book</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.fight}-${row.sportsbookUsed}`} className="border-t border-white/5 align-top text-zinc-200">
                  <td className="py-2 pr-4">{row.fight}</td>
                  <td className="py-2 pr-4">{fmtOdds(row.entryOdds)} · {row.stakeUnits.toFixed(2)}u</td>
                  <td className="py-2 pr-4">{fmtOdds(row.currentOdds)}</td>
                  <td className="py-2 pr-4">{fmtOdds(row.opponentOdds)}</td>
                  <td className="py-2 pr-4">{row.currentBook ?? '—'}</td>
                  <td className="py-2">{fmtTime(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
