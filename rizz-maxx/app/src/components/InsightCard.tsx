import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = PropsWithChildren<{
  title: string;
}>;

export function InsightCard({ title, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLuxury,
    borderRadius: theme.radius.luxury,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  body: {
    gap: theme.spacing.md,
  },
});
