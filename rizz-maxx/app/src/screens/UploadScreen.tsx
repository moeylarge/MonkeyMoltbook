import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { EmptyUploadState } from '../components/EmptyUploadState';
import { InsightCard } from '../components/InsightCard';
import { LoadingState } from '../components/LoadingState';
import { MetricCard } from '../components/MetricCard';
import { PhotoTile } from '../components/PhotoTile';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionPill } from '../components/SectionPill';
import { UploadTipsCard } from '../components/UploadTipsCard';
import { buildMockAnalysis } from '../mockAnalysis';
import { theme } from '../theme';
import { PhotoItem, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

const SAMPLE_PHOTOS: PhotoItem[] = [
  { id: 'sample-1', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { id: 'sample-2', uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { id: 'sample-3', uri: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=900&q=80' },
  { id: 'sample-4', uri: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
];

export function UploadScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingWeb = Platform.OS === 'web';
  const canAnalyze = photos.length >= 4;

  const photoStats = useMemo(() => {
    const remaining = Math.max(0, 10 - photos.length);
    return {
      count: `${photos.length}`,
      remaining: `${remaining}`,
      ready: canAnalyze ? 'Ready' : 'Needs 4+',
    };
  }, [photos.length, canAnalyze]);

  const addSamplePhotos = () => {
    setError(null);
    setPhotos(SAMPLE_PHOTOS);
  };

  const handlePickImages = async () => {
    setError(null);

    if (usingWeb) {
      addSamplePhotos();
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is required to test the upload flow on-device.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (result.canceled) {
      return;
    }

    const nextPhotos: PhotoItem[] = result.assets.map((asset, index) => ({
      id: `picked-${Date.now()}-${index}`,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName,
    }));

    setPhotos(nextPhotos.slice(0, 10));
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      setError('Add at least 4 photos before analysis.');
      return;
    }

    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 900));
    const result = buildMockAnalysis(photos);
    setIsLoading(false);
    navigation.navigate('Results', { photos, result });
  };

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Upload"
        title="Build the set you would actually post"
        subtitle="This flow is real at the surface level: load a set, reorder it, remove weak shots, and run the mocked analysis path."
      />

      <View style={styles.metricsRow}>
        <MetricCard label="Photos loaded" value={photoStats.count} tone="accent" />
        <MetricCard label="Open slots" value={photoStats.remaining} />
        <MetricCard label="Analysis state" value={photoStats.ready} tone={canAnalyze ? 'positive' : 'negative'} />
      </View>

      <InsightCard title="Upload zone">
        <SectionPill label={usingWeb ? 'WEB PROOF MODE' : 'DEVICE PICKER'} tone="accent" />
        <Text style={styles.helper}>
          {usingWeb
            ? 'Web proof mode loads a sample set so the full upload-to-results flow can be exercised honestly without native library access.'
            : 'Pick a real photo set from your device library.'}
        </Text>
        <PrimaryButton
          label={usingWeb ? 'Load sample photo set' : 'Pick photos'}
          onPress={handlePickImages}
        />
      </InsightCard>

      <UploadTipsCard />

      {error ? (
        <InsightCard title="Issue">
          <Text style={styles.error}>{error}</Text>
        </InsightCard>
      ) : null}

      {isLoading ? (
        <InsightCard title="Analysis loading">
          <LoadingState label="Ranking your strongest first impression and building your improvement plan..." />
        </InsightCard>
      ) : null}

      {photos.length > 0 ? (
        <InsightCard title={`Photo set · ${photos.length} of 10`}>
          <Text style={styles.setIntro}>
            Reorder until the strongest likely lead sits near the front. Remove anything that weakens trust or clarity.
          </Text>
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                rankLabel={index === 0 ? 'Lead candidate' : `#${index + 1}`}
                badgeTone={index === 0 ? 'best' : 'default'}
                onRemove={() => removePhoto(photo.id)}
                onMoveLeft={() => movePhoto(index, -1)}
                onMoveRight={() => movePhoto(index, 1)}
                disableMoveLeft={index === 0}
                disableMoveRight={index === photos.length - 1}
              />
            ))}
          </View>
        </InsightCard>
      ) : (
        <EmptyUploadState />
      )}

      <PrimaryButton label="Analyze my profile" onPress={handleAnalyze} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  helper: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  setIntro: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: theme.colors.negative,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
});
