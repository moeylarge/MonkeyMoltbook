import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <AppShell>
      <ScreenHeader
        eyebrow="RIZZ MAXX"
        title="Your dating profile is only as strong as your weakest photo."
        subtitle="Rank your photos, pick your best lead, and see exactly what to fix."
      />

      <InsightCard title="What you get">
        <Text style={styles.body}>• Best lead photo recommendation</Text>
        <Text style={styles.body}>• Weak-photo cleanup guidance</Text>
        <Text style={styles.body}>• A clearer path to a stronger profile</Text>
      </InsightCard>

      <InsightCard title="How it should feel">
        <Text style={styles.subtle}>
          Fast, sharp, honest, and built like a premium consumer product — not a toy demo.
        </Text>
      </InsightCard>

      <View style={styles.spacer} />
      <PrimaryButton label="Optimize my profile" onPress={() => navigation.navigate('Upload')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  subtle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing.xxl,
  },
});
