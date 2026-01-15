/**
 * Billing Service Port
 *
 * Port interface for billing service operations.
 * This allows modules to check subscription status without direct coupling to the billing module.
 *
 * Note: Named BillingServicePort to avoid confusion with BillingProviderAdapter in platform/billing
 */

import type { BillingMode } from "../constants/billing-mode";
import type { BillingProvider } from "../constants/providers";

/**
 * Billing service port interface for hexagonal architecture.
 * Implementations are provided by the billing module adapter.
 */
export interface BillingServicePort {
  /**
   * Get the current billing mode from settings
   */
  getBillingMode(): Promise<BillingMode>;

  /**
   * Assert that the current scope has an active subscription for credit consumption.
   * Only applies when billing mode is "subscription_with_credits".
   * Throws forbidden error if subscription is not active.
   */
  assertActiveSubscriptionForCredits(): Promise<void>;

  /**
   * Find scope ID by external provider customer ID.
   * Used by webhook handlers to map provider customers to internal scopes.
   */
  findScopeIdByCustomer(provider: BillingProvider, customerId: string): Promise<string | null>;
}

// Provider storage
let _billingServiceProvider: BillingServicePort | null = null;

/**
 * Set the billing service provider implementation.
 * Called at app bootstrap.
 */
export function setBillingServiceProvider(provider: BillingServicePort): void {
  _billingServiceProvider = provider;
}

/**
 * Get the billing service provider. Throws if not configured.
 */
export function getBillingServiceProvider(): BillingServicePort {
  if (!_billingServiceProvider) {
    throw new Error(
      "BillingServicePort not configured. Call setBillingServiceProvider() at bootstrap."
    );
  }
  return _billingServiceProvider;
}

/**
 * Check if billing service provider is configured.
 */
export function hasBillingServiceProvider(): boolean {
  return _billingServiceProvider !== null;
}

/**
 * Convenience function: Get the billing mode via port.
 * Uses the configured BillingServicePort provider.
 */
export async function getBillingModeViaPort(): Promise<BillingMode> {
  return getBillingServiceProvider().getBillingMode();
}

/**
 * Convenience function: Assert active subscription for credits via port.
 * Uses the configured BillingServicePort provider.
 */
export async function assertActiveSubscriptionForCreditsViaPort(): Promise<void> {
  return getBillingServiceProvider().assertActiveSubscriptionForCredits();
}

/**
 * Convenience function: Find scope ID by customer via port.
 * Uses the configured BillingServicePort provider.
 */
export async function findScopeIdByCustomerViaPort(provider: BillingProvider, customerId: string): Promise<string | null> {
  return getBillingServiceProvider().findScopeIdByCustomer(provider, customerId);
}
