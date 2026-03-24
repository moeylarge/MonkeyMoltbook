import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

export function PremiumScreen({ navigation }: Props) {
  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Premium"
        title="Unlock the full profile strategy"
        subtitle="This shell proves paywall routing and layout only. No billing logic yet."
      />

      <InsightCard title="Premium unlock preview">
        <Text style={styles.body}>• Strongest 6-photo order</Text>
        <Text style={styles.body}>• Deeper per-photo breakdown</Text>
        <Text style={styles.body}>• Better replacement strategy</Text>
        <Text style={styles.body}>• Stronger profile positioning guidance</Text>
      </InsightCard>

      <PrimaryButton label="Open settings shell" onPress={() => navigation.navigate('Settings')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
});
