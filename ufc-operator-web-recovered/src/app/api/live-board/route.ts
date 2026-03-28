import { NextResponse } from 'next/server';
import { getBetHistory } from '@/lib/bet-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_URL = 'https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds';
const BOOKMAKERS = ['draftkings', 'fanduel'] as const;
const MARKET = 'h2h';

function normalizeName(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sameUtcDate(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
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

  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`The Odds API ${response.status}: ${await response.text()}`);
  return await response.json();
}

function findOutcome(outcomes: any[], fighterName: string) {
  return outcomes.find((outcome) => normalizeName(outcome.name) === normalizeName(fighterName)) ?? null;
}

export async function GET() {
  try {
    const [bets, payload] = await Promise.all([
      getBetHistory('date'),
      fetchOddsApiPayload(),
    ]);

    const now = new Date();
    const pendingToday = bets.filter((bet: any) => {
      if (bet.result !== 'pending') return false;
      const ts = bet.timestamp_pick ? new Date(bet.timestamp_pick) : null;
      return ts ? sameUtcDate(ts, now) : true;
    });

    const rows = pendingToday.map((bet: any) => {
      const event = payload.find((item: any) => {
        const home = normalizeName(item.home_team);
        const away = normalizeName(item.away_team);
        const fighter = normalizeName(bet.fighter_name);
        const opponent = normalizeName(bet.opponent_name);
        return (home === fighter && away === opponent) || (home === opponent && away === fighter);
      });

      const books = Object.fromEntries(
        BOOKMAKERS.map((book) => {
          const bookmaker = event?.bookmakers?.find((entry: any) => entry.key === book);
          const market = bookmaker?.markets?.find((entry: any) => entry.key === MARKET);
          const picked = market ? findOutcome(market.outcomes ?? [], bet.fighter_name) : null;
          const opp = market ? findOutcome(market.outcomes ?? [], bet.opponent_name) : null;
          return [book, {
            pickedOdds: picked ? Number(picked.price ?? null) : null,
            opponentOdds: opp ? Number(opp.price ?? null) : null,
            updatedAt: bookmaker?.last_update ?? null,
          }];
        }),
      ) as Record<string, { pickedOdds: number | null; opponentOdds: number | null; updatedAt: string | null }>;

      const preferred = books[bet.sportsbook_used] ?? null;
      const fallback = books.draftkings?.pickedOdds != null ? 'draftkings' : books.fanduel?.pickedOdds != null ? 'fanduel' : null;
      const currentBook = preferred?.pickedOdds != null ? bet.sportsbook_used : fallback;
      const live = currentBook ? books[currentBook] : null;

      return {
        fight: `${bet.fighter_name} vs ${bet.opponent_name}`,
        fighterName: bet.fighter_name,
        opponentName: bet.opponent_name,
        sportsbookUsed: bet.sportsbook_used,
        entryOdds: Number(bet.odds_at_pick),
        stakeUnits: Number(bet.bet_size_units ?? 0),
        currentBook,
        currentOdds: live?.pickedOdds ?? null,
        opponentOdds: live?.opponentOdds ?? null,
        updatedAt: live?.updatedAt ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      rows,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'live_board_failed' }, { status: 500 });
  }
}
