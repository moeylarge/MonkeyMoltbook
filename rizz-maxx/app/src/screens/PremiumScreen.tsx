import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PricingOptionCard } from '../components/PricingOptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { BillingProductId, BillingState, getBillingState, getPlanLabel, getPlanStatusLabel, purchasePlan, restorePurchases } from '../billing';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

type ProductId = BillingProductId;

export function PremiumScreen({ navigation }: Props) {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductId>('rizz-maxx-premium-monthly');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'purchase' | 'restore' | null>(null);

  useEffect(() => {
    getBillingState().then(setBilling).catch(() => setBilling(null));
  }, []);

  const handleUnlock = async (productId: ProductId = selectedProduct) => {
    setBusyAction('purchase');
    setFeedback('Opening secure purchase...');
    const result = await purchasePlan(productId);
    setBilling(result.state);
    setSelectedProduct(productId);
    setFeedback(result.message);
    setBusyAction(null);
  };

  const handleRestore = async () => {
    setBusyAction('restore');
    setFeedback('Restoring purchases...');
    const result = await restorePurchases();
    setBilling(result.state);
    setFeedback(result.message);
    setBusyAction(null);
  };

  const handleManage = async () => {
    if (!billing?.manageUrl) return;
    await Linking.openURL(billing.manageUrl);
  };

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="RIZZMAXX PRO"
        title="Keep improving your profile over time."
        subtitle="Full ranking, lineup strategy, replacement guidance, and re-testing for stronger profile versions."
      />

      <InsightCard title="Current plan">
        <Text style={styles.body}>{billing ? `${getPlanLabel(billing.plan)} · ${getPlanStatusLabel(billing.plan)}` : 'Free Preview · Locked'}</Text>
        {feedback ? <Text style={styles.note}>{feedback}</Text> : null}
      </InsightCard>

      <InsightCard title="Free preview first">
        <Text style={styles.body}>See the signal first. Upgrade only if you want the deeper strategy and ongoing progress tools.</Text>
      </InsightCard>

      <PricingOptionCard
        title="RizzMaxx Pro"
        price="$4.99/mo"
        subtitle="Full analysis, lineup strategy, replacement guidance, re-testing, and saved progress."
        selected={selectedProduct === 'rizz-maxx-premium-monthly'}
        onPress={() => setSelectedProduct('rizz-maxx-premium-monthly')}
      />
      <PricingOptionCard
        title="Lifetime Access"
        price="$29.99"
        subtitle="One payment. Full unlock. Permanent access."
        selected={selectedProduct === 'rizz-maxx-premium-lifetime'}
        onPress={() => setSelectedProduct('rizz-maxx-premium-lifetime')}
      />

      <InsightCard title="Inside Pro">
        <Text style={styles.body}>• full ranked photo order</Text>
        <Text style={styles.body}>• strongest lead photo and first cut</Text>
        <Text style={styles.body}>• best 6-photo lineup strategy</Text>
        <Text style={styles.body}>• replacement guidance for weak photos</Text>
        <Text style={styles.body}>• compare new sets against older ones</Text>
        <Text style={styles.body}>• saved progress across profile versions</Text>
      </InsightCard>

      <InsightCard title="Why it is monthly">
        <Text style={styles.body}>RizzMaxx Pro is for repeated improvement, not a one-time guess. Re-test new photos, compare stronger sets against weaker ones, and keep refining the lineup.</Text>
      </InsightCard>

      <View style={styles.actions}>
        {billing?.plan !== 'pro-monthly' ? (
          <PrimaryButton
            label={busyAction === 'purchase' && selectedProduct === 'rizz-maxx-premium-monthly' ? 'Opening purchase...' : 'Unlock RizzMaxx Pro'}
            onPress={() => handleUnlock('rizz-maxx-premium-monthly')}
            style={styles.unlockButton}
          />
        ) : null}
        {billing?.plan !== 'lifetime' ? (
          <SecondaryButton
            label={busyAction === 'purchase' && selectedProduct === 'rizz-maxx-premium-lifetime' ? 'Opening purchase...' : 'Get Lifetime Access'}
            onPress={() => handleUnlock('rizz-maxx-premium-lifetime')}
            style={styles.lifetimeButton}
          />
        ) : null}
        <Text style={styles.microcopy}>Sharper lineup. Better first impression. Faster results.</Text>
        <SecondaryButton label={busyAction === 'restore' ? 'Restoring purchases...' : 'Restore purchases'} onPress={handleRestore} />
        {billing?.plan === 'pro-monthly' ? <SecondaryButton label="Manage subscription" onPress={handleManage} /> : null}
        <SecondaryButton label="Open settings" onPress={() => navigation.navigate('Settings')} style={styles.settingsButton} />
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
  note: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  microcopy: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.md,
  },
  unlockButton: {
    backgroundColor: theme.colors.negative,
  },
  lifetimeButton: {
    minHeight: 52,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  settingsButton: {
    backgroundColor: '#6EA8FF',
    minHeight: 50,
  },
});
