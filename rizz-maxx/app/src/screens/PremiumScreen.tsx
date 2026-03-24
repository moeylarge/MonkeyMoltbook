import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../components/AppShell';
import { InsightCard } from '../components/InsightCard';
import { PricingOptionCard } from '../components/PricingOptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getPremiumEntitlement, PremiumEntitlement, resetPremiumPrototype, restorePremiumPrototype, unlockPremiumPrototype } from '../storage';
import { theme } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

type ProductId = 'rizz-maxx-premium-monthly' | 'rizz-maxx-premium-lifetime';

export function PremiumScreen({ navigation }: Props) {
  const [entitlement, setEntitlement] = useState<PremiumEntitlement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductId>('rizz-maxx-premium-monthly');

  const refresh = () => {
    getPremiumEntitlement().then(setEntitlement).catch(() => setEntitlement(null));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUnlock = async () => {
    const next = await unlockPremiumPrototype(selectedProduct);
    setEntitlement(next);
  };

  const handleRestore = async () => {
    const next = await restorePremiumPrototype();
    setEntitlement(next);
  };

  const handleReset = async () => {
    await resetPremiumPrototype();
    refresh();
  };

  const unlocked = entitlement?.unlocked ?? false;

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Premium"
        title="Unlock the full profile strategy"
        subtitle="This phase adds local purchase-state and entitlement behavior, but still no real billing provider integration."
      />

      <InsightCard title="Premium state">
        <Text style={styles.body}>
          {unlocked
            ? `Premium is active in local prototype mode${entitlement?.productId ? ` via ${entitlement.productId}` : ''}.`
            : 'Premium is currently locked.'}
        </Text>
      </InsightCard>

      <PricingOptionCard
        title="Premium Monthly"
        price="$9.99"
        subtitle="Use this as the default recurring option in prototype state."
        selected={selectedProduct === 'rizz-maxx-premium-monthly'}
        onPress={() => setSelectedProduct('rizz-maxx-premium-monthly')}
      />
      <PricingOptionCard
        title="Premium Lifetime"
        price="$49"
        subtitle="Use this as the one-time unlock option in prototype state."
        selected={selectedProduct === 'rizz-maxx-premium-lifetime'}
        onPress={() => setSelectedProduct('rizz-maxx-premium-lifetime')}
      />

      <InsightCard title="Premium unlock preview">
        <Text style={styles.body}>• Strongest 6-photo order</Text>
        <Text style={styles.body}>• Deeper per-photo breakdown</Text>
        <Text style={styles.body}>• Better replacement strategy</Text>
        <Text style={styles.body}>• Stronger profile positioning guidance</Text>
      </InsightCard>

      <View style={styles.actions}>
        {!unlocked ? <PrimaryButton label="Unlock premium prototype" onPress={handleUnlock} /> : null}
        <SecondaryButton label="Restore premium prototype" onPress={handleRestore} />
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
