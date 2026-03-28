export const revalidate = 15;

import Link from 'next/link';
import { OddsRecommendationValue, OddsStatusNote } from '@/components/odds-integrity';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime, formatPct, formatSigned, getPublicBettingFeed, isUpcomingFight } from '@/lib/ufc-data';

export default async function FightsPage() {
  const feed = await getPublicBettingFeed();
  const fights = [...(feed?.fights ?? [])]
    .filter((fight: any) => isUpcomingFight(fight))
    .sort((a: any, b: any) => Number(b.edgePct ?? 0) - Number(a.edgePct ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">Fight board</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Decision table</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Upcoming UFC fights only, sorted by highest edge first. This page answers one question only: is this a BET, PASS, or AVOID?
        </p>
      </div>

      <div className="table-wrap">
        <table className="data-table min-w-[1000px] bg-zinc-950/40 text-sm">
          <thead>
            <tr>
              <th>Fight</th>
              <th>Pick</th>
              <th>Odds</th>
              <th>Model probability</th>
              <th>Edge</th>
              <th>Signal</th>
              <th>Bet size</th>
            </tr>
          </thead>
          <tbody>
            {fights.map((fight: any) => (
              <tr key={fight.fightId}>
                <td>
                  <Link className="font-medium text-white hover:text-cyan-300" href={`/fights/${fight.fightId}`}>
                    {fight.fight}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-500">{fight.eventName}</div>
                  <details className="mt-2 text-xs text-zinc-500">
                    <summary className="cursor-pointer list-none font-medium text-zinc-400">Details</summary>
                    <div className="mt-2 space-y-1">
                      <div>{fight.oddsSourceLabel} · {formatDateTime(fight.oddsTimestamp)} · {fight.oddsFreshnessMinutes ?? '—'} min</div>
                      <div>Odds at prediction: {fight.oddsAtPrediction == null ? '—' : fight.oddsAtPrediction > 0 ? `+${fight.oddsAtPrediction}` : fight.oddsAtPrediction} · Closing odds: {fight.clvPending ? 'Pending' : fight.closingOdds}</div>
                    </div>
                  </details>
                </td>
                <td className="text-lg font-bold text-white">{fight.pick}</td>
                <td className="text-zinc-300">{fight.odds > 0 ? `+${fight.odds}` : fight.odds}</td>
                <td className="text-zinc-300">{formatPct(fight.modelProbability, 1)}</td>
                <td className={fight.edgePct > 5 ? 'text-emerald-300' : fight.edgePct < -5 ? 'text-rose-300' : 'text-zinc-200'}>
                  <div className="text-lg font-bold">{formatSigned(fight.edgePct, 2, '%')}</div>
                  <div className="mt-1 text-xs text-zinc-500"><OddsStatusNote oddsTimestamp={fight.oddsTimestamp} /></div>
                </td>
                <td>
                  <div className="flex flex-col gap-2">
                    <OddsRecommendationValue oddsTimestamp={fight.oddsTimestamp} hiddenFallback={<StatusBadge label="—" tone="suppressed" />}>
                      <StatusBadge
                        label={fight.signal}
                        tone={fight.signal === 'BET' ? 'approved' : fight.signal === 'PASS' ? 'review' : 'suppressed'}
                      />
                    </OddsRecommendationValue>
                    {fight.isHighRiskEdge ? <StatusBadge label="⚠ High edge anomaly" tone="suppressed" /> : null}
                  </div>
                </td>
                <td><div className="text-lg font-bold text-white"><OddsRecommendationValue oddsTimestamp={fight.oddsTimestamp}>{fight.betSizeUnits ? `${fight.betSizeUnits}u` : '—'}</OddsRecommendationValue></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
