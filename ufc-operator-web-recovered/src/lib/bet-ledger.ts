import { Pool } from 'pg';

let pool: Pool | null = null;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL');
  if (!pool) pool = new Pool({ connectionString });
  return pool;
}

export async function initBetLedgerDb() {
  if (!hasDatabase()) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS bets (
      id BIGSERIAL PRIMARY KEY,
      fight_id BIGINT NOT NULL,
      fighter_name TEXT NOT NULL,
      opponent_name TEXT NOT NULL,
      sportsbook_used TEXT NOT NULL,
      odds_at_pick INTEGER NOT NULL,
      implied_probability_at_pick DOUBLE PRECISION NOT NULL,
      model_probability DOUBLE PRECISION NOT NULL,
      edge_at_pick DOUBLE PRECISION NOT NULL,
      bet_size_units DOUBLE PRECISION NOT NULL,
      timestamp_pick TIMESTAMPTZ NOT NULL,
      result TEXT NOT NULL DEFAULT 'pending',
      payout_units DOUBLE PRECISION NOT NULL DEFAULT 0,
      closing_odds INTEGER,
      implied_probability_closing DOUBLE PRECISION,
      clv DOUBLE PRECISION,
      opening_odds INTEGER,
      market_movement_direction TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT bets_result_check CHECK (result IN ('win','loss','pending')),
      CONSTRAINT bets_unique_snapshot UNIQUE (fight_id, fighter_name, timestamp_pick)
    );
    CREATE INDEX IF NOT EXISTS idx_bets_timestamp_pick ON bets(timestamp_pick DESC);
    CREATE INDEX IF NOT EXISTS idx_bets_fight_id ON bets(fight_id);
  `);
}

export async function recordDisplayedBets(bets: any[]) {
  if (!bets.length || !hasDatabase()) return;
  await initBetLedgerDb();
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const bet of bets) {
      const openingOdds = bet.rawSportsbookOdds?.find((row: any) => row.sportsbook === bet.selectedSportsbook)?.pickedOdds ?? bet.odds ?? null;
      await client.query(
        `INSERT INTO bets (
          fight_id, fighter_name, opponent_name, sportsbook_used, odds_at_pick,
          implied_probability_at_pick, model_probability, edge_at_pick, bet_size_units,
          timestamp_pick, result, payout_units, closing_odds, implied_probability_closing,
          clv, opening_odds, market_movement_direction, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,'pending',0,NULL,NULL,
          NULL,$11,NULL,NOW(),NOW()
        ) ON CONFLICT (fight_id, fighter_name, timestamp_pick) DO NOTHING`,
        [
          bet.fightId,
          bet.pick,
          String(bet.fight).split(' vs ').find((name: string) => name !== bet.pick) ?? '',
          bet.selectedSportsbook ?? bet.sportsbook,
          bet.selectedOdds ?? bet.odds,
          bet.selectedMarketProbability ?? bet.marketProbability,
          bet.modelProbability,
          bet.edgePct,
          bet.betSizeUnits ?? 0,
          bet.oddsTimestamp,
          openingOdds,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function resolveBetResult(fightId: number, outcome: 'win' | 'loss') {
  if (!hasDatabase()) return;
  await initBetLedgerDb();
  const db = getPool();
  await db.query(
    `UPDATE bets
     SET result = $2,
         payout_units = CASE
           WHEN $2 = 'win' AND odds_at_pick > 0 THEN bet_size_units * (odds_at_pick::double precision / 100.0)
           WHEN $2 = 'win' AND odds_at_pick < 0 THEN bet_size_units * (100.0 / ABS(odds_at_pick::double precision))
           WHEN $2 = 'loss' THEN -bet_size_units
           ELSE payout_units
         END,
         updated_at = NOW()
     WHERE fight_id = $1 AND result = 'pending'`,
    [fightId, outcome],
  );
}

export async function updateClosingLine(fightId: number, closingOdds: number) {
  if (!hasDatabase()) return;
  await initBetLedgerDb();
  const db = getPool();
  const implied = closingOdds > 0 ? 100 / (closingOdds + 100) : Math.abs(closingOdds) / (Math.abs(closingOdds) + 100);
  await db.query(
    `UPDATE bets
     SET closing_odds = $2,
         implied_probability_closing = $3,
         clv = $3 - implied_probability_at_pick,
         market_movement_direction = CASE
           WHEN opening_odds IS NULL THEN NULL
           WHEN $2 > odds_at_pick THEN 'moved in favor'
           WHEN $2 < odds_at_pick THEN 'moved against'
           ELSE 'unchanged'
         END,
         updated_at = NOW()
     WHERE fight_id = $1`,
    [fightId, closingOdds, implied],
  );
}

export async function getBetHistory(sort: string = 'date') {
  if (!hasDatabase()) return [];
  await initBetLedgerDb();
  const db = getPool();
  const sortMap: Record<string, string> = {
    date: "CASE WHEN result = 'pending' THEN 1 ELSE 0 END ASC, timestamp_pick DESC",
    edge: 'edge_at_pick DESC NULLS LAST',
    result: 'result ASC, timestamp_pick DESC',
  };
  const orderBy = sortMap[sort] ?? sortMap.date;
  const result = await db.query(`SELECT * FROM bets ORDER BY ${orderBy}`);
  return result.rows;
}

export async function getPerformanceMetrics() {
  if (!hasDatabase()) {
    return {
      totalUnits: 0,
      totalBets: 0,
      winRate: 0,
      roi: 0,
      averageClv: 0,
      positiveClvRate: 0,
      last10: { units: 0, roi: 0, winRate: 0 },
      last30: { units: 0, roi: 0, winRate: 0 },
    };
  }
  await initBetLedgerDb();
  const db = getPool();
  const summary = await db.query(`
    SELECT
      COALESCE(SUM(payout_units), 0) AS total_units,
      COUNT(*)::int AS total_bets,
      COALESCE(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END), 0)::int AS wins,
      COALESCE(SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END), 0)::int AS losses,
      COALESCE(SUM(bet_size_units), 0) AS total_units_risked,
      COALESCE(AVG(clv), 0) AS average_clv,
      COALESCE(AVG(CASE WHEN clv > 0 THEN 1.0 ELSE 0.0 END), 0) AS positive_clv_rate
    FROM bets
  `);
  const rolling10 = await db.query(`SELECT * FROM bets ORDER BY timestamp_pick DESC LIMIT 10`);
  const rolling30 = await db.query(`SELECT * FROM bets ORDER BY timestamp_pick DESC LIMIT 30`);

  const calc = (rows: any[]) => {
    const totalUnits = rows.reduce((sum, row) => sum + Number(row.payout_units ?? 0), 0);
    const totalRisked = rows.reduce((sum, row) => sum + Number(row.bet_size_units ?? 0), 0);
    const wins = rows.filter((row) => row.result === 'win').length;
    return {
      units: totalUnits,
      roi: totalRisked ? totalUnits / totalRisked : 0,
      winRate: rows.length ? wins / rows.length : 0,
    };
  };

  const row = summary.rows[0];
  const totalRisked = Number(row.total_units_risked ?? 0);
  const totalUnits = Number(row.total_units ?? 0);
  return {
    totalUnits,
    totalBets: Number(row.total_bets ?? 0),
    winRate: Number(row.total_bets ?? 0) ? Number(row.wins ?? 0) / Number(row.total_bets ?? 0) : 0,
    roi: totalRisked ? totalUnits / totalRisked : 0,
    averageClv: Number(row.average_clv ?? 0),
    positiveClvRate: Number(row.positive_clv_rate ?? 0),
    last10: calc(rolling10.rows),
    last30: calc(rolling30.rows),
  };
}
