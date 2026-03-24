import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation }: Props) {
  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Results"
        title="Results shell"
        subtitle="The hierarchy is rendered here first. Real scoring and analysis are still intentionally unbuilt."
      />

      <View style={styles.scoreHero}>
        <Text style={styles.score}>78</Text>
        <Text style={styles.scoreLabel}>Profile strength</Text>
        <Text style={styles.scoreSub}>You have a few strong assets, but the set still leaks value.</Text>
      </View>

      <InsightCard title="Best first photo">
        <Text style={styles.body}>Hero image slot + short why-it-wins explanation.</Text>
      </InsightCard>

      <InsightCard title="Action plan preview">
        <Text style={styles.body}>• Replace your weakest low-clarity photo</Text>
        <Text style={styles.body}>• Add one better-lit full-body shot</Text>
        <Text style={styles.body}>• Tighten the first impression with a cleaner lead</Text>
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
  scoreSub: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
});
