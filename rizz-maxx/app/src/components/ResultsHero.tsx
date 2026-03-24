import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SectionPill } from './SectionPill';

type Props = {
  score: number;
  summary: string;
  source: 'real' | 'mock';
};

export function ResultsHero({ score, summary, source }: Props) {
  const tone = score >= 80 ? 'positive' : score >= 70 ? 'accent' : 'negative';
  const label = score >= 80 ? 'STRONG BASE' : score >= 70 ? 'SOLID, NEEDS CLEANUP' : 'LEAKING VALUE';

  return (
    <View style={styles.wrap}>
      <SectionPill label={source === 'real' ? 'REAL LOCAL ANALYSIS' : 'MOCKED LOCAL ANALYSIS'} tone="accent" />
      <SectionPill label={label} tone={tone === 'accent' ? 'accent' : tone} />
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.label}>Profile strength</Text>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.sheet,
    padding: theme.spacing.xxxl,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  score: {
    color: theme.colors.textPrimary,
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '900',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  summary: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
