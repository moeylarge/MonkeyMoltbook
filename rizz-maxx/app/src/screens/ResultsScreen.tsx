import { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { ListBlock } from '../components/ListBlock';
import { MetricCard } from '../components/MetricCard';
import { PhotoTile } from '../components/PhotoTile';
import { PremiumDetailsCard } from '../components/PremiumDetailsCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ResultsHero } from '../components/ResultsHero';
import { ScreenHeader } from '../components/ScreenHeader';
import { TopPhotoSummary } from '../components/TopPhotoSummary';
import { getBillingState } from '../billing';
import { saveAnalysis } from '../storage';
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

  const lineupGuidance = useMemo(() => {
    const slots = [
      'Lead with your strongest attraction signal so the first impression lands immediately.',
      'Follow with a trust-building shot that feels natural and grounded.',
      'Use the third slot for range so the profile does not feel repetitive.',
      'Use the fourth slot for lifestyle or social proof to widen appeal.',
      'Keep the fifth slot clean and supportive, not louder than the opener.',
      'Close with consistency so the full set feels intentional instead of random.',
    ];

    return rankedPhotos.slice(0, 6).map((photo, index) => `${index + 1}. ${photo?.fileName ?? `Photo ${index + 1}`} — ${slots[index]}`);
  }, [rankedPhotos]);

  const replacementGuidance = useMemo(() => {
    const seed = result.weaknesses.length > 0 ? result.weaknesses : result.actions;

    return seed.slice(0, 4).map((item, index) => {
      if (/dark|lighting|dim/i.test(item)) return 'Replace weak lighting with a brighter close-up that keeps your face clear and easy to read.';
      if (/selfie|angle|camera/i.test(item)) return 'Replace forced-angle shots with a cleaner eye-level photo that feels natural and higher-trust.';
      if (/group|busy|background/i.test(item)) return 'Replace cluttered frames with a cleaner shot where you are the obvious focus.';
      if (/expression|smile|stiff/i.test(item)) return 'Replace flat expression photos with a more relaxed shot that feels warmer and more socially natural.';
      if (/style|fit|body/i.test(item)) return 'Add one cleaner full-body or style-driven shot so the set shows range without looking try-hard.';
      return index % 2 === 0
        ? 'Replace one weak photo with a brighter, cleaner close-up that builds trust faster.'
        : 'Replace one low-signal photo with a lifestyle or social-proof shot that adds range to the lineup.';
    });
  }, [result.actions, result.weaknesses]);

  const analysisId = useMemo(() => savedId ?? `analysis-${Date.now()}-${result.score}`, [savedId, result.score]);

  useEffect(() => {
    getBillingState().then((state) => setPremiumUnlocked(state.hasProAccess)).catch(() => setPremiumUnlocked(false));
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
        eyebrow={premiumUnlocked ? 'Pro Result' : 'Free Preview'}
        title="Your profile result"
        subtitle={premiumUnlocked
          ? 'A sharper read on what should lead, what should go, and what strengthens the lineup.'
          : 'A first read on the signal. Unlock Pro for the full ranking, lineup strategy, and replacement moves.'}
      />

      <ResultsHero score={result.score} summary={result.summary} source={result.source} />

      <View style={styles.metricsGrid}>
        <MetricCard label="Conf." value={result.confidence === 'Medium' ? 'Med' : result.confidence === 'High' ? 'High' : 'Low'} tone="accent" />
        <MetricCard label="Photos" value={`${photos.length}`} />
        <MetricCard label="Move" value="Cut weak" tone="negative" />
      </View>

      <InsightCard title="What this means for your profile">
        <Text style={styles.meaningLead}>
          {result.score >= 80
            ? 'You already have something real to build around.'
            : result.score >= 70
              ? 'You are closer than the current profile makes it look.'
              : 'Right now the weak photos are speaking too loudly.'}
        </Text>
        <Text style={styles.meaningText}>
          {result.score >= 80
            ? 'The goal is no longer guessing. Protect the lead photo, keep the strongest support shots, and remove anything that makes the set feel less intentional.'
            : result.score >= 70
              ? 'The top of the set has promise, but the weaker images are softening the first impression. Tightening the set should produce visible improvement.'
              : 'The profile is sending mixed signals. The fastest gains come from removing drag, not adding more random photos.'}
        </Text>
      </InsightCard>

      <InsightCard title="Saved state">
        <Text style={styles.persistenceText}>
          {saveState === 'saved'
            ? 'This result is saved in profile history.'
            : saveState === 'error'
              ? 'Save failed, but the result is still visible in this session.'
              : 'Saving this result to profile history...'}
        </Text>
      </InsightCard>

      {premiumUnlocked ? (
        <PremiumDetailsCard result={result} />
      ) : (
        <InsightCard title="Unlock full strategy">
          <Text style={styles.lockedLead}>The preview proves there is signal here. Pro turns that signal into a cleaner, stronger lineup.</Text>
          <Text style={styles.lockedText}>Unlock the full ranking, lineup strategy, replacement guidance, and compare mode.</Text>
        </InsightCard>
      )}

      <InsightCard title="Best photo to lead with">
        <TopPhotoSummary
          uri={bestPhoto.uri}
          title="This is your strongest first impression"
          body="This shot is carrying the profile better than the others. If someone sees one image first, this is the one most likely to make the set feel stronger and more intentional."
          tone="positive"
        />
      </InsightCard>

      <InsightCard title="First photo to remove">
        <TopPhotoSummary
          uri={weakestPhoto.uri}
          title="This is the first cut to make"
          body="This image is pulling the set downward harder than the others. Removing it is the cleanest way to improve the profile without guessing." 
          tone="negative"
        />
      </InsightCard>

      {premiumUnlocked ? (
        <>
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

          <InsightCard title="Your best 6-photo lineup">
            <Text style={styles.lockedLead}>This is the order that should carry the profile hardest from first impression to final support shot.</Text>
            <ListBlock items={lineupGuidance.length > 0 ? lineupGuidance : ['1. Lead with your strongest opener.', '2. Follow with trust.', '3. Add range.', '4. Add lifestyle.', '5. Keep support clean.', '6. Close with consistency.']} />
          </InsightCard>

          <InsightCard title="Replacement guidance">
            <Text style={styles.lockedLead}>Do not just cut weak photos. Replace them with images that fix the missing signal.</Text>
            <ListBlock items={replacementGuidance} />
          </InsightCard>

          <InsightCard title="What is working">
            <ListBlock items={result.strengths} tone="positive" />
          </InsightCard>

          <InsightCard title="What is costing you">
            <ListBlock items={result.weaknesses} tone="negative" />
          </InsightCard>

          <InsightCard title="What to do next">
            <ListBlock items={result.actions} />
          </InsightCard>

          <View style={styles.actions}>
            <PrimaryButton label="Open profile history" onPress={() => navigation.navigate('Saved')} style={styles.savedButton} />
            <PrimaryButton label="Compare a new set" onPress={() => navigation.navigate('Compare')} style={styles.premiumButton} />
          </View>
        </>
      ) : (
        <>
          <InsightCard title="Locked: your best 6-photo order">
            <Text style={styles.lockedText}>See the exact lineup that gives your profile the strongest first impression from photo one through photo six.</Text>
          </InsightCard>

          <InsightCard title="Locked: what is costing you matches">
            <Text style={styles.lockedText}>Unlock the weak photos, mixed signals, and trust leaks that are dragging the profile down.</Text>
          </InsightCard>

          <InsightCard title="Locked: replacement guidance">
            <Text style={styles.lockedText}>Find out what kind of photo should replace your weakest shot so the next upload performs better.</Text>
          </InsightCard>

          <InsightCard title="Locked: compare and progress">
            <Text style={styles.lockedText}>Re-test new sets against older ones and track whether your profile is actually improving over time.</Text>
          </InsightCard>

          <View style={styles.actions}>
            <PrimaryButton label="Unlock RizzMaxx Pro — $4.99/month" onPress={() => navigation.navigate('Premium')} style={styles.premiumButton} />
            <PrimaryButton label="Get Lifetime Access" onPress={() => navigation.navigate('Premium')} style={styles.savedButton} />
          </View>
        </>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  meaningLead: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  meaningText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  persistenceText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  lockedLead: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  lockedText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
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
  savedButton: {
    backgroundColor: '#5B8CFF',
  },
  premiumButton: {
    backgroundColor: theme.colors.negative,
  },
});
