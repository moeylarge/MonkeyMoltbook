import {
  getLatestBestLineRows,
  getLatestSyncRun,
  initLiveOddsDb,
  insertBestLineRows,
  insertSyncRun,
} from './live-odds-db';

const API_URL = 'https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds';
const BOOKMAKERS = ['draftkings', 'fanduel'] as const;
const MARKET = 'h2h';

type FeedItem = Record<string, any>;
type BookmakerKey = (typeof BOOKMAKERS)[number];

type BestLineRow = {
  fight_id: number;
  event_name: string | null;
  event_date: string | null;
  fight: string;
  fighter_name: string;
  opponent_name: string;
  draftkings_odds: number | null;
  fanduel_odds: number | null;
  selected_best_odds: number | null;
  selected_sportsbook: BookmakerKey | null;
  draftkings_timestamp: string | null;
  fanduel_timestamp: string | null;
  fetch_timestamp: string;
  market_type: 'h2h';
  picked_side: 'A' | 'B';
  model_probability: number | null;
  implied_probability: number | null;
  edge_pct: number | null;
  status: 'ok' | 'stale' | 'rejected';
  reject_reason: string | null;
  raw_json: string;
};

export type VerificationSample = {
  fighter: string;
  draftkingsOdds: number | null;
  draftkingsTimestamp: string | null;
  fanduelOdds: number | null;
  fanduelTimestamp: string | null;
  selectedOdds: number | null;
  selectedSportsbook: string | null;
  impliedProbability: number | null;
  modelProbability: number | null;
  edge: number | null;
};

function normalizeName(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function americanToProbability(odds: number | null | undefined) {
  if (odds == null || Number.isNaN(Number(odds)) || Number(odds) === 0) return null;
  const value = Number(odds);
  return value > 0 ? 100 / (value + 100) : Math.abs(value) / (Math.abs(value) + 100);
}

function getEffectiveModelProbability(item: FeedItem) {
  const modelProbabilityA = Number(item.modelProbability ?? item.adjusted_probability_A ?? item.model_probability_A ?? 0);
  return (item.pickSide ?? 'A') === 'A' ? modelProbabilityA : 1 - modelProbabilityA;
}

function mapEventByFightName(payload: any[]) {
  const events = new Map<string, any>();
  for (const event of payload) {
    events.set(normalizeName(`${event.home_team} vs ${event.away_team}`), event);
    events.set(normalizeName(`${event.away_team} vs ${event.home_team}`), event);
  }
  return events;
}

function findOutcome(outcomes: any[], fighterName: string) {
  return outcomes.find((outcome) => normalizeName(outcome.name) === normalizeName(fighterName)) ?? null;
}

function buildBestLineRows(feed: Record<string, any>, payload: any[], fetchedAt: string) {
  const fights = feed?.fights ?? [];
  const events = mapEventByFightName(payload);
  const rows: BestLineRow[] = [];

  for (const item of fights) {
    const event = events.get(normalizeName(item.fight));
    const modelProbability = getEffectiveModelProbability(item);
    const pickedName = item.pick;
    const opponentName = String(item.fight).split(' vs ').find((name: string) => normalizeName(name) !== normalizeName(pickedName)) ?? null;
    if (!event || !pickedName || !opponentName) continue;

    const bookEntries = new Map<BookmakerKey, { odds: number | null; timestamp: string | null; outcomeName: string | null; marketType: string | null }>();
    for (const bookmaker of event.bookmakers ?? []) {
      if (!BOOKMAKERS.includes(bookmaker.key)) continue;
      const market = (bookmaker.markets ?? []).find((entry: any) => entry.key === MARKET);
      const pickedOutcome = market ? findOutcome(market.outcomes ?? [], pickedName) : null;
      bookEntries.set(bookmaker.key, {
        odds: pickedOutcome ? Number(pickedOutcome.price ?? null) : null,
        timestamp: bookmaker.last_update ?? fetchedAt,
        outcomeName: pickedOutcome?.name ?? null,
        marketType: market?.key ?? null,
      });
    }

    const dk = bookEntries.get('draftkings');
    const fd = bookEntries.get('fanduel');
    let status: BestLineRow['status'] = 'ok';
    let rejectReason: string | null = null;

    if (!dk?.marketType || !fd?.marketType || dk.marketType !== MARKET || fd.marketType !== MARKET) {
      status = 'rejected';
      rejectReason = 'market_type_not_h2h';
    } else if (!dk.outcomeName || !fd.outcomeName || dk.odds == null || fd.odds == null) {
      status = 'rejected';
      rejectReason = 'missing_sportsbook_data';
    } else if (normalizeName(dk.outcomeName) !== normalizeName(fd.outcomeName) || normalizeName(dk.outcomeName) !== normalizeName(pickedName)) {
      status = 'rejected';
      rejectReason = 'fighter_name_mismatch';
    }

    const selectedSportsbook: BookmakerKey | null = status === 'ok'
      ? ((Number(dk?.odds) >= Number(fd?.odds)) ? 'draftkings' : 'fanduel')
      : null;
    const selectedBestOdds = selectedSportsbook === 'draftkings' ? dk?.odds ?? null : selectedSportsbook === 'fanduel' ? fd?.odds ?? null : null;
    const impliedProbability = americanToProbability(selectedBestOdds);
    const edgePct = impliedProbability == null || status !== 'ok' ? null : (modelProbability - impliedProbability) * 100;

    rows.push({
      fight_id: Number(item.fightId ?? item.fight_id),
      event_name: item.eventName ?? null,
      event_date: item.eventDate ?? null,
      fight: item.fight,
      fighter_name: pickedName,
      opponent_name: opponentName,
      draftkings_odds: dk?.odds ?? null,
      fanduel_odds: fd?.odds ?? null,
      selected_best_odds: selectedBestOdds,
      selected_sportsbook: selectedSportsbook,
      draftkings_timestamp: dk?.timestamp ?? null,
      fanduel_timestamp: fd?.timestamp ?? null,
      fetch_timestamp: fetchedAt,
      market_type: MARKET,
      picked_side: item.pickSide ?? 'A',
      model_probability: modelProbability,
      implied_probability: impliedProbability,
      edge_pct: edgePct,
      status,
      reject_reason: rejectReason,
      raw_json: JSON.stringify({ event, draftkings: dk ?? null, fanduel: fd ?? null }),
    });
  }

  return rows;
}

async function fetchOddsApiPayload() {
  const apiKey = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error('Missing THE_ODDS_API_KEY or ODDS_API_KEY');

  const url = new URL(API_URL);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', MARKET);
  url.searchParams.set('bookmakers', BOOKMAKERS.join(','));
  url.searchParams.set('oddsFormat', 'american');

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error(`The Odds API ${response.status}: ${await response.text()}`);
      return await response.json();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError ?? new Error('Unknown odds API failure');
}

export async function refreshLiveOdds(feed: Record<string, any>) {
  await initLiveOddsDb();
  const fetchedAt = new Date().toISOString();

  try {
    const payload = await fetchOddsApiPayload();
    const rows = buildBestLineRows(feed, payload, fetchedAt);
    const validRows = rows.filter((row) => row.status === 'ok');
    if (!validRows.length) throw new Error('No valid best-line rows after integrity checks');

    await insertBestLineRows(rows);
    await insertSyncRun({
      fetchedAt,
      status: 'ok',
      source: 'the-odds-api',
      payloadJson: {
        totalRows: rows.length,
        validRows: validRows.length,
        rejectedRows: rows.length - validRows.length,
        sourceMaxTimestamp: rows.reduce((max: string | null, row) => {
          const candidates = [row.draftkings_timestamp, row.fanduel_timestamp].filter(Boolean).sort();
          const candidate = candidates[candidates.length - 1] ?? null;
          return !max || (candidate && candidate > max) ? candidate : max;
        }, null),
      },
    });

    const latestRows = await getLatestBestLineRows();
    return {
      ok: true,
      fetchedAt,
      rows: latestRows,
      rowCount: latestRows.length,
      sample: toVerificationSample(latestRows.find((row: any) => row.status === 'ok') ?? null),
    };
  } catch (error: any) {
    await insertSyncRun({
      fetchedAt,
      status: 'stale',
      source: 'the-odds-api',
      failReason: String(error?.message ?? error),
    });
    const latestRows = await getLatestBestLineRows().catch(() => []);
    return {
      ok: false,
      fetchedAt,
      rows: latestRows,
      rowCount: latestRows.length,
      sample: toVerificationSample(latestRows.find((row: any) => row.status === 'ok') ?? null),
      error: String(error?.message ?? error),
    };
  }
}

function toMergedItem(item: FeedItem, row: any) {
  if (!row) return item;
  const modelProbability = getEffectiveModelProbability(item);
  const impliedProbability = row.implied_probability ?? null;
  const computedEdgePct = impliedProbability == null ? null : (modelProbability - impliedProbability) * 100;
  return {
    ...item,
    odds: row.selected_best_odds,
    sportsbook: row.selected_sportsbook,
    marketProbability: impliedProbability,
    edgePct: row.edge_pct ?? computedEdgePct,
    oddsTimestamp: row.fetch_timestamp,
    rawSportsbookOdds: [
      { sportsbook: 'draftkings', pickedOdds: row.draftkings_odds, fetchedAt: row.draftkings_timestamp },
      { sportsbook: 'fanduel', pickedOdds: row.fanduel_odds, fetchedAt: row.fanduel_timestamp },
    ],
    selectedSportsbook: row.selected_sportsbook,
    selectedOdds: row.selected_best_odds,
    selectedMarketProbability: impliedProbability,
    selectedFromRealLine: row.selected_best_odds === row.draftkings_odds || row.selected_best_odds === row.fanduel_odds,
    liveOddsStatus: row.status,
    liveOddsRejectReason: row.reject_reason,
  };
}

export async function mergeLiveOddsIntoFeed(feed: Record<string, any>): Promise<Record<string, any>> {
  try {
    await initLiveOddsDb();
    const rows = await getLatestBestLineRows();
    const meta = await getLatestSyncRun();
    const byFightId = new Map(rows.map((row: any) => [Number(row.fight_id), row]));
    const timestamp = meta?.fetched_at ?? rows[0]?.fetch_timestamp ?? feed.oddsTimestamp ?? null;

    return {
      ...feed,
      oddsTimestamp: timestamp,
      liveOddsStatus: meta?.status ?? 'stale',
      liveOddsSource: meta?.source ?? 'database',
      liveOddsFailReason: meta?.fail_reason ?? null,
      todaysBestBets: (feed.todaysBestBets ?? [])
        .map((item: FeedItem) => toMergedItem(item, byFightId.get(Number(item.fightId ?? item.fight_id))))
        .filter((item: FeedItem) => item.liveOddsStatus !== 'rejected'),
      fights: (feed.fights ?? [])
        .map((item: FeedItem) => toMergedItem(item, byFightId.get(Number(item.fightId ?? item.fight_id))))
        .filter((item: FeedItem) => item.liveOddsStatus !== 'rejected'),
    };
  } catch (error: any) {
    return {
      ...feed,
      liveOddsStatus: 'stale',
      liveOddsSource: 'database',
      liveOddsFailReason: String(error?.message ?? error),
    };
  }
}

export function toVerificationSample(row: any): VerificationSample | null {
  if (!row) return null;
  return {
    fighter: row.fighter_name,
    draftkingsOdds: row.draftkings_odds,
    draftkingsTimestamp: row.draftkings_timestamp,
    fanduelOdds: row.fanduel_odds,
    fanduelTimestamp: row.fanduel_timestamp,
    selectedOdds: row.selected_best_odds,
    selectedSportsbook: row.selected_sportsbook,
    impliedProbability: row.implied_probability,
    modelProbability: row.model_probability,
    edge: row.edge_pct,
  };
}

export async function getFreshnessDiagnostics() {
  await initLiveOddsDb();
  const [rows, syncRun] = await Promise.all([getLatestBestLineRows(), getLatestSyncRun()]);
  const now = Date.now();
  const latestRow = rows.find((row: any) => row.status === 'ok') ?? rows[0] ?? null;
  const sourceTimestamps = latestRow ? [latestRow.draftkings_timestamp, latestRow.fanduel_timestamp].filter(Boolean).sort() : [];
  const sourceTimestamp = sourceTimestamps[sourceTimestamps.length - 1] ?? null;
  const dbTimestamp = latestRow?.fetch_timestamp ?? null;
  const syncTimestamp = syncRun?.fetched_at ?? null;
  const pageTimestamp = dbTimestamp;
  const ageSeconds = (value: string | null | undefined) => {
    if (!value) return null;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : Math.max(0, Math.round((now - ms) / 1000));
  };

  const providerAgeSeconds = ageSeconds(sourceTimestamp);
  const ingestionAgeSeconds = ageSeconds(syncTimestamp);
  const freshnessSeconds = Math.max(providerAgeSeconds ?? 0, ingestionAgeSeconds ?? 0);
  let freshnessStatus: 'green' | 'yellow' | 'red' = 'red';
  if ((providerAgeSeconds ?? Infinity) < 30 && (ingestionAgeSeconds ?? Infinity) < 30) freshnessStatus = 'green';
  else if ((providerAgeSeconds ?? Infinity) < 120 && (ingestionAgeSeconds ?? Infinity) < 60) freshnessStatus = 'yellow';

  return {
    now: new Date(now).toISOString(),
    freshnessStatus,
    freshnessSeconds,
    sourceTimestamp,
    providerAgeSeconds,
    sourceAgeSeconds: providerAgeSeconds,
    dbTimestamp,
    dbAgeSeconds: ageSeconds(dbTimestamp),
    syncTimestamp,
    ingestionAgeSeconds,
    syncAgeSeconds: ingestionAgeSeconds,
    latestSyncStatus: syncRun?.status ?? null,
    latestSyncSource: syncRun?.source ?? null,
    latestSyncFailure: syncRun?.fail_reason ?? null,
    targetFreshnessSeconds: 30,
    warningThresholdSeconds: 60,
    staleTriggerThresholdSeconds: 60,
    hardStaleCutoffSeconds: 120,
    hideThresholdSeconds: 120,
    alertIfNoSuccessfulIngestionForSeconds: 120,
    dataValid: (providerAgeSeconds ?? Infinity) < 120 && (ingestionAgeSeconds ?? Infinity) < 60,
    latestRow,
  };
}
