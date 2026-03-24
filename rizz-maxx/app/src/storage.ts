import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, PhotoItem } from './types';

const ANALYSES_KEY = 'rizz-maxx.saved-analyses.v1';

export type SavedAnalysis = {
  id: string;
  createdAt: string;
  score: number;
  confidence: AnalysisResult['confidence'];
  source: AnalysisResult['source'];
  summary: string;
  bestPhotoId: string;
  weakestPhotoId: string;
  photos: PhotoItem[];
  result: AnalysisResult;
};

export async function listSavedAnalyses(): Promise<SavedAnalysis[]> {
  const raw = await AsyncStorage.getItem(ANALYSES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAnalysis(entry: SavedAnalysis): Promise<void> {
  const existing = await listSavedAnalyses();
  const next = [entry, ...existing.filter((item) => item.id !== entry.id)].slice(0, 25);
  await AsyncStorage.setItem(ANALYSES_KEY, JSON.stringify(next));
}

export async function getSavedAnalysis(id: string): Promise<SavedAnalysis | null> {
  const all = await listSavedAnalyses();
  return all.find((item) => item.id === id) ?? null;
}
