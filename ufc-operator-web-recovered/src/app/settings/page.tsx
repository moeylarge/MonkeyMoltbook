import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { CurrentMatchCard } from '@/components/current-match-card';
import { getBettingDecisionSummary, getPublicBettingFeed } from '@/lib/ufc-data';
import { getManualRoundState, saveManualRoundState } from '@/lib/manual-round-state';

export default async function SettingsPage() {
  const betting = await getBettingDecisionSummary();
  const thresholds = betting?.thresholds ?? {};
  const feed = await getPublicBettingFeed();
  const manualState = await getManualRoundState();
  const fights = (feed?.fights ?? []).slice(0, 20);

  async function updateRoundState(formData: FormData) {
    'use server';
    const fightId = String(formData.get('fightId') ?? '');
    const round = Number(formData.get('round') ?? 0);
    const status = String(formData.get('status') ?? 'pre-fight') as 'pre-fight' | 'live' | 'between-rounds' | 'completed';
    const note = String(formData.get('note') ?? '').trim();
    const next = await getManualRoundState();
    next[fightId] = {
      round,
      status,
      note,
      updatedAt: new Date().toISOString(),
    };
    await saveManualRoundState(next);
    revalidatePath('/settings');
    revalidatePath('/alerts');
    revalidatePath('/performance');
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">Settings</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Operator thresholds</h1>
        <p className="mt-2 text-sm text-zinc-400">Manual round-state control is now enabled for tomorrow&apos;s live hedge workflow.</p>
      </div>

      <CurrentMatchCard />

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Manual round-state control</h2>
          <Link href="/settings/current-match" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">Open current match</Link>
        </div>
        <div className="space-y-4">
          {fights.map((fight: any) => {
            const state = manualState[String(fight.fightId)] ?? { round: 0, status: 'pre-fight', note: '' };
            return (
              <form key={fight.fightId} action={updateRoundState} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <input type="hidden" name="fightId" value={fight.fightId} />
                <div className="mb-3">
                  <div className="font-medium text-white">{fight.fight}</div>
                  <div className="mt-1 text-sm text-zinc-400">Pick {fight.pick} · current odds {fight.odds > 0 ? `+${fight.odds}` : fight.odds}</div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-sm text-zinc-300">
                    <div className="mb-1 text-zinc-400">Round</div>
                    <input className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" type="number" min="0" max="5" name="round" defaultValue={state.round} />
                  </label>
                  <label className="text-sm text-zinc-300">
                    <div className="mb-1 text-zinc-400">Status</div>
                    <select className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" name="status" defaultValue={state.status}>
                      <option value="pre-fight">pre-fight</option>
                      <option value="live">live</option>
                      <option value="between-rounds">between-rounds</option>
                      <option value="completed">completed</option>
                    </select>
                  </label>
                  <label className="text-sm text-zinc-300 md:col-span-2">
                    <div className="mb-1 text-zinc-400">Note</div>
                    <input className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" type="text" name="note" defaultValue={state.note ?? ''} placeholder="Won round 1, strong top control, etc." />
                  </label>
                </div>
                <div className="mt-3">
                  <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500" type="submit">Save live state</button>
                </div>
              </form>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Current decision thresholds</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-sm text-zinc-300">
          {Object.entries(thresholds).map(([key, value]) => (
            <div key={key} className="metric">
              <div className="text-zinc-400">{key}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{String(value)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
