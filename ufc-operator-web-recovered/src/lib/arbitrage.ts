type ExitPlanInput = {
  fighterName: string;
  opponentName: string;
  sportsbook: string | null;
  stakeUnits: number;
  entryOdds: number;
  currentOdds: number | null;
  opponentCurrentOdds: number | null;
  modelProbability: number | null;
  impliedProbabilityAtPick: number | null;
  currentImpliedProbability: number | null;
  round?: number | null;
  fightStatus?: string | null;
};

export type ExitPlan = {
  fighterName: string;
  opponentName: string;
  sportsbook: string | null;
  holdProfitIfWin: number;
  holdLossIfLose: number;
  entryToWinUnits: number;
  currentOdds: number | null;
  currentImpliedProbability: number | null;
  marketMovePct: number | null;
  edgeDeltaPct: number | null;
  hedgeStakeUnits: number | null;
  hedgeBookReturnUnits: number | null;
  guaranteedProfitUnits: number | null;
  reducedLossUnits: number | null;
  decision: 'hold' | 'hedge' | 'watch';
  rationale: string;
};

function normalizeName(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function americanToProbability(odds: number | null | undefined) {
  if (odds == null || Number.isNaN(Number(odds)) || Number(odds) === 0) return null;
  const value = Number(odds);
  return value > 0 ? 100 / (value + 100) : Math.abs(value) / (Math.abs(value) + 100);
}

function profitFromOdds(stakeUnits: number, odds: number) {
  if (odds > 0) return stakeUnits * (odds / 100);
  return stakeUnits * (100 / Math.abs(odds));
}

function hedgeStakeForLock(entryProfit: number, opponentOdds: number | null) {
  if (opponentOdds == null || Number.isNaN(Number(opponentOdds)) || Number(opponentOdds) === 0) return null;
  const odds = Number(opponentOdds);
  if (odds > 0) {
    return entryProfit / (odds / 100);
  }
  return entryProfit / (100 / Math.abs(odds));
}

export function buildExitPlan(input: ExitPlanInput): ExitPlan {
  const holdProfitIfWin = profitFromOdds(input.stakeUnits, input.entryOdds);
  const holdLossIfLose = -input.stakeUnits;
  const currentImpliedProbability = input.currentImpliedProbability ?? americanToProbability(input.currentOdds);
  const marketMovePct = input.impliedProbabilityAtPick == null || currentImpliedProbability == null
    ? null
    : (currentImpliedProbability - input.impliedProbabilityAtPick) * 100;
  const edgeDeltaPct = input.modelProbability == null || currentImpliedProbability == null
    ? null
    : (input.modelProbability - currentImpliedProbability) * 100;

  const hedgeStakeUnits = hedgeStakeForLock(holdProfitIfWin, input.opponentCurrentOdds);
  const hedgeBookReturnUnits = hedgeStakeUnits == null || input.opponentCurrentOdds == null
    ? null
    : profitFromOdds(hedgeStakeUnits, input.opponentCurrentOdds);
  const guaranteedProfitUnits = hedgeStakeUnits == null || hedgeBookReturnUnits == null
    ? null
    : Math.min(holdProfitIfWin - hedgeStakeUnits, hedgeBookReturnUnits - input.stakeUnits);
  const reducedLossUnits = hedgeStakeUnits == null || hedgeBookReturnUnits == null
    ? null
    : Math.max(holdProfitIfWin - hedgeStakeUnits, hedgeBookReturnUnits - input.stakeUnits);

  let decision: ExitPlan['decision'] = 'watch';
  let rationale = 'Waiting for a stronger in-fight swing before recommending action.';

  const liveRound = Number(input.round ?? 0);
  const liveActive = input.fightStatus === 'live' || input.fightStatus === 'between-rounds';

  if (liveActive && liveRound >= 1 && (marketMovePct ?? 0) >= 12 && guaranteedProfitUnits != null && guaranteedProfitUnits > 0) {
    decision = 'hedge';
    rationale = `Round ${liveRound}: live market moved strongly in your favor. Hedge now can lock profit on both sides.`;
  } else if (liveActive && liveRound >= 1 && (marketMovePct ?? 0) >= 8 && reducedLossUnits != null && reducedLossUnits > -0.25 * input.stakeUnits) {
    decision = 'hedge';
    rationale = `Round ${liveRound}: live market improved enough to reduce downside materially even if a full lock is not available.`;
  } else if ((marketMovePct ?? 0) >= 4) {
    decision = 'watch';
    rationale = 'Momentum improved, but not enough yet for a clean hedge recommendation.';
  } else {
    decision = 'hold';
    rationale = 'No meaningful live move yet. Best action is to hold and keep monitoring.';
  }

  return {
    fighterName: input.fighterName,
    opponentName: input.opponentName,
    sportsbook: input.sportsbook,
    holdProfitIfWin,
    holdLossIfLose,
    entryToWinUnits: holdProfitIfWin,
    currentOdds: input.currentOdds,
    currentImpliedProbability,
    marketMovePct,
    edgeDeltaPct,
    hedgeStakeUnits,
    hedgeBookReturnUnits,
    guaranteedProfitUnits,
    reducedLossUnits,
    decision,
    rationale,
  };
}

export function buildArbitrageBoardRows(bets: any[], liveFights: any[], roundState: Record<string, any> = {}) {
  const fightMap = new Map(liveFights.map((fight: any) => [Number(fight.fightId ?? fight.fight_id), fight]));
  const fighterPairMap = new Map(
    liveFights.map((fight: any) => {
      const names = String(fight.fight ?? '')
        .split(' vs ')
        .map((name: string) => normalizeName(name))
        .sort()
        .join('|');
      return [names, fight];
    }),
  );

  return bets
    .filter((bet: any) => bet.result === 'pending')
    .map((bet: any) => {
      const pairKey = [normalizeName(bet.fighter_name), normalizeName(bet.opponent_name)].sort().join('|');
      const live = fightMap.get(Number(bet.fight_id)) ?? fighterPairMap.get(pairKey);
      const draftkingsOdds = live?.rawSportsbookOdds?.find((row: any) => row.sportsbook === 'draftkings')?.pickedOdds ?? null;
      const fanduelOdds = live?.rawSportsbookOdds?.find((row: any) => row.sportsbook === 'fanduel')?.pickedOdds ?? null;
      const draftkingsOpponentOdds = live?.rawSportsbookOdds?.find((row: any) => row.sportsbook === 'draftkings')?.opponentOdds ?? null;
      const fanduelOpponentOdds = live?.rawSportsbookOdds?.find((row: any) => row.sportsbook === 'fanduel')?.opponentOdds ?? null;
      const opponentCurrentOdds = live?.selectedOpponentOdds ?? null;

      const state = roundState[String(bet.fight_id)] ?? null;
      const plan = buildExitPlan({
        fighterName: bet.fighter_name,
        opponentName: bet.opponent_name,
        sportsbook: live?.selectedSportsbook ?? bet.sportsbook_used,
        stakeUnits: Number(bet.bet_size_units ?? 0),
        entryOdds: Number(bet.odds_at_pick),
        currentOdds: live?.pick === bet.fighter_name ? Number(live?.selectedOdds ?? null) : null,
        opponentCurrentOdds,
        modelProbability: live?.modelProbability ?? bet.model_probability ?? null,
        impliedProbabilityAtPick: bet.implied_probability_at_pick ?? null,
        currentImpliedProbability: live?.selectedMarketProbability ?? null,
        round: state?.round ?? null,
        fightStatus: state?.status ?? null,
      });

      return {
        fightId: Number(bet.fight_id),
        fight: `${bet.fighter_name} vs ${bet.opponent_name}`,
        fighterName: bet.fighter_name,
        opponentName: bet.opponent_name,
        sportsbookUsed: bet.sportsbook_used,
        stakeUnits: Number(bet.bet_size_units ?? 0),
        entryOdds: Number(bet.odds_at_pick),
        currentOdds: live?.pick === bet.fighter_name ? Number(live?.selectedOdds ?? null) : null,
        currentSportsbook: live?.selectedSportsbook ?? null,
        draftkingsOdds,
        fanduelOdds,
        draftkingsOpponentOdds,
        fanduelOpponentOdds,
        oddsFreshnessMinutes: live?.oddsFreshnessMinutes ?? null,
        scheduledRounds: live?.scheduled_rounds ?? live?.scheduledRounds ?? null,
        manualRound: state?.round ?? null,
        manualStatus: state?.status ?? null,
        manualNote: state?.note ?? null,
        plan,
      };
    });
}
