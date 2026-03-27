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

  if ((marketMovePct ?? 0) >= 12 && guaranteedProfitUnits != null && guaranteedProfitUnits > 0) {
    decision = 'hedge';
    rationale = 'Live market moved strongly in your favor. Hedge now can lock profit on both sides.';
  } else if ((marketMovePct ?? 0) >= 8 && reducedLossUnits != null && reducedLossUnits > -0.25 * input.stakeUnits) {
    decision = 'hedge';
    rationale = 'Live market improved enough to reduce downside materially even if a full lock is not available.';
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

export function buildArbitrageBoardRows(bets: any[], liveFights: any[]) {
  const fightMap = new Map(liveFights.map((fight: any) => [Number(fight.fightId ?? fight.fight_id), fight]));

  return bets
    .filter((bet: any) => bet.result === 'pending')
    .map((bet: any) => {
      const live = fightMap.get(Number(bet.fight_id));
      const draftkingsOdds = live?.rawSportsbookOdds?.find((row: any) => row.sportsbook === 'draftkings')?.pickedOdds ?? null;
      const fanduelOdds = live?.rawSportsbookOdds?.find((row: any) => row.sportsbook === 'fanduel')?.pickedOdds ?? null;
      const opponentCurrentOdds = live?.selectedOdds != null && live?.pick === bet.fighter_name
        ? null
        : live?.selectedOdds ?? null;

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
        oddsFreshnessMinutes: live?.oddsFreshnessMinutes ?? null,
        plan,
      };
    });
}
