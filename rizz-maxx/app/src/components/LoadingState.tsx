import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  sublabel?: string;
};

const luxurySteps = [
  'Reading first-impression strength',
  'Comparing lead-photo potential',
  'Finding weak links in the lineup',
  'Building your strongest order',
];

export function LoadingState({ label, sublabel }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.spinnerWrap}>
        <ActivityIndicator size="large" color={theme.colors.accentViolet} />
      </View>
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      <View style={styles.stepList}>
        {luxurySteps.map((step) => (
          <Text key={step} style={styles.stepItem}>• {step}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  spinnerWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,92,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.18)',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 25,
    textAlign: 'center',
    fontWeight: '800',
    maxWidth: 320,
  },
  sublabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
  stepList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  stepItem: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
