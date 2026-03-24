import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PhotoTile } from '../components/PhotoTile';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { photos, result } = route.params;
  const bestPhoto = photos.find((photo) => photo.id === result.bestPhotoId) ?? photos[0];
  const weakestPhoto = photos.find((photo) => photo.id === result.weakestPhotoId) ?? photos[photos.length - 1];
  const rankedPhotos = result.rankedPhotoIds
    .map((id) => photos.find((photo) => photo.id === id))
    .filter(Boolean);

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Results"
        title="Your profile result"
        subtitle="This is a real Phase 4 flow using the current uploaded set and a mocked local analysis payload."
      />

      <View style={styles.scoreHero}>
        <Text style={styles.score}>{result.score}</Text>
        <Text style={styles.scoreLabel}>Profile strength</Text>
        <Text style={styles.confidence}>{result.confidence} confidence</Text>
        <Text style={styles.scoreSub}>{result.summary}</Text>
      </View>

      <InsightCard title="Best first photo">
        <Image source={{ uri: bestPhoto.uri }} style={styles.heroImage} />
        <Text style={styles.body}>This image currently gives you the strongest lead-photo position in the set.</Text>
      </InsightCard>

      <InsightCard title="Weakest photo">
        <Image source={{ uri: weakestPhoto.uri }} style={styles.heroImage} />
        <Text style={styles.body}>This photo is creating the most drag and should be the first removal candidate.</Text>
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
        {result.strengths.map((item) => (
          <Text key={item} style={styles.body}>• {item}</Text>
        ))}
      </InsightCard>

      <InsightCard title="Weaknesses">
        {result.weaknesses.map((item) => (
          <Text key={item} style={styles.body}>• {item}</Text>
        ))}
      </InsightCard>

      <InsightCard title="Action plan">
        {result.actions.map((item) => (
          <Text key={item} style={styles.body}>• {item}</Text>
        ))}
      </InsightCard>

      <PrimaryButton label="View saved analyses shell" onPress={() => navigation.navigate('Saved')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scoreHero: {
    borderRadius: theme.radius.sheet,
    padding: theme.spacing.xxxl,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  score: {
    color: theme.colors.textPrimary,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '800',
  },
  scoreLabel: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  confidence: {
    color: theme.colors.accentBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  scoreSub: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1.12,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceElevated,
  },
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
});
