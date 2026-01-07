import { PLANS, ZPlanId } from './plan';
import { SUBSCRIPTION_STATUS, ZSubscriptionStatus, INVOICE_STATUS, ZInvoiceStatus, PAYMENT_STATUS, ZPaymentStatus } from './billing';

/**
 * Central registry of all enum constants used across the application.
 * This serves as the single source of truth for facet generation.
 * 
 * Each entry contains:
 * - values: The actual constant array (e.g., PLANS)
 * - zodSchema: The Zod schema for validation (e.g., ZPlanId)
 * - typeName: The TypeScript type name (e.g., 'PlanId')
 * - importPath: Where to import the type from
 */
export const ENUM_CONSTANTS = {
  PlanId: { 
    values: PLANS, 
    zodSchema: ZPlanId,
    typeName: 'PlanId',
    importPath: '@/src/shared/constants/plan',
  },
  SubscriptionStatus: { 
    values: SUBSCRIPTION_STATUS, 
    zodSchema: ZSubscriptionStatus,
    typeName: 'SubscriptionStatus',
    importPath: '@/src/shared/constants/billing',
  },
  InvoiceStatus: { 
    values: INVOICE_STATUS, 
    zodSchema: ZInvoiceStatus,
    typeName: 'InvoiceStatus',
    importPath: '@/src/shared/constants/billing',
  },
  PaymentStatus: { 
    values: PAYMENT_STATUS, 
    zodSchema: ZPaymentStatus,
    typeName: 'PaymentStatus',
    importPath: '@/src/shared/constants/billing',
  },
} as const;

export type EnumConstantKey = keyof typeof ENUM_CONSTANTS;
