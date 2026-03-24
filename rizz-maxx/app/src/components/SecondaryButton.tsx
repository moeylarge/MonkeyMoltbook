import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  tone?: 'default' | 'danger';
};

export function SecondaryButton({ label, onPress, style, tone = 'default' }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.button, tone === 'danger' ? styles.danger : null, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLuxury,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    paddingHorizontal: theme.spacing.xl,
  },
  danger: {
    backgroundColor: 'rgba(200,30,58,0.12)',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
