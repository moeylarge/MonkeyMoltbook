import { AnalysisResult, PhotoItem } from './types';
import { buildMockAnalysis } from './mockAnalysis';

const ANALYSIS_BASE = 'http://127.0.0.1:8091';
const ANALYSIS_TIMEOUT_MS = 60000;

type AdapterResponse = {
  ok?: boolean;
  profileStrength: number;
  confidenceLabel: 'Low' | 'Medium' | 'High';
  traits: {
    clarity: number;
    lighting: number;
    framing: number;
    confidence: number;
    style: number;
    leadStrength?: number;
  };
  strengths: string[];
  weaknesses: string[];
  actions: string[];
  upstreamSummary: {
    confidence: number;
    faceCount: number;
    faceWarning?: string | null;
    upstreamScore: number;
  };
};

type AdapterError = {
  ok?: boolean;
  error?: string;
  detail?: string;
  mapped?: AdapterResponse;
};

async function photoUriToFile(photo: PhotoItem): Promise<File> {
  const res = await fetch(photo.uri);
  const blob = await res.blob();
  return new File([blob], photo.fileName || `${photo.id}.jpg`, { type: blob.type || 'image/jpeg' });
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function uniqueKeepOrder(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function confidenceNumber(label: 'Low' | 'Medium' | 'High') {
  return label === 'High' ? 90 : label === 'Medium' ? 72 : 50;
}

function summarizeScore(score: number, spread: number, failedCount: number, degradedCount: number) {
  if (score >= 84) {
    return failedCount > 0
      ? 'The set has real upside and a strong core, but a few failed reads still make the result slightly incomplete.'
      : 'The set has a real core. Your top photos are doing enough work that cleanup now matters more than experimentation.';
  }
  if (score >= 74) {
    return degradedCount > 0
      ? 'The profile has workable signal, but low-signal photos are softening the result more than they should.'
      : 'You are close. The strongest photos are useful, but the weaker ones still dilute the first impression.';
  }
  if (spread < 8) {
    return 'The set is too flat to rely on ordering alone. You need stronger replacements, not just reshuffling.';
  }
  return 'Right now the weak photos are still doing too much damage. The fastest gain is cutting drag before adding anything new.';
}

async function analyzeOnePhoto(photo: PhotoItem) {
  const file = await photoUriToFile(photo);
  const form = new FormData();
  form.append('image', file);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const res = await fetch(`${ANALYSIS_BASE}/v1/analyze-photo`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as AdapterError;
      if (res.status === 422 && body.mapped) {
        return {
          photo,
          result: body.mapped,
          weightedScore: 10,
          degraded: true,
          hardFailure: false,
          error: body.error || 'no usable face detected',
        };
      }
      return {
        photo,
        result: null,
        weightedScore: 0,
        degraded: false,
        hardFailure: true,
        error: body.error || `adapter-${res.status}`,
      };
    }

    const data = (await res.json()) as AdapterResponse;
    const facePenalty = data.upstreamSummary.faceCount < 1 ? 10 : data.upstreamSummary.faceCount > 1 ? 4 : 0;
    const warningPenalty = data.upstreamSummary.faceWarning ? 5 : 0;
    const weightedScore = Math.round(
      data.profileStrength * 0.28 +
        (data.traits.leadStrength || data.profileStrength) * 0.34 +
        data.traits.clarity * 0.13 +
        data.traits.lighting * 0.1 +
        data.traits.framing * 0.07 +
        data.traits.confidence * 0.05 +
        data.traits.style * 0.03 -
        facePenalty -
        warningPenalty,
    );

    return { photo, result: data, weightedScore, degraded: false, hardFailure: false, error: null };
  } catch (error) {
    return {
      photo,
      result: null,
      weightedScore: 0,
      degraded: false,
      hardFailure: true,
      error: String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzePhotoSet(photos: PhotoItem[]): Promise<AnalysisResult> {
  try {
    const results = await Promise.all(photos.map((photo) => analyzeOnePhoto(photo)));

    const successful = results.filter((entry) => entry.result);
    if (successful.length < Math.max(2, Math.ceil(photos.length / 2))) {
      throw new Error('insufficient-real-results');
    }

    const ranked = [...successful].sort((a, b) => b.weightedScore - a.weightedScore);
    const best = ranked[0];
    const weakest = ranked[ranked.length - 1];
    const score = average(ranked.map((item) => item.weightedScore));
    const confidenceAverage = average(ranked.map((item) => confidenceNumber(item.result!.confidenceLabel)));
    const spread = best.weightedScore - weakest.weightedScore;
    const failedCount = results.filter((item) => item.hardFailure).length;
    const degradedCount = results.filter((item) => item.degraded).length;

    const strengths = uniqueKeepOrder([
      ...best.result!.strengths,
      best.result!.upstreamSummary.faceWarning ? '' : 'Your strongest image earns the lead slot more clearly than the rest of the set.',
      spread >= 12 ? 'There is enough separation between the top and bottom of the set that cleanup should produce visible gains.' : '',
      failedCount > 0 ? 'The real pass still recovered enough signal to rank most of the set.' : '',
    ]).slice(0, 3);

    const weaknesses = uniqueKeepOrder([
      ...weakest.result!.weaknesses,
      weakest.result!.upstreamSummary.faceCount < 1 ? 'At least one weak photo may not even read clearly enough to deserve profile space.' : '',
      spread < 8 ? 'The set is too flat to rely on ordering alone — stronger replacements matter.' : 'The bottom of the set is still doing enough damage to change how the whole profile reads.',
      ranked.length >= 4 ? 'Your weakest slot still changes the tone of the full profile.' : '',
      failedCount > 0 ? 'Some photos failed the real pass, so this ranking is useful but not fully complete.' : '',
      degradedCount > 0 ? 'One or more photos were treated as low-signal because no usable face read was found.' : '',
    ]).slice(0, 4);

    const actions = uniqueKeepOrder([
      ...weakest.result!.actions,
      'Lead with the strongest photo and remove the weakest one before judging the set again.',
      spread < 8 ? 'Do not just reshuffle this set — test stronger replacement candidates.' : 'Use the top image as the benchmark for every replacement decision.',
      failedCount > 0 ? 'Re-run the failed photos after trimming file size or swapping in clearer images.' : '',
      degradedCount > 0 ? 'Replace low-signal photos with cleaner solo shots before trusting the score.' : '',
    ]).slice(0, 4);

    return {
      source: 'real',
      score,
      confidence: confidenceAverage >= 85 ? 'High' : confidenceAverage >= 65 ? 'Medium' : 'Low',
      summary: summarizeScore(score, spread, failedCount, degradedCount),
      bestPhotoId: best.photo.id,
      weakestPhotoId: weakest.photo.id,
      strengths,
      weaknesses,
      actions,
      rankedPhotoIds: ranked.map((item) => item.photo.id),
    };
  } catch (_error) {
    const mocked = buildMockAnalysis(photos);
    return {
      ...mocked,
      source: 'mock',
    };
  }
}
