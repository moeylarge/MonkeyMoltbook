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
  };
  strengths: string[];
  weaknesses: string[];
  actions: string[];
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

        if (!res.ok) {
          throw new Error(`adapter-${res.status}`);
        }

        const data = (await res.json()) as AdapterResponse;
        return {
          photo,
          result: data,
          weightedScore: Math.round(
            data.profileStrength * 0.45 +
              data.traits.clarity * 0.2 +
              data.traits.lighting * 0.12 +
              data.traits.framing * 0.1 +
              data.traits.confidence * 0.08 +
              data.traits.style * 0.05,
          ),
        };
      }),
    );

    const ranked = [...perPhoto].sort((a, b) => b.weightedScore - a.weightedScore);
    const best = ranked[0];
    const weakest = ranked[ranked.length - 1];
    const score = average(ranked.map((item) => item.weightedScore));
    const confidenceAverage = average(
      ranked.map((item) => (item.result.confidenceLabel === 'High' ? 90 : item.result.confidenceLabel === 'Medium' ? 72 : 50)),
    );

    return {
      source: 'real',
      score,
      confidence: confidenceAverage >= 85 ? 'High' : confidenceAverage >= 65 ? 'Medium' : 'Low',
      summary:
        score >= 78
          ? 'The real local analysis pass found a usable base. The top of the set is working, but order and cleanup still matter.'
          : 'The real local analysis pass found enough signal to work with, but weaker photos are still dragging down the profile.',
      bestPhotoId: best.photo.id,
      weakestPhotoId: weakest.photo.id,
      strengths: best.result.strengths.slice(0, 2).concat('Your strongest image is giving you a clearer lead-photo candidate than the rest of the set.').slice(0,3),
      weaknesses:
        weakest.result.weaknesses.length > 0
          ? weakest.result.weaknesses.slice(0, 3)
          : ['The bottom of the set still creates avoidable drag compared with your strongest image.'],
      actions: [
        ...weakest.result.actions,
        'Lead with the strongest photo and remove the weakest one before judging the set again.',
      ].slice(0, 4),
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
