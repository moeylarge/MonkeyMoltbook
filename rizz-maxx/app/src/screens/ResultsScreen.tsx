import { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { ListBlock } from '../components/ListBlock';
import { MetricCard } from '../components/MetricCard';
import { PhotoTile } from '../components/PhotoTile';
import { PremiumDetailsCard } from '../components/PremiumDetailsCard';
import { PremiumPreviewCard } from '../components/PremiumPreviewCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ResultsHero } from '../components/ResultsHero';
import { ScreenHeader } from '../components/ScreenHeader';
import { TopPhotoSummary } from '../components/TopPhotoSummary';
import { isPremiumUnlocked, saveAnalysis } from '../storage';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { photos, result, savedId } = route.params;
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>(savedId ? 'saved' : 'idle');
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);

  const bestPhoto = photos.find((photo) => photo.id === result.bestPhotoId) ?? photos[0];
  const weakestPhoto = photos.find((photo) => photo.id === result.weakestPhotoId) ?? photos[photos.length - 1];
  const rankedPhotos = result.rankedPhotoIds
    .map((id) => photos.find((photo) => photo.id === id))
    .filter(Boolean);

  const analysisId = useMemo(() => savedId ?? `analysis-${Date.now()}-${result.score}`, [savedId, result.score]);

  useEffect(() => {
    isPremiumUnlocked().then(setPremiumUnlocked).catch(() => setPremiumUnlocked(false));
  }, []);

  useEffect(() => {
    if (savedId) return;

    saveAnalysis({
      id: analysisId,
      createdAt: new Date().toISOString(),
      score: result.score,
      confidence: result.confidence,
      source: result.source,
      summary: result.summary,
      bestPhotoId: result.bestPhotoId,
      weakestPhotoId: result.weakestPhotoId,
      photos,
      result,
    })
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('error'));
  }, [analysisId, photos, result, savedId]);

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Results"
        title="Your profile result"
        subtitle="This result stays honest about its source: real local analysis when available, explicit mock fallback when it is not."
      />

      <ResultsHero score={result.score} summary={result.summary} source={result.source} />

      <View style={styles.metricsGrid}>
        <MetricCard label="Conf." value={result.confidence === 'Medium' ? 'Med' : result.confidence === 'High' ? 'High' : 'Low'} tone="accent" />
        <MetricCard label="Photos" value={`${photos.length}`} />
        <MetricCard label="Move" value="Cut weak" tone="negative" />
      </View>

      <InsightCard title="Persistence">
        <Text style={styles.persistenceText}>
          {saveState === 'saved'
            ? 'This analysis is saved and can be reopened from history.'
            : saveState === 'error'
              ? 'Save failed in local persistence mode. The report is still visible in the current session.'
              : 'Saving analysis...'}
        </Text>
      </InsightCard>

      <PremiumPreviewCard unlocked={premiumUnlocked} />
      {premiumUnlocked ? <PremiumDetailsCard result={result} /> : null}

      <InsightCard title="Top signal">
        <TopPhotoSummary
          uri={bestPhoto.uri}
          title="This is your strongest lead-photo candidate"
          body="It gives the set the best first-impression position right now and should anchor the profile unless a stronger replacement beats it later."
          tone="positive"
        />
      </InsightCard>

      <InsightCard title="Biggest drag">
        <TopPhotoSummary
          uri={weakestPhoto.uri}
          title="This is the first removal candidate"
          body="It creates the most drag in the current set and is the cleanest place to improve the profile fast."
          tone="negative"
        />
      </InsightCard>

      <InsightCard title="Ranked set">
        <View style={styles.grid}>
          {rankedPhotos.map((photo, index) => (
            <PhotoTile
              key={photo!.id}
              photo={photo!}
              rankLabel={index === 0 ? 'Best' : index === rankedPhotos.length - 1 ? 'Weakest' : `#${index + 1}`}
              badgeTone={index === 0 ? 'best' : index === rankedPhotos.length - 1 ? 'weak' : 'default'}
              disableMoveLeft
              disableMoveRight
            />
          ))}
        </View>
      </InsightCard>

      <InsightCard title="Strengths">
        <ListBlock items={result.strengths} tone="positive" />
      </InsightCard>

      <InsightCard title="Weaknesses">
        <ListBlock items={result.weaknesses} tone="negative" />
      </InsightCard>

      <InsightCard title="Action plan">
        <ListBlock items={result.actions} />
      </InsightCard>

      <View style={styles.actions}>
        <PrimaryButton label="View saved analyses" onPress={() => navigation.navigate('Saved')} />
        <PrimaryButton label="Open premium" onPress={() => navigation.navigate('Premium')} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  persistenceText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  actions: {
    gap: theme.spacing.md,
  },
});
