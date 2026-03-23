import fs from 'fs/promises';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = '/Users/moey/.openclaw/workspace/ufc-operator-web-recovered';
const DB_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'live-odds.sqlite');
const BUNDLE_PATH = path.join(ROOT, 'public', 'data', 'website_bundle.json');
const API_URL = 'https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds';
const API_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || '';
const BOOKMAKERS = 'draftkings,fanduel';
const MARKETS = 'h2h';

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function americanToProbability(odds) {
  if (odds == null || Number.isNaN(Number(odds)) || Number(odds) === 0) return null;
  const value = Number(odds);
  return value > 0 ? 100 / (value + 100) : Math.abs(value) / (Math.abs(value) + 100);
}

function openDb() {
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
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
  return db;
}

async function loadBaseFeed() {
  const raw = await fs.readFile(BUNDLE_PATH, 'utf8');
  const bundle = JSON.parse(raw);
  const fights = bundle?.publicBettingFeed?.fights ?? [];
  return fights.map((fight) => ({
    fightId: Number(fight.fightId),
    eventName: fight.eventName,
    eventDate: fight.eventDate,
    fight: fight.fight,
    pick: fight.pick,
    pickSide: fight.pickSide,
    modelProbability: Number(fight.modelProbability ?? 0),
    sportsbooks: [fight.sportsbook].filter(Boolean),
  }));
}

function findOutcomeByName(outcomes, fighter) {
  const target = normalizeName(fighter);
  return outcomes.find((outcome) => normalizeName(outcome.name) === target) ?? null;
}

async function fetchOdds() {
  const url = new URL(API_URL);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', MARKETS);
  url.searchParams.set('bookmakers', BOOKMAKERS);
  url.searchParams.set('oddsFormat', 'american');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`The Odds API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

function mapOdds(baseFights, oddsFeed, fetchedAt) {
  const oddsByFight = new Map();
  for (const event of oddsFeed) {
    const home = event.home_team;
    const away = event.away_team;
    const key = normalizeName(`${home} vs ${away}`);
    oddsByFight.set(key, event);
    oddsByFight.set(normalizeName(`${away} vs ${home}`), event);
  }

  const rows = [];

  for (const fight of baseFights) {
    const event = oddsByFight.get(normalizeName(fight.fight));
    if (!event) continue;

    const pickName = fight.pick;
    for (const bookmaker of event.bookmakers ?? []) {
      const market = (bookmaker.markets ?? []).find((entry) => entry.key === 'h2h');
      if (!market) continue;
      const picked = findOutcomeByName(market.outcomes ?? [], pickName);
      const opponent = (market.outcomes ?? []).find((outcome) => normalizeName(outcome.name) !== normalizeName(pickName)) ?? null;
      if (!picked) continue;

      rows.push({
        fight_id: fight.fightId,
        event_name: fight.eventName,
        event_date: fight.eventDate,
        fight: fight.fight,
        sportsbook: bookmaker.key,
        home_team: event.home_team,
        away_team: event.away_team,
        commence_time: event.commence_time ?? null,
        picked_side: fight.pickSide,
        picked_fighter: pickName,
        picked_odds: Number(picked.price ?? null),
        opponent_odds: opponent ? Number(opponent.price ?? null) : null,
        market_probability: americanToProbability(Number(picked.price ?? null)),
        fetched_at: fetchedAt,
        status: 'ok',
        raw_json: JSON.stringify({ event, bookmaker, market }),
      });
    }
  }

  return rows;
}

async function main() {
  await fs.mkdir(DB_DIR, { recursive: true });
  const db = openDb();
  const fetchedAt = new Date().toISOString();

  try {
    if (!API_KEY) {
      throw new Error('Missing THE_ODDS_API_KEY or ODDS_API_KEY');
    }

    const baseFights = await loadBaseFeed();
    const oddsFeed = await fetchOdds();
    const rows = mapOdds(baseFights, oddsFeed, fetchedAt);

    if (!rows.length) {
      throw new Error('The Odds API returned no mappable DraftKings/FanDuel UFC h2h rows');
    }

    const insert = db.prepare(`
      INSERT INTO odds_snapshots (
        fight_id, event_name, event_date, fight, sportsbook, home_team, away_team, commence_time,
        picked_side, picked_fighter, picked_odds, opponent_odds, market_probability, fetched_at, status, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertRun = db.prepare(`
      INSERT INTO sync_runs (fetched_at, status, source, fail_reason, payload_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN');
    try {
      for (const row of rows) {
        insert.run(
          row.fight_id,
          row.event_name,
          row.event_date,
          row.fight,
          row.sportsbook,
          row.home_team,
          row.away_team,
          row.commence_time,
          row.picked_side,
          row.picked_fighter,
          row.picked_odds,
          row.opponent_odds,
          row.market_probability,
          row.fetched_at,
          row.status,
          row.raw_json,
        );
      }
      insertRun.run(fetchedAt, 'ok', 'the-odds-api', null, JSON.stringify({ rowCount: rows.length }));
      db.exec('COMMIT');
    } catch (innerError) {
      db.exec('ROLLBACK');
      throw innerError;
    }

    console.log(JSON.stringify({ ok: true, fetchedAt, rowCount: rows.length }, null, 2));
  } catch (error) {
    db.prepare(`
      INSERT INTO sync_runs (fetched_at, status, source, fail_reason, payload_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(fetchedAt, 'stale', 'the-odds-api', String(error.message || error), null);
    console.error(JSON.stringify({ ok: false, fetchedAt, stale: true, error: String(error.message || error) }, null, 2));
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
