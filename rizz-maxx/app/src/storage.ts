import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, PhotoItem } from './types';

const ANALYSES_KEY = 'rizz-maxx.saved-analyses.v1';
const PREMIUM_KEY = 'rizz-maxx.premium-unlock.v1';

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

export type PremiumEntitlement = {
  unlocked: boolean;
  productId: 'rizz-maxx-premium-monthly' | 'rizz-maxx-premium-lifetime' | null;
  status: 'locked' | 'active';
  unlockedAt: string | null;
  source: 'none' | 'prototype-purchase' | 'prototype-restore';
};

const DEFAULT_ENTITLEMENT: PremiumEntitlement = {
  unlocked: false,
  productId: null,
  status: 'locked',
  unlockedAt: null,
  source: 'none',
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

export async function deleteSavedAnalysis(id: string): Promise<void> {
  const all = await listSavedAnalyses();
  const next = all.filter((item) => item.id !== id);
  await AsyncStorage.setItem(ANALYSES_KEY, JSON.stringify(next));
}

export async function clearSavedAnalyses(): Promise<void> {
  await AsyncStorage.removeItem(ANALYSES_KEY);
}

export async function getPremiumEntitlement(): Promise<PremiumEntitlement> {
  const raw = await AsyncStorage.getItem(PREMIUM_KEY);
  if (!raw) return DEFAULT_ENTITLEMENT;
  try {
    const parsed = JSON.parse(raw) as PremiumEntitlement;
    return { ...DEFAULT_ENTITLEMENT, ...parsed };
  } catch {
    return DEFAULT_ENTITLEMENT;
  }
}

export async function setPremiumEntitlement(entitlement: PremiumEntitlement): Promise<void> {
  await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(entitlement));
}

export async function unlockPremiumPrototype(productId: PremiumEntitlement['productId']): Promise<PremiumEntitlement> {
  const next: PremiumEntitlement = {
    unlocked: true,
    productId,
    status: 'active',
    unlockedAt: new Date().toISOString(),
    source: 'prototype-purchase',
  };
  await setPremiumEntitlement(next);
  return next;
}

export async function restorePremiumPrototype(): Promise<PremiumEntitlement> {
  const current = await getPremiumEntitlement();
  if (current.unlocked) {
    const restored: PremiumEntitlement = { ...current, source: 'prototype-restore' };
    await setPremiumEntitlement(restored);
    return restored;
  }
  return current;
}

export async function resetPremiumPrototype(): Promise<void> {
  await AsyncStorage.removeItem(PREMIUM_KEY);
}
