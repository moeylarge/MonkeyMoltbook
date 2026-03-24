import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
};

export function SectionPill({ label, tone = 'default' }: Props) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'positive' ? styles.positive : null,
        tone === 'negative' ? styles.negative : null,
        tone === 'accent' ? styles.accent : null,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  positive: {
    backgroundColor: 'rgba(45,212,191,0.14)',
  },
  negative: {
    backgroundColor: 'rgba(255,93,115,0.14)',
  },
  accent: {
    backgroundColor: 'rgba(124,92,255,0.18)',
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
