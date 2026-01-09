import type { CreditKind } from "@unisane/kernel";
import type { FeatureKey } from "@unisane/kernel";

export type LedgerEntry = {
  id: string;
  kind: CreditKind;
  amount: number;
  reason: string;
  feature?: FeatureKey | null;
  createdAt: Date;
  expiresAt?: Date | null;
};

export type Balance = number;

export type CreditsBucket = {
  grants: number;
  burns: number;
  available: number;
};

export type CreditsBreakdown = {
  total: CreditsBucket;
  subscription: CreditsBucket;
  topup: CreditsBucket;
  other: CreditsBucket;
};
