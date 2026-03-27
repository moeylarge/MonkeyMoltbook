import { promises as fs } from 'fs';
import path from 'path';
import { mergeLiveOddsIntoFeed } from './live-odds';

const LOGS_DIR = path.resolve(process.cwd(), '../ufc-analytics/logs');
const BUNDLE_PATH = path.resolve(process.cwd(), 'public/data/website_bundle.json');

async function readJsonFile<T = any>(absolutePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(absolutePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadBundle() {
  return readJsonFile<Record<string, any>>(BUNDLE_PATH, {});
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function minutesSince(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return null;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
}

function titleizeSportsbook(value: string | null | undefined) {
  if (!value) return 'Unknown source';
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function withValidationMeta<T extends Record<string, any>>(item: T, oddsTimestamp: string | null | undefined) {
  const edgePct = Number(item?.edgePct ?? 0);
  return {
    ...item,
    oddsSource: item?.sportsbook ?? null,
    oddsSourceLabel: titleizeSportsbook(item?.sportsbook),
    oddsTimestamp: oddsTimestamp ?? null,
    oddsFreshnessMinutes: minutesSince(oddsTimestamp),
    oddsAtPrediction: item?.odds ?? null,
    closingOdds: item?.closingOdds ?? null,
    clvPending: item?.closingOdds == null,
    isHighRiskEdge: edgePct > 15,
    validationLabel: edgePct > 15 ? 'high-risk / likely data issue' : null,
  };
}

async function readJson<T = any>(fileName: string, fallback: T): Promise<T> {
  const bundle = await loadBundle();
  const map: Record<string, string> = {
    'operator_snapshot.json': 'operatorSnapshot',
    'latest_report.json': 'latestReport',
    'validation_report.json': 'validationReport',
    'betting_decision_summary.json': 'bettingDecisionSummary',
    'public_betting_feed.json': 'publicBettingFeed',
    'confidence_summary.json': 'confidenceSummary',
    'segment_profitability_summary.json': 'segmentProfitabilitySummary',
    'market_edge_summary.json': 'marketEdgeSummary',
    'historical_odds_summary.json': 'historicalOddsSummary',
  };
  const key = map[fileName];
  if (key && bundle?.[key]) return bundle[key] as T;
  return readJsonFile(path.join(LOGS_DIR, fileName), fallback);
}

export async function getOperatorSnapshot() {
  return readJson('operator_snapshot.json', {} as Record<string, any>);
}

export async function getLatestReport() {
  return readJson('latest_report.json', { rows: [] as any[] });
}

export async function getValidationReport() {
  return readJson('validation_report.json', {} as Record<string, any>);
}

export async function getPublicBettingFeed() {
  const bundle = await loadBundle();
  const baseFeed = (bundle?.publicBettingFeed ?? (await readJson('public_betting_feed.json', {} as Record<string, any>))) as Record<string, any>;
  const mergedFeed = await mergeLiveOddsIntoFeed({
    ...baseFeed,
    oddsTimestamp: baseFeed?.generated_at ?? bundle?.generated_at ?? null,
  });
  const oddsTimestamp = mergedFeed?.oddsTimestamp ?? baseFeed?.generated_at ?? bundle?.generated_at ?? null;

  return {
    ...mergedFeed,
    generated_at: baseFeed?.generated_at ?? null,
    oddsTimestamp,
    oddsFreshnessMinutes: minutesSince(oddsTimestamp),
    todaysBestBets: (mergedFeed?.todaysBestBets ?? []).map((item: any) => withValidationMeta(item, item?.oddsTimestamp ?? oddsTimestamp)),
    fights: (mergedFeed?.fights ?? []).map((item: any) => withValidationMeta(item, item?.oddsTimestamp ?? oddsTimestamp)),
    recentPerformance: {
      ...(mergedFeed?.recentPerformance ?? {}),
      closingOddsPlaceholder: 'Pending',
    },
  };
}

export async function getConfidenceSummary() {
  return readJson('confidence_summary.json', {} as Record<string, any>);
}

export async function getBettingDecisionSummary() {
  return readJson('betting_decision_summary.json', {} as Record<string, any>);
}

export async function getSegmentProfitabilitySummary() {
  return readJson('segment_profitability_summary.json', {} as Record<string, any>);
}

export async function getMarketEdgeSummary() {
  return readJson('market_edge_summary.json', {} as Record<string, any>);
}

export async function getHistoricalOddsSummary() {
  return readJson('historical_odds_summary.json', {} as Record<string, any>);
}

export async function getDataQualitySummary() {
  const [confidence, historicalOdds] = await Promise.all([
    getConfidenceSummary(),
    getHistoricalOddsSummary(),
  ]);

  return {
    confidence,
    historicalOdds,
    externalCandidates: confidence?.external_data_candidates ?? [],
    reviewFights: confidence?.review_fights ?? [],
    suppressedFights: confidence?.suppressed_fights ?? [],
  };
}

export async function getFightRows() {
  const report = await getLatestReport();
  return report?.rows ?? [];
}

export async function getFightById(fightId: number) {
  const [rows, bettingSummary, segmentSummary, publicFeed] = await Promise.all([
    getFightRows(),
    getBettingDecisionSummary(),
    getSegmentProfitabilitySummary(),
    getPublicBettingFeed(),
  ]);

  const row = rows.find((item: any) => Number(item.fight_id) === Number(fightId));
  const decisions = [
    ...(publicFeed?.fights ?? []),
    ...(bettingSummary?.top_candidates ?? []),
    ...(bettingSummary?.top_no_bet ?? []),
  ];
  const decision = decisions.find((item: any) => Number(item.fight_id ?? item.fightId) === Number(fightId));

  const flaggedSegments = segmentSummary?.flagged_losing_segments ?? [];
  const matchingSegments = flaggedSegments.filter((segment: any) => {
    if (!decision) return false;
    const profile = decision.chosen_side_profile;
    const bucket = decision.chosen_edge_bucket;
    return (
      segment.key === profile ||
      segment.key === bucket ||
      segment.key === `${profile}|${bucket}`
    );
  });

  const oddsTimestamp = publicFeed?.oddsTimestamp ?? publicFeed?.generated_at ?? null;

  return {
    row,
    decision: decision ? withValidationMeta(decision, oddsTimestamp) : decision,
    matchingSegments,
    oddsTimestamp,
    oddsFreshnessMinutes: minutesSince(oddsTimestamp),
  };
}

export function formatPct(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(digits);
}

export function formatDateTime(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function isUpcomingFight(item: any) {
  const eventDate = toDate(item?.event_date ?? item?.eventDate ?? item?.commence_time ?? item?.commenceTime);
  if (!eventDate) return true;
  return eventDate.getTime() >= Date.now();
}

export function formatSigned(value: number | null | undefined, digits = 2, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(digits)}${suffix}`;
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const REASON_LABELS: Record<string, string> = {
  fighter_A_external_history_used: 'Fighter A used external career history',
  fighter_B_external_history_used: 'Fighter B used external career history',
  fighter_A_low_stat_source_quality: 'Fighter A stats came from a weak source',
  fighter_B_low_stat_source_quality: 'Fighter B stats came from a weak source',
  fighter_A_stat_override_used: 'Fighter A used a stat override',
  fighter_B_stat_override_used: 'Fighter B used a stat override',
  market_distance_warning: 'Model and market are far apart',
  market_sanity_blend: 'Probability was softened toward the market',
  live_market_gap_too_large: 'Live market gap is too large',
  live_model_sim_gap_too_large: 'Model and simulator disagree too much',
  losing_segment_side_profile: 'This side profile has been losing historically',
  losing_segment_edge_bucket: 'This edge bucket has been losing historically',
  losing_segment_side_edge: 'This side + edge combination has been losing historically',
  system_paper_only: 'System is still paper-only overall',
  underdog_threshold_penalty: 'Underdog rules are stricter here',
  needs_external_data: 'This fight still depends on external data',
  not_approved_action_tier: 'The fight is not approved for action',
  ev_below_threshold: 'Expected value is below threshold',
  fair_edge_below_threshold: 'Fair edge is below threshold',
  proxy_disagreement_review: 'Weak proxy data plus disagreement forced review',
  proxy_no_market_review: 'Weak proxy data with no market forced review',
  probability_capped: 'Probability was capped for safety',
  fighter_A_incomplete_stats: 'Fighter A stats are incomplete',
  fighter_B_incomplete_stats: 'Fighter B stats are incomplete',
  fighter_A_low_history: 'Fighter A has low fight history',
  fighter_B_low_history: 'Fighter B has low fight history',
  model_sim_disagreement: 'Model and simulator disagree',
  healthy_favorite_segment: 'This sits in a healthier favorite-led bucket',
  healthy_underdog_segment: 'This sits in a healthier underdog bucket',
  paper_candidate: 'Paper candidate only',
  no_bet: 'No-bet decision',
};

export function explainReason(reason: string) {
  if (!reason) return '—';
  if (reason.startsWith('losing_segment_side_profile:')) {
    const value = reason.split(':')[1] ?? '';
    return `Historically losing side profile: ${value}`;
  }
  if (reason.startsWith('losing_segment_edge_bucket:')) {
    const value = reason.split(':')[1] ?? '';
    return `Historically losing edge bucket: ${value}`;
  }
  if (reason.startsWith('losing_segment_side_edge:')) {
    const value = reason.split(':')[1] ?? '';
    return `Historically losing side + edge bucket: ${value}`;
  }
  return REASON_LABELS[reason] ?? reason.replaceAll('_', ' ');
}

export function getValueStrength(edgePct: number | null | undefined) {
  const edge = Number(edgePct ?? 0);
  if (edge > 10) return { label: 'Strong Value', tone: 'approved' };
  if (edge >= 5) return { label: 'Moderate Value', tone: 'review' };
  return { label: 'Weak Signal', tone: 'low' };
}

export function summarizePickReason(item: any) {
  const reasonCodes = item?.reasonCodes ?? item?.reasons ?? [];
  const reasons = Array.isArray(reasonCodes) ? reasonCodes.map((reason: string) => explainReason(reason)) : [];
  if (reasons.length) return reasons.slice(0, 2).join(' · ');

  const modelProbability = item?.modelProbability ?? item?.model_probability_A;
  const marketProbability = item?.marketProbability ?? item?.market_probability_A;
  const marketGap = item?.marketGap;

  if (modelProbability != null && marketProbability != null) {
    return `Model win probability ${formatPct(modelProbability, 1)} vs market ${formatPct(marketProbability, 1)}.`;
  }
  if (marketGap != null) {
    return `Market gap ${formatSigned(marketGap, 2)} with current rule filters applied.`;
  }
  return 'Model features currently support this side under the active rules.';
}

export function summarizeBottomLine(row: any, decision: any, matchingSegments: any[]) {
  if (!row) return 'No fight data found.';
  if (!decision) return 'This fight has no betting decision data yet.';

  if (decision.decision_tier === 'no_bet') {
    if (matchingSegments.length > 0) {
      return 'This is a no-bet because the apparent edge falls into a historically losing betting bucket.';
    }
    if ((decision.market_gap ?? 0) > 0.2) {
      return 'This is a no-bet because the market disagreement is too large to trust.';
    }
    if ((decision.model_sim_gap ?? 0) > 0.15) {
      return 'This is a no-bet because the model and simulator disagree too much.';
    }
    return 'This is a no-bet because it fails the final profitability and trust filters.';
  }

  if (decision.decision_tier === 'paper_candidate') {
    return 'This passes local decision rules, but the overall system is still paper-only.';
  }

  if (decision.decision_tier === 'candidate') {
    return 'This passes the current decision rules and is one of the strongest live candidates.';
  }

  return 'This fight is active in the workflow, but should still be interpreted with caution.';
}
