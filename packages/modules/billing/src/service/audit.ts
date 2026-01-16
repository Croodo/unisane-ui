/**
 * Billing Audit Logging
 *
 * Provides audit logging for billing operations (refunds, cancellations, plan changes).
 * Used for compliance and tracking of sensitive billing state changes.
 */

import { hasAuditProvider, getAuditProvider, tryGetScopeContext } from "@unisane/kernel";

/**
 * Log a billing audit event.
 * Fails silently if audit provider is not configured.
 *
 * @example
 * ```typescript
 * await logBillingAudit({
 *   scopeId: 'tenant_123',
 *   action: 'billing.refund.completed',
 *   targetType: 'payment',
 *   targetId: 'pay_abc',
 *   changes: [{ field: 'status', from: 'succeeded', to: 'refunded' }],
 *   metadata: { provider: 'stripe', amount: 1000 },
 * });
 * ```
 */
export async function logBillingAudit(args: {
  scopeId: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: Array<{ field: string; from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!hasAuditProvider()) return;
  const ctx = tryGetScopeContext();
  try {
    await getAuditProvider().log({
      scopeId: args.scopeId,
      action: args.action,
      actor: {
        type: ctx?.userId ? 'user' : 'system',
        id: ctx?.userId ?? 'system',
      },
      target: {
        type: args.targetType,
        id: args.targetId,
      },
      changes: args.changes,
      metadata: args.metadata,
    });
  } catch {
    // Audit logging should not fail the main operation
  }
}

/**
 * Standard billing audit actions
 */
export const BILLING_AUDIT_ACTIONS = {
  REFUND_COMPLETED: 'billing.refund.completed',
  SUBSCRIPTION_CANCELLED: 'billing.subscription.cancelled',
  PLAN_CHANGED: 'billing.plan.changed',
  QUANTITY_CHANGED: 'billing.quantity.changed',
  SUBSCRIPTION_CREATED: 'billing.subscription.created',
  TOPUP_COMPLETED: 'billing.topup.completed',
} as const;
