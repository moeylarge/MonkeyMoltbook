import AsyncStorage from '@react-native-async-storage/async-storage';
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
  View,
} from 'react-native';

type ScreenKey =
  | 'hook'
  | 'upload'
  | 'scan'
  | 'result'
  | 'breakdown'
  | 'simulate'
  | 'history'
  | 'paywall'
  | 'plan';

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
};

const STORAGE_KEY = 'facemaxx.scanHistory.v1';
const screens: ScreenKey[] = ['hook', 'upload', 'scan', 'result', 'breakdown', 'simulate', 'history', 'paywall', 'plan'];
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

function buildScanFromSeed(seedSource: string, photoLabel: string, imageUri?: string): ScanRecord {
  const hash = hashString(seedSource + photoLabel);
  const baseScore = 58 + (hash % 19);
  const detailA = (hash >> 3) % 9;
  const detailB = (hash >> 6) % 8;
  const detailC = (hash >> 9) % 7;

  const breakdownSeed: BreakdownItem[] = [
    {
      key: 'jawline',
      label: 'Jawline',
      score: clamp(baseScore - 6 + detailA, 44, 89),
      target: 0,
      why: 'Lower-face definition improves fast when framing and leanness stop fighting each other.',
      color: '#7C5CFF',
    },
    {
      key: 'eyes',
      label: 'Eye area',
      score: clamp(baseScore + 1 + detailB, 46, 92),
      target: 0,
      why: 'Presence is already there. Small cleanup multiplies perceived sharpness.',
      color: '#FF4FD8',
    },
    {
      key: 'skin',
      label: 'Skin quality',
      score: clamp(baseScore - 10 + detailC, 40, 84),
      target: 0,
      why: 'Texture and tone are often the fastest visible gain in first impression.',
      color: '#14E38B',
    },
    {
      key: 'symmetry',
      label: 'Symmetry',
      score: clamp(baseScore - 1 + ((hash >> 12) % 6), 48, 88),
      target: 0,
      why: 'Already decent. Better angles matter more than chasing perfect balance.',
      color: '#4DA3FF',
    },
    {
      key: 'hair',
      label: 'Hair / framing',
      score: clamp(baseScore - 8 + ((hash >> 15) % 10), 41, 86),
      target: 0,
      why: 'Frame control changes how the same face reads before anything else.',
      color: '#FF8A3D',
    },
    {
      key: 'thirds',
      label: 'Facial thirds',
      score: clamp(baseScore - 4 + ((hash >> 18) % 9), 45, 88),
      target: 0,
      why: 'Balance gets stronger when top volume and lower-face styling work together.',
      color: '#FFD24D',
    },
  ];

  const breakdown: BreakdownItem[] = breakdownSeed.map((item, index) => {
    const targetLift = 7 + ((hash >> (index + 2)) % 12);
    return { ...item, target: clamp(item.score + targetLift, item.score + 4, 95) };
  });

  const score = Math.round(breakdown.reduce((sum, item) => sum + item.score, 0) / breakdown.length);
  const potential = Math.round(
    clamp(breakdown.reduce((sum, item) => sum + item.target, 0) / breakdown.length + 2, score + 6, 95),
  );

  const archetypes = ['Sharp Jaw Archetype', 'Pretty Boy Signal', 'Soft Aesthetic', 'Model Type B'];
  const archetype = archetypes[hash % archetypes.length];

  let tier = 'ATTRACTIVE';
  let rank = 'SILVER SIGNAL';
  if (score < 55) {
    tier = 'BUILDING';
    rank = 'BRONZE SIGNAL';
  } else if (score >= 82) {
    tier = 'ELITE';
    rank = 'ELITE SIGNAL';
  } else if (score >= 72) {
    tier = 'ATTRACTIVE';
    rank = 'SILVER SIGNAL';
  } else {
    tier = 'RISING';
    rank = 'GOLD SIGNAL';
  }

  return {
    id: `${Date.now()}-${hash}`,
    createdAt: new Date().toISOString(),
    photoLabel,
    imageUri,
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

  const topImprovement = useMemo(() => {
    if (!activeScan) return null;
    return [...activeScan.breakdown].sort((a, b) => b.target - b.score - (a.target - a.score))[0];
  }, [activeScan]);

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
        setImageUri(result.assets[0].uri);
      }
    } finally {
      setBusyPicking(false);
    }
  };

  const startScan = async () => {
    const seed = imageUri ?? `${selectedPhoto}-${Date.now()}`;
    const scan = buildScanFromSeed(seed, selectedPhoto, imageUri);
    setCurrentScan(scan);
    const nextHistory = [scan, ...history].slice(0, 12);
    await persistHistory(nextHistory);
    setScreen('scan');
  };

  const resetFlow = () => {
    setSelectedPhoto('Front selfie');
    setImageUri(undefined);
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
      <Text style={styles.heroTitle}>How do you actually look?</Text>
      <Text style={styles.heroSub}>One photo. One score. One brutally clear path from current signal to stronger signal.</Text>

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
      <Text style={styles.sectionTitle}>Load a real image, then let the local engine score it.</Text>

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTag}>PHASE 3 LIVE INPUT</Text>
        <Text style={styles.uploadTitle}>{selectedPhoto}</Text>
        <Text style={styles.uploadCopy}>This now accepts a real image from your library and saves the scan locally on-device.</Text>
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
          <Text style={styles.infoValue}>{imageUri ? 'LIVE' : 'MOCK'}</Text>
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
        <Text style={styles.secondaryButtonText}>{busyPicking ? 'Opening Photos…' : imageUri ? 'Change Photo' : 'Choose Photo'}</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={startScan}>
        <Text style={styles.primaryButtonText}>Run Scan</Text>
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
          <Text style={styles.resultLabel}>Face Score</Text>
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
          <Text style={styles.identityLineTitle}>Signal read</Text>
          <Text style={styles.identityLineText}>
            {topImprovement
              ? `Your biggest visible upside is ${topImprovement.label.toLowerCase()}. That is the easiest place to create a stronger first impression.`
              : 'Good base. The upside is in polish, framing, and consistency.'}
          </Text>
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
        <Text style={styles.sectionTitle}>Current score versus reachable score.</Text>
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
          <Text style={styles.shareCaption}>Be honest… am I cooked or leveling up?</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setScreen('history')}>
          <Text style={styles.primaryButtonText}>Open Scan History</Text>
        </Pressable>
      </View>
    );
  };

  const renderHistory = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Saved history</Text>
      <Text style={styles.sectionTitle}>Local scan records for rerating and progress tracking.</Text>
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
      <Text style={styles.sectionTitle}>The app now feels real; this is the upgrade spine.</Text>
      <Animated.View
        style={[
          styles.paywallCard,
          { shadowOpacity: paywallGlow.interpolate({ inputRange: [0.25, 1], outputRange: [0.12, 0.42] }) },
        ]}
      >
        <Text style={styles.paywallTier}>PRO SCAN</Text>
        <Text style={styles.paywallPrice}>$7.99</Text>
        <Text style={styles.paywallCopy}>Full breakdown, exportable score card, weekly rerating loop, premium glow-up plan.</Text>
        {['Asymmetry map', 'Hairline recommendation', 'Weekly rerating', 'Glow-up tracker'].map((item, index) => (
          <View key={item} style={[styles.lockedRow, lockedIndex === index && styles.lockedRowActive]}>
            <Text style={styles.lockedRowText}>{item}</Text>
            <Text style={styles.lockedRowTag}>LOCKED</Text>
          </View>
        ))}
      </Animated.View>
      <Pressable style={styles.primaryButton} onPress={() => setScreen('plan')}>
        <Text style={styles.primaryButtonText}>See Improvement Plan</Text>
      </Pressable>
    </View>
  );

  const renderPlan = () => (
    <View style={styles.screenBlock}>
      <Text style={styles.sectionKick}>Improvement engine</Text>
      <Text style={styles.sectionTitle}>Use the score, save the rerates, build the climb.</Text>
      <View style={styles.planCard}>
        <Text style={styles.planTier}>FREE</Text>
        <Text style={styles.planHeadline}>Fix framing before chasing perfect genetics</Text>
        <Text style={styles.planCopy}>Hair outline, camera angle, lower-face definition, light, and consistency first.</Text>
      </View>
      <View style={styles.planCard}>
        <Text style={styles.planTier}>INTERMEDIATE</Text>
        <Text style={styles.planHeadline}>Turn your strongest angles into your default look</Text>
        <Text style={styles.planCopy}>Skin reset, brow cleanup, beard-line control, posture, neck, and fit.</Text>
      </View>
      <View style={styles.planCardAccent}>
        <Text style={styles.planTier}>ADVANCED</Text>
        <Text style={styles.planHeadline}>Push the face into higher-status territory</Text>
        <Text style={styles.planCopy}>Lean-down targets, gym protocol, premium grooming, and tracked rerates over time.</Text>
      </View>
      <View style={styles.retentionCard}>
        <Text style={styles.retentionTitle}>Phase 3 proof</Text>
        <Text style={styles.retentionCopy}>Real image picking, local score generation, and persisted history are now wired into the app.</Text>
      </View>
      <Pressable style={styles.primaryButton} onPress={resetFlow}>
        <Text style={styles.primaryButtonText}>Restart Experience</Text>
      </Pressable>
    </View>
  );

  const renderCurrent = () => {
    switch (screen) {
      case 'hook':
        return renderHook();
      case 'upload':
        return renderUpload();
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  topNav: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 8, paddingBottom: 18, flexWrap: 'wrap' },
  navDotWrap: { padding: 4 },
  navDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#2A2A34' },
  navDotActive: { width: 20, backgroundColor: '#FF4FD8' },
  heroWrap: { minHeight: 720, justifyContent: 'center', alignItems: 'center', gap: 18 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#A0A5BC', fontSize: 12, fontWeight: '700', letterSpacing: 1.7 },
  liveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#14E38B' },
  heroOrb: { width: 232, height: 232, borderRadius: 999, backgroundColor: '#14151F', borderWidth: 1, borderColor: '#2D3041', shadowColor: '#7C5CFF', shadowOpacity: 0.35, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, alignItems: 'center', justifyContent: 'center' },
  heroOrbCore: { width: 156, height: 156, borderRadius: 999, backgroundColor: '#0E0F16', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#26293C' },
  heroOrbScore: { color: '#FFFFFF', fontSize: 52, fontWeight: '900' },
  heroOrbLabel: { color: '#9DA3B8', fontSize: 12, marginTop: 4 },
  heroTitle: { color: '#FFFFFF', fontSize: 42, fontWeight: '900', textAlign: 'center', lineHeight: 46, maxWidth: 320 },
  heroSub: { color: '#B7BBD0', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 315 },
  statRail: { flexDirection: 'row', gap: 12, marginTop: 10 },
  statChip: { width: 145, paddingVertical: 16, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#222431' },
  statNumber: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#8F95AE', fontSize: 12, marginTop: 4 },
  primaryButton: { width: '100%', marginTop: 14, paddingVertical: 18, borderRadius: 24, backgroundColor: '#7C5CFF', alignItems: 'center', shadowColor: '#7C5CFF', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryButton: { width: '100%', marginTop: 10, paddingVertical: 16, borderRadius: 24, backgroundColor: '#151621', alignItems: 'center', borderWidth: 1, borderColor: '#282B3D' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  screenBlock: { paddingTop: 14, gap: 16 },
  sectionKick: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, fontWeight: '900', maxWidth: 330 },
  uploadCard: { padding: 20, borderRadius: 28, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#272A3C', gap: 14 },
  uploadTag: { color: '#14E38B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  uploadTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  uploadCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20 },
  photoPreview: { height: 270, borderRadius: 24, backgroundColor: '#0D0E15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#242637', overflow: 'hidden' },
  photoImageLarge: { width: '100%', height: '100%' },
  photoImageSmall: { width: 86, height: 110, borderRadius: 18 },
  photoFaceLarge: { color: '#FFFFFF', fontSize: 88 },
  photoFaceSmall: { color: '#FFFFFF', fontSize: 56 },
  optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optionChip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: '#151621', borderWidth: 1, borderColor: '#2A2D3F' },
  optionChipActive: { backgroundColor: '#1A1430', borderColor: '#7C5CFF' },
  optionText: { color: '#B3B8CE', fontSize: 13, fontWeight: '700' },
  optionTextActive: { color: '#FFFFFF' },
  infoStack: { flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, padding: 16, borderRadius: 18, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  infoValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  infoLabel: { color: '#8F95AE', fontSize: 12, marginTop: 4 },
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
  dualStats: { flexDirection: 'row', gap: 12 },
  miniStatCard: { flex: 1, padding: 18, borderRadius: 20, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  miniStatCardAccent: { flex: 1, padding: 18, borderRadius: 20, backgroundColor: '#151225', borderWidth: 1, borderColor: '#31245A' },
  miniStatTop: { color: '#9CA2B9', fontSize: 12, fontWeight: '700' },
  miniStatValue: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 6 },
  identityLine: { padding: 18, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  identityLineTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  identityLineText: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 6 },
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
  simCardWrap: { flexDirection: 'row', gap: 12 },
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
  loadingCard: { padding: 22, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535', alignItems: 'center', gap: 10 },
  loadingText: { color: '#C8CDDF', fontSize: 14 },
  historyCard: { padding: 14, borderRadius: 22, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535', flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyCardActive: { borderColor: '#7C5CFF' },
  historyThumb: { width: 56, height: 72, borderRadius: 14, backgroundColor: '#0D0E15', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  historyThumbImage: { width: '100%', height: '100%' },
  historyThumbGlyph: { color: '#FFFFFF', fontSize: 28 },
  historyMeta: { flex: 1 },
  historyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  historySub: { color: '#98A0B8', fontSize: 12, marginTop: 4 },
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
  planCard: { padding: 20, borderRadius: 24, backgroundColor: '#11121A', borderWidth: 1, borderColor: '#232535', gap: 8 },
  planCardAccent: { padding: 20, borderRadius: 24, backgroundColor: '#151225', borderWidth: 1, borderColor: '#32255F', gap: 8 },
  planTier: { color: '#FF4FD8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  planHeadline: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '900' },
  planCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20 },
  retentionCard: { padding: 20, borderRadius: 24, backgroundColor: '#12131A', borderWidth: 1, borderColor: '#232535' },
  retentionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  retentionCopy: { color: '#AAB0C5', fontSize: 14, lineHeight: 20, marginTop: 8 },
});
