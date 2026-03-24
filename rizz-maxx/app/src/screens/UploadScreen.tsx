import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

export function UploadScreen({ navigation }: Props) {
  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Upload"
        title="Upload 4-10 photos"
        subtitle="This shell proves the upload surface and navigation only. No image logic yet."
      />

      <InsightCard title="Upload zone">
        <View style={styles.uploadZone}>
          <Text style={styles.uploadTitle}>Add your dating profile photos</Text>
          <Text style={styles.uploadSub}>Thumbnails, reorder, remove, and analyze will land here next.</Text>
        </View>
      </InsightCard>

      <InsightCard title="Current shell scope">
        <Text style={styles.body}>• Empty state layout rendered</Text>
        <Text style={styles.body}>• CTA placement rendered</Text>
        <Text style={styles.body}>• Navigation path proven before real upload logic</Text>
      </InsightCard>

      <PrimaryButton label="Continue to results shell" onPress={() => navigation.navigate('Results')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  uploadZone: {
    minHeight: 220,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceElevated,
    gap: theme.spacing.sm,
  },
  uploadTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadSub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
});
