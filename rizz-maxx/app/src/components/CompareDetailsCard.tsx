import { StyleSheet, Text, View } from 'react-native';
import { SavedAnalysis } from '../storage';
import { theme } from '../theme';

type Props = {
  latest?: SavedAnalysis;
  previous?: SavedAnalysis;
};

export function CompareDetailsCard({ latest, previous }: Props) {
  if (!latest || !previous) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>What changed</Text>
        <Text style={styles.body}>Save at least two runs to compare how your profile is moving over time.</Text>
      </View>
    );
  }

  const delta = latest.score - previous.score;
  const directionText =
    delta > 0
      ? `improved by ${Math.abs(delta)} point${Math.abs(delta) === 1 ? '' : 's'}`
      : delta < 0
        ? `dropped by ${Math.abs(delta)} point${Math.abs(delta) === 1 ? '' : 's'}`
        : 'held flat';
  const changedLead = latest.bestPhotoId !== previous.bestPhotoId;
  const changedWeakest = latest.weakestPhotoId !== previous.weakestPhotoId;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>What changed</Text>
      <Text style={styles.body}>
        Your latest saved run {directionText}.{' '}
        {changedLead ? 'This new lead photo beats your previous #1.' : 'Your lead photo stayed the same.'}{' '}
        {changedWeakest ? 'You also changed the weakest-photo slot, which is a good sign of active cleanup.' : 'The weakest-photo slot stayed the same, so that may still need attention.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
