import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  title: string;
  price: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
};

export function PricingOptionCard({ title, price, subtitle, selected, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Select ${title}`} onPress={onPress} style={[styles.card, selected ? styles.selected : null]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
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
  selected: {
    backgroundColor: 'rgba(124,92,255,0.10)',
    borderColor: theme.colors.accentViolet,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  price: {
    color: theme.colors.accentBlue,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
