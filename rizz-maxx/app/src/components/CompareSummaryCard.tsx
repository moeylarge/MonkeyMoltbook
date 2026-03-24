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
        <Text style={styles.title}>Comparison</Text>
        <Text style={styles.body}>No saved trend exists yet. Run and save an analysis first.</Text>
      </View>
    );
  }

  if (!previous) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Comparison</Text>
        <Text style={styles.body}>You need at least two saved analyses before trend comparison becomes useful.</Text>
      </View>
    );
  }

  const delta = latest.score - previous.score;
  const improved = delta > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Comparison</Text>
      <Text style={styles.delta}>{delta === 0 ? 'No change' : `${improved ? '+' : ''}${delta} point${Math.abs(delta) === 1 ? '' : 's'}`}</Text>
      <Text style={styles.body}>
        {delta > 0
          ? 'The newest set is scoring better than the previous saved run.'
          : delta < 0
            ? 'The newest set is scoring worse than the previous saved run and needs cleanup.'
            : 'The latest save is effectively flat against the previous one.'}
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
