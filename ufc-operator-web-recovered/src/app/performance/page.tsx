export const revalidate = 15;

import { getBetHistory, getPerformanceMetrics } from '@/lib/bet-ledger';
import { buildArbitrageBoardRows } from '@/lib/arbitrage';
import { getManualRoundState } from '@/lib/manual-round-state';
import { formatDateTime, formatNumber, formatPct, formatSigned, getPublicBettingFeed } from '@/lib/ufc-data';

export default async function PerformancePage({ searchParams }: { searchParams?: Promise<{ sort?: string }> }) {
  const params = (await searchParams) ?? {};
  const [performance, betHistory, feed, roundState] = await Promise.all([
    getPerformanceMetrics(),
    getBetHistory(params.sort ?? 'date'),
    getPublicBettingFeed(),
    getManualRoundState(),
  ]);
  const arbitrageRows = buildArbitrageBoardRows(betHistory, feed?.fights ?? [], roundState);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">Performance</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Track edge over time</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          This page exists to prove or disprove whether the system has real betting value. If the numbers are bad, the system should say so clearly.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric"><div className="text-sm text-zinc-400">Total units</div><div className="mt-2 text-3xl font-semibold text-white">{formatSigned(performance.totalUnits, 2)}</div></div>
        <div className="metric"><div className="text-sm text-zinc-400">ROI</div><div className="mt-2 text-3xl font-semibold text-white">{formatPct(performance.roi, 2)}</div></div>
        <div className="metric"><div className="text-sm text-zinc-400">Win rate</div><div className="mt-2 text-3xl font-semibold text-white">{formatPct(performance.winRate, 2)}</div></div>
        <div className="metric"><div className="text-sm text-zinc-400">Avg CLV</div><div className="mt-2 text-3xl font-semibold text-white">{formatPct(performance.averageClv, 2)}</div></div>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Rolling performance</h2>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="metric"><div className="text-zinc-400">Last 10 bets</div><div className="mt-2 text-white">Units {formatSigned(performance.last10.units, 2)} · ROI {formatPct(performance.last10.roi, 2)} · Win rate {formatPct(performance.last10.winRate, 2)}</div></div>
          <div className="metric"><div className="text-zinc-400">Last 30 bets</div><div className="mt-2 text-white">Units {formatSigned(performance.last30.units, 2)} · ROI {formatPct(performance.last30.roi, 2)} · Win rate {formatPct(performance.last30.winRate, 2)}</div></div>
        </div>
        <div className="mt-4 text-sm text-zinc-400">Positive CLV rate: {formatPct(performance.positiveClvRate, 2)}</div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Live arbitrage / hedge board</h2>
        <p className="mb-2 max-w-3xl text-sm text-zinc-400">
          This is the first pass of the live exit engine: compare entry odds vs current live line and decide whether to hold, watch, or hedge.
        </p>
        <div className="mb-4 text-xs text-cyan-300">
          Live odds updated: {formatDateTime(feed?.oddsTimestamp)} · freshness {feed?.oddsFreshnessMinutes ?? '—'} min
        </div>
        {arbitrageRows.length ? (
          <div className="table-wrap">
            <table className="data-table min-w-[1400px] bg-zinc-950/40 text-sm">
              <thead>
                <tr>
                  <th>Fight</th>
                  <th>Entry</th>
                  <th>Live</th>
                  <th>Opp live</th>
                  <th>Move</th>
                  <th>Decision</th>
                  <th>Lock profit</th>
                  <th>Reduced loss</th>
                  <th>Hedge stake</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {arbitrageRows.map((row: any) => (
                  <tr key={row.fightId}>
                    <td>
                      <div className="font-medium text-white">{row.fight}</div>
                      <div className="mt-1 text-xs text-zinc-500">{row.sportsbookUsed} · freshness {row.oddsFreshnessMinutes ?? '—'} min · rounds {row.scheduledRounds ?? '—'} · live state {row.manualStatus ?? 'unset'} R{row.manualRound ?? 0}</div>
                    </td>
                    <td>{row.entryOdds > 0 ? `+${row.entryOdds}` : row.entryOdds} · {formatNumber(row.stakeUnits, 2)}u</td>
                    <td>{row.currentOdds == null ? 'Pending live move' : row.currentOdds > 0 ? `+${row.currentOdds}` : row.currentOdds}</td>
                    <td>{row.plan.hedgeBookReturnUnits == null && row.plan.hedgeStakeUnits == null ? (row.draftkingsOpponentOdds == null && row.fanduelOpponentOdds == null ? 'Missing' : (row.currentSportsbook === 'draftkings' ? row.draftkingsOpponentOdds : row.currentSportsbook === 'fanduel' ? row.fanduelOpponentOdds : null) > 0 ? `+${row.currentSportsbook === 'draftkings' ? row.draftkingsOpponentOdds : row.currentSportsbook === 'fanduel' ? row.fanduelOpponentOdds : null}` : (row.currentSportsbook === 'draftkings' ? row.draftkingsOpponentOdds : row.currentSportsbook === 'fanduel' ? row.fanduelOpponentOdds : '—')) : (row.currentSportsbook === 'draftkings' ? row.draftkingsOpponentOdds : row.currentSportsbook === 'fanduel' ? row.fanduelOpponentOdds : null) > 0 ? `+${row.currentSportsbook === 'draftkings' ? row.draftkingsOpponentOdds : row.currentSportsbook === 'fanduel' ? row.fanduelOpponentOdds : null}` : (row.currentSportsbook === 'draftkings' ? row.draftkingsOpponentOdds : row.currentSportsbook === 'fanduel' ? row.fanduelOpponentOdds : '—')}</td>
                    <td>{row.plan.marketMovePct == null ? '—' : formatSigned(row.plan.marketMovePct, 2, '%')}</td>
                    <td className="font-semibold text-white">{row.plan.decision.toUpperCase()}</td>
                    <td>{row.plan.guaranteedProfitUnits == null ? 'Need opponent live line' : `${formatSigned(row.plan.guaranteedProfitUnits, 2)}u`}</td>
                    <td>{row.plan.reducedLossUnits == null ? 'Need opponent live line' : `${formatSigned(row.plan.reducedLossUnits, 2)}u`}</td>
                    <td>{row.plan.hedgeStakeUnits == null ? 'Need opponent live line' : `${formatNumber(row.plan.hedgeStakeUnits, 2)}u`}</td>
                    <td className="max-w-[360px] text-zinc-400">{row.plan.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No pending bets available for live arbitrage tracking yet.</div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Full bet history</h2>
        <div className="mb-3 flex gap-3 text-sm text-cyan-300">
          <a href="/performance?sort=date">Sort by date</a>
          <a href="/performance?sort=edge">Sort by edge</a>
          <a href="/performance?sort=result">Sort by result</a>
        </div>
        <div className="table-wrap">
          <table className="data-table min-w-[1200px] bg-zinc-950/40 text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fight</th>
                <th>Sportsbook</th>
                <th>Odds at pick</th>
                <th>Model</th>
                <th>Edge</th>
                <th>Bet size</th>
                <th>Result</th>
                <th>Payout</th>
                <th>Closing odds</th>
                <th>CLV</th>
                <th>Movement</th>
              </tr>
            </thead>
            <tbody>
              {betHistory.map((bet: any) => (
                <tr key={bet.id}>
                  <td>{formatDateTime(bet.timestamp_pick)}</td>
                  <td>{bet.fighter_name} vs {bet.opponent_name}</td>
                  <td>{bet.sportsbook_used}</td>
                  <td>{bet.odds_at_pick > 0 ? `+${bet.odds_at_pick}` : bet.odds_at_pick}</td>
                  <td>{formatPct(bet.model_probability, 2)}</td>
                  <td>{formatSigned(bet.edge_at_pick, 2, '%')}</td>
                  <td>{formatNumber(bet.bet_size_units, 2)}u</td>
                  <td>{bet.result}</td>
                  <td>{formatSigned(bet.payout_units, 2)}</td>
                  <td>{bet.closing_odds == null ? 'Pending' : bet.closing_odds > 0 ? `+${bet.closing_odds}` : bet.closing_odds}</td>
                  <td>{bet.clv == null ? 'Pending' : formatPct(bet.clv, 2)}</td>
                  <td>{bet.market_movement_direction ?? 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
