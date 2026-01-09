import { z } from "zod";

// Billing mode values
export const BILLING_MODES = [
  "subscription",
  "topup_only",
  "subscription_with_credits",
  "disabled",
] as const;

export type BillingMode = (typeof BILLING_MODES)[number];

export const ZBillingMode = z.enum(BILLING_MODES);

export const DEFAULT_BILLING_MODE: BillingMode = "subscription";


