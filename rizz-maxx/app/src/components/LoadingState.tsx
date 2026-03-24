import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
};

export function LoadingState({ label }: Props) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={theme.colors.accentViolet} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
