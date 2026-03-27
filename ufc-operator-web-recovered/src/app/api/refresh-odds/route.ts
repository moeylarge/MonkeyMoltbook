import { NextResponse } from 'next/server';
import { processLiveOddsAlerts } from '@/lib/live-alerts';
import { getPublicBettingFeed } from '@/lib/ufc-data';
import { getFreshnessDiagnostics, refreshLiveOdds, toVerificationSample } from '@/lib/live-odds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const header = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return token === secret || header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const feed = (await getPublicBettingFeed()) as Record<string, any>;
  const result = await refreshLiveOdds(feed);
  const sample = toVerificationSample(result.rows?.find((row: any) => row.status === 'ok') ?? null);
  const diagnostics = await getFreshnessDiagnostics();
  const alertLog = await processLiveOddsAlerts(result.rows ?? []);
  const consecutiveFailures = diagnostics.latestSyncStatus === 'stale' ? 1 : 0;

  console.log(JSON.stringify({
    event: 'refresh-odds',
    ok: result.ok,
    fetchedAt: result.fetchedAt,
    rowCount: result.rowCount ?? 0,
    diagnostics,
  }));

  return NextResponse.json({
    ok: result.ok,
    fetchedAt: result.fetchedAt,
    stale: !result.ok,
    error: result.ok ? null : result.error ?? null,
    sample,
    diagnostics,
    alerts: {
      staleTriggered: (diagnostics.freshnessSeconds ?? Infinity) > diagnostics.staleTriggerThresholdSeconds,
      ingestionStoppedMoreThanTwoCycles: (diagnostics.syncAgeSeconds ?? 0) > diagnostics.alertIfNoSuccessfulIngestionForSeconds,
      providerTooOld: (diagnostics.providerAgeSeconds ?? Infinity) > diagnostics.hardStaleCutoffSeconds,
      ingestionTooOld: (diagnostics.ingestionAgeSeconds ?? Infinity) > diagnostics.warningThresholdSeconds,
      consecutiveFailures,
      liveOddsFavorableTriggers: alertLog.triggerCount,
      favorableMovesCsvPath: alertLog.csvPath,
      triggeredFights: alertLog.triggered,
    },
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const POST = GET;
