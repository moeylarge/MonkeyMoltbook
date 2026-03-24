import { getPremiumEntitlement, PremiumEntitlement, restorePremiumPrototype, unlockPremiumPrototype } from './storage';

export type BillingPlan = 'free' | 'pro-monthly' | 'lifetime';
export type BillingProductId = 'rizz-maxx-premium-monthly' | 'rizz-maxx-premium-lifetime';
export type BillingStatus = 'idle' | 'purchasing' | 'active' | 'restoring' | 'error';

export type BillingState = {
  plan: BillingPlan;
  hasProAccess: boolean;
  productId: BillingProductId | null;
  status: BillingStatus;
  unlockedAt: string | null;
  source: PremiumEntitlement['source'];
  provider: 'prototype' | 'app-store';
  manageUrl?: string | null;
};

export type PurchaseResult = {
  ok: boolean;
  canceled?: boolean;
  state: BillingState;
  message: string;
};

const MANAGE_SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';

function entitlementToPlan(entitlement: PremiumEntitlement): BillingPlan {
  if (!entitlement.unlocked || !entitlement.productId) return 'free';
  return entitlement.productId === 'rizz-maxx-premium-lifetime' ? 'lifetime' : 'pro-monthly';
}

function entitlementToState(entitlement: PremiumEntitlement, status: BillingStatus = 'idle'): BillingState {
  const plan = entitlementToPlan(entitlement);
  return {
    plan,
    hasProAccess: entitlement.unlocked,
    productId: entitlement.productId,
    status: entitlement.unlocked ? (status === 'idle' ? 'active' : status) : status,
    unlockedAt: entitlement.unlockedAt,
    source: entitlement.source,
    provider: 'prototype',
    manageUrl: plan === 'pro-monthly' ? MANAGE_SUBSCRIPTION_URL : null,
  };
}

export async function getBillingState(): Promise<BillingState> {
  const entitlement = await getPremiumEntitlement();
  return entitlementToState(entitlement);
}

export async function purchasePlan(productId: BillingProductId): Promise<PurchaseResult> {
  try {
    const next = await unlockPremiumPrototype(productId);
    return {
      ok: true,
      state: entitlementToState(next, 'active'),
      message: productId === 'rizz-maxx-premium-lifetime'
        ? 'Lifetime Access unlocked. Your full strategy is now available.'
        : 'RizzMaxx Pro is now active. Your full strategy is unlocked.',
    };
  } catch (_error) {
    const state = await getBillingState();
    return {
      ok: false,
      state: { ...state, status: 'error' },
      message: 'Purchase could not be completed right now. Please try again.',
    };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const before = await getPremiumEntitlement();
    const restored = await restorePremiumPrototype();
    const state = entitlementToState(restored, restored.unlocked ? 'active' : 'idle');

    if (!restored.unlocked && !before.unlocked) {
      return {
        ok: false,
        state,
        message: 'No previous RizzMaxx purchases were found for this Apple ID.',
      };
    }

    return {
      ok: true,
      state,
      message: 'Your purchases were restored.',
    };
  } catch (_error) {
    const state = await getBillingState();
    return {
      ok: false,
      state: { ...state, status: 'error' },
      message: 'Restore could not be completed right now. Please try again.',
    };
  }
}

export function getPlanLabel(plan: BillingPlan) {
  if (plan === 'pro-monthly') return 'RizzMaxx Pro';
  if (plan === 'lifetime') return 'Lifetime Access';
  return 'Free Preview';
}

export function getPlanStatusLabel(plan: BillingPlan) {
  if (plan === 'pro-monthly') return 'Active monthly';
  if (plan === 'lifetime') return 'Permanent unlock';
  return 'Locked';
}
