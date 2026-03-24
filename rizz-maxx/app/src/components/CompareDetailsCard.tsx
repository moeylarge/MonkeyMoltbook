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
        <Text style={styles.body}>Save at least two runs to compare profile movement.</Text>
      </View>
    );
  }

  const delta = latest.score - previous.score;
  const direction = delta > 0 ? 'improved' : delta < 0 ? 'dropped' : 'held flat';
  const changedLead = latest.bestPhotoId !== previous.bestPhotoId;
  const changedWeakest = latest.weakestPhotoId !== previous.weakestPhotoId;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>What changed</Text>
      <Text style={styles.body}>
        Your latest saved run {direction} {delta === 0 ? '' : `by ${Math.abs(delta)} point${Math.abs(delta) === 1 ? '' : 's'}`}. 
        {changedLead ? 'The lead-photo recommendation changed.' : 'The lead-photo recommendation stayed the same.'} 
        {changedWeakest ? 'The weakest-photo slot changed too.' : 'The weakest-photo slot stayed the same.'}
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
