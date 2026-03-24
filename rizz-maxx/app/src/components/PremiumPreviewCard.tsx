import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { SectionPill } from './SectionPill';

type Props = {
  unlocked: boolean;
};

export function PremiumPreviewCard({ unlocked }: Props) {
  return (
    <View style={styles.card}>
      <SectionPill label={unlocked ? 'PREMIUM UNLOCKED' : 'PREMIUM PREVIEW'} tone="accent" />
      <Text style={styles.title}>{unlocked ? 'Deeper profile layer is unlocked' : 'There is still more detail behind this result'}</Text>
      <Text style={styles.body}>
        {unlocked
          ? 'You can now use the expanded premium section below in this local-first prototype state.'
          : 'Premium is where deeper ordering logic, stronger replacement guidance, and expanded strategy fit in this product.'}
      </Text>
      <View style={styles.list}>
        <Text style={styles.item}>• Strongest 6-photo order</Text>
        <Text style={styles.item}>• Better replacement strategy</Text>
        <Text style={styles.item}>• Deeper profile positioning guidance</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sheet,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  list: {
    gap: theme.spacing.sm,
  },
  item: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
});
