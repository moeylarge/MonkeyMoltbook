import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { isPremiumUnlocked, setPremiumUnlocked } from '../storage';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

export function PremiumScreen({ navigation }: Props) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    isPremiumUnlocked().then(setUnlocked).catch(() => setUnlocked(false));
  }, []);

  const handleUnlock = async () => {
    await setPremiumUnlocked(true);
    setUnlocked(true);
  };

  const handleReset = async () => {
    await setPremiumUnlocked(false);
    setUnlocked(false);
  };

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Premium"
        title="Unlock the full profile strategy"
        subtitle="This phase adds a real local unlock state and gated premium surface, but not real billing yet."
      />

      <InsightCard title="Premium state">
        <Text style={styles.body}>{unlocked ? 'Premium is unlocked in local prototype mode.' : 'Premium is currently locked.'}</Text>
      </InsightCard>

      <InsightCard title="Premium unlock preview">
        <Text style={styles.body}>• Strongest 6-photo order</Text>
        <Text style={styles.body}>• Deeper per-photo breakdown</Text>
        <Text style={styles.body}>• Better replacement strategy</Text>
        <Text style={styles.body}>• Stronger profile positioning guidance</Text>
      </InsightCard>

      <View style={styles.actions}>
        {!unlocked ? <PrimaryButton label="Unlock premium prototype" onPress={handleUnlock} /> : null}
        {unlocked ? <SecondaryButton label="Reset premium prototype" onPress={handleReset} tone="danger" /> : null}
        <PrimaryButton label="Open settings shell" onPress={() => navigation.navigate('Settings')} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
