export const revalidate = 15;

import { StatusBadge } from '@/components/status-badge';
import { buildArbitrageBoardRows } from '@/lib/arbitrage';
import { getBetHistory } from '@/lib/bet-ledger';
import { getManualRoundState } from '@/lib/manual-round-state';
import { formatDateTime, formatPct, formatSigned, getPublicBettingFeed } from '@/lib/ufc-data';

export default async function AlertsPage() {
  const [feed, betHistory, roundState] = await Promise.all([
    getPublicBettingFeed(),
    getBetHistory('date'),
    getManualRoundState(),
  ]);
  const bestBets = feed?.todaysBestBets ?? [];
  const movers = (feed?.fights ?? []).filter((fight: any) => Number(fight.edgePct ?? 0) > 5).slice(0, 12);
  const arbitrageRows = buildArbitrageBoardRows(betHistory, feed?.fights ?? [], roundState);
  const hedgeNow = arbitrageRows.filter((row: any) => row.plan.decision === 'hedge');

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">Alerts</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Value bet alerts</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Alerts only fire when a fight clears the value-bet threshold or the live hedge engine sees a real exit opportunity.
        </p>
        <div className="mt-2 text-xs text-cyan-300">
          Live odds updated: {formatDateTime(feed?.oddsTimestamp)} · freshness {feed?.oddsFreshnessMinutes ?? '—'} min
        </div>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">HEDGE NOW</h2>
        <div className="space-y-3">
          {hedgeNow.map((row: any) => (
            <div key={row.fightId} className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium text-white">Hedge now: {row.fighterName}</div>
                  <div className="mt-1 text-sm text-zinc-300">
                    {row.fight} · entry {row.entryOdds > 0 ? `+${row.entryOdds}` : row.entryOdds} · live {row.currentOdds != null ? (row.currentOdds > 0 ? `+${row.currentOdds}` : row.currentOdds) : '—'}
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    Round {row.manualRound ?? '—'} · status {row.manualStatus ?? '—'} · hedge stake {row.plan.hedgeStakeUnits == null ? '—' : `${row.plan.hedgeStakeUnits.toFixed(2)}u`} · lock profit {row.plan.guaranteedProfitUnits == null ? '—' : formatSigned(row.plan.guaranteedProfitUnits, 2)}u
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge label="HEDGE NOW" tone="approved" />
                  <StatusBadge label={row.currentSportsbook ?? 'live'} tone="review" />
                </div>
              </div>
            </div>
          ))}
          {!hedgeNow.length && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">No live hedge alerts right now.</div>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Current value bet alerts</h2>
        <div className="space-y-3">
          {(bestBets.length ? bestBets : []).slice(0, 12).map((bet: any) => (
            <div key={`${bet.fightId}-${bet.sportsbook}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium text-white">Value bet detected: {bet.pick}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {bet.fight} · {bet.odds > 0 ? `+${bet.odds}` : bet.odds} · edge {formatSigned(bet.edgePct, 2, '%')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge label="BET" tone="approved" />
                  <StatusBadge label={`${bet.betSizeUnits}u`} tone="paper_candidate" />
                </div>
              </div>
            </div>
          ))}
          {!bestBets.length && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">No active value bet alerts right now.</div>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Highest current edges</h2>
        <div className="space-y-3">
          {movers.map((fight: any) => (
            <div key={`${fight.fightId}-${fight.sportsbook}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="font-medium text-white">{fight.fight}</div>
              <div className="mt-1 text-sm text-zinc-400">
                Pick {fight.pick} · Odds {fight.odds > 0 ? `+${fight.odds}` : fight.odds} · Model {formatPct(fight.modelProbability, 1)} · Edge {formatSigned(fight.edgePct, 2, '%')}
              </div>
            </div>
          ))}
          {!movers.length && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">No edges above the alert threshold.</div>}
        </div>
      </section>
    </div>
  );
}
