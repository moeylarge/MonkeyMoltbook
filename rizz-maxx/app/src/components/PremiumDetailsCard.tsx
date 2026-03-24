import { StyleSheet, Text, View } from 'react-native';
import { AnalysisResult } from '../types';
import { theme } from '../theme';

type Props = {
  result: AnalysisResult;
};

export function PremiumDetailsCard({ result }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Premium strategy layer</Text>
      <Text style={styles.body}>
        Best move: lead with your strongest photo, rebuild around it, and stop letting lower-signal images dilute the profile.
      </Text>
      <Text style={styles.body}>Recommended strongest ordering starts from your top-ranked image and keeps weaker shots out of the first impression path.</Text>
      <Text style={styles.body}>Current strongest signal: {result.strengths[0] ?? 'Your top image still outperforms the rest of the set.'}</Text>
      <Text style={styles.body}>Current biggest drag: {result.weaknesses[0] ?? 'Your weakest image is still pulling the profile down.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(124,92,255,0.10)',
    borderRadius: theme.radius.sheet,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
});
