import { StyleSheet, Text, View } from 'react-native';
import { SavedAnalysis } from '../storage';
import { theme } from '../theme';

type Props = {
  items: SavedAnalysis[];
};

export function HistoryStatsCard({ items }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Profile history</Text>
        <Text style={styles.body}>No saved profile versions yet.</Text>
      </View>
    );
  }

  const scores = items.map((item) => item.score);
  const best = Math.max(...scores);
  const avg = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Profile history</Text>
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.value}>{items.length}</Text>
          <Text style={styles.label}>Saved versions</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.value}>{best}</Text>
          <Text style={styles.label}>Best score</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.value}>{avg}</Text>
          <Text style={styles.label}>Average</Text>
        </View>
      </View>
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
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metric: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
