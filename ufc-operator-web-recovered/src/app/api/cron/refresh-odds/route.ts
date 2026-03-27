import { NextResponse } from 'next/server';
import { processLiveOddsAlerts } from '@/lib/live-alerts';
import { getPublicBettingFeed } from '@/lib/ufc-data';
import { refreshLiveOdds, toVerificationSample } from '@/lib/live-odds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const feed = (await getPublicBettingFeed()) as Record<string, any>;
  const result = await refreshLiveOdds(feed);
  const sample = toVerificationSample(result.rows?.find((row: any) => row.status === 'ok') ?? null);
  const alertLog = await processLiveOddsAlerts(result.rows ?? []);

  return NextResponse.json({
    ok: result.ok,
    oddsTimestamp: result.fetchedAt ?? null,
    liveOddsStatus: result.ok ? 'ok' : 'stale',
    sample,
    liveAlertTriggers: alertLog.triggerCount,
    favorableMovesCsvPath: alertLog.csvPath,
    triggeredFights: alertLog.triggered,
  });
}
