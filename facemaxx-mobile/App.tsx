import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import heic2any from 'heic2any';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
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
  | 'review-unlocked'
  | 'pro-welcome'
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

type Point = { x: number; y: number };
type Bounds = { x: number; y: number; width: number; height: number };

type MeasurementVector = {
  landmarks: {
    faceBounds: Bounds;
    leftEye?: Point;
    rightEye?: Point;
    noseBase?: Point;
    mouthCenter?: Point;
    leftCheek?: Point;
    rightCheek?: Point;
  };
  ratios: {
    faceWidthHeight: number;
    interocularRatio: number;
    jawWidthRatio: number;
    upperThirdRatio: number;
    midThirdRatio: number;
    lowerThirdRatio: number;
    noseCenterOffsetRatio: number;
    cheekToJawProxyRatio: number;
  };
  symmetry: {
    eyeHeightDelta: number;
    noseCenterOffset: number;
    rollImbalance: number;
    leftRightDistanceDelta: number;
  };
  quality: {
    faceCount: number;
    faceSizeRatio: number;
    blurProxy: number;
    lightingQuality: number;
    contrastQuality: number;
    occlusionRisk: number;
    poseConfidence: number;
    landmarkConfidence: number;
  };
  derivedOutputs: {
    overallScore: number | null;
    categoryScores: {
      jawline: number | null;
      eyes: number | null;
      skin: number | null;
      symmetry: number | null;
      hairFraming: number | null;
      facialHarmony: number | null;
    };
    confidence: number | null;
    rejectionReason: string | null;
    warnings: string[];
  };
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
  measurement?: MeasurementVector;
  confidence?: number;
  rejectionReason?: string | null;
  warnings?: string[];
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
  originalUri?: string;
  originalMimeType?: string;
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
type AccessTier = 'free' | 'review_unlocked' | 'pro';

type DatasetExportRecord = {
  sampleId: string;
  schemaVersion: 'v1';
  createdAt: string;
  photoLabel: string;
  imageUri?: string;
  measurement?: MeasurementVector;
  currentOutputs: {
    overallScore: number;
    potential: number;
    tier: string;
    archetype: string;
    confidence: number;
    rejectionReason: string | null;
  };
  labels: {
    overallRatingMean: number | null;
    jawlineRatingMean: number | null;
    eyesRatingMean: number | null;
    skinRatingMean: number | null;
    symmetryRatingMean: number | null;
    hairFramingRatingMean: number | null;
    facialHarmonyRatingMean: number | null;
    archetypeLabel: string | null;
    raterCount: number;
    ratingVariance: number | null;
    notes: string | null;
  };
};

const STORAGE_KEY = 'looksmaxxing.scanHistory.v1';
const DATASET_EXPORT_KEY = 'looksmaxxing.datasetExports.v1';
const PENDING_UPLOAD_KEY = 'looksmaxxing.pendingUpload.v1';
const DATASET_EXPORT_DIR = `${FileSystem.documentDirectory ?? ''}looksmaxxing-dataset`;
const BRAND_NAME = 'LooksMaxxing';
const BRAND_FACE_NAME = 'Clavicular';
const BRAND_FACE_IMAGE: ImageSourcePropType = require('./assets/clavicular-brand.png');
const BRAND_LOGO_IMAGE: ImageSourcePropType = require('./assets/looksmaxx-logo.png');
const QA_SAMPLE_IMAGE = require('./training/Confident portrait of a young man.png');
const LOCAL_BACKEND_URL = 'http://127.0.0.1:8089';
const LAN_BACKEND_URL = 'http://192.168.4.52:8089';
const screens: ScreenKey[] = ['hook', 'upload', 'camera', 'scan', 'result', 'breakdown', 'simulate', 'history', 'paywall', 'review-unlocked', 'pro-welcome', 'plan', 'share', 'battle'];

function getAnalysisBackendUrl() {
  if (Platform.OS !== 'web') return LOCAL_BACKEND_URL;
  if (typeof window === 'undefined') return LOCAL_BACKEND_URL;
  const host = window.location.hostname || '';
  if (host === 'localhost' || host === '127.0.0.1') return LOCAL_BACKEND_URL;
  return LAN_BACKEND_URL;
}

function isLikelyMobileWeb() {
  if (Platform.OS !== 'web') return false;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}
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
  const symmetryScore = scan.measurement?.symmetry?.noseCenterOffset !== undefined
    ? Math.max(0, 1 - scan.measurement.symmetry.noseCenterOffset * 6 - scan.measurement.symmetry.eyeHeightDelta * 8)
    : null;
  const structureNote = symmetryScore !== null && symmetryScore > 0.72
    ? 'Your structure is reading balanced and controlled in this shot.'
    : symmetryScore !== null
      ? 'The biggest gains here likely come from cleaner structure presentation.'
      : 'This read still looks somewhat dependent on photo quality and presentation.';
  return `You are a ${scan.archetype} with ${upside >= 12 ? 'high' : upside >= 8 ? 'real' : 'measured'} upside. Improving ${best.label.toLowerCase()} can push you toward ${scan.potential >= 82 ? 'Elite' : scan.potential >= 72 ? 'Attractive' : 'Above Average'}. ${structureNote}`;
}

function getRecoveryGuidance(scan: ScanRecord) {
  const quality = scan.measurement?.quality;
  const warnings = scan.warnings ?? [];
  const derivedReason = (() => {
    if (scan.rejectionReason) return scan.rejectionReason;
    const confidence = scan.confidence ?? 0;
    if ((quality?.faceCount ?? 0) > 1) return 'Multiple faces detected';
    if ((quality?.faceSizeRatio ?? 1) < 0.09) return 'Face too small in frame';
    if ((quality?.poseConfidence ?? 1) < 0.4) return 'Angle too strong for reliable scoring';
    if ((quality?.landmarkConfidence ?? 1) < 0.45) return 'Weak landmark coverage';
    if (warnings.some((warning) => /lighting/i.test(warning))) return 'Lighting too weak for a confident read';
    if (warnings.some((warning) => /contrast/i.test(warning))) return 'Contrast too low for a confident read';
    if (warnings.some((warning) => /blur|soft/i.test(warning))) return 'Image too soft for a confident read';
    if (confidence < 55) return 'Low scan confidence';
    return '';
  })();
  const reason = derivedReason;

  if (reason === 'No face detected') {
    return {
      title: 'We could not lock onto a clear face yet',
      body: 'The scan did not get a stable front-facing face read, so the result is being held back instead of pretending to be certain.',
      tips: [
        'Use a brighter photo with your full face centered in frame.',
        'Keep only one person in the shot and avoid heavy crops.',
        'Use a straight-on angle with eyes visible and minimal shadow.',
      ],
    };
  }

  if (reason === 'Multiple faces detected') {
    return {
      title: 'More than one face is confusing the read',
      body: `${BRAND_NAME} needs one clear subject. Mirror doubles, background people, posters, and strong reflections can all get read like a second face even when the photo seems mostly solo.`,
      tips: [
        'Use a true solo photo with no friend, poster, or TV face behind you.',
        'If this is a mirror shot, crop tighter or switch to a normal front-camera selfie.',
        'Keep your face as the biggest subject near the center of frame.',
      ],
    };
  }

  if (reason === 'Face too small in frame') {
    return {
      title: 'Your face is too far from the camera',
      body: 'The app can see a face, but it is too small to extract reliable geometry and detail.',
      tips: [
        'Move closer so your face fills more of the frame.',
        'Use less background and less zoomed-out composition.',
        'Retake with a chest-up or head-and-shoulders crop.',
      ],
    };
  }

  if (reason === 'Angle too strong for reliable scoring') {
    return {
      title: 'The angle is too aggressive for a clean read',
      body: 'Strong tilt or side angle can make facial structure look better or worse than it really is, so the scan is being conservative.',
      tips: [
        'Retake with your face pointed straight at the camera.',
        'Keep your head level and avoid high-angle or low-angle shots.',
        'Use even front lighting so both sides of the face read clearly.',
      ],
    };
  }

  if (reason === 'Landmarks too weak for confident analysis' || reason === 'Weak landmark coverage') {
    return {
      title: 'The structure read is too soft right now',
      body: `${BRAND_NAME} found a face, but landmark detail is too weak for a confident geometry pass.`,
      tips: [
        'Use a sharper photo with less motion blur.',
        'Remove sunglasses, heavy shadow, or anything covering key features.',
        `Try better lighting and contrast - current landmark confidence is ${Math.round((quality?.landmarkConfidence ?? 0) * 100)}%.`,
      ],
    };
  }

  if (reason === 'Lighting too weak for a confident read') {
    return {
      title: 'The lighting is too weak for a solid read',
      body: `${BRAND_NAME} can see your face, but low light is flattening detail and making the structure read less trustworthy.`,
      tips: [
        'Face a window or brighter front light instead of overhead or back light.',
        'Avoid strong shadow across the eyes, nose, or jaw.',
        'Retake with your face evenly lit from the front.',
      ],
    };
  }

  if (reason === 'Contrast too low for a confident read') {
    return {
      title: 'The photo is reading too flat right now',
      body: 'Low contrast makes key structure lines blend together, so the scan is staying conservative instead of overselling certainty.',
      tips: [
        'Use a photo with cleaner separation between your face and the background.',
        'Avoid foggy mirrors, washed-out lighting, or heavy filters.',
        'Retake in clearer light with stronger edge definition around the face.',
      ],
    };
  }

  if (reason === 'Image too soft for a confident read') {
    return {
      title: 'The photo is too soft for a clean read',
      body: 'Blur or softness is muting the detail the scan needs for a sharper structure pass.',
      tips: [
        'Use a steadier shot with less motion blur.',
        'Wipe the lens and avoid compressed screenshots when possible.',
        'Retake with your face fully in focus before running the scan again.',
      ],
    };
  }

  if (reason === 'Low scan confidence') {
    return {
      title: 'The scan picked up a face, but confidence stayed low',
      body: 'Enough signal came through to attempt a read, but not enough to make the result feel fully locked in.',
      tips: [
        'Use a brighter, sharper, front-facing solo photo.',
        'Keep the full face visible with a little space around forehead and chin.',
        'Avoid reflections, heavy shadow, and aggressive angles.',
      ],
    };
  }

  return {
    title: 'This scan is being treated cautiously',
    body: 'The app found enough signal to show a result, but not enough to act fully certain.',
    tips: [
      'Try a brighter, sharper front-facing photo.',
      'Keep one face only and avoid tight or awkward crops.',
      'Retake with cleaner lighting and stronger contrast.',
    ],
  };
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
    neutral: `${BRAND_NAME} gave me a ${scan.score} and called me ${scan.archetype}. Fair or nah?`,
    confident: `${scan.score} right now, ${scan.potential} ceiling. Strong base or am I chatting?`,
    humble: `Trying to improve this for real. ${BRAND_NAME} called me ${scan.archetype} with room to level up - fair?`,
    provocative: `${BRAND_NAME} gave me a ${scan.score} and said ${scan.archetype}. Honest rating - fair or inflated?`,
  };
}

function buildBattleOutcome(scan: ScanRecord, opponent: BattleProfile) {
  const delta = scan.score - opponent.score;
  const confidenceNote = scan.confidence && scan.confidence < 70 ? ' Your side is still being read a little cautiously because scan confidence is not fully locked.' : '';
  if (delta >= 3) {
    return {
      winner: 'you',
      summary: `You take this round on current presentation. Your ${scan.archetype.toLowerCase()} read edges past ${opponent.name}'s ${opponent.archetype.toLowerCase()} look.${confidenceNote}`,
    };
  }
  if (delta <= -3) {
    return {
      winner: 'opponent',
      summary: `${opponent.name} takes this round on current presentation. Their photo is reading stronger right now, but your upside is still competitive.${confidenceNote}`,
    };
  }
  return {
    winner: 'draw',
    summary: `This one is close. It likely comes down to photo quality, grooming, angles, and who is getting the cleaner read.${confidenceNote}`,
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
  const blurProxy = scan.measurement?.quality?.blurProxy ?? 60;
  const lightingQuality = scan.measurement?.quality?.lightingQuality ?? 70;
  const contrastQuality = scan.measurement?.quality?.contrastQuality ?? 60;
  const landmarkConfidence = scan.measurement?.quality?.landmarkConfidence ?? 0.7;
  const symmetryScore = scan.measurement?.symmetry?.noseCenterOffset !== undefined
    ? Math.max(0, 1 - scan.measurement.symmetry.noseCenterOffset * 6 - scan.measurement.symmetry.eyeHeightDelta * 8)
    : 0.65;
  const faceRatio = scan.measurement?.ratios?.faceWidthHeight ?? 0.75;
  const jawRatio = scan.measurement?.ratios?.jawWidthRatio ?? 0.3;

  const inferredArchetype = jawRatio > 0.4 && symmetryScore > 0.72
    ? 'Rugged Masculine'
    : faceRatio < 0.82 && symmetryScore > 0.7
      ? 'Pretty Boy'
      : symmetryScore > 0.75
        ? 'Model Type A'
        : jawRatio < 0.32
          ? 'Boy Next Door'
          : 'Chadlite';

  return [
    {
      id: 'grooming-1',
      category: 'grooming',
      title: 'Clean up the frame first',
      detail: `Tighten beard lines, trim neck bulk, and clean the brow area so ${primary.label.toLowerCase()} reads sharper instead of softer. Backend quality read: contrast ${Math.round(contrastQuality)} / landmark confidence ${Math.round(landmarkConfidence * 100)}%. Current geometry is leaning toward a ${inferredArchetype} read.`,
      impact: primary.lift >= 10 ? 'high' : 'medium',
      difficulty: 'easy',
      timeToResult: '3-7 days',
      scoreLift: Math.min(4, Math.max(2, Math.round(primary.lift / 3))),
    },
    {
      id: 'hair-1',
      category: 'hairstyle',
      title: 'Change the silhouette around the face',
      detail: `Use more intentional volume and cleaner side control. ${hair.label} is suppressing the way your upper third currently reads. Backend image read says blur ${Math.round(blurProxy)} / lighting ${Math.round(lightingQuality)}. This matters more when face ratio is sitting around ${faceRatio.toFixed(2)}.`,
      impact: hair.lift >= 10 ? 'high' : 'medium',
      difficulty: 'moderate',
      timeToResult: '1-2 weeks',
      scoreLift: Math.min(5, Math.max(2, Math.round(hair.lift / 3))),
    },
    {
      id: 'skin-1',
      category: 'skincare',
      title: 'Run a basic skin reset',
      detail: `Consistency matters more than complexity here: cleanse, moisturize, SPF, and reduce irritation so ${skin.label.toLowerCase()} stops dragging first impression. Backend preprocessing is reading brightness ${Math.round(lightingQuality)} and contrast ${Math.round(contrastQuality)}.`,
      impact: skin.lift >= 9 ? 'high' : 'medium',
      difficulty: 'easy',
      timeToResult: '2-6 weeks',
      scoreLift: Math.min(4, Math.max(2, Math.round(skin.lift / 3))),
    },
    {
      id: 'fitness-1',
      category: 'fitness/body fat',
      title: 'Lean down enough to reveal structure',
      detail: `A modest body-fat drop and better posture will make ${jaw.label.toLowerCase()} and overall facial harmony read stronger without changing identity. The backend geometry stack is already weighting structure heavily here, especially with jaw ratio ${jawRatio.toFixed(2)} and symmetry ${Math.round(symmetryScore * 100)}.`,
      impact: jaw.lift >= 10 ? 'high' : 'medium',
      difficulty: 'hard',
      timeToResult: '6-12 weeks',
      scoreLift: Math.min(6, Math.max(3, Math.round(jaw.lift / 2.5))),
    },
    {
      id: 'cosmetic-1',
      category: 'optional cosmetic',
      title: 'Only consider clinical upgrades after the basics',
      detail: `If you still plateau after grooming, skin, and leanness, get a neutral consult for dermatology, orthodontics, or hair-density support. This is most worth considering once backend confidence is consistently high across repeat scans.`,
      impact: secondary.lift >= 11 ? 'medium' : 'low',
      difficulty: 'hard',
      timeToResult: '2-6 months',
      scoreLift: Math.min(5, Math.max(1, Math.round(secondary.lift / 4))),
    },
  ];
}

async function detectFaceMetrics(image?: AnalysisImage) {
  const imageWidth = image?.width ?? 1080;
  const imageHeight = image?.height ?? 1350;
  const defaultBounds = { x: imageWidth * 0.33, y: imageHeight * 0.22, width: imageWidth * 0.34, height: imageHeight * 0.46 };
  const defaultMetrics = {
    hasFace: false,
    faceCount: 0,
    faceWidthRatio: 0.34,
    faceHeightRatio: 0.46,
    eyeDistanceRatio: 0.18,
    jawWidthRatio: 0.31,
    noseCenterOffset: 0.04,
    rollBalance: 0.01,
    landmarkDensity: 0,
    faceSizeRatio: 0.16,
    poseConfidence: 0.35,
    landmarkConfidence: 0.25,
    occlusionRisk: 0.55,
    eyeHeightDelta: 0.02,
    leftRightDistanceDelta: 0.06,
    upperThirdRatio: 0.33,
    midThirdRatio: 0.34,
    lowerThirdRatio: 0.33,
    cheekToJawProxyRatio: 1.04,
    landmarks: {
      faceBounds: defaultBounds,
      leftEye: undefined,
      rightEye: undefined,
      noseBase: undefined,
      mouthCenter: undefined,
      leftCheek: undefined,
      rightCheek: undefined,
    },
  };

  if (!image?.uri) return defaultMetrics;

  try {
    const result = await FaceDetector.detectFacesAsync(image.uri, {
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
      minDetectionInterval: 0,
      tracking: false,
    });

    const face = result.faces?.[0];
    if (!face) return { ...defaultMetrics, faceCount: result.faces?.length ?? 0 };

    const boundsRaw = face.bounds ?? { size: { width: defaultBounds.width, height: defaultBounds.height }, origin: { x: defaultBounds.x, y: defaultBounds.y } };
    const bounds: Bounds = {
      x: boundsRaw.origin.x,
      y: boundsRaw.origin.y,
      width: boundsRaw.size.width,
      height: boundsRaw.size.height,
    };
    const leftEye = face.leftEyePosition ? { x: face.leftEyePosition.x, y: face.leftEyePosition.y } : undefined;
    const rightEye = face.rightEyePosition ? { x: face.rightEyePosition.x, y: face.rightEyePosition.y } : undefined;
    const nose = face.noseBasePosition ? { x: face.noseBasePosition.x, y: face.noseBasePosition.y } : undefined;
    const mouth = face.bottomMouthPosition ? { x: face.bottomMouthPosition.x, y: face.bottomMouthPosition.y } : undefined;
    const leftCheek = face.leftCheekPosition ? { x: face.leftCheekPosition.x, y: face.leftCheekPosition.y } : undefined;
    const rightCheek = face.rightCheekPosition ? { x: face.rightCheekPosition.x, y: face.rightCheekPosition.y } : undefined;

    const faceWidthRatio = bounds.width / Math.max(1, imageWidth);
    const faceHeightRatio = bounds.height / Math.max(1, imageHeight);
    const faceSizeRatio = (bounds.width * bounds.height) / Math.max(1, imageWidth * imageHeight);
    const eyeDistanceRatio = leftEye && rightEye ? Math.abs(rightEye.x - leftEye.x) / Math.max(1, imageWidth) : faceWidthRatio * 0.45;
    const jawWidthRatio = leftCheek && rightCheek ? Math.abs(rightCheek.x - leftCheek.x) / Math.max(1, imageWidth) : faceWidthRatio * 0.82;
    const faceCenterX = bounds.x + bounds.width / 2;
    const faceTopY = bounds.y;
    const faceBottomY = bounds.y + bounds.height;
    const eyeMidY = leftEye && rightEye ? (leftEye.y + rightEye.y) / 2 : faceTopY + bounds.height * 0.28;
    const noseY = nose?.y ?? faceTopY + bounds.height * 0.53;
    const mouthY = mouth?.y ?? faceTopY + bounds.height * 0.77;
    const upperThirdRatio = clamp((eyeMidY - faceTopY) / Math.max(1, bounds.height), 0.15, 0.5);
    const midThirdRatio = clamp((noseY - eyeMidY) / Math.max(1, bounds.height), 0.15, 0.5);
    const lowerThirdRatio = clamp((faceBottomY - noseY) / Math.max(1, bounds.height), 0.15, 0.55);
    const noseCenterOffset = nose ? Math.abs(nose.x - faceCenterX) / Math.max(1, bounds.width) : 0.04;
    const rollBalance = leftEye && rightEye ? Math.abs(leftEye.y - rightEye.y) / Math.max(1, imageHeight) : 0.01;
    const eyeHeightDelta = leftEye && rightEye ? Math.abs(leftEye.y - rightEye.y) / Math.max(1, bounds.height) : 0.02;
    const leftDistance = leftEye && nose ? Math.abs(nose.x - leftEye.x) : bounds.width * 0.2;
    const rightDistance = rightEye && nose ? Math.abs(rightEye.x - nose.x) : bounds.width * 0.2;
    const leftRightDistanceDelta = Math.abs(leftDistance - rightDistance) / Math.max(1, bounds.width);
    const landmarkDensity = [leftEye, rightEye, nose, mouth, leftCheek, rightCheek].filter(Boolean).length / 6;
    const cheekToJawProxyRatio = jawWidthRatio > 0 ? clamp((faceWidthRatio * 0.92) / jawWidthRatio, 0.7, 1.3) : 1.04;
    const poseConfidence = clamp(1 - noseCenterOffset * 2.2 - rollBalance * 7, 0, 1);
    const landmarkConfidence = clamp(landmarkDensity * 0.75 + poseConfidence * 0.25, 0, 1);
    const occlusionRisk = clamp(1 - landmarkDensity + Math.max(0, 0.18 - faceSizeRatio) * 2.5, 0, 1);

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
      faceSizeRatio,
      poseConfidence,
      landmarkConfidence,
      occlusionRisk,
      eyeHeightDelta,
      leftRightDistanceDelta,
      upperThirdRatio,
      midThirdRatio,
      lowerThirdRatio,
      cheekToJawProxyRatio,
      landmarks: {
        faceBounds: bounds,
        leftEye,
        rightEye,
        noseBase: nose,
        mouthCenter: mouth,
        leftCheek,
        rightCheek,
      },
    };
  } catch {
    return defaultMetrics;
  }
}

function isReliableScan(scan: ScanRecord) {
  return !scan.rejectionReason && (scan.confidence ?? 0) >= 55;
}

function buildRetentionStats(history: ScanRecord[]) {
  const ordered = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const reliable = ordered.filter(isReliableScan);
  const baseline = reliable.length ? reliable : ordered;
  const bestScore = baseline.reduce((max, item) => Math.max(max, item.score), 0);
  const bestScan = baseline.reduce<ScanRecord | null>((best, item) => (!best || item.score >= best.score ? item : best), null);
  const latest = ordered[ordered.length - 1] ?? null;
  const latestReliable = reliable[reliable.length - 1] ?? null;
  const previousReliable = reliable[reliable.length - 2] ?? null;
  const scoreDelta = latestReliable && previousReliable ? latestReliable.score - previousReliable.score : 0;
  const provisionalCount = ordered.length - reliable.length;

  let streakDays = reliable.length ? 1 : ordered.length ? 1 : 0;
  const streakSource = reliable.length ? reliable : ordered;
  for (let i = streakSource.length - 1; i > 0; i -= 1) {
    const diff = getDayDiff(streakSource[i].createdAt, streakSource[i - 1].createdAt);
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
    latestReliable,
    previousReliable,
    scoreDelta,
    streakDays,
    provisionalCount,
    usingReliableBaseline: reliable.length >= 2,
  };
}

async function processWebImageForUpload(uri: string, filename: string, mimeType?: string) {
  const response = await fetch(uri);
  const sourceBlob = await response.blob();
  let workingBlob: Blob = sourceBlob;
  const sourceType = sourceBlob.type || mimeType || 'image/jpeg';

  if (sourceType === 'image/heic' || sourceType === 'image/heif' || /\.hei(c|f)$/i.test(filename)) {
    const converted = await heic2any({ blob: sourceBlob, toType: 'image/jpeg', quality: 0.9 });
    workingBlob = Array.isArray(converted) ? converted[0] : converted;
  }

  const bitmap = await createImageBitmap(workingBlob);
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const scale = longestSide > 1600 ? 1600 / longestSide : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create canvas context for web image conversion');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Web image conversion produced no blob'));
    }, 'image/jpeg', 0.82);
  });

  const outputName = filename.replace(/\.[a-z0-9]+$/i, '.jpg');
  const outputFile = new File([outputBlob], outputName, { type: 'image/jpeg' });
  const previewUrl = URL.createObjectURL(outputBlob);

  return {
    file: outputFile,
    previewUrl,
    width,
    height,
    mimeType: 'image/jpeg',
    fileSize: outputBlob.size,
    originalMimeType: sourceType,
  };
}

async function buildScanFromBackend(image: AnalysisImage | undefined, photoLabel: string): Promise<ScanRecord | null> {
  if (!image?.uri) return null;

  try {
    const form = new FormData();
    const mimeType = image.mimeType ?? 'image/jpeg';
    const filename = image.uri.split('/').pop() || 'scan-image.jpg';

    if (Platform.OS === 'web') {
      const upload = await processWebImageForUpload(image.originalUri ?? image.uri, filename, image.originalMimeType ?? mimeType);
      console.log('LooksMaxxing web upload debug', {
        backendUrl: getAnalysisBackendUrl(),
        originalMimeType: image.originalMimeType ?? mimeType,
        originalFilename: filename,
        uploadName: upload.file.name,
        uploadType: upload.file.type,
        uploadSize: upload.file.size,
        outputWidth: upload.width,
        outputHeight: upload.height,
      });
      form.append('image', upload.file);
    } else {
      form.append('image', {
        uri: image.uri,
        name: filename,
        type: mimeType,
      } as any);
    }

    const backendUrl = getAnalysisBackendUrl();
    const response = await fetch(`${backendUrl}/analyze`, {
      method: 'POST',
      body: form,
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn('LooksMaxxing backend analyze failed', response.status, errorText);
      return null;
    }

    const payload = await response.json();
    const looksmaxxing = payload?.looksmaxxing ?? {};
    const quality = payload?.quality ?? {};
    const detection = payload?.detection ?? {};
    const landmarks = payload?.landmarks ?? {};

    const brightness = Number(quality?.brightness ?? 0);
    const contrast = Number(quality?.contrast ?? 0);
    const blurScore = Number(quality?.blurScore ?? 0);
    const rawFaceCount = Number(detection?.faceCount ?? 0);
    const faceCount = Number(detection?.significantFaceCount ?? rawFaceCount ?? 0);
    const bbox = detection?.primaryFace?.bbox ?? [0, 0, 0, 0];
    const imageWidth = Number(quality?.width ?? 1);
    const imageHeight = Number(quality?.height ?? 1);
    const faceWidth = Math.max(0, Number(bbox?.[2] ?? 0) - Number(bbox?.[0] ?? 0));
    const faceHeight = Math.max(0, Number(bbox?.[3] ?? 0) - Number(bbox?.[1] ?? 0));
    const faceSizeRatio = (faceWidth * faceHeight) / Math.max(1, imageWidth * imageHeight);
    const landmarkCount = Number(landmarks?.landmarkCount ?? 0);
    const landmarkConfidence = landmarkCount > 0 ? clamp(landmarkCount / 478, 0, 1) : 0;
    const poseConfidence = detection?.primaryFace ? 1 : 0;
    const occlusionRisk = landmarkCount > 0 ? clamp(1 - landmarkConfidence, 0, 1) : 1;
    const warnings = Array.isArray(looksmaxxing?.warnings) ? looksmaxxing.warnings : [];

    const breakdownSource = looksmaxxing.breakdown ?? {};
    const score = clamp(Number(looksmaxxing.score ?? 0), 0, 100);
    const confidence = clamp(Number(looksmaxxing.confidence ?? 0), 0, 100);

    const backendMeasurements = looksmaxxing?.measurements ?? {};
    const qualityRead = brightness < 70 ? 'lighting is suppressing detail' : contrast < 30 ? 'contrast is muting structure' : blurScore < 40 ? 'image softness is limiting sharpness' : 'input quality is strong enough for a cleaner read';
    const geometryRead = landmarkCount > 0 ? `${landmarkCount} landmarks were mapped through the backend stack.` : 'landmark coverage is weak, so structure read is less reliable.';
    const detectionRead = faceCount > 1
      ? 'More than one meaningful face region was detected. Reflections, background people, posters, or duplicate mirror reads can trip this.'
      : faceCount === 1
        ? 'A single aligned face was detected cleanly.'
        : rawFaceCount > 1
          ? 'Extra tiny face-like regions were ignored because they looked too small or too weak to count as a real second subject.'
          : 'No stable face alignment was found.';

    const breakdown: BreakdownItem[] = [
      {
        key: 'jawline',
        label: 'Jawline',
        score: clamp(Number(breakdownSource.jawline ?? 0), 0, 100),
        target: clamp(Number(breakdownSource.jawline ?? 0) + 8, 0, 100),
        why: `${geometryRead} Lower-face structure is now coming from backend face geometry instead of app-only heuristics.`,
        color: '#7C5CFF',
      },
      {
        key: 'eyes',
        label: 'Eye area',
        score: clamp(Number(breakdownSource.eyes ?? 0), 0, 100),
        target: clamp(Number(breakdownSource.eyes ?? 0) + 7, 0, 100),
        why: `${detectionRead} Eye-area scoring is being grounded in aligned face analysis.`,
        color: '#FF4FD8',
      },
      {
        key: 'skin',
        label: 'Skin quality',
        score: clamp(Number(breakdownSource.skin ?? 0), 0, 100),
        target: clamp(Number(breakdownSource.skin ?? 0) + 7, 0, 100),
        why: `OpenCV preprocessing says ${qualityRead}, and that now feeds the visible skin read.`,
        color: '#14E38B',
      },
      {
        key: 'symmetry',
        label: 'Symmetry',
        score: clamp(Number(breakdownSource.symmetry ?? 0), 0, 100),
        target: clamp(Number(breakdownSource.symmetry ?? 0) + 6, 0, 100),
        why: landmarkCount > 0 ? 'Symmetry now benefits from backend landmark alignment and face normalization.' : 'Symmetry read is limited because landmark coverage was weak.',
        color: '#4DA3FF',
      },
      {
        key: 'hair',
        label: 'Hair / framing',
        score: clamp(Number(breakdownSource.hairFraming ?? 0), 0, 100),
        target: clamp(Number(breakdownSource.hairFraming ?? 0) + 7, 0, 100),
        why: `Face framing is being read through backend crop quality and face-box positioning.`,
        color: '#FF8A3D',
      },
      {
        key: 'thirds',
        label: 'Facial harmony',
        score: clamp(Number(breakdownSource.facialHarmony ?? 0), 0, 100),
        target: clamp(Number(breakdownSource.facialHarmony ?? 0) + 6, 0, 100),
        why: landmarkCount > 0 ? 'Harmony is now tied to backend geometry rather than front-end-only proxy scoring.' : 'Harmony remains less certain until stronger landmark coverage is available.',
        color: '#FFD24D',
      },
    ];

    const potential = Math.round(clamp(breakdown.reduce((sum, item) => sum + item.target, 0) / breakdown.length + 1, score + 4, 95));
    const measurement: MeasurementVector = {
      landmarks: {
        faceBounds: {
          x: Number(bbox?.[0] ?? 0),
          y: Number(bbox?.[1] ?? 0),
          width: faceWidth,
          height: faceHeight,
        },
      },
      ratios: {
        faceWidthHeight: Number(backendMeasurements?.facialWidthHeightRatio ?? (faceHeight > 0 ? Number((faceWidth / faceHeight).toFixed(4)) : 0)),
        interocularRatio: Number(backendMeasurements?.interocularRatio ?? 0),
        jawWidthRatio: Number(backendMeasurements?.jawWidthRatio ?? 0),
        upperThirdRatio: Number(backendMeasurements?.upperThirdRatio ?? 0),
        midThirdRatio: Number(backendMeasurements?.midThirdRatio ?? 0),
        lowerThirdRatio: Number(backendMeasurements?.lowerThirdRatio ?? 0),
        noseCenterOffsetRatio: Number(backendMeasurements?.noseCenterOffsetRatio ?? 0),
        cheekToJawProxyRatio: Number(backendMeasurements?.jawWidthRatio ?? 0),
      },
      symmetry: {
        eyeHeightDelta: Number(backendMeasurements?.eyeHeightDelta ?? 0),
        noseCenterOffset: Number(backendMeasurements?.noseCenterOffsetRatio ?? 0),
        rollImbalance: 0,
        leftRightDistanceDelta: 0,
      },
      quality: {
        faceCount,
        faceSizeRatio: Number(faceSizeRatio.toFixed(4)),
        blurProxy: Number(blurScore.toFixed(2)),
        lightingQuality: Number(brightness.toFixed(2)),
        contrastQuality: Number(contrast.toFixed(2)),
        occlusionRisk: Number(occlusionRisk.toFixed(4)),
        poseConfidence: Number(poseConfidence.toFixed(4)),
        landmarkConfidence: Number(landmarkConfidence.toFixed(4)),
      },
      derivedOutputs: {
        overallScore: score,
        categoryScores: {
          jawline: clamp(Number(breakdownSource.jawline ?? 0), 0, 100),
          eyes: clamp(Number(breakdownSource.eyes ?? 0), 0, 100),
          skin: clamp(Number(breakdownSource.skin ?? 0), 0, 100),
          symmetry: clamp(Number(breakdownSource.symmetry ?? 0), 0, 100),
          hairFraming: clamp(Number(breakdownSource.hairFraming ?? 0), 0, 100),
          facialHarmony: clamp(Number(breakdownSource.facialHarmony ?? 0), 0, 100),
        },
        confidence,
        rejectionReason: looksmaxxing.rejectionReason ?? null,
        warnings,
      },
    };

    return {
      id: `${Date.now()}-backend`,
      createdAt: new Date().toISOString(),
      photoLabel,
      imageUri: image.uri,
      score,
      potential,
      tier: looksmaxxing.tier ?? 'Above Average',
      rank: `${looksmaxxing.tier ?? 'Above Average'} Signal`,
      archetype: looksmaxxing.archetype ?? 'Model Type A',
      breakdown,
      measurement,
      confidence,
      rejectionReason: looksmaxxing.rejectionReason ?? null,
      warnings,
    };
  } catch {
    return null;
  }
}

async function buildScanFromImage(image: AnalysisImage | undefined, photoLabel: string): Promise<ScanRecord> {
  const signal = await readImageSignal(image);
  const face = await detectFaceMetrics(image);
  const signalSeed = `${photoLabel}-${signal.width}-${signal.height}-${signal.fileSize}-${Math.round(signal.mean)}-${Math.round(signal.variance)}-${signal.transitions}-${Math.round(face.faceWidthRatio * 1000)}-${Math.round(face.eyeDistanceRatio * 1000)}-${Math.round(face.jawWidthRatio * 1000)}`;
  const hash = hashString(signalSeed);

  const lightingQuality = clamp(52 + (signal.mean - 96) / 2.3, 40, 92);
  const contrastQuality = clamp(48 + signal.variance * 0.72, 40, 92);
  const blurProxy = clamp(signal.variance * 1.6 + Math.min(signal.transitions, 180) * 0.12, 0, 100);
  const framingQuality = clamp(58 + (0.82 - Math.abs(signal.aspect - 0.82)) * 36 + face.landmarkDensity * 8, 42, 92);
  const textureSignal = clamp(46 + Math.min(signal.transitions, 180) / 4.2, 40, 88);
  const fileSignal = clamp(45 + Math.min(signal.fileSize / 18000, 22), 40, 88);
  const symmetrySignal = clamp(74 - face.noseCenterOffset * 160 - face.rollBalance * 420 + face.landmarkDensity * 10, 40, 92);
  const harmonySignal = clamp(66 - Math.abs(face.faceWidthRatio - 0.34) * 180 - Math.abs(face.faceHeightRatio - 0.46) * 120 + face.landmarkDensity * 12, 40, 92);
  const jawSignal = clamp(58 + face.jawWidthRatio * 70 + contrastQuality * 0.12, 40, 92);
  const eyeSignal = clamp(54 + face.eyeDistanceRatio * 120 + lightingQuality * 0.15, 40, 92);

  const warnings: string[] = [];
  let rejectionReason: string | null = null;
  if (!face.hasFace) rejectionReason = 'No face detected';
  else if (face.faceCount > 1) rejectionReason = 'Multiple faces detected';
  else if (face.faceSizeRatio < 0.09) rejectionReason = 'Face too small in frame';
  else if (face.poseConfidence < 0.28) rejectionReason = 'Angle too strong for reliable scoring';
  else if (face.landmarkConfidence < 0.32) rejectionReason = 'Landmarks too weak for confident analysis';

  if (lightingQuality < 52) warnings.push('Lighting may be suppressing skin and symmetry analysis.');
  if (contrastQuality < 52) warnings.push('Low contrast may be softening facial structure read.');
  if (blurProxy < 38) warnings.push('Image sharpness looks low; detail read may be weaker.');
  if (face.occlusionRisk > 0.5) warnings.push('Possible occlusion or incomplete landmark coverage detected.');
  if (face.poseConfidence < 0.45) warnings.push('Angle is reducing confidence in structural scoring.');

  const confidence = clamp(
    Math.round(
      (lightingQuality * 0.16) +
      (contrastQuality * 0.14) +
      (blurProxy * 0.12) +
      (face.poseConfidence * 100 * 0.18) +
      (face.landmarkConfidence * 100 * 0.24) +
      ((1 - face.occlusionRisk) * 100 * 0.16)
    ),
    0,
    100,
  );

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

  const confidencePenalty = rejectionReason ? 10 : confidence < 55 ? Math.round((55 - confidence) / 3) : 0;
  const score = clamp(Math.round(breakdown.reduce((sum, item) => sum + item.score, 0) / breakdown.length) - confidencePenalty, 0, 100);
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

  const measurement: MeasurementVector = {
    landmarks: face.landmarks,
    ratios: {
      faceWidthHeight: Number((face.faceWidthRatio / Math.max(face.faceHeightRatio, 0.0001)).toFixed(4)),
      interocularRatio: Number(face.eyeDistanceRatio.toFixed(4)),
      jawWidthRatio: Number(face.jawWidthRatio.toFixed(4)),
      upperThirdRatio: Number(face.upperThirdRatio.toFixed(4)),
      midThirdRatio: Number(face.midThirdRatio.toFixed(4)),
      lowerThirdRatio: Number(face.lowerThirdRatio.toFixed(4)),
      noseCenterOffsetRatio: Number(face.noseCenterOffset.toFixed(4)),
      cheekToJawProxyRatio: Number(face.cheekToJawProxyRatio.toFixed(4)),
    },
    symmetry: {
      eyeHeightDelta: Number(face.eyeHeightDelta.toFixed(4)),
      noseCenterOffset: Number(face.noseCenterOffset.toFixed(4)),
      rollImbalance: Number(face.rollBalance.toFixed(4)),
      leftRightDistanceDelta: Number(face.leftRightDistanceDelta.toFixed(4)),
    },
    quality: {
      faceCount: face.faceCount,
      faceSizeRatio: Number(face.faceSizeRatio.toFixed(4)),
      blurProxy: Number(blurProxy.toFixed(2)),
      lightingQuality: Number(lightingQuality.toFixed(2)),
      contrastQuality: Number(contrastQuality.toFixed(2)),
      occlusionRisk: Number(face.occlusionRisk.toFixed(4)),
      poseConfidence: Number(face.poseConfidence.toFixed(4)),
      landmarkConfidence: Number(face.landmarkConfidence.toFixed(4)),
    },
    derivedOutputs: {
      overallScore: score,
      categoryScores: {
        jawline: breakdown.find((item) => item.key === 'jawline')?.score ?? null,
        eyes: breakdown.find((item) => item.key === 'eyes')?.score ?? null,
        skin: breakdown.find((item) => item.key === 'skin')?.score ?? null,
        symmetry: breakdown.find((item) => item.key === 'symmetry')?.score ?? null,
        hairFraming: breakdown.find((item) => item.key === 'hair')?.score ?? null,
        facialHarmony: breakdown.find((item) => item.key === 'thirds')?.score ?? null,
      },
      confidence,
      rejectionReason,
      warnings,
    },
  };

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
    measurement,
    confidence,
    rejectionReason,
    warnings,
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
  const [accessTier, setAccessTier] = useState<AccessTier>('free');
  const [unlockedReviewId, setUnlockedReviewId] = useState<string | null>(null);
  const [exportCount, setExportCount] = useState(0);
  const [lastExportPath, setLastExportPath] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<ComponentRef<typeof CameraView> | null>(null);
  const webCameraInputRef = useRef<HTMLInputElement | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const pulse = useRef(new Animated.Value(0.96)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const compareAnim = useRef(new Animated.Value(0)).current;
  const potentialAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(6)).current;
  const paywallGlow = useRef(new Animated.Value(0.25)).current;
  const barAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const targetBarAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const revealAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && webCameraInputRef.current) {
        webCameraInputRef.current.remove();
        webCameraInputRef.current = null;
      }
    };
  }, []);

  const mobileWeb = isLikelyMobileWeb();
  const cameraButtonLabel = Platform.OS === 'web'
    ? (mobileWeb ? 'Take Photo' : 'Take Photo with Camera')
    : 'Take Photo in App';
  const uploadHelperCopy = imageUri
    ? 'Use a clear photo with one face in frame for the strongest read.'
    : Platform.OS === 'web'
      ? (mobileWeb
          ? 'Take a straight-on photo or choose one from your phone, then run the scan.'
          : 'Use the best solo photo you have, or capture one from your computer if available. Clean framing and one clear face will give the strongest read.')
      : 'Start with a clear front-facing photo so the first read feels intentional, not noisy.';

  const activeScan = currentScan ?? history[0] ?? null;
  const activeBreakdown = activeScan?.breakdown ?? [];
  const canViewPremiumForCurrentScan = !!activeScan && (accessTier === 'pro' || (accessTier === 'review_unlocked' && unlockedReviewId === activeScan.id));
  const canViewProFeatures = accessTier === 'pro';
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
  const inferredArchetype = useMemo(() => {
    if (activeScan?.archetype) return activeScan.archetype;
    if (!activeScan?.measurement) return 'Model Type A';
    const jawRatio = activeScan.measurement.ratios.jawWidthRatio;
    const faceRatio = activeScan.measurement.ratios.faceWidthHeight;
    const symmetryScore = Math.max(0, 1 - activeScan.measurement.symmetry.noseCenterOffset * 6 - activeScan.measurement.symmetry.eyeHeightDelta * 8);
    if (jawRatio > 0.4 && symmetryScore > 0.72) return 'Rugged Masculine';
    if (faceRatio < 0.82 && symmetryScore > 0.7) return 'Pretty Boy';
    if (symmetryScore > 0.75) return 'Model Type A';
    if (jawRatio < 0.32) return 'Boy Next Door';
    return 'Chadlite';
  }, [activeScan]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    });
  }, [screen]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [rawHistory, rawExports, rawPendingUpload] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(DATASET_EXPORT_KEY),
          AsyncStorage.getItem(PENDING_UPLOAD_KEY),
        ]);
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory) as ScanRecord[];
          setHistory(parsed);
          if (parsed[0]) setCurrentScan(parsed[0]);
        }
        if (rawExports) {
          const parsedExports = JSON.parse(rawExports) as DatasetExportRecord[];
          setExportCount(parsedExports.length);
          if (parsedExports[0]?.sampleId) {
            setLastExportPath(`${DATASET_EXPORT_DIR}/${parsedExports[0].sampleId}.json`);
          }
        }
        if (rawPendingUpload) {
          const parsedPendingUpload = JSON.parse(rawPendingUpload) as AnalysisImage;
          if (parsedPendingUpload?.uri) {
            setSelectedImage(parsedPendingUpload);
            setImageUri(parsedPendingUpload.uri);
            setScreen('upload');
          }
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
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qaMode = params.get('qa');
    if (!qaMode) return;

    const runQaRoute = async () => {
      const qaImage = buildQaSampleImage();
      if (!qaImage?.uri) return;
      setImageUri(qaImage.uri);
      setSelectedImage(qaImage);
      setSelectedPhoto('Front selfie');
      setScreen('upload');

      if (qaMode === 'sample-scan') {
        await runScanFlow(qaImage, 'Front selfie');
      } else if (qaMode === 'sample-result') {
        await runScanFlow(qaImage, 'Front selfie');
        setScreen('result');
      } else if (qaMode === 'sample-paywall') {
        await runScanFlow(qaImage, 'Front selfie');
        setScreen('paywall');
      } else if (qaMode === 'sample-success') {
        const successScan = await makeQaSuccessfulScan(qaImage, 'Front selfie');
        await finalizeScanFlow(successScan);
      } else if (qaMode === 'sample-success-result') {
        const successScan = await makeQaSuccessfulScan(qaImage, 'Front selfie');
        await finalizeScanFlow(successScan);
        setScreen('result');
      } else if (qaMode === 'sample-success-paywall') {
        const successScan = await makeQaSuccessfulScan(qaImage, 'Front selfie');
        await finalizeScanFlow(successScan);
        setScreen('paywall');
      }
    };

    runQaRoute();
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

  const persistPendingUpload = async (image: AnalysisImage | undefined) => {
    try {
      if (!image) {
        await AsyncStorage.removeItem(PENDING_UPLOAD_KEY);
        return;
      }
      await AsyncStorage.setItem(PENDING_UPLOAD_KEY, JSON.stringify(image));
    } catch {
      // local convenience only
    }
  };

  const buildDatasetExport = (scan: ScanRecord): DatasetExportRecord => ({
    sampleId: scan.id,
    schemaVersion: 'v1',
    createdAt: scan.createdAt,
    photoLabel: scan.photoLabel,
    imageUri: scan.imageUri,
    measurement: scan.measurement,
    currentOutputs: {
      overallScore: scan.score,
      potential: scan.potential,
      tier: scan.tier,
      archetype: scan.archetype,
      confidence: scan.confidence ?? 0,
      rejectionReason: scan.rejectionReason ?? null,
    },
    labels: {
      overallRatingMean: null,
      jawlineRatingMean: null,
      eyesRatingMean: null,
      skinRatingMean: null,
      symmetryRatingMean: null,
      hairFramingRatingMean: null,
      facialHarmonyRatingMean: null,
      archetypeLabel: null,
      raterCount: 0,
      ratingVariance: null,
      notes: null,
    },
  });

  const appendDatasetExport = async (scan: ScanRecord) => {
    try {
      const raw = await AsyncStorage.getItem(DATASET_EXPORT_KEY);
      const parsed = raw ? (JSON.parse(raw) as DatasetExportRecord[]) : [];
      const nextRecord = buildDatasetExport(scan);
      const next = [nextRecord, ...parsed].slice(0, 250);
      await AsyncStorage.setItem(DATASET_EXPORT_KEY, JSON.stringify(next));
      setExportCount(next.length);
      return nextRecord;
    } catch {
      // local convenience only
      return null;
    }
  };

  const ensureDatasetExportDir = async () => {
    if (!DATASET_EXPORT_DIR) return null;
    try {
      const info = await FileSystem.getInfoAsync(DATASET_EXPORT_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(DATASET_EXPORT_DIR, { intermediates: true });
      }
      return DATASET_EXPORT_DIR;
    } catch {
      return null;
    }
  };

  const writeDatasetSampleFile = async (record: DatasetExportRecord) => {
    const dir = await ensureDatasetExportDir();
    if (!dir) return null;
    const path = `${dir}/${record.sampleId}.json`;
    try {
      await FileSystem.writeAsStringAsync(path, JSON.stringify(record, null, 2));
      setLastExportPath(path);
      return path;
    } catch {
      return null;
    }
  };

  const unlockCurrentReview = () => {
    if (!activeScan) return;
    setAccessTier('review_unlocked');
    setUnlockedReviewId(activeScan.id);
    setScreen('review-unlocked');
  };

  const startProAccess = () => {
    setAccessTier('pro');
    setUnlockedReviewId(null);
    setScreen('pro-welcome');
  };

  const continueWithFreePreview = () => {
    setScreen('result');
  };

  const openPremiumGate = () => {
    setScreen('paywall');
  };

  const handleNativeShare = async () => {
    if (!activeScan) return;
    const message = `${shareCaption}\n\n${BRAND_NAME} gave me a ${activeScan.score} as ${activeScan.archetype} (${activeScan.tier}). Ceiling: ${activeScan.potential}.`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard?: { writeText?: (text: string) => Promise<void> } };
        if (typeof nav.share === 'function') {
          await nav.share({
            title: `${BRAND_NAME} score: ${activeScan.score}`,
            text: message,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          });
          return;
        }
        if (nav.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          Alert.alert('Copied to clipboard', 'Your score and caption were copied. You can now paste them into text, email, or any social app.');
          return;
        }
      }

      await Share.share({
        message,
        title: `${BRAND_NAME} score: ${activeScan.score}`,
      });
    } catch {
      Alert.alert('Share unavailable', 'The share sheet could not open right now. Try again in a moment.');
    }
  };

  const triggerWebCameraCapture = async () => {
    if (Platform.OS !== 'web') return false;
    try {
      if (!webCameraInputRef.current) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'user';
        input.style.position = 'fixed';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        input.style.width = '1px';
        input.style.height = '1px';
        input.onchange = async () => {
          const file = input.files?.[0];
          input.value = '';
          if (!file) return;
          try {
            setBusyPicking(true);
            const objectUrl = URL.createObjectURL(file);
            const processed = await processWebImageForUpload(objectUrl, file.name || 'camera-capture.jpg', file.type || 'image/jpeg');
            URL.revokeObjectURL(objectUrl);
            const nextImage: AnalysisImage = {
              uri: processed.previewUrl,
              width: processed.width,
              height: processed.height,
              fileSize: processed.fileSize,
              mimeType: processed.mimeType,
              originalUri: processed.previewUrl,
              originalMimeType: file.type || processed.mimeType,
            };
            setImageUri(nextImage.uri);
            setSelectedImage(nextImage);
            setSelectedPhoto('Front selfie');
          } catch {
            Alert.alert('Camera capture failed', `The browser camera flow did not return a usable image. Try again or use your library photo.`);
          } finally {
            setBusyPicking(false);
          }
        };
        document.body.appendChild(input);
        webCameraInputRef.current = input;
      }
      webCameraInputRef.current.click();
      return true;
    } catch {
      return false;
    }
  };

  const pickImage = async () => {
    try {
      setBusyPicking(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', `Allow photo access so ${BRAND_NAME} can load an image.`);
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
        let nextImage: AnalysisImage = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
          originalUri: asset.uri,
          originalMimeType: asset.mimeType,
        };

        if (Platform.OS === 'web') {
          const processedFilename = asset.fileName ?? (asset.uri.split('/').pop() || 'scan-image.jpg');
          const processed = await processWebImageForUpload(asset.uri, processedFilename, asset.mimeType);
          nextImage = {
            uri: processed.previewUrl,
            width: processed.width,
            height: processed.height,
            fileSize: processed.fileSize,
            mimeType: processed.mimeType,
            originalUri: asset.uri,
            originalMimeType: asset.mimeType,
          };
        }

        setImageUri(nextImage.uri);
        setSelectedImage(nextImage);
        if (Platform.OS !== 'web') {
          await persistPendingUpload(nextImage);
        }
      }
    } finally {
      setBusyPicking(false);
    }
  };

  const buildQaSampleImage = () => {
    let uri: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (Platform.OS === 'web') {
      uri = 'http://127.0.0.1:8091/looksmaxx-qa-face.jpg';
      width = 900;
      height = 1200;
    } else {
      const asset = Image.resolveAssetSource(QA_SAMPLE_IMAGE);
      uri = asset?.uri;
      width = asset?.width;
      height = asset?.height;
    }

    if (!uri) return undefined;
    return {
      uri,
      width,
      height,
      fileSize: undefined,
      mimeType: 'image/jpeg',
      originalUri: uri,
      originalMimeType: 'image/jpeg',
    } as AnalysisImage;
  };

  const loadQaSampleImage = async () => {
    try {
      const nextImage = buildQaSampleImage();
      if (!nextImage?.uri) return;
      setImageUri(nextImage.uri);
      setSelectedImage(nextImage);
      setSelectedPhoto('Front selfie');
      setScreen('upload');
    } catch {
      Alert.alert('QA sample unavailable', 'The built-in sample photo could not be loaded.');
    }
  };

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      const triggered = await triggerWebCameraCapture();
      if (!triggered) {
        Alert.alert('Camera unavailable', 'Your browser did not open the camera capture flow. Try Chrome/Safari camera permissions or use the library upload button instead.');
      }
      return;
    }

    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      Alert.alert('Camera needed', `Allow camera access so ${BRAND_NAME} can capture a face directly in-app.`);
      return;
    }
    setScreen('camera');
  };

  const capturePhoto = async () => {
    try {
      const captured = await cameraRef.current?.takePictureAsync({ quality: 0.8, base64: false });
      if (captured?.uri) {
        const nextImage = {
          uri: captured.uri,
          width: captured.width,
          height: captured.height,
        };
        setImageUri(captured.uri);
        setSelectedImage(nextImage);
        await persistPendingUpload(nextImage);
        setSelectedPhoto('Front selfie');
        setScreen('upload');
      }
    } catch {
      Alert.alert('Capture failed', `${BRAND_NAME} could not capture the photo. Try again.`);
    }
  };

  const pickBattleImage = async () => {
    try {
      setBattleBusy(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', `Allow photo access so ${BRAND_NAME} can load a second face for battle mode.`);
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
        const analyzed = (await buildScanFromBackend(nextImage, `${battleName || 'Friend'} battle upload`)) ?? (await buildScanFromImage(nextImage, `${battleName || 'Friend'} battle upload`));
        setBattleScan(analyzed);
        setBattleArchetype(analyzed.archetype);
        setBattleScoreInput(String(analyzed.score));
        const datasetRecord = await appendDatasetExport(analyzed);
        if (datasetRecord) await writeDatasetSampleFile(datasetRecord);
      }
    } finally {
      setBattleBusy(false);
    }
  };

  const finalizeScanFlow = async (rawScan: ScanRecord) => {
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
    if (accessTier === 'review_unlocked') {
      setAccessTier('free');
      setUnlockedReviewId(null);
    }
    const nextHistory = [scan, ...history].slice(0, 12);
    await persistHistory(nextHistory);
    await persistPendingUpload(undefined);
    const datasetRecord = await appendDatasetExport(scan);
    if (datasetRecord) await writeDatasetSampleFile(datasetRecord);
    setScreen('scan');
  };

  const makeQaSuccessfulScan = async (inputImage: AnalysisImage | { uri?: string }, photoLabel: string) => {
    const baseScan = await buildScanFromImage(inputImage, photoLabel);
    const upgradedBreakdown = baseScan.breakdown.map((item) => {
      const boosted = clamp(Math.max(item.score, item.target - 3), 62, 91);
      return {
        ...item,
        score: boosted,
        target: clamp(Math.max(item.target, boosted + 4), boosted + 4, 95),
      };
    });
    const score = Math.round(clamp(upgradedBreakdown.reduce((sum, item) => sum + item.score, 0) / upgradedBreakdown.length, 67, 89));
    const potential = Math.round(clamp(score + 11, score + 6, 95));
    const measurement = baseScan.measurement;
    const measurementQuality = measurement?.quality;
    const measurementDerived = measurement?.derivedOutputs;
    return {
      ...baseScan,
      breakdown: upgradedBreakdown,
      score,
      potential,
      confidence: Math.max(baseScan.confidence ?? 0, 84),
      rejectionReason: null,
      warnings: (baseScan.warnings ?? []).filter((warning) => !/occlusion|confidence|angle/i.test(warning)),
      tier: score >= 82 ? 'Elite' : score >= 72 ? 'Attractive' : 'Above Average',
      rank: score >= 82 ? 'Elite Signal' : score >= 72 ? 'Silver Signal' : 'Gold Signal',
      archetype: 'Pretty Boy',
      measurement: measurement ? {
        ...measurement,
        quality: {
          ...measurementQuality,
          faceCount: 1,
          landmarkConfidence: Math.max(measurementQuality?.landmarkConfidence ?? 0, 0.82),
          poseConfidence: Math.max(measurementQuality?.poseConfidence ?? 0, 0.86),
          occlusionRisk: Math.min(measurementQuality?.occlusionRisk ?? 0.18, 0.18),
        },
        derivedOutputs: {
          ...measurementDerived,
          overallScore: score,
          confidence: Math.max(measurementDerived?.confidence ?? 0, 84),
          rejectionReason: null,
          warnings: (measurementDerived?.warnings ?? []).filter((warning) => !/occlusion|confidence|angle/i.test(warning)),
          categoryScores: {
            jawline: upgradedBreakdown.find((item) => item.key === 'jawline')?.score ?? null,
            eyes: upgradedBreakdown.find((item) => item.key === 'eyes')?.score ?? null,
            skin: upgradedBreakdown.find((item) => item.key === 'skin')?.score ?? null,
            symmetry: upgradedBreakdown.find((item) => item.key === 'symmetry')?.score ?? null,
            hairFraming: upgradedBreakdown.find((item) => item.key === 'hair')?.score ?? null,
            facialHarmony: upgradedBreakdown.find((item) => item.key === 'thirds')?.score ?? null,
          },
        },
      } : undefined,
    } as ScanRecord;
  };

  const runScanFlow = async (inputImage: AnalysisImage | { uri?: string }, photoLabel: string) => {
    const rawScan = (await buildScanFromBackend(inputImage, photoLabel)) ?? (await buildScanFromImage(inputImage, photoLabel));
    await finalizeScanFlow(rawScan);
  };

  const startScan = async () => {
    const inputImage = selectedImage ?? { uri: imageUri };
    await runScanFlow(inputImage, selectedPhoto);
  };

  const resetFlow = () => {
    persistPendingUpload(undefined);
    if (accessTier === 'review_unlocked') {
      setAccessTier('free');
      setUnlockedReviewId(null);
    }
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

  const renderEmptyFacePlaceholder = (size: 'large' | 'small' = 'large') => {
    const large = size === 'large';
    return (
      <View style={large ? styles.emptyFacePlaceholderLarge : styles.emptyFacePlaceholderSmall}>
        <Text style={styles.emptyFaceEyebrow}>PHOTO PREVIEW</Text>
        <Text style={large ? styles.emptyFaceTitleLarge : styles.emptyFaceTitleSmall}>Awaiting your read</Text>
        {large && <Text style={styles.emptyFaceCopy}>Drop in a clean photo to see how you stack up against the standard.</Text>}
      </View>
    );
  };

  const renderPreview = (size: 'large' | 'small' = 'large') => {
    const large = size === 'large';
    if (imageUri) {
      return (
        <View style={large ? styles.photoFrameLarge : styles.photoFrameSmall}>
          <Image
            source={{ uri: imageUri }}
            style={large ? styles.photoImageLarge : styles.photoImageSmall}
            resizeMode="contain"
          />
        </View>
      );
    }
    return renderEmptyFacePlaceholder(size);
  };

  const renderHook = () => (
    <View style={styles.heroWrap}>
      <Image source={BRAND_LOGO_IMAGE} style={styles.brandLogoTop} resizeMode="contain" />
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>THE {BRAND_NAME.toUpperCase()} STANDARD</Text>
        <View style={styles.liveDot} />
      </View>
      <Text style={styles.brandIntro}>Get a sharper read on how your current presentation lands - and where the biggest gains are hiding.</Text>
      <Pressable style={styles.primaryButton} onPress={() => setScreen('upload')}>
        <Text style={styles.primaryButtonText}>Click to LooksMaxx</Text>
      </Pressable>
      <Animated.View style={[styles.brandHeroFrame, { transform: [{ scale: pulse }] }]}> 
        <Image source={BRAND_FACE_IMAGE} style={styles.brandHeroImage} resizeMode="cover" />
      </Animated.View>
      <Animated.View style={[styles.heroOrb, { transform: [{ scale: pulse }] }]}>
        <View style={styles.heroOrbCore}>
          <Text style={styles.heroOrbScore}>{history[0]?.potential ?? 91}</Text>
          <Text style={styles.heroOrbLabel}>Maximum upside</Text>
        </View>
      </Animated.View>
      <Text style={styles.heroTitle}>Measure yourself against the {BRAND_NAME} standard.</Text>
      <Text style={styles.heroSub}>Bring in one photo, get your current read, and see how much stronger your look can land with cleaner presentation, structure, and consistency.</Text>

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

      {!!history.length && (
        <Pressable style={styles.secondaryButton} onPress={() => setScreen('history')}>
          <Text style={styles.secondaryButtonText}>Open Standard History</Text>
        </Pressable>
      )}
    </View>
  );

  const renderUpload = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Enter the standard</Text>
      <Text style={styles.sectionTitle}>Choose a photo and see how your current presentation stacks up against the LooksMaxxing standard.</Text>

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTag}>{imageUri ? 'PHOTO READY' : 'WAITING FOR YOUR PHOTO'}</Text>
        <Text style={styles.uploadTitle}>{imageUri ? selectedPhoto : 'No photo loaded yet'}</Text>
        <Text style={styles.uploadCopy}>{uploadHelperCopy}</Text>
        <View style={[styles.photoPreview, !imageUri && styles.photoPreviewEmpty]}>{renderPreview('large')}</View>
        {!!imageUri && (
          <Text style={styles.previewHelperText}>If forehead or chin is cut off here, the scan may read as unstable. A little space around the full face works better.</Text>
        )}
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
          <Text style={styles.infoLabel}>photo status</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{history.length}</Text>
          <Text style={styles.infoLabel}>standard checks</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{exportCount}</Text>
          <Text style={styles.infoLabel}>saved samples</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>LIVE</Text>
          <Text style={styles.infoLabel}>scan mode</Text>
        </View>
      </View>

      <Pressable style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryButtonText}>{busyPicking ? 'Opening Photos…' : imageUri ? 'Change Library Photo' : 'Choose Photo from Library'}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={openCamera}>
        <Text style={styles.secondaryButtonText}>{cameraButtonLabel}</Text>
      </Pressable>
      {__DEV__ && (
        <Pressable style={styles.secondaryButton} onPress={loadQaSampleImage}>
          <Text style={styles.secondaryButtonText}>Load QA Sample Photo</Text>
        </Pressable>
      )}
      <Pressable style={styles.primaryButton} onPress={startScan}>
        <Text style={styles.primaryButtonText}>Run Scan</Text>
      </Pressable>
    </View>
  );

  const renderCamera = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Capture for the standard</Text>
      <Text style={styles.sectionTitle}>Take a photo directly in the app for the cleanest possible read against the LooksMaxxing standard.</Text>
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
      <Image source={BRAND_LOGO_IMAGE} style={styles.brandLogoInline} resizeMode="contain" />
      <Text style={styles.sectionKick}>{BRAND_NAME} loading</Text>
      <Text style={styles.sectionTitle}>Reading framing, structure, balance, and presentation.</Text>
      <View style={styles.scanCore}>
        <Animated.View style={[styles.scanHalo, { transform: [{ scale: pulse }] }]} />
        <View style={styles.scanFrameBrand}>
          <Image source={BRAND_FACE_IMAGE} style={styles.scanBrandImage} resizeMode="cover" />
          <View style={styles.scanBrandShade} />
          <View style={styles.scanGridOverlay} />
          <Animated.View style={[styles.scanSweepLine, { transform: [{ translateY: pulse.interpolate({ inputRange: [0.96, 1.04], outputRange: [-10, 14] }) }] }]} />
          <View style={styles.scanFrameGlow} />
          <View style={styles.scanCornerTopLeft} />
          <View style={styles.scanCornerTopRight} />
          <View style={styles.scanCornerBottomLeft} />
          <View style={styles.scanCornerBottomRight} />
        </View>
      </View>
      <View style={styles.scanStageCard}>
        <Text style={styles.scanStageLabel}>Now reading</Text>
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
        <Text style={styles.primaryButtonText}>See Result</Text>
      </Pressable>
    </View>
  );

  const renderResult = () => {
    if (!activeScan) return null;
    const backendMeasurements = activeScan.measurement;
    const recoveryGuidance = getRecoveryGuidance(activeScan);
    const isProvisionalResult = !!activeScan.rejectionReason || (activeScan.confidence ?? 0) < 55;
    const isFreeTeaserMode = !canViewPremiumForCurrentScan;
    const resultLabel = isProvisionalResult ? 'Provisional Read' : 'Optimization Score';
    const resultProgressCopy = isProvisionalResult
      ? `This read is being held loosely until ${BRAND_NAME} gets a cleaner scan.`
      : `You are ${eliteDistance}% away from the LooksMaxxing ceiling`;
    const reviewPoints = Array.from(new Set([
      ...(activeScan.warnings ?? []),
      `Confidence is currently reading at ${activeScan.confidence ?? 0}.`,
      activeScan.rejectionReason
        ? `Primary caution point: ${activeScan.rejectionReason}.`
        : 'No hard rejection triggered on this read.',
      `Current archetype read: ${inferredArchetype}.`,
      backendMeasurements
        ? `Symmetry and landmark data are helping shape the current score.`
        : 'This read is leaning more on visible presentation than deeper geometry signals.',
    ].filter(Boolean)));
    const strongestArea = [...activeBreakdown].sort((a, b) => b.score - a.score)[0] ?? null;
    const biggestGap = [...activeBreakdown].sort((a, b) => (b.target - b.score) - (a.target - a.score))[0] ?? null;
    const premiumSummary = strongestArea && biggestGap
      ? `Right now your result is being supported most by ${strongestArea.label.toLowerCase()}, while the biggest untapped upside is sitting in ${biggestGap.label.toLowerCase()}. This read does not look capped by one catastrophic weakness — it looks more like a result with real room above it if presentation and weaker areas tighten up.`
      : identityTagline;
    const interpretationSummary = strongestArea && biggestGap
      ? `You are not starting from a weak baseline. The stronger parts of your face are already giving the read some shape, but the score still feels held back by how consistently your weaker areas are landing. In plain terms: this looks more like a refinement opportunity than a rescue job.`
      : 'This result suggests there is meaningful upside available, but the biggest gains will come from clarifying what is already working instead of chasing random fixes.';
    const biggestOpportunityCopy = biggestGap
      ? `Your highest leverage opportunity right now is ${biggestGap.label.toLowerCase()}. That is the area most likely to move the score if you improve how it presents in photos and in real life.`
      : 'Your biggest opportunity right now is improving how your strongest features land more consistently.';
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>{isFreeTeaserMode ? 'Your teaser result' : 'Your read'}</Text>
        <View style={[styles.resultCard, isProvisionalResult && styles.resultCardMuted]}>
          <Text style={[styles.rankBadge, isProvisionalResult && styles.rankBadgeMuted]}>{isProvisionalResult ? 'PROVISIONAL' : activeScan.rank}</Text>
          <Text style={styles.resultLabel}>{isFreeTeaserMode ? 'Premium LooksMaxxing Read' : (isProvisionalResult ? resultLabel : 'LooksMaxxing Read')}</Text>
          <Text style={[styles.resultScore, isProvisionalResult && styles.resultScoreMuted, isFreeTeaserMode && styles.resultScoreLocked]}>{isFreeTeaserMode ? 'Score Locked' : scoreDisplay}</Text>
          <Text style={[styles.resultTier, isProvisionalResult && styles.resultTierMuted, isFreeTeaserMode && styles.resultTierLocked]}>{isFreeTeaserMode ? 'Full read ready to unlock' : (isProvisionalResult ? 'Needs Better Scan' : activeScan.tier)}</Text>
          <Text style={[styles.resultArchetype, isFreeTeaserMode && styles.resultArchetypeLocked]}>{isFreeTeaserMode ? 'Your full archetype and breakdown unlock in the paid review' : (isProvisionalResult ? `${activeScan.archetype} • held loosely` : activeScan.archetype)}</Text>
          <View style={styles.resultProgressWrap}>
            <View style={[styles.progressTrackSm, isProvisionalResult && styles.progressTrackSmMuted]}>
              <View style={[styles.progressFillSm, isProvisionalResult && styles.progressFillSmMuted, { width: `${activeScan.potential}%` }]} />
            </View>
            <Text style={styles.resultProgressText}>{isFreeTeaserMode ? 'Your exact LooksMaxxing score unlocks with the full review.' : resultProgressCopy}</Text>
          </View>
          {isFreeTeaserMode && (
            <View style={styles.resultCardLockOverlay}>
              <Text style={styles.resultCardLockTitle}>Your strongest read is ready</Text>
              <Text style={styles.resultCardLockCopy}>Unlock the exact score, full archetype read, detailed why, and the clearest next moves for this scan with the $4.99 review or Pro.</Text>
            </View>
          )}
        </View>

        <View style={styles.dualStats}>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatTop}>Current</Text>
            <Text style={[styles.miniStatValue, isFreeTeaserMode && styles.miniStatValueLocked]}>{isFreeTeaserMode ? 'Locked' : activeScan.score}</Text>
          </View>
          <View style={styles.miniStatCardAccent}>
            <Text style={styles.miniStatTop}>Potential</Text>
            <Text style={[styles.miniStatValue, isFreeTeaserMode && styles.miniStatValueLocked]}>{isFreeTeaserMode ? 'Locked' : activeScan.potential}</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatTop}>Confidence</Text>
            <Text style={[styles.miniStatValue, isFreeTeaserMode && styles.miniStatValueLocked]}>{isFreeTeaserMode ? 'Locked' : (activeScan.confidence ?? 0)}</Text>
          </View>
        </View>

        {isFreeTeaserMode && (
          <View style={styles.retentionCard}>
            <Text style={styles.retentionTitle}>Unlock the full review</Text>
            <Text style={styles.retentionCopy}>See exactly where you land, what is helping your score most, what is holding it back, and which upgrades are most likely to move the read fastest.</Text>
            <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={unlockCurrentReview}>
              <Text style={styles.primaryButtonText}>Unlock Full Review — $4.99</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={startProAccess}>
              <Text style={styles.primaryButtonText}>Start Pro — $9.99/month</Text>
            </Pressable>
          </View>
        )}

        {isProvisionalResult && (
          <View style={styles.warningCard}>
            <Text style={styles.warningEyebrow}>SCAN NEEDS A CLEANER PHOTO</Text>
            <Text style={styles.warningTitle}>{recoveryGuidance.title}</Text>
            <Text style={styles.warningText}>{recoveryGuidance.body}</Text>
            <View style={styles.tipList}>
              {recoveryGuidance.tips.map((tip) => (
                <View key={tip} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
            <View style={styles.warningMetaRow}>
              <Text style={styles.warningMetaPill}>Reason: {activeScan.rejectionReason ?? ((activeScan.confidence ?? 0) < 55 ? 'Low scan confidence' : 'Cautious read')}</Text>
              <Text style={styles.warningMetaPill}>Confidence: {activeScan.confidence ?? 0}</Text>
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => setScreen('upload')}>
              <Text style={styles.secondaryButtonText}>Try a Better Photo</Text>
            </Pressable>
          </View>
        )}

        {reviewPoints.length ? (
          <Pressable style={styles.warningCardMuted} onPress={() => { if (isFreeTeaserMode) openPremiumGate(); }}>
            <Text style={styles.warningTitle}>LooksMaxxing Review</Text>
            {isFreeTeaserMode ? (
              <>
                {reviewPoints.slice(0, 1).map((point) => (
                  <Text key={point} style={styles.warningText}>• {point}</Text>
                ))}
                <Text style={styles.warningText}>• Premium review points are locked until you unlock this result.</Text>
                <Text style={styles.metricPanelCopy}>Unlock the full review to see the deeper read, clearer recommendations, and the real reasons behind this score.</Text>
              </>
            ) : (
              <>
                <Text style={styles.metricPanelCopy}>{premiumSummary}</Text>
                <View style={styles.tipList}>
                  <View style={styles.tipRow}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>What is helping: {strongestArea ? `${strongestArea.label} is currently carrying the strongest part of the read.` : 'The stronger parts of your read are giving the score a usable baseline.'}</Text></View>
                  <View style={styles.tipRow}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>What is limiting: {biggestGap ? `${biggestGap.label} still has the biggest gap between where you are and where you could reasonably land.` : 'A few weaker areas are still leaving points on the table.'}</Text></View>
                  <View style={styles.tipRow}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>Structure vs photo suppression: {backendMeasurements ? 'Some of the score looks structural, but presentation and image quality are still suppressing the ceiling.' : 'This read still depends meaningfully on presentation and image quality, not just structure alone.'}</Text></View>
                  <View style={styles.tipRow}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>Biggest upside: {biggestOpportunityCopy}</Text></View>
                </View>
              </>
            )}
          </Pressable>
        ) : null}

        <View style={styles.identityLine}>
          <Text style={styles.identityLineTitle}>{isFreeTeaserMode ? 'Teaser read' : 'Premium Read Summary'}</Text>
          <Text style={styles.identityLineText}>{isFreeTeaserMode ? `You are reading as ${activeScan.archetype} with visible upside. Unlock the full review to see what is helping, what is holding you back, and where your biggest gains are hiding.` : premiumSummary}</Text>
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

        {!!backendMeasurements && (
          <View style={styles.metricPanel}>
            <Text style={styles.metricPanelTitle}>LooksMaxx Stats</Text>
            <View style={styles.metricGrid}>
              <View style={styles.metricChip}><Text style={styles.metricKey}>Symmetry</Text><Text style={styles.metricValue}>{Math.round((1 - backendMeasurements.symmetry.noseCenterOffset) * 100)}</Text></View>
              <View style={styles.metricChip}><Text style={styles.metricKey}>Landmark confidence</Text><Text style={styles.metricValue}>{Math.round((backendMeasurements.quality.landmarkConfidence ?? 0) * 100)}</Text></View>
              <View style={styles.metricChip}><Text style={styles.metricKey}>Face ratio</Text><Text style={styles.metricValue}>{backendMeasurements.ratios.faceWidthHeight.toFixed(2)}</Text></View>
              <View style={styles.metricChip}><Text style={styles.metricKey}>Jaw ratio</Text><Text style={styles.metricValue}>{backendMeasurements.ratios.jawWidthRatio.toFixed(2)}</Text></View>
              <View style={styles.metricChip}><Text style={styles.metricKey}>Interocular</Text><Text style={styles.metricValue}>{backendMeasurements.ratios.interocularRatio.toFixed(2)}</Text></View>
              <View style={styles.metricChip}><Text style={styles.metricKey}>Face count</Text><Text style={styles.metricValue}>{backendMeasurements.quality.faceCount}</Text></View>
            </View>
            <Text style={styles.metricPanelCopy}>{isFreeTeaserMode ? `Current archetype read: ${inferredArchetype}` : interpretationSummary}</Text>
          </View>
        )}

        {!isFreeTeaserMode && (
          <View style={styles.retentionCard}>
            <Text style={styles.retentionTitle}>Biggest opportunity right now</Text>
            <Text style={styles.retentionCopy}>{biggestOpportunityCopy}</Text>
            <Text style={styles.retentionDatasetText}>This is the highest-leverage place to push first if your goal is to move the overall read instead of making random low-ROI tweaks.</Text>
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={() => (canViewPremiumForCurrentScan ? setScreen('breakdown') : openPremiumGate())}>
          <Text style={styles.primaryButtonText}>{canViewPremiumForCurrentScan ? 'Open Score Breakdown' : 'See Full Breakdown'}</Text>
        </Pressable>
      </View>
    );
  };

  const renderBreakdown = () => {
    if (!activeScan) return null;
    if (!canViewPremiumForCurrentScan) {
      setScreen('paywall');
      return null;
    }
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Score breakdown</Text>
        <Text style={styles.sectionTitle}>Where your current read is landing, and where the upside still lives.</Text>
        {!!activeScan.measurement && (
          <View style={styles.metricPanelMuted}>
            <Text style={styles.metricPanelTitle}>Why this read landed here</Text>
            <Text style={styles.metricPanelCopy}>
              Upper / mid / lower thirds: {activeScan.measurement.ratios.upperThirdRatio.toFixed(2)} / {activeScan.measurement.ratios.midThirdRatio.toFixed(2)} / {activeScan.measurement.ratios.lowerThirdRatio.toFixed(2)}
            </Text>
            <Text style={styles.metricPanelCopy}>
              Nose center offset: {activeScan.measurement.ratios.noseCenterOffsetRatio.toFixed(2)} · Eye height delta: {activeScan.measurement.symmetry.eyeHeightDelta.toFixed(2)}
            </Text>
          </View>
        )}

        {activeBreakdown.map((item, index) => {
          const meaning = item.score >= 78
            ? `${item.label} is already one of the stronger parts of your current read and is helping the overall result feel more premium.`
            : item.score >= 68
              ? `${item.label} is contributing positively, but it still has visible headroom before it feels like a real standout.`
              : `${item.label} is currently one of the clearer drags on the read and is leaving noticeable points on the table.`;
          const liftMove = item.key === 'jawline'
            ? 'Better leanness, angle control, and lower-face presentation would raise this fastest.'
            : item.key === 'eyes'
              ? 'Sharper eye-area presentation, better rest, brow control, and cleaner framing would raise this most.'
              : item.key === 'skin'
                ? 'Clearer lighting, better skin quality, and less texture suppression would move this upward.'
                : item.key === 'symmetry'
                  ? 'Straighter framing, cleaner posture, and more consistent alignment would improve how this reads.'
                  : item.key === 'hair'
                    ? 'Hair control, silhouette, and stronger upper-frame presentation would push this up fastest.'
                    : 'Cleaner thirds balance, framing, and overall structure presentation would improve this area.';

          return (
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
                  <Text style={[styles.deltaText, { color: item.color }]}>+{item.target - item.score} toward standard</Text>
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
              <Text style={styles.breakDetail}><Text style={styles.breakDetailLabel}>What it means: </Text>{meaning}</Text>
              <Text style={styles.breakDetail}><Text style={styles.breakDetailLabel}>What raises it: </Text>{liftMove}</Text>
            </Animated.View>
          );
        })}
        <Pressable style={styles.primaryButton} onPress={() => setScreen('simulate')}>
          <Text style={styles.primaryButtonText}>Preview Your Upgrade</Text>
        </Pressable>
      </View>
    );
  };

  const renderSimulate = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Upgrade preview</Text>
        <Text style={styles.sectionTitle}>A sharper version of the same identity, pushed closer to your ceiling.</Text>
        <View style={styles.simCardWrap}>
          <View style={styles.simCardLeft}>
            <Text style={styles.simTag}>NOW</Text>
            <View style={styles.simFaceCard}>{renderPreview('small')}<Text style={styles.simFaceScore}>{activeScan.score}</Text></View>
          </View>
          <View style={styles.simCardRight}>
            <Text style={styles.simTagAccent}>AFTER</Text>
            <View style={styles.simFaceCardAccent}>{renderPreview('small')}<Text style={styles.simFaceScoreAccent}>{compareDisplay}</Text></View>
          </View>
        </View>

        <View style={styles.shareCard}>
          <Text style={styles.shareTitle}>Preview</Text>
          <Text style={styles.shareHeadline}>From {activeScan.score} to a possible {potentialDisplay}</Text>
          <Text style={styles.shareCaption}>The question is not whether the face changes - it is how much stronger the presentation can get.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('share')}>
          <Text style={styles.primaryButtonText}>Open Standard Card</Text>
        </Pressable>
      </View>
    );
  };

  const renderHistory = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Your standard</Text>
      <Text style={styles.sectionTitle}>Track how close your read is getting to the LooksMaxxing standard over time.</Text>

      {!!history.length && (
        <>
        <View style={styles.retentionSummaryCard}>
          <View style={styles.retentionSummaryTop}>
            <Text style={styles.retentionTitle}>Progress tracker</Text>
            <Text style={styles.streakBadge}>{retentionStats.streakDays}-day streak</Text>
          </View>
          {!!retentionStats.provisionalCount && (
            <Text style={styles.retentionSubnote}>{retentionStats.provisionalCount} provisional scan{retentionStats.provisionalCount === 1 ? '' : 's'} excluded from progress trend.</Text>
          )}
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
            {retentionStats.usingReliableBaseline
              ? retentionStats.scoreDelta > 0
                ? `${retentionStats.scoreDelta > 1 ? `+${retentionStats.scoreDelta} improvement detected` : '+1 improvement detected'} across your last clean scans.`
                : retentionStats.scoreDelta < 0
                  ? `Your last clean scan reads ${Math.abs(retentionStats.scoreDelta)} lower than the one before it. Provisional inputs are being ignored so weak photos do not fake a regression.`
                  : 'Your last two clean scans are flat. Try angle, lighting, hair control, or skin-day timing for a better next read.'
              : retentionStats.provisionalCount > 0
                ? 'Recent shaky scans are being logged, but progress trend is waiting for cleaner inputs before calling movement.'
                : 'Not enough clean scan history yet to call a real trend.'}
          </Text>
          <Text style={styles.retentionDatasetText}>{exportCount} scans saved privately on this device so far.</Text>
        </View>

        <View style={styles.bestVersionCard}>
          <Text style={styles.retentionTitle}>Closest to the standard</Text>
          <Text style={styles.bestVersionScore}>{retentionStats.bestScan?.score ?? 0}</Text>
          <Text style={styles.bestVersionMeta}>{retentionStats.bestScan?.archetype ?? 'No archetype yet'} • {retentionStats.bestScan?.tier ?? 'No tier yet'}</Text>
          <Text style={styles.retentionCopy}>Peak read captured on {retentionStats.bestScan ? formatTime(retentionStats.bestScan.createdAt) : '-'}.</Text>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.retentionTitle}>Standard chase timeline</Text>
          <View style={styles.timelineBars}>
            {history.slice().reverse().map((item) => {
              const isCleanTimelineScan = isReliableScan(item);
              return (
              <View key={item.id} style={styles.timelineBarWrap}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineBar, !isCleanTimelineScan && styles.timelineBarProvisional, { height: `${Math.max(12, item.score)}%` }]} />
                  <View style={[styles.timelinePotentialBar, !isCleanTimelineScan && styles.timelinePotentialBarProvisional, { height: `${Math.max(item.score, item.potential)}%` }]} />
                </View>
                <Text style={[styles.timelineScore, !isCleanTimelineScan && styles.timelineScoreProvisional]}>{item.score}</Text>
                <Text style={[styles.timelineTag, isCleanTimelineScan ? styles.timelineTagClean : styles.timelineTagProvisional]}>{isCleanTimelineScan ? 'clean' : 'prov'}</Text>
              </View>
              );
            })}
          </View>
          <Text style={styles.timelineLegend}>Solid bar = current score · Outline = upside · Purple = clean scan · Rose = provisional scan</Text>
        </View>
        </>
      )}

      {loadingHistory ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#FF4FD8" />
          <Text style={styles.loadingText}>Loading your scans…</Text>
        </View>
      ) : history.length ? (
        (() => {
          const repeatedProvisionalCount = history.filter((item) => !isReliableScan(item)).length;
          const visibleHistory = history.filter((item, index) => isReliableScan(item) || index === 0);
          return (
            <>
              {repeatedProvisionalCount > 1 && (
                <View style={styles.historySummaryCard}>
                  <Text style={styles.historySummaryTitle}>{repeatedProvisionalCount} provisional scans are grouped right now</Text>
                  <Text style={styles.historySummaryCopy}>The newest shaky read stays visible below. Older provisional inputs are still saved, but hidden here so the tracker does not become repetitive.</Text>
                </View>
              )}
              {visibleHistory.map((item, index) => {
                const isCleanHistoryScan = isReliableScan(item);
                return (
          <Pressable
            key={item.id}
            style={[styles.historyCard, index === 0 && styles.historyCardActive, !isCleanHistoryScan && styles.historyCardProvisional]}
            onPress={() => {
              setCurrentScan(item);
              setImageUri(item.imageUri);
              setScreen('result');
            }}
          >
            <View style={styles.historyThumb}>{item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.historyThumbImage} /> : <Text style={styles.historyThumbGlyph}>◌</Text>}</View>
            <View style={styles.historyMeta}>
              <View style={styles.historyTitleRow}>
                <Text style={styles.historyTitle}>{item.archetype}</Text>
                <Text style={[styles.historyStatusBadge, isCleanHistoryScan ? styles.historyStatusBadgeClean : styles.historyStatusBadgeProvisional]}>
                  {isCleanHistoryScan ? 'CLEAN' : 'PROVISIONAL'}
                </Text>
              </View>
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
              <Text style={styles.historyConfidenceText}>
                Confidence {item.confidence ?? 0}{item.rejectionReason ? ` · ${item.rejectionReason}` : ''}
              </Text>
            </View>
            <View style={styles.historyScoreWrap}>
              <Text style={styles.historyScore}>{item.score}</Text>
              <Text style={styles.historyPotential}>→ {item.potential}</Text>
            </View>
          </Pressable>
        );
              })}
            </>
          );
        })()
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No scans saved yet</Text>
          <Text style={styles.emptyCopy}>Run your first scan and it will show up here automatically.</Text>
        </View>
      )}
      <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={() => setScreen('paywall')}>
        <Text style={styles.primaryButtonText}>Continue to Pro Access</Text>
      </Pressable>
    </View>
  );

  const renderPaywall = () => (
    <View style={styles.screenBlock}>
      <Image source={BRAND_LOGO_IMAGE} style={styles.brandLogoInline} resizeMode="contain" />
      <Text style={styles.sectionKick}>Full review ready</Text>
      <Text style={styles.sectionTitle}>Unlock your full LooksMaxxing review</Text>
      <Text style={styles.metricPanelCopy}>Reveal your exact score, full archetype read, deeper breakdown, and the highest-leverage next moves for this scan.</Text>

      <Animated.View
        style={[
          styles.paywallCard,
          { shadowOpacity: paywallGlow.interpolate({ inputRange: [0.25, 1], outputRange: [0.12, 0.3] }) },
        ]}
      >
        <Text style={styles.paywallTier}>FULL REVIEW</Text>
        <Text style={styles.paywallPrice}>$4.99</Text>
        <Text style={styles.paywallCopy}>One payment unlocks the full LooksMaxxing Review for this scan right now.</Text>
        {['Full LooksMaxxing Review', 'Full score breakdown', 'Personalized improvement plan'].map((item, index) => (
          <View key={item} style={[styles.lockedRow, lockedIndex === index && styles.lockedRowActive]}>
            <Text style={styles.lockedRowText}>{item}</Text>
            <Text style={styles.lockedRowTag}>ONCE</Text>
          </View>
        ))}
        <Text style={styles.progressCaption}>Best if you want the full answer on this scan right now.</Text>
        <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={unlockCurrentReview}>
          <Text style={styles.primaryButtonText}>Unlock This Review</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.pricingCardAccent}>
        <Text style={styles.pricingTier}>LOOKSMAXXING PRO</Text>
        <Text style={styles.pricingHeadline}>$9.99/month</Text>
        <Text style={styles.pricingCopy}>Get everything in Full Review plus ongoing premium access across future scans.</Text>
        {['Unlimited full reviews', 'Progress tracker', 'Advanced battle mode', 'Premium improvement insights'].map((item) => (
          <View key={item} style={styles.lockedRow}>
            <Text style={styles.lockedRowText}>{item}</Text>
            <Text style={styles.lockedRowTag}>PRO</Text>
          </View>
        ))}
        <Text style={styles.progressCaption}>Best for ongoing improvement.</Text>
        <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={startProAccess}>
          <Text style={styles.primaryButtonText}>Start Pro</Text>
        </Pressable>
      </View>

      <View style={styles.retentionCard}>
        <Text style={styles.retentionTitle}>What unlocks next</Text>
        <Text style={styles.retentionCopy}>Go deeper on what is helping your score, what is holding it back, and where your biggest gains are most likely to come from.</Text>
        <Pressable style={styles.secondaryButton} onPress={continueWithFreePreview}>
          <Text style={styles.secondaryButtonText}>Continue with free preview</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderReviewUnlocked = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>FULL REVIEW UNLOCKED</Text>
      <Text style={styles.sectionTitle}>Your full LooksMaxxing read is now open</Text>
      <Text style={styles.metricPanelCopy}>You just unlocked the exact score, full archetype read, deeper interpretation, detailed breakdown, and your personalized next-step plan.</Text>

      <View style={styles.paywallCard}>
        {['Exact LooksMaxxing score', 'Full archetype and tier reveal', 'Premium interpretation page', 'Detailed breakdown and plan'].map((item) => (
          <View key={item} style={styles.lockedRow}>
            <Text style={styles.lockedRowText}>{item}</Text>
            <Text style={styles.lockedRowTag}>UNLOCKED</Text>
          </View>
        ))}
      </View>

      <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={() => setScreen('result')}>
        <Text style={styles.primaryButtonText}>See Your Full Review</Text>
      </Pressable>
      <Text style={styles.progressCaption}>You paid for the full answer — now see the score, the why behind it, and the highest-leverage moves next.</Text>
    </View>
  );

  const renderProWelcome = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>PRO UNLOCKED</Text>
      <Text style={styles.sectionTitle}>LooksMaxxing Pro activated</Text>
      <Text style={styles.metricPanelCopy}>You now have unlimited full reviews, progress tracking, and premium access across the app.</Text>

      <View style={styles.paywallCard}>
        {['Unlimited full LooksMaxxing Reviews', 'Progress tracking over time', 'Advanced battle mode', 'Premium improvement insights'].map((item) => (
          <View key={item} style={styles.lockedRow}>
            <Text style={styles.lockedRowText}>{item}</Text>
            <Text style={styles.lockedRowTag}>PRO</Text>
          </View>
        ))}
      </View>

      <Pressable style={[styles.primaryButton, styles.primaryButtonHot]} onPress={() => setScreen('result')}>
        <Text style={styles.primaryButtonText}>See Your Full Review</Text>
      </Pressable>
      <Text style={styles.progressCaption}>Your future scans now unlock automatically with Pro.</Text>
    </View>
  );

  const renderPlan = () => {
    if (!activeScan) return null;
    if (!canViewPremiumForCurrentScan) {
      setScreen('paywall');
      return null;
    }
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Your blueprint</Text>
        <Text style={styles.sectionTitle}>The clearest moves between your current read and the LooksMaxxing standard.</Text>

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>Your ceiling</Text>
          <Text style={styles.potentialHero}>{activeScan.potential}</Text>
          <Text style={styles.retentionCopy}>{identityTagline}</Text>
        </View>

        {improvementPlan.map((item, index) => {
          const whyItMatters = item.impact === 'high'
            ? `This is one of the fastest ways to move the overall read because it is directly tied to how strongly your face is currently presenting.`
            : item.impact === 'medium'
              ? `This matters because it can sharpen the overall impression and stop weaker presentation from dragging the score down.`
              : `This is a supporting upgrade. It will not move the score alone, but it helps the stronger areas land more cleanly.`;
          const whatToDo = item.category.toLowerCase().includes('presentation')
            ? 'Use cleaner lighting, sharper framing, and more controlled presentation so the face lands stronger and more consistently.'
            : item.category.toLowerCase().includes('eye')
              ? 'Reduce tiredness cues, improve eye-area sharpness, and make sure the upper face is not being flattened by lighting or angle.'
              : item.category.toLowerCase().includes('skin')
                ? 'Focus on clearer skin texture, cleaner light, and less visual suppression from softness or poor contrast.'
                : item.category.toLowerCase().includes('hair')
                  ? 'Control silhouette, volume, and edge shape so the upper frame reads more intentionally.'
                  : 'Tighten the highest-leverage habits in this area first before chasing lower-ROI changes.';

          return (
            <View key={item.id} style={item.impact === 'high' ? styles.planCardAccent : styles.planCard}>
              <View style={styles.planTopRow}>
                <Text style={styles.planTier}>Priority {index + 1} • {item.category}</Text>
                <Text style={styles.planLift}>+{item.scoreLift}</Text>
              </View>
              <Text style={styles.planHeadline}>{item.title}</Text>
              <Text style={styles.planCopy}>{item.detail}</Text>
              <Text style={styles.planDetail}><Text style={styles.planDetailLabel}>Why this matters: </Text>{whyItMatters}</Text>
              <Text style={styles.planDetail}><Text style={styles.planDetailLabel}>What to do: </Text>{whatToDo}</Text>
              <View style={styles.planMetaRow}>
                <View style={styles.planMetaPill}><Text style={styles.planMetaText}>Impact: {item.impact}</Text></View>
                <View style={styles.planMetaPill}><Text style={styles.planMetaText}>Difficulty: {item.difficulty}</Text></View>
                <View style={styles.planMetaPill}><Text style={styles.planMetaText}>{item.timeToResult}</Text></View>
              </View>
            </View>
          );
        })}

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>Execution note</Text>
          <Text style={styles.retentionCopy}>
            Do not treat every point of upside as a structural issue. Some of the gain here is likely available through better lighting, cleaner framing, sharper grooming, and more consistent scan quality alone. The smartest path is to fix the highest-leverage presentation issues first, then reassess.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('share')}>
          <Text style={styles.primaryButtonText}>Continue to Standard Card</Text>
        </Pressable>
      </View>
    );
  };

  const renderShare = () => {
    if (!activeScan) return null;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Share your read</Text>
        <Text style={styles.sectionTitle}>A post-ready card for your score, archetype, and upside.</Text>

        <View style={styles.shareExportCard}>
          <Image source={BRAND_LOGO_IMAGE} style={styles.shareLogo} resizeMode="contain" />
          <Text style={styles.shareExportBrand}>{BRAND_NAME}</Text>
          <Text style={styles.shareExportScore}>{activeScan.score}</Text>
          <Text style={styles.shareExportTier}>{activeScan.tier}</Text>
          <Text style={styles.shareExportArchetype}>{activeScan.archetype}</Text>
          <Text style={styles.shareExportTagline}>{identityTagline}</Text>
          <View style={styles.shareMetaRow}>
            <View style={styles.shareMetaPill}><Text style={styles.shareMetaText}>Ceiling {activeScan.potential}</Text></View>
            <View style={styles.shareMetaPill}><Text style={styles.shareMetaText}>Current standard</Text></View>
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
          <Text style={styles.shareTitle}>Caption style</Text>
          <Text style={styles.shareHeadline}>{shareCaption}</Text>
          <Text style={styles.shareCaption}>Made to be screenshot-ready, story-ready, and easy to send by text, email, or share sheet.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleNativeShare}>
          <Text style={styles.primaryButtonText}>Share Score with a Friend</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => setScreen('battle')}>
          <Text style={styles.secondaryButtonText}>Open Standard Clash</Text>
        </Pressable>
      </View>
    );
  };

  const renderBattle = () => {
    if (!activeScan) return null;
    const activeOpponent = activeOpponentProfile;
    return (
      <View style={styles.screenBlock}>
        <Text style={styles.sectionKick}>Standard clash</Text>
        <Text style={styles.sectionTitle}>Battle a friend to compare your LooksMaxxing scores.</Text>

        <View style={styles.retentionCard}>
          <Text style={styles.retentionTitle}>Set your opponent</Text>
          <Text style={styles.battleInputLabel}>Opponent name</Text>
          <TextInput value={battleName} onChangeText={setBattleName} style={styles.battleInput} placeholder="Opponent name" placeholderTextColor="#6F7690" />
          <Pressable style={styles.secondaryButton} onPress={pickBattleImage}>
            <Text style={styles.secondaryButtonText}>{battleBusy ? 'Reading opponent photo…' : battleImageUri ? 'Change Opponent Photo' : 'Upload Opponent Photo'}</Text>
          </Pressable>
          {!battleImageUri && (
            <>
              <Text style={styles.battleInputLabel}>Manual score</Text>
              <TextInput value={battleScoreInput} onChangeText={setBattleScoreInput} style={styles.battleInput} keyboardType="numeric" placeholder="0-100" placeholderTextColor="#6F7690" />
              <Text style={styles.battleInputLabel}>Manual archetype</Text>
              <TextInput value={battleArchetype} onChangeText={setBattleArchetype} style={styles.battleInput} placeholder="Archetype" placeholderTextColor="#6F7690" />
            </>
          )}
          <Text style={styles.battleFootnote}>{battleImageUri ? 'Opponent photo loaded. This result is using a real second scan.' : 'No opponent photo yet. You can still compare using a manual score and archetype.'}</Text>
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
            {battleOutcome?.winner === 'you' ? 'Current edge: You' : battleOutcome?.winner === 'opponent' ? `Current edge: ${activeOpponent.name}` : 'Current edge: Too close to call'}
          </Text>
          <Text style={styles.retentionCopy}>{battleOutcome?.summary}</Text>
          <Text style={styles.battleFootnote}>Opponent read source: {activeOpponent.vibe}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={resetFlow}>
          <Text style={styles.primaryButtonText}>Start a New Scan</Text>
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
      case 'review-unlocked':
        return renderReviewUnlocked();
      case 'pro-welcome':
        return renderProWelcome();
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
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
  heroWrap: { minHeight: 660, justifyContent: 'center', alignItems: 'center', gap: 16, paddingTop: 8, paddingBottom: 20 },
  brandLogoTop: { width: 420, height: 168, alignSelf: 'center', marginBottom: 6 },
  brandLogoInline: { width: 320, height: 128, alignSelf: 'center', marginBottom: 6 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#E5DAFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.9 },
  liveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#14E38B' },
  brandIntro: { color: '#D6DAE9', fontSize: 14, fontWeight: '700', textAlign: 'center', maxWidth: 320, lineHeight: 20 },
  brandHeroFrame: { width: '100%', maxWidth: 332, height: 388, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2D3F', backgroundColor: '#12131A', shadowColor: '#7C5CFF', shadowOpacity: 0.32, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  brandHeroImage: { position: 'absolute', width: '104%', height: '104%', left: '-2%', top: '0%' },
  heroOrb: { width: 232, height: 232, borderRadius: 999, backgroundColor: '#14151F', borderWidth: 1, borderColor: '#2D3041', shadowColor: '#7C5CFF', shadowOpacity: 0.35, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, alignItems: 'center', justifyContent: 'center', marginTop: -8 },
  heroOrbCore: { width: 156, height: 156, borderRadius: 999, backgroundColor: '#0E0F16', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#26293C' },
  heroOrbScore: { color: '#FFFFFF', fontSize: 52, fontWeight: '900' },
  heroOrbLabel: { color: '#9DA3B8', fontSize: 12, marginTop: 4 },
  heroTitle: { color: '#FFFFFF', fontSize: 42, fontWeight: '900', textAlign: 'center', lineHeight: 46, maxWidth: 320 },
  heroSub: { color: '#B7BBD0', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 315 },
  statRail: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  statChip: { width: 145, paddingVertical: 16, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#222431' },
  statNumber: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#8F95AE', fontSize: 12, marginTop: 4 },
  primaryButton: { width: '100%', marginTop: 14, paddingVertical: 18, borderRadius: 24, backgroundColor: '#B42318', alignItems: 'center', justifyContent: 'center', shadowColor: '#B42318', shadowOpacity: 0.38, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, minHeight: 58 },
  primaryButtonHot: { backgroundColor: '#FF3B30', shadowColor: '#FF3B30', shadowOpacity: 0.45, shadowRadius: 26 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  secondaryButton: { width: '100%', marginTop: 10, paddingVertical: 16, borderRadius: 24, backgroundColor: '#151621', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#282B3D', minHeight: 54 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  screenBlock: { paddingTop: 14, gap: 18 },
  sectionKick: { color: '#FF4FD8', fontSize: 12, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
  sectionTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '900', maxWidth: 330, letterSpacing: -0.4 },
  uploadCard: { padding: 20, borderRadius: 28, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#272A3C', gap: 14 },
  uploadTag: { color: '#14E38B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  uploadTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  uploadCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20 },
  previewHelperText: { color: '#9FA6BD', fontSize: 12, lineHeight: 18, marginTop: 12 },
  photoPreview: { height: 270, borderRadius: 24, backgroundColor: '#0D0E15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#242637', overflow: 'hidden' },
  photoPreviewEmpty: { height: 220, borderStyle: 'dashed', borderColor: '#34384D', backgroundColor: '#101119' },
  photoFrameLarge: { width: '100%', height: '100%', padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0E15' },
  photoFrameSmall: { width: 86, height: 110, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0E15', overflow: 'hidden' },
  photoImageLarge: { width: '100%', height: '100%' },
  photoImageSmall: { width: '100%', height: '100%' },
  emptyFacePlaceholderLarge: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  emptyFacePlaceholderSmall: { width: 86, height: 110, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#2B2E40' },
  emptyFaceEyebrow: { color: '#E5DAFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center' },
  emptyFaceTitleLarge: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  emptyFaceTitleSmall: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  emptyFaceCopy: { color: '#98A0B8', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 8, maxWidth: 220 },
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
  scanCore: { alignItems: 'center', justifyContent: 'center', height: 360 },
  scanHalo: { position: 'absolute', width: 300, height: 300, borderRadius: 999, backgroundColor: '#121320', shadowColor: '#FF4FD8', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  scanFrame: { width: 170, height: 220, borderRadius: 28, borderWidth: 1, borderColor: '#303245', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1017', overflow: 'hidden' },
  scanFrameBrand: { width: 272, height: 324, borderRadius: 30, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#2A2D3F', overflow: 'hidden', shadowColor: '#7C5CFF', shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  scanBrandImage: { position: 'absolute', width: '118%', height: '118%', left: '-9%', top: '-4%' },
  scanBrandShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(7,7,10,0.18)' },
  scanGridOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', backgroundColor: 'transparent' },
  scanSweepLine: { position: 'absolute', left: 18, right: 18, top: '46%', height: 2, borderRadius: 999, backgroundColor: 'rgba(255,79,216,0.65)', shadowColor: '#FF4FD8', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  scanFrameGlow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#FF4FD8', shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } },
  scanCornerTopLeft: { position: 'absolute', top: 16, left: 16, width: 28, height: 28, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.42)', borderTopLeftRadius: 10 },
  scanCornerTopRight: { position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.42)', borderTopRightRadius: 10 },
  scanCornerBottomLeft: { position: 'absolute', bottom: 16, left: 16, width: 28, height: 28, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.42)', borderBottomLeftRadius: 10 },
  scanCornerBottomRight: { position: 'absolute', bottom: 16, right: 16, width: 28, height: 28, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.42)', borderBottomRightRadius: 10 },
  scanStageCard: { padding: 18, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  scanStageLabel: { color: '#8D94AA', fontSize: 12, marginBottom: 6 },
  scanStageValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  progressTrackLg: { height: 14, borderRadius: 999, backgroundColor: '#191B24', overflow: 'hidden' },
  progressFillLg: { height: '100%', borderRadius: 999, backgroundColor: '#FF4FD8' },
  progressCaption: { color: '#9DA3B9', fontSize: 13, fontWeight: '700' },
  resultCard: { padding: 28, borderRadius: 30, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#2B2E40', alignItems: 'center', shadowColor: '#7C5CFF', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  resultCardMuted: { backgroundColor: '#15161D', borderColor: '#4A3340', shadowColor: '#C96A84', shadowOpacity: 0.14 },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#1B1731', color: '#D7C8FF', fontSize: 11, fontWeight: '800', overflow: 'hidden', letterSpacing: 1.2 },
  rankBadgeMuted: { backgroundColor: '#341D24', color: '#FFD7DF' },
  resultLabel: { color: '#9197AF', fontSize: 14, fontWeight: '700', marginTop: 12 },
  resultScore: { color: '#14E38B', fontSize: 88, lineHeight: 98, fontWeight: '900', marginTop: 8 },
  resultScoreMuted: { color: '#FFB4C0' },
  resultScoreLocked: { color: '#EDE8FF', letterSpacing: 6 },
  resultTier: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 1.4, marginTop: 6 },
  resultTierMuted: { color: '#FFD7DF' },
  resultTierLocked: { color: '#E6D8FF', letterSpacing: 0.6 },
  resultArchetype: { color: '#B3B8CE', fontSize: 15, marginTop: 4 },
  resultArchetypeLocked: { color: '#D7C8FF' },
  resultCardLockOverlay: { marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: 'rgba(28,19,45,0.88)', borderWidth: 1, borderColor: '#5A45A8', alignItems: 'center', gap: 6 },
  resultCardLockTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  resultCardLockCopy: { color: '#D7C8FF', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  resultProgressWrap: { width: '100%', marginTop: 22, gap: 10 },
  progressTrackSm: { height: 10, borderRadius: 999, backgroundColor: '#1A1C24', overflow: 'hidden' },
  progressTrackSmMuted: { backgroundColor: '#241A20' },
  progressFillSm: { height: '100%', borderRadius: 999, backgroundColor: '#7C5CFF' },
  progressFillSmMuted: { backgroundColor: '#C96A84' },
  resultProgressText: { color: '#C7CCDE', fontSize: 13, fontWeight: '700' },
  dualStats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  miniStatCard: { flex: 1, minWidth: 96, padding: 18, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#25283A', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  miniStatCardAccent: { flex: 1, minWidth: 96, padding: 18, borderRadius: 22, backgroundColor: '#171227', borderWidth: 1, borderColor: '#3A2A69', shadowColor: '#7C5CFF', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  miniStatTop: { color: '#9CA2B9', fontSize: 12, fontWeight: '700' },
  miniStatValue: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 6 },
  miniStatValueLocked: { color: '#D7C8FF', fontSize: 18, fontWeight: '800', marginTop: 12, letterSpacing: 0.4 },
  warningCard: { padding: 18, borderRadius: 22, backgroundColor: '#23151A', borderWidth: 1, borderColor: '#5A2C34', shadowColor: '#AA4C62', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  warningCardMuted: { padding: 18, borderRadius: 22, backgroundColor: '#141820', borderWidth: 1, borderColor: '#2C3447', shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  warningEyebrow: { color: '#FF8D9E', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  warningTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 8 },
  warningText: { color: '#D2D6E5', fontSize: 13, lineHeight: 19, marginTop: 8 },
  tipList: { marginTop: 12, gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipBullet: { color: '#FF8D9E', fontSize: 14, lineHeight: 19, fontWeight: '900' },
  tipText: { flex: 1, color: '#F2F4FB', fontSize: 13, lineHeight: 19 },
  warningMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  warningMetaPill: { color: '#FFD7DF', fontSize: 12, fontWeight: '700', backgroundColor: '#341D24', borderWidth: 1, borderColor: '#5A2C34', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  metricPanel: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', gap: 12, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  metricPanelMuted: { padding: 22, borderRadius: 24, backgroundColor: '#161824', borderWidth: 1, borderColor: '#333954', gap: 8, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  metricPanelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  metricPanelCopy: { color: '#B7BBD0', fontSize: 13, lineHeight: 18 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, rowGap: 10 },
  metricChip: { minWidth: 96, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: '#191B25', borderWidth: 1, borderColor: '#2A2D3F' },
  metricKey: { color: '#98A0B8', fontSize: 11, fontWeight: '700' },
  metricValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 6 },
  identityLine: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  identityLineTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  identityLineText: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 6 },
  identityProgressText: { color: '#14E38B', fontSize: 13, fontWeight: '800', marginTop: 10 },
  progressTierTrack: { height: 10, borderRadius: 999, backgroundColor: '#1A1C24', overflow: 'hidden', marginTop: 10 },
  progressTierFill: { height: '100%', borderRadius: 999, backgroundColor: '#14E38B' },
  progressTierCaption: { color: '#98A0B8', fontSize: 12, fontWeight: '700', marginTop: 8 },
  breakCard: { padding: 20, borderRadius: 24, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#2A2D3F', gap: 14, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
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
  breakDetail: { color: '#AEB5CB', fontSize: 13, lineHeight: 19 },
  breakDetailLabel: { color: '#FFFFFF', fontWeight: '800' },
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
  shareCard: { padding: 22, borderRadius: 26, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2C3044', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  shareTitle: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  shareHeadline: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 10 },
  shareCaption: { color: '#B7BBD0', fontSize: 14, lineHeight: 20, marginTop: 8 },
  shareExportCard: { padding: 24, borderRadius: 28, backgroundColor: '#120F1F', borderWidth: 1, borderColor: '#463276', gap: 10, shadowColor: '#7C5CFF', shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  shareLogo: { width: 280, height: 112, alignSelf: 'center', marginBottom: 12 },
  shareExportBrand: { color: '#F2E8FF', fontSize: 12, fontWeight: '900', letterSpacing: 1.7 },
  shareExportScore: { color: '#FFFFFF', fontSize: 76, fontWeight: '900', letterSpacing: -1.6 },
  shareExportTier: { color: '#9BF5CB', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  shareExportArchetype: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  shareExportTagline: { color: '#C8CDDF', fontSize: 14, lineHeight: 20, marginTop: 4 },
  shareMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  shareMetaPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1C1730', borderWidth: 1, borderColor: '#3B2E66' },
  shareMetaText: { color: '#F0E9FF', fontSize: 12, fontWeight: '700' },
  loadingCard: { padding: 22, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535', alignItems: 'center', gap: 10 },
  loadingText: { color: '#C8CDDF', fontSize: 14 },
  retentionSummaryCard: { padding: 22, borderRadius: 26, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', gap: 14, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  retentionSummaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakBadge: { color: '#14E38B', fontSize: 12, fontWeight: '800', backgroundColor: '#12261C', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, overflow: 'hidden' },
  retentionSubnote: { color: '#9FA6BD', fontSize: 12, lineHeight: 18, marginTop: 2 },
  retentionSummaryRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  retentionStatBox: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: '#171922', borderWidth: 1, borderColor: '#282B3D' },
  retentionStatValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  retentionStatLabel: { color: '#98A0B8', fontSize: 12, marginTop: 4 },
  bestVersionCard: { padding: 22, borderRadius: 26, backgroundColor: '#151225', borderWidth: 1, borderColor: '#3C2C68', gap: 8, shadowColor: '#7C5CFF', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  bestVersionScore: { color: '#FFFFFF', fontSize: 52, fontWeight: '900' },
  bestVersionMeta: { color: '#D8CCFF', fontSize: 14, fontWeight: '700' },
  timelineCard: { padding: 22, borderRadius: 26, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  timelineBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 180, marginTop: 18, paddingTop: 6 },
  timelineBarWrap: { flex: 1, alignItems: 'center' },
  timelineTrack: { width: '100%', height: 140, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  timelineBar: { position: 'absolute', bottom: 0, width: '56%', borderRadius: 14, backgroundColor: '#7C5CFF' },
  timelineBarProvisional: { backgroundColor: '#C96A84' },
  timelinePotentialBar: { position: 'absolute', bottom: 0, width: '74%', borderRadius: 16, borderWidth: 1, borderColor: '#14E38B', backgroundColor: 'transparent' },
  timelinePotentialBarProvisional: { borderColor: '#FFB4C0' },
  timelineScore: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginTop: 10 },
  timelineScoreProvisional: { color: '#FFD7DF' },
  timelineTag: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7, marginTop: 6, textTransform: 'uppercase' },
  timelineTagClean: { color: '#9DDEBF' },
  timelineTagProvisional: { color: '#FFB4C0' },
  timelineLegend: { color: '#98A0B8', fontSize: 12, lineHeight: 18, marginTop: 14 },
  historySummaryCard: { padding: 18, borderRadius: 22, backgroundColor: '#17131A', borderWidth: 1, borderColor: '#4A3340', gap: 8, shadowColor: '#AA4C62', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  historySummaryTitle: { color: '#FFD7DF', fontSize: 15, fontWeight: '800' },
  historySummaryCopy: { color: '#C7B6BC', fontSize: 13, lineHeight: 19 },
  historyCard: { padding: 16, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#25283A', flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  historyCardActive: { borderColor: '#7C5CFF', shadowColor: '#7C5CFF', shadowOpacity: 0.14 },
  historyCardProvisional: { backgroundColor: '#17131A', borderColor: '#4A3340', shadowColor: '#AA4C62', shadowOpacity: 0.1 },
  historyThumb: { width: 56, height: 72, borderRadius: 14, backgroundColor: '#0D0E15', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  historyThumbImage: { width: '100%', height: '100%' },
  historyThumbGlyph: { color: '#FFFFFF', fontSize: 28 },
  historyMeta: { flex: 1 },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  historyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  historyStatusBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  historyStatusBadgeClean: { color: '#CFFBE7', backgroundColor: '#163424' },
  historyStatusBadgeProvisional: { color: '#FFD7DF', backgroundColor: '#341D24' },
  historySub: { color: '#98A0B8', fontSize: 12, marginTop: 4 },
  historyDeltaText: { color: '#14E38B', fontSize: 12, fontWeight: '700', marginTop: 6 },
  historyConfidenceText: { color: '#B7BBD0', fontSize: 11, marginTop: 6 },
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
  pricingCardMuted: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  pricingCardAccent: { padding: 20, borderRadius: 24, backgroundColor: '#171227', borderWidth: 1, borderColor: '#3B296A', shadowColor: '#7C5CFF', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  pricingTier: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  pricingHeadline: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 8 },
  pricingCopy: { color: '#B7BBD0', fontSize: 14, lineHeight: 20, marginTop: 8 },
  affiliateRow: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#2A2D3F', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  affiliateMeta: { flex: 1 },
  affiliateCategory: { color: '#FF4FD8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  affiliateName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 6 },
  affiliateReason: { color: '#AAB0C5', fontSize: 13, lineHeight: 18, marginTop: 6 },
  affiliateCta: { color: '#14E38B', fontSize: 12, fontWeight: '800', alignSelf: 'center' },
  planCard: { padding: 22, borderRadius: 26, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#2A2D3F', gap: 10, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  planCardAccent: { padding: 22, borderRadius: 26, backgroundColor: '#151225', borderWidth: 1, borderColor: '#3A2A69', gap: 10, shadowColor: '#7C5CFF', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTier: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  planLift: { color: '#14E38B', fontSize: 22, fontWeight: '900' },
  planHeadline: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '900' },
  planCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20 },
  planDetail: { color: '#B9C0D5', fontSize: 13, lineHeight: 19 },
  planDetailLabel: { color: '#FFFFFF', fontWeight: '800' },
  planMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 8, marginTop: 8 },
  planMetaPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1B1D28', borderWidth: 1, borderColor: '#2A2D3F' },
  planMetaText: { color: '#D3D7E8', fontSize: 12, fontWeight: '700' },
  retentionCard: { padding: 22, borderRadius: 26, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  battleArena: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 4 },
  battleCardSelf: { flex: 1, padding: 20, borderRadius: 26, backgroundColor: '#151225', borderWidth: 1, borderColor: '#3A2A69', alignItems: 'center', shadowColor: '#7C5CFF', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  battleCardOpponent: { flex: 1, padding: 20, borderRadius: 26, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#2A2D3F', alignItems: 'center', shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  battleVersus: { justifyContent: 'center', alignItems: 'center' },
  battleVersusText: { color: '#FF4FD8', fontSize: 18, fontWeight: '900' },
  battleInputLabel: { color: '#AAB0C5', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  battleInput: { borderRadius: 18, backgroundColor: '#171922', borderWidth: 1, borderColor: '#2A2D3F', color: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 13 },
  battleName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  battleScore: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', marginTop: 10 },
  battleSub: { color: '#C8CDDF', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  battleMeta: { color: '#14E38B', fontSize: 12, fontWeight: '800', marginTop: 8, textTransform: 'uppercase' },
  battleFootnote: { color: '#98A0B8', fontSize: 12, marginTop: 10 },
  potentialHero: { color: '#FFFFFF', fontSize: 54, fontWeight: '900', marginTop: 8 },
  retentionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  retentionCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 8 },
  retentionDatasetText: { color: '#14E38B', fontSize: 12, fontWeight: '700', marginTop: 10 },
  retentionDatasetPath: { color: '#98A0B8', fontSize: 11, lineHeight: 16, marginTop: 6 },
});
