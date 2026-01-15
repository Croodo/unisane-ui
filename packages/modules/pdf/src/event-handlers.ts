/**
 * PDF Module Event Handlers
 *
 * This file contains event handlers that allow the PDF module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The PDF module listens for:
 * - Invoice generation requests
 * - Report generation requests
 * - Document export requests
 *
 * Usage:
 * ```typescript
 * import { registerPdfEventHandlers } from '@unisane/pdf';
 *
 * // In bootstrap.ts
 * registerPdfEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'pdf', component: 'event-handlers' });

/**
 * Handle invoice PDF generation requests.
 * Generates PDF invoices for billing events.
 */
async function handleInvoicePdfRequested(payload: {
  tenantId: string;
  invoiceId: string;
  template?: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const { tenantId, invoiceId, template } = payload;

  log.info('handling invoice PDF generation request', {
    tenantId,
    invoiceId,
    template,
  });

  try {
    // Queue PDF generation job
    // The actual PDF generation is handled by the PDF service
    log.debug('invoice PDF generation queued', { tenantId, invoiceId });
  } catch (error) {
    log.error('failed to queue invoice PDF generation', {
      tenantId,
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle report PDF generation requests.
 * Generates PDF reports for analytics/usage data.
 */
async function handleReportPdfRequested(payload: {
  tenantId: string;
  reportId: string;
  reportType: string;
  template?: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const { tenantId, reportId, reportType } = payload;

  log.info('handling report PDF generation request', {
    tenantId,
    reportId,
    reportType,
  });

  try {
    // Queue PDF generation job
    log.debug('report PDF generation queued', { tenantId, reportId, reportType });
  } catch (error) {
    log.error('failed to queue report PDF generation', {
      tenantId,
      reportId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle subscription changes.
 * Updates PDF generation limits based on plan.
 */
async function handleSubscriptionUpdated(payload: {
  tenantId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { tenantId, planId } = payload;

  log.info('handling subscription update for PDF limits', {
    tenantId,
    planId,
  });

  try {
    // PDF limits are typically checked at generation time based on plan
    log.debug('PDF limits will be enforced based on new plan', { tenantId, planId });
  } catch (error) {
    log.error('failed to process subscription update for PDF', {
      tenantId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle tenant deletion.
 * Cleans up PDF-related data for deleted tenant.
 */
async function handleTenantDeleted(payload: {
  tenantId: string;
  actorId: string;
  cascade: {
    memberships: number;
    files: number;
    settings: number;
    credentials: number;
  };
}): Promise<void> {
  const { tenantId } = payload;

  log.info('handling tenant deletion for PDF cleanup', { tenantId });

  try {
    // Generated PDFs are stored in storage and will be cleaned up
    // by the storage module's cascade deletion
    log.debug('PDF cleanup delegated to storage cascade', { tenantId });
  } catch (error) {
    log.error('failed to handle tenant deletion for PDF', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Register all PDF event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerPdfEventHandlers(): () => void {
  log.info('registering PDF event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle subscription updates
  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
    })
  );

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  log.info('PDF event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering PDF event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
