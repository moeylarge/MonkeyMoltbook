import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  sublabel?: string;
};

export function LoadingState({ label, sublabel }: Props) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={theme.colors.accentViolet} />
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  sublabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
});
