import fs from 'fs/promises';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = '/Users/moey/.openclaw/workspace/ufc-operator-web-recovered';
const DB_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'live-odds.sqlite');

type SyncRun = {
  fetched_at: string;
  status: string;
  source: string;
  fail_reason: string | null;
  payload_json: any;
};

let db: DatabaseSync | null = null;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
  }
  return db;
}

export async function initLiveOddsDb() {
  await fs.mkdir(DB_DIR, { recursive: true });
  const sqlite = getDb();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sync_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fetched_at TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      fail_reason TEXT,
      payload_json TEXT
    );

    CREATE TABLE IF NOT EXISTS odds_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fight_id INTEGER NOT NULL,
      event_name TEXT,
      event_date TEXT,
      fight TEXT NOT NULL,
      sportsbook TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      commence_time TEXT,
      picked_side TEXT NOT NULL,
      picked_fighter TEXT NOT NULL,
      picked_odds INTEGER,
      opponent_odds INTEGER,
      market_probability REAL,
      fetched_at TEXT NOT NULL,
      status TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );

    CREATE VIEW IF NOT EXISTS latest_odds_view AS
      SELECT s.*
      FROM odds_snapshots s
      JOIN (
        SELECT fight_id, MAX(fetched_at) AS max_fetched_at
        FROM odds_snapshots
        GROUP BY fight_id
      ) latest
      ON latest.fight_id = s.fight_id AND latest.max_fetched_at = s.fetched_at;
  `);
}

export async function insertSyncRun(run: {
  fetchedAt: string;
  status: string;
  source: string;
  failReason?: string | null;
  payloadJson?: any;
}) {
  const sqlite = getDb();
  sqlite
    .prepare(`
      INSERT INTO sync_runs (fetched_at, status, source, fail_reason, payload_json)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(run.fetchedAt, run.status, run.source, run.failReason ?? null, JSON.stringify(run.payloadJson ?? null));
}

export async function insertBestLineRows(rows: any[]) {
  const sqlite = getDb();
  const insert = sqlite.prepare(`
    INSERT INTO odds_snapshots (
      fight_id, event_name, event_date, fight, sportsbook, home_team, away_team, commence_time,
      picked_side, picked_fighter, picked_odds, opponent_odds, market_probability, fetched_at, status, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sqlite.exec('BEGIN');
  try {
    for (const row of rows) {
      insert.run(
        row.fight_id,
        row.event_name,
        row.event_date,
        row.fight,
        row.sportsbook,
        row.home_team ?? '',
        row.away_team ?? '',
        row.commence_time ?? null,
        row.picked_side,
        row.fighter_name ?? row.picked_fighter,
        row.selected_best_odds ?? row.picked_odds,
        row.opponent_odds ?? null,
        row.implied_probability ?? row.market_probability,
        row.fetch_timestamp ?? row.fetched_at,
        row.status,
        typeof row.raw_json === 'string' ? row.raw_json : JSON.stringify(row.raw_json),
      );
    }
    sqlite.exec('COMMIT');
  } catch (error) {
    sqlite.exec('ROLLBACK');
    throw error;
  }
}

export async function getLatestBestLineRows() {
  const sqlite = getDb();
  const rows = sqlite
    .prepare(`
      SELECT
        fight_id,
        event_name,
        event_date,
        fight,
        MAX(CASE WHEN sportsbook='draftkings' THEN picked_odds END) AS draftkings_odds,
        MAX(CASE WHEN sportsbook='fanduel' THEN picked_odds END) AS fanduel_odds,
        MAX(CASE WHEN sportsbook='draftkings' THEN fetched_at END) AS draftkings_timestamp,
        MAX(CASE WHEN sportsbook='fanduel' THEN fetched_at END) AS fanduel_timestamp,
        MAX(fetched_at) AS fetch_timestamp
      FROM latest_odds_view
      GROUP BY fight_id, event_name, event_date, fight
      ORDER BY fight_id ASC
    `)
    .all() as any[];

  return rows.map((row) => {
    const dk = row.draftkings_odds == null ? null : Number(row.draftkings_odds);
    const fd = row.fanduel_odds == null ? null : Number(row.fanduel_odds);
    const selected_sportsbook = dk == null && fd == null ? null : dk != null && (fd == null || dk >= fd) ? 'draftkings' : 'fanduel';
    const selected_best_odds = selected_sportsbook === 'draftkings' ? dk : selected_sportsbook === 'fanduel' ? fd : null;
    const implied_probability = selected_best_odds == null
      ? null
      : selected_best_odds > 0
        ? 100 / (selected_best_odds + 100)
        : Math.abs(selected_best_odds) / (Math.abs(selected_best_odds) + 100);

    return {
      ...row,
      draftkings_odds: dk,
      fanduel_odds: fd,
      selected_sportsbook,
      selected_best_odds,
      implied_probability,
      edge_pct: null,
      status: selected_best_odds == null ? 'rejected' : 'ok',
      reject_reason: selected_best_odds == null ? 'missing_sportsbook_data' : null,
    };
  });
}

export async function getLatestSyncRun(): Promise<SyncRun | null> {
  const sqlite = getDb();
  const row = sqlite
    .prepare(`
      SELECT fetched_at, status, source, fail_reason, payload_json
      FROM sync_runs
      ORDER BY id DESC
      LIMIT 1
    `)
    .get() as any;

  if (!row) return null;
  return {
    ...row,
    payload_json: row.payload_json ? JSON.parse(row.payload_json) : null,
  };
}
