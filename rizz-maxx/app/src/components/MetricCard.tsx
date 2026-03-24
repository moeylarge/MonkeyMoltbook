import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
};

export function MetricCard({ label, value, tone = 'default' }: Props) {
  return (
    <View
      style={[
        styles.card,
        tone === 'positive' ? styles.positive : null,
        tone === 'negative' ? styles.negative : null,
        tone === 'accent' ? styles.accent : null,
      ]}
    >
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 88,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  positive: {
    backgroundColor: 'rgba(45,212,191,0.08)',
  },
  negative: {
    backgroundColor: 'rgba(255,93,115,0.08)',
  },
  accent: {
    backgroundColor: 'rgba(124,92,255,0.1)',
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
