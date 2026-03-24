import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { BillingState, getBillingState, getPlanLabel, getPlanStatusLabel, restorePurchases } from '../billing';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    getBillingState().then(setBilling).catch(() => setBilling(null));
  }, []);

  const handleRestore = async () => {
    const result = await restorePurchases();
    setBilling(result.state);
    setFeedback(result.message);
  };

  const handleManage = async () => {
    if (!billing?.manageUrl) return;
    await Linking.openURL(billing.manageUrl);
  };

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Settings"
        title="Account and access"
        subtitle="Manage your current plan, restore purchases, and review your access state."
      />

      <InsightCard title="Current plan">
        <Text style={styles.body}>{billing ? `${getPlanLabel(billing.plan)} · ${getPlanStatusLabel(billing.plan)}` : 'Free Preview · Locked'}</Text>
        {feedback ? <Text style={styles.note}>{feedback}</Text> : null}
      </InsightCard>

      <InsightCard title="Support and billing">
        <Text style={styles.body}>Restore purchases here, or manage your monthly subscription from Apple if Pro is active.</Text>
      </InsightCard>

      <SecondaryButton label="Restore purchases" onPress={handleRestore} />
      {billing?.plan === 'pro-monthly' ? <SecondaryButton label="Manage subscription" onPress={handleManage} /> : null}
      <PrimaryButton label="Back to onboarding" onPress={() => navigation.navigate('Onboarding')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  note: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});
