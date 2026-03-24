export type PhotoItem = {
  id: string;
  uri: string;
  width?: number;
  height?: number;
  fileName?: string | null;
};

export type AnalysisResult = {
  source: 'real' | 'mock';
  score: number;
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;
  bestPhotoId: string;
  weakestPhotoId: string;
  strengths: string[];
  weaknesses: string[];
  actions: string[];
  rankedPhotoIds: string[];
};

export type RootStackParamList = {
  Onboarding: undefined;
  Upload: undefined;
  Results: {
    photos: PhotoItem[];
    result: AnalysisResult;
  };
  Saved: undefined;
  Premium: undefined;
  Settings: undefined;
};
