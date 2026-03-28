'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = {
  fight: string;
  fighterName: string;
  opponentName: string;
  pick: string;
  betPlacedAt: string | null;
  currentBook: string | null;
  currentOdds: number | null;
  opponentOdds: number | null;
  updatedAt: string | null;
  entryOdds: number;
  movement: number | null;
  actionHint: string;
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

function fmtMove(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return value > 0 ? `+${value}` : `${value}`;
}

function fmtTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function movementTone(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return 'text-zinc-300 bg-zinc-800/70';
  if (value > 0) return 'text-emerald-300 bg-emerald-500/15';
  if (value < 0) return 'text-rose-300 bg-rose-500/15';
  return 'text-zinc-300 bg-zinc-800/70';
}

export default function CurrentMatchPage() {
  const [data, setData] = useState<LiveBoardResponse | null>(null);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

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
  const noteKey = useMemo(() => (row ? `current-match-note:${row.fight}` : null), [row]);

  useEffect(() => {
    if (!noteKey) return;
    setNote(window.localStorage.getItem(noteKey) ?? '');
    setSaveState('idle');
  }, [noteKey]);

  const saveNote = () => {
    if (!noteKey) return;
    window.localStorage.setItem(noteKey, note);
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1500);
  };

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
          <div className="space-y-5 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300">
                Live now / up next
              </span>
            </div>
            <div><span className="text-zinc-500">Fight:</span> <span className="text-white">{row.fight}</span></div>
            <div><span className="text-zinc-500">Status:</span> <span className="text-white">live / upcoming</span></div>
            <div><span className="text-zinc-500">Pick:</span> <span className="text-white">{row.pick}</span></div>
            <div><span className="text-zinc-500">Entry odds:</span> <span className="text-white">{fmtOdds(row.entryOdds)}</span></div>
            <div><span className="text-zinc-500">Bet placed:</span> <span className="text-white">{fmtTime(row.betPlacedAt)}</span></div>
            <div>
              <div className="text-zinc-500">Current live odds</div>
              <div className="mt-1 text-4xl font-bold text-red-400">{fmtOdds(row.currentOdds)}</div>
            </div>
            <div>
              <div className="text-zinc-500">Opponent live odds</div>
              <div className="mt-1 text-3xl font-bold text-white">{fmtOdds(row.opponentOdds)}</div>
            </div>
            <div>
              <div className="text-zinc-500">Live odds movement</div>
              <div className={`mt-1 inline-flex rounded-full px-3 py-1 text-lg font-semibold ${movementTone(row.movement)}`}>{fmtMove(row.movement)}</div>
            </div>
            <div><span className="text-zinc-500">Action hint:</span> <span className="text-white">{row.actionHint}</span></div>
            <div><span className="text-zinc-500">Book:</span> <span className="text-white">{row.currentBook ?? '—'}</span></div>
            <div><span className="text-zinc-500">Last updated:</span> <span className="text-white">{fmtTime(row.updatedAt)}</span></div>

            <div>
              <div className="mb-2 text-zinc-500">Notes</div>
              <textarea
                className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                placeholder="What are we watching here? cardio, damage, line movement, hedge thoughts..."
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setSaveState('idle');
                }}
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveNote}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                >
                  Save note
                </button>
                {saveState === 'saved' ? <span className="text-xs text-emerald-300">Saved</span> : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
