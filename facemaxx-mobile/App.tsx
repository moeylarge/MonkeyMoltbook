import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ScreenKey =
  | 'hook'
  | 'upload'
  | 'camera'
  | 'scan'
  | 'result'
  | 'breakdown'
  | 'simulate'
  | 'history'
  | 'paywall'
  | 'plan'
  | 'share'
  | 'battle';

type BreakdownKey = 'jawline' | 'eyes' | 'skin' | 'symmetry' | 'hair' | 'thirds';

type BreakdownItem = {
  key: BreakdownKey;
  label: string;
  score: number;
  target: number;
  why: string;
  color: string;
};

type ScanRecord = {
  id: string;
  createdAt: string;
  photoLabel: string;
  imageUri?: string;
  score: number;
  potential: number;
  tier: string;
  rank: string;
  archetype: string;
  breakdown: BreakdownItem[];
  deltaFromPrevious?: number;
  streakDays?: number;
};

type ImprovementItem = {
  id: string;
  category: 'grooming' | 'hairstyle' | 'skincare' | 'fitness/body fat' | 'optional cosmetic';
  title: string;
  detail: string;
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'hard';
  timeToResult: string;
  scoreLift: number;
};

type AnalysisImage = {
  uri?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
};

type AffiliateItem = {
  id: string;
  category: 'skincare' | 'grooming' | 'hair products' | 'fitness items';
  name: string;
  reason: string;
  cta: string;
};

type BattleProfile = {
  id: string;
  name: string;
  archetype: string;
  tier: string;
  score: number;
  vibe: string;
};

type ShareTone = 'neutral' | 'confident' | 'humble' | 'provocative';

const STORAGE_KEY = 'facemaxx.scanHistory.v1';
const screens: ScreenKey[] = ['hook', 'upload', 'camera', 'scan', 'result', 'breakdown', 'simulate', 'history', 'paywall', 'plan', 'share', 'battle'];
const battleProfiles: BattleProfile[] = [
  { id: '1', name: 'Damon', archetype: 'Pretty Boy', tier: 'Attractive', score: 74, vibe: 'cleaner eye area, softer jaw' },
  { id: '2', name: 'Rex', archetype: 'Rugged Masculine', tier: 'Elite', score: 83, vibe: 'stronger jawline, rougher skin quality' },
  { id: '3', name: 'Noah', archetype: 'Boy Next Door', tier: 'Above Average', score: 68, vibe: 'balanced, approachable, less frame control' },
];
const scanStages = [
  'Locking face frame',
  'Reading structure tension',
  'Scoring eye area + skin',
  'Assigning archetype',
  'Building upgrade path',
];

const gradientColors = ['#7C5CFF', '#FF4FD8', '#14E38B', '#4DA3FF', '#FF8A3D', '#FFD24D'];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

async function readImageSignal(image?: AnalysisImage) {
  const width = image?.width ?? 1080;
  const height = image?.height ?? 1350;
  const fileSize = image?.fileSize ?? 0;
  const aspect = width / Math.max(1, height);

  let mean = 128;
  let variance = 34;
  let transitions = 52;
  let sampleCount = 0;

  if (image?.uri) {
    try {
      const response = await fetch(image.uri);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const stride = Math.max(1, Math.floor(bytes.length / 512));
      let prev = bytes[0] ?? 0;
      let total = 0;
      let totalSq = 0;
      for (let i = 0; i < bytes.length; i += stride) {
        const value = bytes[i] ?? 0;
        total += value;
        totalSq += value * value;
        if (Math.abs(value - prev) > 24) transitions += 1;
        prev = value;
        sampleCount += 1;
      }
      if (sampleCount > 0) {
        mean = total / sampleCount;
        variance = Math.sqrt(Math.max(0, totalSq / sampleCount - mean * mean));
      }
    } catch {
      // fall back to metadata-only analysis
    }
  }

  return {
    width,
    height,
    fileSize,
    aspect,
    mean,
    variance,
    transitions,
    sampleCount,
  };
}

function getTierProgress(score: number) {
  if (score < 55) {
    return { currentTier: 'Normie', nextTier: 'Above Average', currentThreshold: 0, nextThreshold: 55 };
  }
  if (score < 72) {
    return { currentTier: 'Above Average', nextTier: 'Attractive', currentThreshold: 55, nextThreshold: 72 };
  }
  if (score < 82) {
    return { currentTier: 'Attractive', nextTier: 'Elite', currentThreshold: 72, nextThreshold: 82 };
  }
  if (score < 92) {
    return { currentTier: 'Elite', nextTier: 'Genetic Outlier', currentThreshold: 82, nextThreshold: 92 };
  }
  return { currentTier: 'Genetic Outlier', nextTier: 'Maxed', currentThreshold: 92, nextThreshold: 100 };
}

function getProgressPercent(score: number) {
  const progress = getTierProgress(score);
  const span = Math.max(1, progress.nextThreshold - progress.currentThreshold);
  return clamp(Math.round(((score - progress.currentThreshold) / span) * 100), 0, 100);
}

function getCalendarDayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function getDayDiff(a: string, b: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  const aMs = new Date(`${getCalendarDayKey(a)}T00:00:00Z`).getTime();
  const bMs = new Date(`${getCalendarDayKey(b)}T00:00:00Z`).getTime();
  return Math.round((aMs - bMs) / dayMs);
}

function getIdentityTagline(scan: ScanRecord) {
  const best = [...scan.breakdown].sort((a, b) => b.target - b.score - (a.target - a.score))[0];
  const upside = Math.max(0, scan.potential - scan.score);
  return `You are a ${scan.archetype} with ${upside >= 12 ? 'high' : upside >= 8 ? 'real' : 'measured'} upside. Improving ${best.label.toLowerCase()} can push you toward ${scan.potential >= 82 ? 'Elite' : scan.potential >= 72 ? 'Attractive' : 'Above Average'}.`;
}

function buildAffiliateItems(scan: ScanRecord): AffiliateItem[] {
  const skin = scan.breakdown.find((item) => item.key === 'skin');
  const hair = scan.breakdown.find((item) => item.key === 'hair');
  const jaw = scan.breakdown.find((item) => item.key === 'jawline');

  return [
    {
      id: 'affiliate-skin',
      category: 'skincare',
      name: 'Barrier Repair Kit',
      reason: `${skin?.label ?? 'Skin quality'} is suppressing first impression. A simple routine is the fastest visible reset.`,
      cta: 'View skincare picks',
    },
    {
      id: 'affiliate-groom',
      category: 'grooming',
      name: 'Precision Beard + Brow Kit',
      reason: 'Sharper edges make the same face read more intentional immediately.',
      cta: 'View grooming tools',
    },
    {
      id: 'affiliate-hair',
      category: 'hair products',
      name: 'Texture + Hold Stack',
      reason: `${hair?.label ?? 'Hair framing'} can add perceived structure before any long-term changes kick in.`,
      cta: 'View hair products',
    },
    {
      id: 'affiliate-fitness',
      category: 'fitness items',
      name: 'Lean-Down Essentials',
      reason: `${jaw?.label ?? 'Jawline definition'} responds best when body-fat and posture stop working against you.`,
      cta: 'View fitness items',
    },
  ];
}

function buildShareCaptions(scan: ScanRecord): Record<ShareTone, string> {
  return {
    neutral: `FACEMAXX scored me ${scan.score} as ${scan.archetype}. Fair read or not?`,
    confident: `${scan.score} now and ${scan.potential} potential. Strong base or overhyped?`,
    humble: `Trying to level this up. FACEMAXX says ${scan.archetype} with room to improve — accurate?`,
    provocative: `FACEMAXX says I’m a ${scan.archetype} at ${scan.score}. Honest takes only — fair or inflated?`,
  };
}

function buildBattleOutcome(scan: ScanRecord, opponent: BattleProfile) {
  const delta = scan.score - opponent.score;
  if (delta >= 3) {
    return {
      winner: 'you',
      summary: `You win on overall signal. Your ${scan.archetype.toLowerCase()} read edges out ${opponent.name}'s ${opponent.archetype.toLowerCase()} profile.`,
    };
  }
  if (delta <= -3) {
    return {
      winner: 'opponent',
      summary: `${opponent.name} wins on current signal. Their profile reads stronger right now, but your ceiling is still competitive.`,
    };
  }
  return {
    winner: 'draw',
    summary: `Near draw. This comes down to angle, grooming, and who presents their strongest frame better.`,
  };
}

function buildImprovementPlan(scan: ScanRecord): ImprovementItem[] {
  const lifts = [...scan.breakdown]
    .map((item) => ({ ...item, lift: item.target - item.score }))
    .sort((a, b) => b.lift - a.lift);

  const primary = lifts[0];
  const secondary = lifts[1] ?? lifts[0];
  const skin = lifts.find((item) => item.key === 'skin') ?? lifts[0];
  const hair = lifts.find((item) => item.key === 'hair') ?? lifts[1] ?? lifts[0];
  const jaw = lifts.find((item) => item.key === 'jawline') ?? lifts[0];

  return [
    {
      id: 'grooming-1',
      category: 'grooming',
      title: 'Clean up the frame first',
      detail: `Tighten beard lines, trim neck bulk, and clean the brow area so ${primary.label.toLowerCase()} reads sharper instead of softer.`,
      impact: primary.lift >= 10 ? 'high' : 'medium',
      difficulty: 'easy',
      timeToResult: '3-7 days',
      scoreLift: Math.min(4, Math.max(2, Math.round(primary.lift / 3))),
    },
    {
      id: 'hair-1',
      category: 'hairstyle',
      title: 'Change the silhouette around the face',
      detail: `Use more intentional volume and cleaner side control. ${hair.label} is suppressing the way your upper third currently reads.`,
      impact: hair.lift >= 10 ? 'high' : 'medium',
      difficulty: 'moderate',
      timeToResult: '1-2 weeks',
      scoreLift: Math.min(5, Math.max(2, Math.round(hair.lift / 3))),
    },
    {
      id: 'skin-1',
      category: 'skincare',
      title: 'Run a basic skin reset',
      detail: `Consistency matters more than complexity here: cleanse, moisturize, SPF, and reduce irritation so ${skin.label.toLowerCase()} stops dragging first impression.`,
      impact: skin.lift >= 9 ? 'high' : 'medium',
      difficulty: 'easy',
      timeToResult: '2-6 weeks',
      scoreLift: Math.min(4, Math.max(2, Math.round(skin.lift / 3))),
    },
    {
      id: 'fitness-1',
      category: 'fitness/body fat',
      title: 'Lean down enough to reveal structure',
      detail: `A modest body-fat drop and better posture will make ${jaw.label.toLowerCase()} and overall facial harmony read stronger without changing identity.`,
      impact: jaw.lift >= 10 ? 'high' : 'medium',
      difficulty: 'hard',
      timeToResult: '6-12 weeks',
      scoreLift: Math.min(6, Math.max(3, Math.round(jaw.lift / 2.5))),
    },
    {
      id: 'cosmetic-1',
      category: 'optional cosmetic',
      title: 'Only consider clinical upgrades after the basics',
      detail: `If you still plateau after grooming, skin, and leanness, get a neutral consult for dermatology, orthodontics, or hair-density support.`,
      impact: secondary.lift >= 11 ? 'medium' : 'low',
      difficulty: 'hard',
      timeToResult: '2-6 months',
      scoreLift: Math.min(5, Math.max(1, Math.round(secondary.lift / 4))),
    },
  ];
}

async function detectFaceMetrics(image?: AnalysisImage) {
  if (!image?.uri) {
    return {
      hasFace: false,
      faceCount: 0,
      faceWidthRatio: 0.34,
      faceHeightRatio: 0.46,
      eyeDistanceRatio: 0.18,
      jawWidthRatio: 0.31,
      noseCenterOffset: 0,
      rollBalance: 0,
      landmarkDensity: 0,
    };
  }

  try {
    const result = await FaceDetector.detectFacesAsync(image.uri, {
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
      minDetectionInterval: 0,
      tracking: false,
    });

    const face = result.faces?.[0];
    if (!face) {
      return {
        hasFace: false,
        faceCount: 0,
        faceWidthRatio: 0.34,
        faceHeightRatio: 0.46,
        eyeDistanceRatio: 0.18,
        jawWidthRatio: 0.31,
        noseCenterOffset: 0,
        rollBalance: 0,
        landmarkDensity: 0,
      };
    }

    const imageWidth = image.width ?? 1080;
    const imageHeight = image.height ?? 1350;
    const bounds = face.bounds ?? { size: { width: imageWidth * 0.34, height: imageHeight * 0.46 }, origin: { x: imageWidth * 0.33, y: imageHeight * 0.22 } };
    const leftEye = face.leftEyePosition;
    const rightEye = face.rightEyePosition;
    const nose = face.noseBasePosition;
    const leftCheek = face.leftCheekPosition;
    const rightCheek = face.rightCheekPosition;

    const faceWidthRatio = bounds.size.width / Math.max(1, imageWidth);
    const faceHeightRatio = bounds.size.height / Math.max(1, imageHeight);
    const eyeDistanceRatio = leftEye && rightEye ? Math.abs(rightEye.x - leftEye.x) / Math.max(1, imageWidth) : faceWidthRatio * 0.45;
    const jawWidthRatio = leftCheek && rightCheek ? Math.abs(rightCheek.x - leftCheek.x) / Math.max(1, imageWidth) : faceWidthRatio * 0.82;
    const faceCenterX = bounds.origin.x + bounds.size.width / 2;
    const noseCenterOffset = nose ? Math.abs(nose.x - faceCenterX) / Math.max(1, bounds.size.width) : 0.04;
    const rollBalance = leftEye && rightEye ? Math.abs(leftEye.y - rightEye.y) / Math.max(1, imageHeight) : 0.01;
    const landmarkDensity = [leftEye, rightEye, nose, leftCheek, rightCheek].filter(Boolean).length / 5;

    return {
      hasFace: true,
      faceCount: result.faces?.length ?? 1,
      faceWidthRatio,
      faceHeightRatio,
      eyeDistanceRatio,
      jawWidthRatio,
      noseCenterOffset,
      rollBalance,
      landmarkDensity,
    };
  } catch {
    return {
      hasFace: false,
      faceCount: 0,
      faceWidthRatio: 0.34,
      faceHeightRatio: 0.46,
      eyeDistanceRatio: 0.18,
      jawWidthRatio: 0.31,
      noseCenterOffset: 0,
      rollBalance: 0,
      landmarkDensity: 0,
    };
  }
}

function buildRetentionStats(history: ScanRecord[]) {
  const ordered = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const bestScore = ordered.reduce((max, item) => Math.max(max, item.score), 0);
  const bestScan = ordered.reduce<ScanRecord | null>((best, item) => (!best || item.score >= best.score ? item : best), null);
  const latest = ordered[ordered.length - 1] ?? null;
  const previous = ordered[ordered.length - 2] ?? null;
  const scoreDelta = latest && previous ? latest.score - previous.score : 0;

  let streakDays = ordered.length ? 1 : 0;
  for (let i = ordered.length - 1; i > 0; i -= 1) {
    const diff = getDayDiff(ordered[i].createdAt, ordered[i - 1].createdAt);
    if (diff === 0) continue;
    if (diff === 1) {
      streakDays += 1;
      continue;
    }
    break;
  }

  return {
    bestScore,
    bestScan,
    latest,
    previous,
    scoreDelta,
    streakDays,
  };
}

async function buildScanFromImage(image: AnalysisImage | undefined, photoLabel: string): Promise<ScanRecord> {
  const signal = await readImageSignal(image);
  const face = await detectFaceMetrics(image);
  const signalSeed = `${photoLabel}-${signal.width}-${signal.height}-${signal.fileSize}-${Math.round(signal.mean)}-${Math.round(signal.variance)}-${signal.transitions}-${Math.round(face.faceWidthRatio * 1000)}-${Math.round(face.eyeDistanceRatio * 1000)}-${Math.round(face.jawWidthRatio * 1000)}`;
  const hash = hashString(signalSeed);

  const lightingQuality = clamp(52 + (signal.mean - 96) / 2.3, 40, 92);
  const contrastQuality = clamp(48 + signal.variance * 0.72, 40, 92);
  const framingQuality = clamp(58 + (0.82 - Math.abs(signal.aspect - 0.82)) * 36 + face.landmarkDensity * 8, 42, 92);
  const textureSignal = clamp(46 + Math.min(signal.transitions, 180) / 4.2, 40, 88);
  const fileSignal = clamp(45 + Math.min(signal.fileSize / 18000, 22), 40, 88);
  const symmetrySignal = clamp(74 - face.noseCenterOffset * 160 - face.rollBalance * 420 + face.landmarkDensity * 10, 40, 92);
  const harmonySignal = clamp(66 - Math.abs(face.faceWidthRatio - 0.34) * 180 - Math.abs(face.faceHeightRatio - 0.46) * 120 + face.landmarkDensity * 12, 40, 92);
  const jawSignal = clamp(58 + face.jawWidthRatio * 70 + contrastQuality * 0.12, 40, 92);
  const eyeSignal = clamp(54 + face.eyeDistanceRatio * 120 + lightingQuality * 0.15, 40, 92);

  const breakdownSeed: BreakdownItem[] = [
    {
      key: 'jawline',
      label: 'Jawline',
      score: clamp(Math.round((jawSignal * 0.58 + framingQuality * 0.22 + contrastQuality * 0.2) - 4), 42, 92),
      target: 0,
      why: face.hasFace ? 'Jawline read is now tied to detected lower-face width, framing, and contrast separation.' : 'Lower-face definition responds to cleaner framing, leanness, and stronger image separation.',
      color: '#7C5CFF',
    },
    {
      key: 'eyes',
      label: 'Eye area',
      score: clamp(Math.round((eyeSignal * 0.52 + lightingQuality * 0.28 + contrastQuality * 0.2) + 1), 44, 92),
      target: 0,
      why: face.hasFace ? 'Eye area read now uses detected eye spacing plus lighting and contrast quality.' : 'Eye presence depends heavily on lighting quality, contrast, and overall sharpness.',
      color: '#FF4FD8',
    },
    {
      key: 'skin',
      label: 'Skin quality',
      score: clamp(Math.round((lightingQuality * 0.3 + textureSignal * 0.45 + fileSignal * 0.25) - 6), 40, 86),
      target: 0,
      why: 'Texture, tone, and image clarity strongly affect how skin quality reads on first impression.',
      color: '#14E38B',
    },
    {
      key: 'symmetry',
      label: 'Symmetry',
      score: clamp(Math.round((symmetrySignal * 0.6 + framingQuality * 0.2 + lightingQuality * 0.2) - 2), 45, 91),
      target: 0,
      why: face.hasFace ? 'Symmetry read is now tied to detected nose centering, eye balance, and face alignment.' : 'Balanced framing and even lighting make facial symmetry read stronger immediately.',
      color: '#4DA3FF',
    },
    {
      key: 'hair',
      label: 'Hair / framing',
      score: clamp(Math.round((framingQuality * 0.5 + textureSignal * 0.2 + fileSignal * 0.3) - 5), 41, 88),
      target: 0,
      why: 'Hair and overall framing control can dramatically change how the same face presents.',
      color: '#FF8A3D',
    },
    {
      key: 'thirds',
      label: 'Facial harmony',
      score: clamp(Math.round((harmonySignal * 0.58 + framingQuality * 0.22 + contrastQuality * 0.2) - 3), 44, 91),
      target: 0,
      why: face.hasFace ? 'Facial harmony is now influenced by detected face proportions, alignment, and balance.' : 'Harmony improves when proportions, angle, and visual balance all cooperate.',
      color: '#FFD24D',
    },
  ];

  const breakdown: BreakdownItem[] = breakdownSeed.map((item, index) => {
    const targetLift = 6 + ((hash >> (index + 1)) % 10);
    return { ...item, target: clamp(item.score + targetLift, item.score + 4, 95) };
  });

  const score = Math.round(breakdown.reduce((sum, item) => sum + item.score, 0) / breakdown.length);
  const potential = Math.round(clamp(breakdown.reduce((sum, item) => sum + item.target, 0) / breakdown.length + 2, score + 6, 95));

  const archetypes = ['Chadlite', 'Pretty Boy', 'Model Type A', 'Boy Next Door', 'Rugged Masculine'];
  const archetype = archetypes[hash % archetypes.length];

  let tier = 'Attractive';
  let rank = 'Silver Signal';
  if (score < 55) {
    tier = 'Normie';
    rank = 'Bronze Signal';
  } else if (score >= 92) {
    tier = 'Genetic Outlier';
    rank = 'Outlier Signal';
  } else if (score >= 82) {
    tier = 'Elite';
    rank = 'Elite Signal';
  } else if (score >= 72) {
    tier = 'Attractive';
    rank = 'Silver Signal';
  } else {
    tier = 'Above Average';
    rank = 'Gold Signal';
  }

  return {
    id: `${Date.now()}-${hash}`,
    createdAt: new Date().toISOString(),
    photoLabel,
    imageUri: image?.uri,
    score,
    potential,
    tier,
    rank,
    archetype,
    breakdown,
  };
}

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('hook');
  const [selectedPhoto, setSelectedPhoto] = useState<'Front selfie' | 'Mirror shot' | 'Sharp angle'>('Front selfie');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<AnalysisImage | undefined>();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanRecord | null>(null);
  const [scanIndex, setScanIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(6);
  const [busyPicking, setBusyPicking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [potentialDisplay, setPotentialDisplay] = useState(0);
  const [compareDisplay, setCompareDisplay] = useState(0);
  const [lockedIndex, setLockedIndex] = useState(0);
  const [selectedBattleId, setSelectedBattleId] = useState<string>(battleProfiles[0].id);
  const [battleName, setBattleName] = useState('Friend');
  const [battleScoreInput, setBattleScoreInput] = useState('71');
  const [battleArchetype, setBattleArchetype] = useState('Pretty Boy');
  const [battleImageUri, setBattleImageUri] = useState<string | undefined>();
  const [battleImage, setBattleImage] = useState<AnalysisImage | undefined>();
  const [battleScan, setBattleScan] = useState<ScanRecord | null>(null);
  const [battleBusy, setBattleBusy] = useState(false);
  const [shareTone, setShareTone] = useState<ShareTone>('neutral');

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;
  const pulse = useRef(new Animated.Value(0.96)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const compareAnim = useRef(new Animated.Value(0)).current;
  const potentialAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(6)).current;
  const paywallGlow = useRef(new Animated.Value(0.25)).current;
  const barAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const targetBarAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const revealAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  const activeScan = currentScan ?? history[0] ?? null;
  const activeBreakdown = activeScan?.breakdown ?? [];
  const eliteDistance = activeScan ? Math.max(0, 100 - activeScan.potential) : 18;
  const retentionStats = useMemo(() => buildRetentionStats(history), [history]);

  const topImprovement = useMemo(() => {
    if (!activeScan) return null;
    return [...activeScan.breakdown].sort((a, b) => b.target - b.score - (a.target - a.score))[0];
  }, [activeScan]);

  const improvementPlan = useMemo(() => (activeScan ? buildImprovementPlan(activeScan) : []), [activeScan]);
  const identityTagline = useMemo(() => (activeScan ? getIdentityTagline(activeScan) : ''), [activeScan]);
  const tierProgress = useMemo(() => (activeScan ? getTierProgress(activeScan.score) : null), [activeScan]);
  const tierProgressPercent = useMemo(() => (activeScan ? getProgressPercent(activeScan.score) : 0), [activeScan]);
  const shareCaptions = useMemo(() => (activeScan ? buildShareCaptions(activeScan) : null), [activeScan]);
  const shareCaption = shareCaptions?.[shareTone] ?? '';
  const affiliateItems = useMemo(() => (activeScan ? buildAffiliateItems(activeScan) : []), [activeScan]);
  const selectedBattleProfile = useMemo(
    () => battleProfiles.find((item) => item.id === selectedBattleId) ?? battleProfiles[0],
    [selectedBattleId],
  );
  const customBattleProfile = useMemo(
    () => ({
      id: 'custom',
      name: battleName || 'Friend',
      archetype: battleArchetype || 'Unknown',
      tier: getTierProgress(clamp(Number(battleScoreInput) || 0, 0, 100)).currentTier,
      score: clamp(Number(battleScoreInput) || 0, 0, 100),
      vibe: 'manual two-face compare entry',
    }),
    [battleName, battleArchetype, battleScoreInput],
  );
  const activeOpponentProfile = useMemo(() => {
    if (battleScan) {
      return {
        id: 'scan-opponent',
        name: battleName || 'Friend',
        archetype: battleScan.archetype,
        tier: battleScan.tier,
        score: battleScan.score,
        vibe: 'derived from real second uploaded image',
      };
    }
    return customBattleProfile.score ? customBattleProfile : selectedBattleProfile;
  }, [battleScan, battleName, customBattleProfile, selectedBattleProfile]);
  const battleOutcome = useMemo(
    () => (activeScan ? buildBattleOutcome(activeScan, activeOpponentProfile) : null),
    [activeScan, activeOpponentProfile],
  );

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ScanRecord[];
          setHistory(parsed);
          if (parsed[0]) setCurrentScan(parsed[0]);
        }
      } catch {
        // keep quiet, local fallback only
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(18);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [screen, fade, slide]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 1300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    const a = scoreAnim.addListener(({ value }) => setScoreDisplay(Math.round(value)));
    const b = compareAnim.addListener(({ value }) => setCompareDisplay(Math.round(value)));
    const c = potentialAnim.addListener(({ value }) => setPotentialDisplay(Math.round(value)));
    return () => {
      scoreAnim.removeListener(a);
      compareAnim.removeListener(b);
      potentialAnim.removeListener(c);
    };
  }, [scoreAnim, compareAnim, potentialAnim]);

  useEffect(() => {
    if (screen !== 'scan') return;
    setScanIndex(0);
    setScanProgress(6);
    progressAnim.setValue(6);

    let stage = 0;
    const tick = setInterval(() => {
      stage += 1;
      const next = Math.min(20 + stage * 20, 100);
      setScanIndex(Math.min(stage, scanStages.length - 1));
      setScanProgress(next);
      Animated.timing(progressAnim, {
        toValue: next,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      if (stage >= scanStages.length - 1) clearInterval(tick);
    }, 420);

    return () => clearInterval(tick);
  }, [screen, progressAnim]);

  useEffect(() => {
    if (screen !== 'result' || !activeScan) return;
    scoreAnim.setValue(0);
    Animated.timing(scoreAnim, {
      toValue: activeScan.score,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [screen, activeScan, scoreAnim]);

  useEffect(() => {
    if (screen !== 'breakdown' || !activeScan) return;
    activeScan.breakdown.forEach((item, index) => {
      revealAnims[index].setValue(0);
      barAnims[index].setValue(0);
      targetBarAnims[index].setValue(0);
      Animated.parallel([
        Animated.timing(revealAnims[index], {
          toValue: 1,
          duration: 240,
          delay: index * 90,
          useNativeDriver: true,
        }),
        Animated.timing(barAnims[index], {
          toValue: item.score,
          duration: 650,
          delay: index * 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(targetBarAnims[index], {
          toValue: item.target,
          duration: 760,
          delay: index * 90 + 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [screen, activeScan, barAnims, revealAnims, targetBarAnims]);

  useEffect(() => {
    if (screen !== 'simulate' || !activeScan) return;
    compareAnim.setValue(activeScan.score);
    potentialAnim.setValue(activeScan.score);
    Animated.sequence([
      Animated.timing(compareAnim, {
        toValue: clamp(activeScan.score + 10, activeScan.score, 95),
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(compareAnim, {
        toValue: activeScan.potential,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
    Animated.timing(potentialAnim, {
      toValue: activeScan.potential,
      duration: 1150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [screen, activeScan, compareAnim, potentialAnim]);

  useEffect(() => {
    if (screen !== 'paywall') return;
    paywallGlow.setValue(0.25);
    setLockedIndex(0);
    const interval = setInterval(() => setLockedIndex((v) => (v + 1) % 4), 900);
    Animated.loop(
      Animated.sequence([
        Animated.timing(paywallGlow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(paywallGlow, {
          toValue: 0.25,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ).start();
    return () => clearInterval(interval);
  }, [screen, paywallGlow]);

  const persistHistory = async (next: ScanRecord[]) => {
    setHistory(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // local convenience only
    }
  };

  const pickImage = async () => {
    try {
      setBusyPicking(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access so FACEMAXX can load an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setSelectedImage({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
        });
      }
    } finally {
      setBusyPicking(false);
    }
  };

  const openCamera = async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      Alert.alert('Camera needed', 'Allow camera access so FACEMAXX can capture a face directly in-app.');
      return;
    }
    setScreen('camera');
  };

  const capturePhoto = async () => {
    try {
      const captured = await cameraRef.current?.takePictureAsync({ quality: 0.8, base64: false });
      if (captured?.uri) {
        setImageUri(captured.uri);
        setSelectedImage({
          uri: captured.uri,
          width: captured.width,
          height: captured.height,
        });
        setSelectedPhoto('Front selfie');
        setScreen('upload');
      }
    } catch {
      Alert.alert('Capture failed', 'FACEMAXX could not capture the photo. Try again.');
    }
  };

  const pickBattleImage = async () => {
    try {
      setBattleBusy(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access so FACEMAXX can load a second face for battle mode.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        const nextImage = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
        };
        setBattleImageUri(asset.uri);
        setBattleImage(nextImage);
        const analyzed = await buildScanFromImage(nextImage, `${battleName || 'Friend'} battle upload`);
        setBattleScan(analyzed);
        setBattleArchetype(analyzed.archetype);
        setBattleScoreInput(String(analyzed.score));
      }
    } finally {
      setBattleBusy(false);
    }
  };

  const startScan = async () => {
    const rawScan = await buildScanFromImage(
      selectedImage ?? { uri: imageUri },
      selectedPhoto,
    );
    const previous = history[0];
    const deltaFromPrevious = previous ? rawScan.score - previous.score : 0;
    const streakDays = previous
      ? (() => {
          const diff = getDayDiff(rawScan.createdAt, previous.createdAt);
          if (diff === 0) return previous.streakDays ?? 1;
          if (diff === 1) return (previous.streakDays ?? 1) + 1;
          return 1;
        })()
      : 1;

    const scan: ScanRecord = {
      ...rawScan,
      deltaFromPrevious,
      streakDays,
    };

    setCurrentScan(scan);
    const nextHistory = [scan, ...history].slice(0, 12);
    await persistHistory(nextHistory);
    setScreen('scan');
  };

  const resetFlow = () => {
    setSelectedPhoto('Front selfie');
    setImageUri(undefined);
    setSelectedImage(undefined);
    setBattleImageUri(undefined);
    setBattleImage(undefined);
    setBattleScan(null);
    setCurrentScan(history[0] ?? null);
    setScreen('hook');
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const renderPreview = (size: 'large' | 'small' = 'large') => {
    const large = size === 'large';
    if (imageUri) {
      return (
        <Image
          source={{ uri: imageUri }}
          style={large ? styles.photoImageLarge : styles.photoImageSmall}
          resizeMode="cover"
        />
      );
    }
    return <Text style={large ? styles.photoFaceLarge : styles.photoFaceSmall}>◌</Text>;
  };

  const renderHook = () => (
    <View style={styles.heroWrap}>
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>LIVE IDENTITY ENGINE</Text>
        <View style={styles.liveDot} />
      </View>
      <Animated.View style={[styles.heroOrb, { transform: [{ scale: pulse }] }]}>
        <View style={styles.heroOrbCore}>
          <Text style={styles.heroOrbScore}>{history[0]?.potential ?? 91}</Text>
          <Text style={styles.heroOrbLabel}>Potential cap</Text>
        </View>
      </Animated.View>
      <Text style={styles.heroTitle}>How much can you optimize your face signal?</Text>
      <Text style={styles.heroSub}>One photo. One optimization score. One clear path from current signal to stronger signal.</Text>

      <View style={styles.statRail}>
        <View style={styles.statChip}>
          <Text style={styles.statNumber}>{history.length || 1}</Text>
          <Text style={styles.statLabel}>Scans saved locally</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statNumber}>{history[0] ? `${Math.max(0, history[0].potential - history[0].score)}` : '27'}</Text>
          <Text style={styles.statLabel}>Potential points</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => setScreen('upload')}>
        <Text style={styles.primaryButtonText}>Start Face Scan</Text>
      </Pressable>
      {!!history.length && (
        <Pressable style={styles.secondaryButton} onPress={() => setScreen('history')}>
          <Text style={styles.secondaryButtonText}>Open Saved Scans</Text>
        </Pressable>
      )}
    </View>
  );

  const renderUpload = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Photo entry</Text>
      <Text style={styles.sectionTitle}>Load a real image, then let the local optimization engine analyze it.</Text>

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTag}>PHASE 3 LIVE INPUT</Text>
        <Text style={styles.uploadTitle}>{selectedPhoto}</Text>
        <Text style={styles.uploadCopy}>This now accepts a real image from your library and runs image-derived local analysis before saving the scan on-device.</Text>
        <View style={styles.photoPreview}>{renderPreview('large')}</View>
      </View>

      <View style={styles.optionRow}>
        {(['Front selfie', 'Mirror shot', 'Sharp angle'] as const).map((option) => (
          <Pressable
            key={option}
            style={[styles.optionChip, selectedPhoto === option && styles.optionChipActive]}
            onPress={() => setSelectedPhoto(option)}
          >
            <Text style={[styles.optionText, selectedPhoto === option && styles.optionTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.infoStack}>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{imageUri ? 'LIVE' : 'WAITING'}</Text>
          <Text style={styles.infoLabel}>input mode</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{history.length}</Text>
          <Text style={styles.infoLabel}>saved scans</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>LOCAL</Text>
          <Text style={styles.infoLabel}>storage only</Text>
        </View>
      </View>

      <Pressable style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryButtonText}>{busyPicking ? 'Opening Photos…' : imageUri ? 'Change Library Photo' : 'Choose Photo from Library'}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={openCamera}>
        <Text style={styles.secondaryButtonText}>Take Photo in App</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={startScan}>
        <Text style={styles.primaryButtonText}>Run Scan</Text>
      </Pressable>
    </View>
  );

  const renderCamera = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Direct capture</Text>
      <Text style={styles.sectionTitle}>Take a face photo directly in-app before running the analysis engine.</Text>
      <View style={styles.cameraShell}>
        {cameraPermission?.granted ? (
          <CameraView ref={cameraRef} facing="front" style={styles.cameraView} />
        ) : (
          <View style={styles.cameraFallback}><Text style={styles.cameraFallbackText}>Camera permission required</Text></View>
        )}
      </View>
      <Pressable style={styles.secondaryButton} onPress={() => setScreen('upload')}>
        <Text style={styles.secondaryButtonText}>Back to Upload</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={capturePhoto}>
        <Text style={styles.primaryButtonText}>Capture Face Photo</Text>
      </Pressable>
    </View>
  );

  const renderScan = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Scan experience</Text>
      <Text style={styles.sectionTitle}>Simulating a fast identity read while keeping the UI alive.</Text>
      <View style={styles.scanCore}>
        <Animated.View style={[styles.scanHalo, { transform: [{ scale: pulse }] }]} />
        <View style={styles.scanFrame}>{renderPreview('large')}</View>
      </View>
      <View style={styles.scanStageCard}>
        <Text style={styles.scanStageLabel}>Current phase</Text>
        <Text style={styles.scanStageValue}>{scanStages[scanIndex]}</Text>
      </View>
      <View style={styles.progressTrackLg}>
        <Animated.View
          style={[
            styles.progressFillLg,
            { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={styles.progressCaption}>{scanProgress}% complete</Text>
      <Pressable style={styles.primaryButton} onPress={() => setScreen('result')}>
        <Text style={styles.primaryButtonText}>Reveal Result</Text>
      </Pressable>
    </View>
  );

  const renderResult = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Result impact</Text>
        <View style={styles.resultCard}>
          <Text style={styles.rankBadge}>{activeScan.rank}</Text>
          <Text style={styles.resultLabel}>Optimization Score</Text>
          <Text style={styles.resultScore}>{scoreDisplay}</Text>
          <Text style={styles.resultTier}>{activeScan.tier}</Text>
          <Text style={styles.resultArchetype}>{activeScan.archetype}</Text>
          <View style={styles.resultProgressWrap}>
            <View style={styles.progressTrackSm}>
              <View style={[styles.progressFillSm, { width: `${activeScan.potential}%` }]} />
            </View>
            <Text style={styles.resultProgressText}>You are {eliteDistance}% away from 100-signal ceiling</Text>
          </View>
        </View>

        <View style={styles.dualStats}>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatTop}>Current</Text>
            <Text style={styles.miniStatValue}>{activeScan.score}</Text>
          </View>
          <View style={styles.miniStatCardAccent}>
            <Text style={styles.miniStatTop}>Potential</Text>
            <Text style={styles.miniStatValue}>{activeScan.potential}</Text>
          </View>
        </View>

        <View style={styles.identityLine}>
          <Text style={styles.identityLineTitle}>Identity tagline</Text>
          <Text style={styles.identityLineText}>{identityTagline}</Text>
          {!!tierProgress && (
            <>
              <Text style={styles.identityProgressText}>
                {Math.max(0, tierProgress.nextThreshold - activeScan.score)} points away from {tierProgress.nextTier}
              </Text>
              <View style={styles.progressTierTrack}>
                <View style={[styles.progressTierFill, { width: `${tierProgressPercent}%` }]} />
              </View>
              <Text style={styles.progressTierCaption}>
                {tierProgressPercent}% through {tierProgress.currentTier}
              </Text>
            </>
          )}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('breakdown')}>
          <Text style={styles.primaryButtonText}>See Breakdown</Text>
        </Pressable>
      </View>
    );
  };

  const renderBreakdown = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Structured breakdown</Text>
        <Text style={styles.sectionTitle}>Current optimization score versus reachable score.</Text>
        {activeBreakdown.map((item, index) => (
          <Animated.View
            key={item.key}
            style={[
              styles.breakCard,
              {
                opacity: revealAnims[index],
                transform: [
                  { translateY: revealAnims[index].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.breakTopRow}>
              <Text style={styles.breakLabel}>{item.label}</Text>
              <View style={[styles.deltaPill, { backgroundColor: `${item.color}22` }]}>
                <Text style={[styles.deltaText, { color: item.color }]}>+{item.target - item.score} available</Text>
              </View>
            </View>

            <View style={styles.scoreCompareRow}>
              <View style={styles.scoreCompareBlock}>
                <Text style={styles.scoreCompareValue}>{item.score}</Text>
                <Text style={styles.scoreCompareLabel}>Current</Text>
              </View>
              <Text style={styles.scoreArrow}>→</Text>
              <View style={styles.scoreCompareBlock}>
                <Text style={[styles.scoreCompareValue, { color: item.color }]}>{item.target}</Text>
                <Text style={styles.scoreCompareLabel}>Target</Text>
              </View>
            </View>

            <View style={styles.compareBarsWrap}>
              <View style={styles.compareLine}>
                <Text style={styles.compareBarLabel}>Now</Text>
                <View style={styles.compareTrack}>
                  <Animated.View
                    style={[
                      styles.compareFill,
                      {
                        backgroundColor: item.color,
                        width: barAnims[index].interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.compareLine}>
                <Text style={styles.compareBarLabel}>Target</Text>
                <View style={styles.compareTrackMuted}>
                  <Animated.View
                    style={[
                      styles.compareFillGhost,
                      {
                        borderColor: item.color,
                        width: targetBarAnims[index].interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
            <Text style={styles.breakReason}>{item.why}</Text>
          </Animated.View>
        ))}
        <Pressable style={styles.primaryButton} onPress={() => setScreen('simulate')}>
          <Text style={styles.primaryButtonText}>Preview Transformation</Text>
        </Pressable>
      </View>
    );
  };

  const renderSimulate = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Future simulation</Text>
        <Text style={styles.sectionTitle}>A tighter version of the same identity signal.</Text>
        <View style={styles.simCardWrap}>
          <View style={styles.simCardLeft}>
            <Text style={styles.simTag}>NOW</Text>
            <View style={styles.simFaceCard}>{imageUri ? renderPreview('small') : <Text style={styles.simFaceGlyph}>◌</Text>}<Text style={styles.simFaceScore}>{activeScan.score}</Text></View>
          </View>
          <View style={styles.simCardRight}>
            <Text style={styles.simTagAccent}>AFTER</Text>
            <View style={styles.simFaceCardAccent}>{imageUri ? renderPreview('small') : <Text style={styles.simFaceGlyph}>◌</Text>}<Text style={styles.simFaceScoreAccent}>{compareDisplay}</Text></View>
          </View>
        </View>

        <View style={styles.shareCard}>
          <Text style={styles.shareTitle}>Share card</Text>
          <Text style={styles.shareHeadline}>I went from {activeScan.score} → {potentialDisplay}</Text>
          <Text style={styles.shareCaption}>Be honest… is this a real upgrade or not yet?</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('share')}>
          <Text style={styles.primaryButtonText}>Open Share Card</Text>
        </Pressable>
      </View>
    );
  };

  const renderHistory = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Glow-up tracker</Text>
      <Text style={styles.sectionTitle}>Face optimization progress over time, not a one-off judgment.</Text>

      {!!history.length && (
        <>
        <View style={styles.retentionSummaryCard}>
          <View style={styles.retentionSummaryTop}>
            <Text style={styles.retentionTitle}>Glow-up tracker</Text>
            <Text style={styles.streakBadge}>{retentionStats.streakDays}-day streak</Text>
          </View>
          <View style={styles.retentionSummaryRow}>
            <View style={styles.retentionStatBox}>
              <Text style={styles.retentionStatValue}>{retentionStats.bestScore}</Text>
              <Text style={styles.retentionStatLabel}>Best score</Text>
            </View>
            <View style={styles.retentionStatBox}>
              <Text style={styles.retentionStatValue}>{retentionStats.scoreDelta >= 0 ? `+${retentionStats.scoreDelta}` : retentionStats.scoreDelta}</Text>
              <Text style={styles.retentionStatLabel}>Last change</Text>
            </View>
            <View style={styles.retentionStatBox}>
              <Text style={styles.retentionStatValue}>{history.length}</Text>
              <Text style={styles.retentionStatLabel}>Scans logged</Text>
            </View>
          </View>
          <Text style={styles.retentionCopy}>
            {retentionStats.scoreDelta > 0
              ? `${retentionStats.scoreDelta > 1 ? `+${retentionStats.scoreDelta} improvement detected` : '+1 improvement detected'} from your last scan.`
              : retentionStats.scoreDelta < 0
                ? `Current optimization read is ${Math.abs(retentionStats.scoreDelta)} lower than your last scan. Lighting or angle may be suppressing the optimization score.`
                : 'No score change detected on the last scan. Try angle, lighting, hair control, or skin-day timing.'}
          </Text>
        </View>

        <View style={styles.bestVersionCard}>
          <Text style={styles.retentionTitle}>Best version of you</Text>
          <Text style={styles.bestVersionScore}>{retentionStats.bestScan?.score ?? 0}</Text>
          <Text style={styles.bestVersionMeta}>{retentionStats.bestScan?.archetype ?? 'No archetype yet'} • {retentionStats.bestScan?.tier ?? 'No tier yet'}</Text>
          <Text style={styles.retentionCopy}>Peak read captured on {retentionStats.bestScan ? formatTime(retentionStats.bestScan.createdAt) : '—'}.</Text>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.retentionTitle}>Timeline graph</Text>
          <View style={styles.timelineBars}>
            {history.slice().reverse().map((item) => (
              <View key={item.id} style={styles.timelineBarWrap}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineBar, { height: `${Math.max(12, item.score)}%` }]} />
                  <View style={[styles.timelinePotentialBar, { height: `${Math.max(item.score, item.potential)}%` }]} />
                </View>
                <Text style={styles.timelineScore}>{item.score}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.timelineLegend}>Solid = current optimization score · Outline = max potential analysis</Text>
        </View>
        </>
      )}

      {loadingHistory ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#FF4FD8" />
          <Text style={styles.loadingText}>Loading saved scans…</Text>
        </View>
      ) : history.length ? (
        history.map((item, index) => (
          <Pressable
            key={item.id}
            style={[styles.historyCard, index === 0 && styles.historyCardActive]}
            onPress={() => {
              setCurrentScan(item);
              setImageUri(item.imageUri);
              setScreen('result');
            }}
          >
            <View style={styles.historyThumb}>{item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.historyThumbImage} /> : <Text style={styles.historyThumbGlyph}>◌</Text>}</View>
            <View style={styles.historyMeta}>
              <Text style={styles.historyTitle}>{item.archetype}</Text>
              <Text style={styles.historySub}>{formatTime(item.createdAt)} • {item.photoLabel}</Text>
              <Text style={styles.historyDeltaText}>
                {typeof item.deltaFromPrevious === 'number'
                  ? item.deltaFromPrevious > 0
                    ? `+${item.deltaFromPrevious} from previous`
                    : item.deltaFromPrevious < 0
                      ? `${item.deltaFromPrevious} from previous`
                      : 'No change from previous'
                  : 'First logged scan'}
              </Text>
            </View>
            <View style={styles.historyScoreWrap}>
              <Text style={styles.historyScore}>{item.score}</Text>
              <Text style={styles.historyPotential}>→ {item.potential}</Text>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No scans saved yet</Text>
          <Text style={styles.emptyCopy}>Run one real or mock scan and it will persist locally here.</Text>
        </View>
      )}
      <Pressable style={styles.primaryButton} onPress={() => setScreen('paywall')}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  );

  const renderPaywall = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Monetization layer</Text>
      <Text style={styles.sectionTitle}>The revenue spine: free hook, paid unlocks, recurring tracking, affiliate attach.</Text>
      <Animated.View
        style={[
          styles.paywallCard,
          { shadowOpacity: paywallGlow.interpolate({ inputRange: [0.25, 1], outputRange: [0.12, 0.42] }) },
        ]}
      >
        <Text style={styles.paywallTier}>PRO SCAN</Text>
        <Text style={styles.paywallPrice}>$7.99</Text>
        <Text style={styles.paywallCopy}>Unlock full breakdown, max potential score, weekly rerating loop, export cards, battle mode insights, and premium glow-up plan.</Text>
        {['Full improvement plan', 'Max potential score', 'Weekly rerating reports', 'Battle mode insights'].map((item, index) => (
          <View key={item} style={[styles.lockedRow, lockedIndex === index && styles.lockedRowActive]}>
            <Text style={styles.lockedRowText}>{item}</Text>
            <Text style={styles.lockedRowTag}>PAID</Text>
          </View>
        ))}
      </Animated.View>

      <View style={styles.pricingGrid}>
        <View style={styles.pricingCardMuted}>
          <Text style={styles.pricingTier}>FREE</Text>
          <Text style={styles.pricingHeadline}>Hook + limited analysis</Text>
          <Text style={styles.pricingCopy}>Score, limited breakdown, teaser simulation, light history.</Text>
        </View>
        <View style={styles.pricingCardAccent}>
          <Text style={styles.pricingTier}>PRO</Text>
          <Text style={styles.pricingHeadline}>Full transformation loop</Text>
          <Text style={styles.pricingCopy}>Improvement engine, retention analytics, share cards, battle mode, premium unlocks.</Text>
        </View>
        <View style={styles.pricingCardMuted}>
          <Text style={styles.pricingTier}>SUBSCRIPTION</Text>
          <Text style={styles.pricingHeadline}>Ongoing rerating</Text>
          <Text style={styles.pricingCopy}>Weekly progress reports, recurring re-analysis, and streak-based retention.</Text>
        </View>
      </View>

      <View style={styles.retentionCard}>
        <Text style={styles.retentionTitle}>Affiliate engine</Text>
        <Text style={styles.retentionCopy}>Attach monetizable products directly to the user’s improvement path.</Text>
        {affiliateItems.map((item) => (
          <View key={item.id} style={styles.affiliateRow}>
            <View style={styles.affiliateMeta}>
              <Text style={styles.affiliateCategory}>{item.category}</Text>
              <Text style={styles.affiliateName}>{item.name}</Text>
              <Text style={styles.affiliateReason}>{item.reason}</Text>
            </View>
            <Text style={styles.affiliateCta}>{item.cta}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => setScreen('plan')}>
        <Text style={styles.primaryButtonText}>See Paid Improvement Flow</Text>
      </Pressable>
    </View>
  );

  const renderPlan = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Improvement engine</Text>
        <Text style={styles.sectionTitle}>Actionable upgrades tied to your current score and ceiling.</Text>

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>Max potential score</Text>
          <Text style={styles.potentialHero}>{activeScan.potential}</Text>
          <Text style={styles.retentionCopy}>{identityTagline}</Text>
        </View>

        {improvementPlan.map((item) => (
          <View key={item.id} style={item.impact === 'high' ? styles.planCardAccent : styles.planCard}>
            <View style={styles.planTopRow}>
              <Text style={styles.planTier}>{item.category}</Text>
              <Text style={styles.planLift}>+{item.scoreLift}</Text>
            </View>
            <Text style={styles.planHeadline}>{item.title}</Text>
            <Text style={styles.planCopy}>{item.detail}</Text>
            <View style={styles.planMetaRow}>
              <View style={styles.planMetaPill}><Text style={styles.planMetaText}>Impact: {item.impact}</Text></View>
              <View style={styles.planMetaPill}><Text style={styles.planMetaText}>Difficulty: {item.difficulty}</Text></View>
              <View style={styles.planMetaPill}><Text style={styles.planMetaText}>{item.timeToResult}</Text></View>
            </View>
          </View>
        ))}

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>Uncertainty loop</Text>
          <Text style={styles.retentionCopy}>
            Lighting may affect this read. Try a cleaner angle, tighter hair control, or better skin-day conditions — that alone could add +2 to +4.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('share')}>
          <Text style={styles.primaryButtonText}>Continue to Share Card</Text>
        </Pressable>
      </View>
    );
  };

  const renderShare = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Share card system</Text>
        <Text style={styles.sectionTitle}>Export-ready optimization framing built around score, archetype, tier, and upside.</Text>

        <View style={styles.shareExportCard}>
          <Text style={styles.shareExportBrand}>FACEMAXX</Text>
          <Text style={styles.shareExportScore}>{activeScan.score}</Text>
          <Text style={styles.shareExportTier}>{activeScan.tier}</Text>
          <Text style={styles.shareExportArchetype}>{activeScan.archetype}</Text>
          <Text style={styles.shareExportTagline}>{identityTagline}</Text>
          <View style={styles.shareMetaRow}>
            <View style={styles.shareMetaPill}><Text style={styles.shareMetaText}>Potential {activeScan.potential}</Text></View>
            <View style={styles.shareMetaPill}><Text style={styles.shareMetaText}>Optimization score</Text></View>
          </View>
        </View>

        <View style={styles.optionRow}>
          {(['neutral', 'confident', 'humble', 'provocative'] as ShareTone[]).map((tone) => (
            <Pressable key={tone} style={[styles.optionChip, shareTone === tone && styles.optionChipActive]} onPress={() => setShareTone(tone)}>
              <Text style={[styles.optionText, shareTone === tone && styles.optionTextActive]}>{tone}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.shareCard}>
          <Text style={styles.shareTitle}>Caption generator</Text>
          <Text style={styles.shareHeadline}>{shareCaption}</Text>
          <Text style={styles.shareCaption}>Built for X, Instagram, and TikTok style posting.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('battle')}>
          <Text style={styles.primaryButtonText}>Open Battle Mode</Text>
        </Pressable>
      </View>
    );
  };

  const renderBattle = () => {
    if (!activeScan) return null;
    const activeOpponent = activeOpponentProfile;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Battle mode</Text>
        <Text style={styles.sectionTitle}>Real two-face compare flow with a second uploaded image and a declared winner.</Text>

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>Opponent setup</Text>
          <View style={styles.optionRow}>
            {battleProfiles.map((profile) => (
              <Pressable
                key={profile.id}
                style={[styles.optionChip, selectedBattleId === profile.id && styles.optionChipActive]}
                onPress={() => {
                  setSelectedBattleId(profile.id);
                  setBattleName(profile.name);
                  setBattleScoreInput(String(profile.score));
                  setBattleArchetype(profile.archetype);
                  setBattleScan(null);
                  setBattleImage(undefined);
                  setBattleImageUri(undefined);
                }}
              >
                <Text style={[styles.optionText, selectedBattleId === profile.id && styles.optionTextActive]}>{profile.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.battleInputLabel}>Friend name</Text>
          <TextInput value={battleName} onChangeText={setBattleName} style={styles.battleInput} placeholder="Friend name" placeholderTextColor="#6F7690" />
          <Pressable style={styles.secondaryButton} onPress={pickBattleImage}>
            <Text style={styles.secondaryButtonText}>{battleBusy ? 'Analyzing second face…' : battleImageUri ? 'Change Friend Photo' : 'Upload Friend Photo'}</Text>
          </Pressable>
          {!battleImageUri && (
            <>
              <Text style={styles.battleInputLabel}>Fallback score</Text>
              <TextInput value={battleScoreInput} onChangeText={setBattleScoreInput} style={styles.battleInput} keyboardType="numeric" placeholder="0-100" placeholderTextColor="#6F7690" />
              <Text style={styles.battleInputLabel}>Fallback archetype</Text>
              <TextInput value={battleArchetype} onChangeText={setBattleArchetype} style={styles.battleInput} placeholder="Archetype" placeholderTextColor="#6F7690" />
            </>
          )}
          <Text style={styles.battleFootnote}>{battleImageUri ? 'Second image uploaded. Opponent score is coming from a real second analysis pass.' : 'No second photo yet — manual fallback stays available.'}</Text>
        </View>

        <View style={styles.battleArena}>
          <View style={styles.battleCardSelf}>
            <Text style={styles.battleName}>You</Text>
            <Text style={styles.battleScore}>{activeScan.score}</Text>
            <Text style={styles.battleSub}>{activeScan.archetype}</Text>
            <Text style={styles.battleMeta}>{activeScan.tier}</Text>
          </View>
          <View style={styles.battleVersus}><Text style={styles.battleVersusText}>VS</Text></View>
          <View style={styles.battleCardOpponent}>
            <Text style={styles.battleName}>{activeOpponent.name}</Text>
            <Text style={styles.battleScore}>{activeOpponent.score}</Text>
            <Text style={styles.battleSub}>{activeOpponent.archetype}</Text>
            <Text style={styles.battleMeta}>{activeOpponent.tier}</Text>
          </View>
        </View>

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>
            {battleOutcome?.winner === 'you' ? 'Winner: You' : battleOutcome?.winner === 'opponent' ? `Winner: ${activeOpponent.name}` : 'Result: Draw'}
          </Text>
          <Text style={styles.retentionCopy}>{battleOutcome?.summary}</Text>
          <Text style={styles.battleFootnote}>Opponent profile: {activeOpponent.vibe}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={resetFlow}>
          <Text style={styles.primaryButtonText}>Restart Experience</Text>
        </Pressable>
      </View>
    );
  };

  const renderCurrent = () => {
    switch (screen) {
      case 'hook':
        return renderHook();
      case 'upload':
        return renderUpload();
      case 'camera':
        return renderCamera();
      case 'scan':
        return renderScan();
      case 'result':
        return renderResult();
      case 'breakdown':
        return renderBreakdown();
      case 'simulate':
        return renderSimulate();
      case 'history':
        return renderHistory();
      case 'paywall':
        return renderPaywall();
      case 'plan':
        return renderPlan();
      case 'share':
        return renderShare();
      case 'battle':
        return renderBattle();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.topNav}>
          {screens.map((item) => (
            <Pressable key={item} onPress={() => setScreen(item)} style={styles.navDotWrap}>
              <View style={[styles.navDot, screen === item && styles.navDotActive]} />
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>{renderCurrent()}</Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0B0F' },
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 96, paddingTop: 6 },
  topNav: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 10, paddingBottom: 20, flexWrap: 'wrap' },
  navDotWrap: { padding: 4 },
  navDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#2A2A34' },
  navDotActive: { width: 20, backgroundColor: '#FF4FD8' },
  heroWrap: { minHeight: 720, justifyContent: 'center', alignItems: 'center', gap: 18, paddingTop: 12, paddingBottom: 24 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#A0A5BC', fontSize: 12, fontWeight: '700', letterSpacing: 1.7 },
  liveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#14E38B' },
  heroOrb: { width: 232, height: 232, borderRadius: 999, backgroundColor: '#14151F', borderWidth: 1, borderColor: '#2D3041', shadowColor: '#7C5CFF', shadowOpacity: 0.35, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, alignItems: 'center', justifyContent: 'center' },
  heroOrbCore: { width: 156, height: 156, borderRadius: 999, backgroundColor: '#0E0F16', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#26293C' },
  heroOrbScore: { color: '#FFFFFF', fontSize: 52, fontWeight: '900' },
  heroOrbLabel: { color: '#9DA3B8', fontSize: 12, marginTop: 4 },
  heroTitle: { color: '#FFFFFF', fontSize: 42, fontWeight: '900', textAlign: 'center', lineHeight: 46, maxWidth: 320 },
  heroSub: { color: '#B7BBD0', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 315 },
  statRail: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  statChip: { width: 145, paddingVertical: 16, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#222431' },
  statNumber: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#8F95AE', fontSize: 12, marginTop: 4 },
  primaryButton: { width: '100%', marginTop: 14, paddingVertical: 18, borderRadius: 24, backgroundColor: '#7C5CFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#7C5CFF', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, minHeight: 58 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  secondaryButton: { width: '100%', marginTop: 10, paddingVertical: 16, borderRadius: 24, backgroundColor: '#151621', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#282B3D', minHeight: 54 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  screenBlock: { paddingTop: 14, gap: 18 },
  sectionKick: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '900', maxWidth: 330 },
  uploadCard: { padding: 20, borderRadius: 28, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#272A3C', gap: 14 },
  uploadTag: { color: '#14E38B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  uploadTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  uploadCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20 },
  photoPreview: { height: 270, borderRadius: 24, backgroundColor: '#0D0E15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#242637', overflow: 'hidden' },
  photoImageLarge: { width: '100%', height: '100%' },
  photoImageSmall: { width: 86, height: 110, borderRadius: 18 },
  photoFaceLarge: { color: '#FFFFFF', fontSize: 88 },
  photoFaceSmall: { color: '#FFFFFF', fontSize: 56 },
  optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', rowGap: 10 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: '#151621', borderWidth: 1, borderColor: '#2A2D3F' },
  optionChipActive: { backgroundColor: '#1A1430', borderColor: '#7C5CFF' },
  optionText: { color: '#B3B8CE', fontSize: 13, fontWeight: '700' },
  optionTextActive: { color: '#FFFFFF' },
  infoStack: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  infoCard: { flex: 1, padding: 16, borderRadius: 18, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  infoValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  infoLabel: { color: '#8F95AE', fontSize: 12, marginTop: 4 },
  cameraShell: { height: 420, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2D3F', backgroundColor: '#11121A' },
  cameraView: { flex: 1 },
  cameraFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12131A' },
  cameraFallbackText: { color: '#C8CDDF', fontSize: 16, fontWeight: '700' },
  scanCore: { alignItems: 'center', justifyContent: 'center', height: 280 },
  scanHalo: { position: 'absolute', width: 230, height: 230, borderRadius: 999, backgroundColor: '#121320', shadowColor: '#FF4FD8', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  scanFrame: { width: 170, height: 220, borderRadius: 28, borderWidth: 1, borderColor: '#303245', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1017', overflow: 'hidden' },
  scanStageCard: { padding: 18, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  scanStageLabel: { color: '#8D94AA', fontSize: 12, marginBottom: 6 },
  scanStageValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  progressTrackLg: { height: 14, borderRadius: 999, backgroundColor: '#191B24', overflow: 'hidden' },
  progressFillLg: { height: '100%', borderRadius: 999, backgroundColor: '#FF4FD8' },
  progressCaption: { color: '#9DA3B9', fontSize: 13, fontWeight: '700' },
  resultCard: { padding: 26, borderRadius: 28, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#262839', alignItems: 'center' },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#1B1731', color: '#D7C8FF', fontSize: 11, fontWeight: '800', overflow: 'hidden', letterSpacing: 1.2 },
  resultLabel: { color: '#9197AF', fontSize: 14, fontWeight: '700', marginTop: 12 },
  resultScore: { color: '#14E38B', fontSize: 88, lineHeight: 98, fontWeight: '900', marginTop: 8 },
  resultTier: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 1.4, marginTop: 6 },
  resultArchetype: { color: '#B3B8CE', fontSize: 15, marginTop: 4 },
  resultProgressWrap: { width: '100%', marginTop: 22, gap: 10 },
  progressTrackSm: { height: 10, borderRadius: 999, backgroundColor: '#1A1C24', overflow: 'hidden' },
  progressFillSm: { height: '100%', borderRadius: 999, backgroundColor: '#7C5CFF' },
  resultProgressText: { color: '#C7CCDE', fontSize: 13, fontWeight: '700' },
  dualStats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  miniStatCard: { flex: 1, padding: 18, borderRadius: 20, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  miniStatCardAccent: { flex: 1, padding: 18, borderRadius: 20, backgroundColor: '#151225', borderWidth: 1, borderColor: '#31245A' },
  miniStatTop: { color: '#9CA2B9', fontSize: 12, fontWeight: '700' },
  miniStatValue: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 6 },
  identityLine: { padding: 18, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  identityLineTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  identityLineText: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 6 },
  identityProgressText: { color: '#14E38B', fontSize: 13, fontWeight: '800', marginTop: 10 },
  progressTierTrack: { height: 10, borderRadius: 999, backgroundColor: '#1A1C24', overflow: 'hidden', marginTop: 10 },
  progressTierFill: { height: '100%', borderRadius: 999, backgroundColor: '#14E38B' },
  progressTierCaption: { color: '#98A0B8', fontSize: 12, fontWeight: '700', marginTop: 8 },
  breakCard: { padding: 18, borderRadius: 22, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#232535', gap: 14 },
  breakTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', flex: 1 },
  deltaPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginLeft: 10 },
  deltaText: { fontSize: 11, fontWeight: '800' },
  scoreCompareRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreCompareBlock: { width: 80 },
  scoreCompareValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  scoreCompareLabel: { color: '#9CA2B9', fontSize: 12, marginTop: 2 },
  scoreArrow: { color: '#7A8098', fontSize: 28, fontWeight: '700' },
  compareBarsWrap: { gap: 10 },
  compareLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compareBarLabel: { width: 46, color: '#8F95AE', fontSize: 12, fontWeight: '700' },
  compareTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: '#1A1C24', overflow: 'hidden' },
  compareTrackMuted: { flex: 1, height: 10, borderRadius: 999, backgroundColor: '#15161D', overflow: 'hidden' },
  compareFill: { height: '100%', borderRadius: 999 },
  compareFillGhost: { height: '100%', borderRadius: 999, borderWidth: 1, backgroundColor: 'transparent' },
  breakReason: { color: '#A7ACC0', fontSize: 13, lineHeight: 19 },
  simCardWrap: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  simCardLeft: { flex: 1 },
  simCardRight: { flex: 1 },
  simTag: { color: '#9DA3B8', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  simTagAccent: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  simFaceCard: { height: 220, borderRadius: 26, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#232535', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  simFaceCardAccent: { height: 220, borderRadius: 26, backgroundColor: '#171227', borderWidth: 1, borderColor: '#3B296A', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  simFaceGlyph: { color: '#FFFFFF', fontSize: 68 },
  simFaceScore: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  simFaceScoreAccent: { color: '#14E38B', fontSize: 36, fontWeight: '900' },
  shareCard: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F' },
  shareTitle: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  shareHeadline: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '900', marginTop: 10 },
  shareCaption: { color: '#B7BBD0', fontSize: 14, lineHeight: 20, marginTop: 8 },
  shareExportCard: { padding: 24, borderRadius: 28, backgroundColor: '#151225', borderWidth: 1, borderColor: '#35295C', gap: 10 },
  shareExportBrand: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  shareExportScore: { color: '#FFFFFF', fontSize: 72, fontWeight: '900' },
  shareExportTier: { color: '#14E38B', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  shareExportArchetype: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  shareExportTagline: { color: '#C8CDDF', fontSize: 14, lineHeight: 20, marginTop: 4 },
  shareMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  shareMetaPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1C1730', borderWidth: 1, borderColor: '#3B2E66' },
  shareMetaText: { color: '#F0E9FF', fontSize: 12, fontWeight: '700' },
  loadingCard: { padding: 22, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535', alignItems: 'center', gap: 10 },
  loadingText: { color: '#C8CDDF', fontSize: 14 },
  retentionSummaryCard: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', gap: 14 },
  retentionSummaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakBadge: { color: '#14E38B', fontSize: 12, fontWeight: '800', backgroundColor: '#12261C', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, overflow: 'hidden' },
  retentionSummaryRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  retentionStatBox: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: '#171922', borderWidth: 1, borderColor: '#282B3D' },
  retentionStatValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  retentionStatLabel: { color: '#98A0B8', fontSize: 12, marginTop: 4 },
  bestVersionCard: { padding: 20, borderRadius: 24, backgroundColor: '#151225', borderWidth: 1, borderColor: '#36295F', gap: 8 },
  bestVersionScore: { color: '#FFFFFF', fontSize: 52, fontWeight: '900' },
  bestVersionMeta: { color: '#D8CCFF', fontSize: 14, fontWeight: '700' },
  timelineCard: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F' },
  timelineBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 180, marginTop: 18, paddingTop: 6 },
  timelineBarWrap: { flex: 1, alignItems: 'center' },
  timelineTrack: { width: '100%', height: 140, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  timelineBar: { position: 'absolute', bottom: 0, width: '56%', borderRadius: 14, backgroundColor: '#7C5CFF' },
  timelinePotentialBar: { position: 'absolute', bottom: 0, width: '74%', borderRadius: 16, borderWidth: 1, borderColor: '#14E38B', backgroundColor: 'transparent' },
  timelineScore: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginTop: 10 },
  timelineLegend: { color: '#98A0B8', fontSize: 12, lineHeight: 18, marginTop: 14 },
  historyCard: { padding: 14, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535', flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyCardActive: { borderColor: '#7C5CFF' },
  historyThumb: { width: 56, height: 72, borderRadius: 14, backgroundColor: '#0D0E15', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  historyThumbImage: { width: '100%', height: '100%' },
  historyThumbGlyph: { color: '#FFFFFF', fontSize: 28 },
  historyMeta: { flex: 1 },
  historyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  historySub: { color: '#98A0B8', fontSize: 12, marginTop: 4 },
  historyDeltaText: { color: '#14E38B', fontSize: 12, fontWeight: '700', marginTop: 6 },
  historyScoreWrap: { alignItems: 'flex-end' },
  historyScore: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  historyPotential: { color: '#14E38B', fontSize: 12, fontWeight: '800', marginTop: 4 },
  emptyCard: { padding: 22, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 8 },
  paywallCard: { padding: 22, borderRadius: 28, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2B2743', shadowColor: '#7C5CFF', shadowRadius: 26, shadowOffset: { width: 0, height: 10 } },
  paywallTier: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  paywallPrice: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', marginTop: 8 },
  paywallCopy: { color: '#C6CBDE', fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
  lockedRow: { padding: 14, borderRadius: 16, backgroundColor: '#161821', borderWidth: 1, borderColor: '#262A39', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  lockedRowActive: { borderColor: '#7C5CFF', backgroundColor: '#1A1730' },
  lockedRowText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  lockedRowTag: { color: '#14E38B', fontSize: 11, fontWeight: '800' },
  pricingGrid: { gap: 12 },
  pricingCardMuted: { padding: 18, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#272A3C' },
  pricingCardAccent: { padding: 18, borderRadius: 22, backgroundColor: '#171227', borderWidth: 1, borderColor: '#3B296A' },
  pricingTier: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  pricingHeadline: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 8 },
  pricingCopy: { color: '#B7BBD0', fontSize: 14, lineHeight: 20, marginTop: 8 },
  affiliateRow: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#262A39', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  affiliateMeta: { flex: 1 },
  affiliateCategory: { color: '#FF4FD8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  affiliateName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 6 },
  affiliateReason: { color: '#AAB0C5', fontSize: 13, lineHeight: 18, marginTop: 6 },
  affiliateCta: { color: '#14E38B', fontSize: 12, fontWeight: '800', alignSelf: 'center' },
  planCard: { padding: 20, borderRadius: 24, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#232535', gap: 8 },
  planCardAccent: { padding: 20, borderRadius: 24, backgroundColor: '#151225', borderWidth: 1, borderColor: '#32255F', gap: 8 },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTier: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  planLift: { color: '#14E38B', fontSize: 22, fontWeight: '900' },
  planHeadline: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '900' },
  planCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20 },
  planMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 8, marginTop: 8 },
  planMetaPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1B1D28', borderWidth: 1, borderColor: '#2A2D3F' },
  planMetaText: { color: '#D3D7E8', fontSize: 12, fontWeight: '700' },
  retentionCard: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  battleArena: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 4 },
  battleCardSelf: { flex: 1, padding: 18, borderRadius: 24, backgroundColor: '#151225', borderWidth: 1, borderColor: '#32255F', alignItems: 'center' },
  battleCardOpponent: { flex: 1, padding: 18, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', alignItems: 'center' },
  battleVersus: { justifyContent: 'center', alignItems: 'center' },
  battleVersusText: { color: '#FF4FD8', fontSize: 18, fontWeight: '900' },
  battleInputLabel: { color: '#AAB0C5', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  battleInput: { borderRadius: 16, backgroundColor: '#171922', borderWidth: 1, borderColor: '#2A2D3F', color: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12 },
  battleName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  battleScore: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', marginTop: 10 },
  battleSub: { color: '#C8CDDF', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  battleMeta: { color: '#14E38B', fontSize: 12, fontWeight: '800', marginTop: 8, textTransform: 'uppercase' },
  battleFootnote: { color: '#98A0B8', fontSize: 12, marginTop: 10 },
  potentialHero: { color: '#FFFFFF', fontSize: 54, fontWeight: '900', marginTop: 8 },
  retentionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  retentionCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 8 },
});
