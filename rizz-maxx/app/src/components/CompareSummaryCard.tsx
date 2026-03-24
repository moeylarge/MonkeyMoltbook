import { StyleSheet, Text, View } from 'react-native';
import { SavedAnalysis } from '../storage';
import { theme } from '../theme';

type Props = {
  latest?: SavedAnalysis;
  previous?: SavedAnalysis;
};

export function CompareSummaryCard({ latest, previous }: Props) {
  if (!latest) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Profile progress</Text>
        <Text style={styles.body}>No profile history exists yet. Run and save an analysis first.</Text>
      </View>
    );
  }

  if (!previous) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Profile progress</Text>
        <Text style={styles.body}>Save at least two analyses to see whether your lineup is actually improving.</Text>
      </View>
    );
  }

  const delta = latest.score - previous.score;
  const improved = delta > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Profile progress</Text>
      <Text style={styles.delta}>{delta === 0 ? 'No change' : `${improved ? '+' : ''}${delta} point${Math.abs(delta) === 1 ? '' : 's'}`}</Text>
      <Text style={styles.body}>
        {delta > 0
          ? 'Your newest saved set is performing better than the previous one.'
          : delta < 0
            ? 'Your newest saved set is underperforming the previous one and likely needs lineup cleanup.'
            : 'Your latest saved set is flat against the previous version.'}
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
  delta: {
    color: theme.colors.accentBlue,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
