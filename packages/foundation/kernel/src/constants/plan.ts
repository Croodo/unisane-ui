import { z } from 'zod';
import type { FeatureKey } from './features';
import { FEATURE } from './features';

export const PLANS = ['free', 'pro', 'pro_yearly', 'business', 'business_yearly'] as const;
export type PlanId = (typeof PLANS)[number];
export const ZPlanId = z.enum(PLANS);

export type PlanMeta = {
  label: string;
  tagline: string;
  recommended?: boolean;
  // Optional list of marketing/features bullets for UI
  features?: string[];
  // Optional default display/seed price (major units)
  defaultPrice?: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
};

export type PlanEntitlements = {
  toggles: Record<string, boolean>;
  capacities: Record<string, number>;
  quotas: Record<string, { limit: number; window: 'day' | 'month' | 'year' }>;
  credits: Record<string, { grant: number; period: 'month' | 'year' }>;
  // Optional per-feature daily freebies for metering (tokens/units)
  dailyFree?: Partial<Record<FeatureKey, number>>;
};

export type PlanDefinition = PlanMeta & {
  entitlements: PlanEntitlements;
};

const PRO_ENTITLEMENTS: PlanEntitlements = {
  toggles: { 'analytics.pro': true },
  capacities: {
    seats: 10,
    channels: 6,
    storageBytes: 200 * 2 ** 30,
    analyticsRetentionDays: 180,
  },
  quotas: { 'posts.mo': { limit: 600, window: 'month' } },
  credits: { 'ai.tokens': { grant: 50_000, period: 'month' } },
  dailyFree: {
    [FEATURE.API_CALL]: 2000,
    [FEATURE.AI_GENERATE]: 100,
  },
};

const BUSINESS_ENTITLEMENTS: PlanEntitlements = {
  toggles: { 'analytics.pro': true, 'enterprise.sso': true },
  capacities: {
    seats: 25,
    channels: 12,
    storageBytes: 1 * 2 ** 40,
    analyticsRetentionDays: 365,
  },
  quotas: { 'posts.mo': { limit: 2000, window: 'month' } },
  credits: { 'ai.tokens': { grant: 200_000, period: 'month' } },
  dailyFree: {
    [FEATURE.API_CALL]: 20_000,
    [FEATURE.AI_GENERATE]: 1000,
  },
};

export const PLAN_DEFS: Record<PlanId, PlanDefinition> = {
  free: {
    label: 'Free',
    tagline: 'Evaluation & small personal projects',
    defaultPrice: {
      amount: 0,
      currency: 'USD',
      interval: 'month',
    },
    entitlements: {
      toggles: { 'analytics.pro': false },
      capacities: {
        seats: 2,
        channels: 2,
        storageBytes: 50 * 2 ** 30,
        analyticsRetentionDays: 90,
      },
      quotas: { 'posts.mo': { limit: 120, window: 'month' } },
      credits: { 'ai.tokens': { grant: 10_000, period: 'month' } },
      dailyFree: {
        [FEATURE.API_CALL]: 50,
        [FEATURE.AI_GENERATE]: 2,
      },
    },
  },
  pro: {
    label: 'Pro',
    tagline: 'Teams that need higher limits',
    recommended: true,
    defaultPrice: {
      amount: 29,
      currency: 'USD',
      interval: 'month',
    },
    entitlements: PRO_ENTITLEMENTS,
  },
  pro_yearly: {
    label: 'Pro (yearly)',
    tagline: 'Pro plan billed annually (save ~2 months)',
    defaultPrice: {
      amount: 290,
      currency: 'USD',
      interval: 'year',
    },
    entitlements: PRO_ENTITLEMENTS,
  },
  business: {
    label: 'Business',
    tagline: 'Larger orgs and advanced features',
    defaultPrice: {
      amount: 99,
      currency: 'USD',
      interval: 'month',
    },
    entitlements: BUSINESS_ENTITLEMENTS,
  },
  business_yearly: {
    label: 'Business (yearly)',
    tagline: 'Business plan billed annually (save ~2 months)',
    defaultPrice: {
      amount: 990,
      currency: 'USD',
      interval: 'year',
    },
    entitlements: BUSINESS_ENTITLEMENTS,
  },
};

export const PLAN_META: Record<PlanId, PlanMeta> = PLANS.reduce(
  (acc, id) => {
    const def = PLAN_DEFS[id];
    const meta: PlanMeta = {
      label: def.label,
      tagline: def.tagline,
      ...(def.recommended ? { recommended: true } : {}),
      ...(def.features && def.features.length
        ? { features: def.features }
        : {}),
      ...(def.defaultPrice ? { defaultPrice: def.defaultPrice } : {}),
    };
    acc[id] = meta;
    return acc;
  },
  {} as Record<PlanId, PlanMeta>
);
