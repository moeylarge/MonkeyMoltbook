import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { LoadingState } from '../components/LoadingState';
import { PhotoTile } from '../components/PhotoTile';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
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
    if (photos.length < 4) {
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
        title="Upload 4-10 photos"
        subtitle="Phase 4 now uses a real selectable set, reorder controls, remove actions, and an analysis trigger."
      />

      <InsightCard title="Upload zone">
        <Text style={styles.helper}>
          {usingWeb
            ? 'Web proof mode uses a sample photo set so the flow can be exercised honestly without native library access.'
            : 'Pick a real photo set from your device library.'}
        </Text>
        <PrimaryButton
          label={usingWeb ? 'Load sample photo set' : 'Pick photos'}
          onPress={handlePickImages}
        />
      </InsightCard>

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
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                rankLabel={`#${index + 1}`}
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
        <InsightCard title="Current shell scope">
          <Text style={styles.body}>• Empty upload state is real</Text>
          <Text style={styles.body}>• Photo set can now be loaded</Text>
          <Text style={styles.body}>• Reorder/remove controls are active</Text>
          <Text style={styles.body}>• Analyze CTA now drives a real mocked result path</Text>
        </InsightCard>
      )}

      <PrimaryButton label="Analyze my profile" onPress={handleAnalyze} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
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
