import { AnalysisResult, PhotoItem } from './types';
import { buildMockAnalysis } from './mockAnalysis';

const ANALYSIS_BASE = 'http://127.0.0.1:8091';

type AdapterResponse = {
  ok: boolean;
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
    upstreamScore: number;
  };
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

export async function analyzePhotoSet(photos: PhotoItem[]): Promise<AnalysisResult> {
  try {
    const perPhoto = await Promise.all(
      photos.map(async (photo) => {
        const file = await photoUriToFile(photo);
        const form = new FormData();
        form.append('image', file);
        const res = await fetch(`${ANALYSIS_BASE}/v1/analyze-photo`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) throw new Error(`adapter-${res.status}`);

        const data = (await res.json()) as AdapterResponse;
        const weightedScore = Math.round(
          data.profileStrength * 0.34 +
            (data.traits.leadStrength || data.profileStrength) * 0.28 +
            data.traits.clarity * 0.14 +
            data.traits.lighting * 0.1 +
            data.traits.framing * 0.08 +
            data.traits.confidence * 0.04 +
            data.traits.style * 0.02,
        );

        return { photo, result: data, weightedScore };
      }),
    );

    const ranked = [...perPhoto].sort((a, b) => b.weightedScore - a.weightedScore);
    const best = ranked[0];
    const weakest = ranked[ranked.length - 1];
    const score = average(ranked.map((item) => item.weightedScore));
    const confidenceAverage = average(
      ranked.map((item) => (item.result.confidenceLabel === 'High' ? 90 : item.result.confidenceLabel === 'Medium' ? 72 : 50)),
    );
    const spread = best.weightedScore - weakest.weightedScore;

    const strengths = uniqueKeepOrder([
      ...best.result.strengths,
      'Your strongest image gives you a clearly better lead-photo candidate than the rest of the set.',
      spread >= 12 ? 'There is a visible difference between your strongest and weakest options, which makes cleanup worthwhile.' : '',
    ]).slice(0, 3);

    const weaknesses = uniqueKeepOrder([
      ...weakest.result.weaknesses,
      spread < 8 ? 'The set is clustered too tightly to rely on ordering alone — better replacements matter.' : 'The bottom of the set is still creating avoidable drag compared with the top.',
      ranked.length >= 4 ? 'Your set quality is uneven enough that the weakest slot changes how the whole profile reads.' : '',
    ]).slice(0, 3);

    const actions = uniqueKeepOrder([
      ...weakest.result.actions,
      'Lead with the strongest photo and remove the weakest one before judging the set again.',
      spread < 8 ? 'Test stronger replacement candidates instead of just reshuffling the same set.' : 'Use the top image as the benchmark for every replacement decision.',
    ]).slice(0, 4);

    return {
      source: 'real',
      score,
      confidence: confidenceAverage >= 85 ? 'High' : confidenceAverage >= 65 ? 'Medium' : 'Low',
      summary:
        score >= 80
          ? 'The real local analysis pass found a usable base. Your top image is doing real work, but tighter set discipline will still improve the profile.'
          : score >= 70
            ? 'The real local analysis pass found enough signal to work with, but weaker photos are still dragging down the profile.'
            : 'The real local analysis pass found usable signal, but the current set is leaking too much value to trust as-is.',
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
