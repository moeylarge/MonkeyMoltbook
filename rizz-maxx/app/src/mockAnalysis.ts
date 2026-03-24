import { AnalysisResult, PhotoItem } from './types';

function scorePhoto(photo: PhotoItem, index: number, total: number) {
  const seed = [...photo.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const balance = total - index;
  return 55 + (seed % 28) + balance;
}

export function buildMockAnalysis(photos: PhotoItem[]): AnalysisResult {
  const ranked = [...photos]
    .map((photo, index) => ({ photo, score: scorePhoto(photo, index, photos.length) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.photo;
  const weakest = ranked[ranked.length - 1]?.photo;
  const average = Math.round(ranked.reduce((sum, item) => sum + item.score, 0) / Math.max(ranked.length, 1));
  const spread = ranked[0].score - ranked[ranked.length - 1].score;

  return {
    score: average,
    confidence: photos.length >= 6 ? 'High' : photos.length >= 4 ? 'Medium' : 'Low',
    summary:
      average >= 80
        ? 'You have real potential here. The top of the set is strong, but cleanup still matters.'
        : 'There is enough here to work with, but the weaker photos are dragging down the overall impression.',
    bestPhotoId: best.id,
    weakestPhotoId: weakest.id,
    strengths: [
      'You have at least one photo strong enough to lead the profile.',
      'The set has enough variety to build a sharper first impression.',
      'Your top images create better profile momentum than your current baseline suggests.',
    ],
    weaknesses: [
      'The weakest image lowers trust in the overall set.',
      'Some photos feel less intentional than the strongest one.',
      'Your current ordering likely hides the strongest first impression.',
    ],
    actions: [
      'Lead with the strongest clean, high-confidence photo.',
      'Remove the weakest image before it drags the whole set down.',
      'Replace one low-signal shot with a brighter, clearer photo.',
      spread < 10
        ? 'Your set is relatively consistent — improve the lead photo to gain the next jump.'
        : 'Tighten the gap between your strongest and weakest photos.',
    ],
    rankedPhotoIds: ranked.map((item) => item.photo.id),
  };
}
