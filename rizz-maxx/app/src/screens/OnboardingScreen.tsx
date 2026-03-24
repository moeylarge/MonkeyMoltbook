import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { HeroCoverImage } from '../components/HeroCoverImage';
import { HeroPreviewCard } from '../components/HeroPreviewCard';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { StartUploadCard } from '../components/StartUploadCard';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <AppShell>
      <HeroCoverImage />

      <View style={styles.heroSpacer} />

      <ScreenHeader
        eyebrow="RIZZ MAXX"
        title="One bad photo can quietly kill attraction before you ever get a chance."
        subtitle="Upload your set and see what is helping — and what is costing you matches."
      />

      <PrimaryButton label="Upload photos now" onPress={() => navigation.navigate('Upload')} />

      <Text style={styles.previewTag}>Free preview first. Unlock deeper strategy only if you want it.</Text>
      <Text style={styles.bodyCopy}>RIZZ MAXX ranks your photos, finds your best opener, and shows where the lineup gets weaker.</Text>
      <StartUploadCard />

      <HeroPreviewCard />

      <InsightCard title="Why people use it">
        <Text style={styles.body}>• find the strongest lead photo fast</Text>
        <Text style={styles.body}>• spot weak images before they drag the whole profile down</Text>
        <Text style={styles.body}>• get direct next steps instead of guessing</Text>
      </InsightCard>

      <View style={styles.footerNote}>
        <Text style={styles.subtle}>The sharper the input truth, the more useful the result.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  previewTag: {
    color: theme.colors.accentBlue,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: theme.spacing.md,
  },
  bodyCopy: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  subtle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  heroSpacer: {
    height: theme.spacing.hero,
  },
  footerNote: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
});
