import { promises as fs } from 'fs';
import path from 'path';
import { getPublicBettingFeed, isUpcomingFight } from '@/lib/ufc-data';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'live-odds-alert-log.csv');
const STATE_PATH = path.join(DATA_DIR, 'live-odds-alert-state.json');

type AlertState = Record<string, {
  thresholdsHit: number[];
  lastLoggedOdds: number | null;
  lastLoggedAt: string | null;
}>;

function normalizeThresholds(entryOdds: number) {
  if (entryOdds > 0) {
    const steps = [5, 10, 20, 30, 40, 50, 75, 100];
    return steps
      .map((step) => entryOdds - step)
      .filter((value) => value > 100);
  }
  const abs = Math.abs(entryOdds);
  const steps = [5, 10, 15, 20, 25, 30, 40, 50];
  return steps
    .map((step) => -(Math.max(100, abs - step)))
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function improvedInFavor(entryOdds: number, currentOdds: number) {
  if (entryOdds > 0) return currentOdds < entryOdds;
  return currentOdds > entryOdds;
}

async function readState(): Promise<AlertState> {
  try {
    return JSON.parse(await fs.readFile(STATE_PATH, 'utf8')) as AlertState;
  } catch {
    return {};
  }
}

async function writeState(state: AlertState) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

async function ensureCsv() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CSV_PATH);
  } catch {
    const header = 'timestamp,fight_id,event_name,fight,pick,sportsbook,entry_odds,current_live_odds,threshold_crossed,market_move,status,note\n';
    await fs.writeFile(CSV_PATH, header);
  }
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export async function processLiveOddsAlerts(liveRows: any[]) {
  const feed = await getPublicBettingFeed();
  const feedMap = new Map((feed?.fights ?? []).filter((fight: any) => isUpcomingFight(fight)).map((fight: any) => [Number(fight.fightId ?? fight.fight_id), fight]));
  const state = await readState();
  await ensureCsv();

  const lines: string[] = [];
  const triggered: any[] = [];
  const now = new Date().toISOString();

  for (const row of liveRows ?? []) {
    const fight = feedMap.get(Number(row.fight_id)) as any;
    if (!fight) continue;

    const entryOdds = Number(fight.oddsAtPrediction ?? fight.odds ?? 0);
    const currentOdds = Number(row.selected_best_odds ?? NaN);
    if (!entryOdds || Number.isNaN(currentOdds)) continue;
    if (!improvedInFavor(entryOdds, currentOdds)) continue;

    const thresholds = normalizeThresholds(entryOdds);
    const hit = thresholds.filter((threshold) => entryOdds > 0 ? currentOdds <= threshold : currentOdds >= threshold);
    if (!hit.length) continue;

    const key = String(row.fight_id);
    const prev = state[key] ?? { thresholdsHit: [], lastLoggedOdds: null, lastLoggedAt: null };
    const newHits = hit.filter((threshold) => !prev.thresholdsHit.includes(threshold));
    if (!newHits.length) continue;

    for (const threshold of newHits) {
      const marketMove = entryOdds > 0 ? entryOdds - currentOdds : currentOdds - entryOdds;
      lines.push([
        now,
        row.fight_id,
        row.event_name,
        row.fight,
        fight.pick,
        row.selected_sportsbook,
        entryOdds,
        currentOdds,
        threshold,
        marketMove,
        'triggered',
        'Live odds improved in our favor',
      ].map(csvEscape).join(','));

      triggered.push({
        fightId: row.fight_id,
        fight: row.fight,
        pick: fight.pick,
        entryOdds,
        currentOdds,
        threshold,
        sportsbook: row.selected_sportsbook,
      });
    }

    state[key] = {
      thresholdsHit: [...prev.thresholdsHit, ...newHits].sort((a, b) => a - b),
      lastLoggedOdds: currentOdds,
      lastLoggedAt: now,
    };
  }

  if (lines.length) {
    await fs.appendFile(CSV_PATH, `${lines.join('\n')}\n`);
  }
  await writeState(state);

  return {
    csvPath: CSV_PATH,
    triggered,
    triggerCount: triggered.length,
  };
}
