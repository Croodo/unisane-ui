import { z } from 'zod';
// Avoid pulling the full validated env here to keep this module usable during
// build/codegen without requiring DB envs like MONGODB_URI.

export const CREDIT_KIND = ['grant', 'burn'] as const;
export type CreditKind = (typeof CREDIT_KIND)[number];
export const ZCreditKind = z.enum(CREDIT_KIND);

// Optional label for UI display
export const CREDIT_UNITS = ['credit', 'token'] as const;
export type CreditUnit = (typeof CREDIT_UNITS)[number];
export const ZCreditUnit = z.enum(CREDIT_UNITS);

// Server-side pricing: how many credits per 1 major currency unit
// These defaults can be adjusted per SaaS; kept simple here.
const DEFAULT_CREDITS_PER_MAJOR_UNIT: Record<string, number> = { USD: 10, INR: 1 };

function parseOverride(): Record<string, number> {
  const raw = process.env.CREDITS_PER_MAJOR_UNIT_JSON;
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k.toUpperCase()] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export const CREDITS_PER_MAJOR_UNIT: Record<string, number> = {
  ...DEFAULT_CREDITS_PER_MAJOR_UNIT,
  ...parseOverride(),
};

export function creditsForPurchase(amountMajor: number, currency: string): number {
  const rate = CREDITS_PER_MAJOR_UNIT[currency.toUpperCase()] ?? 1;
  return Math.max(0, Math.floor(amountMajor * rate));
}

export type TopupOptionId = 'small' | 'standard' | 'large';

export type TopupOption = {
  id: TopupOptionId;
  label: string;
  amount: number;
  currency: string;
};

export const TOPUP_OPTIONS: TopupOption[] = [
  { id: 'small', label: '$10', amount: 10, currency: 'USD' },
  { id: 'standard', label: '$25', amount: 25, currency: 'USD' },
  { id: 'large', label: '$50', amount: 50, currency: 'USD' },
];

export function getTopupOption(id: TopupOptionId): TopupOption | undefined {
  return TOPUP_OPTIONS.find((o) => o.id === id);
}
