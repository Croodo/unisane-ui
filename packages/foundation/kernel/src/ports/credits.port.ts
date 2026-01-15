/**
 * Credits Port
 *
 * Port interface for credit/token management.
 * Used by modules (ai, billing) to consume and grant credits.
 * Credits module implements this port, consumers depend on the interface.
 */

import type { CreditKind } from "../constants/credits";
import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'credits';

/**
 * Credit balance view
 */
export interface CreditBalance {
  available: number;
  reserved: number;
  expiring: { amount: number; expiresAt: Date }[];
}

/**
 * Credit transaction record
 */
export interface CreditTransaction {
  id: string;
  scopeId: string;
  kind: CreditKind;
  amount: number;
  reason: string;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Port interface for credit operations.
 * Used by ai module to consume credits, billing module to grant credits.
 */
export interface CreditsPort {
  /**
   * Consume credits from a scope's balance.
   * @throws InsufficientCreditsError if balance too low
   */
  consume(args: {
    scopeId: string;
    amount: number;
    reason: string;
    feature?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ consumed: number; remaining: number }>;

  /**
   * Grant credits to a scope.
   */
  grant(args: {
    scopeId: string;
    amount: number;
    reason: string;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<{ granted: number; newBalance: number }>;

  /**
   * Get current balance for a scope.
   */
  getBalance(scopeId: string): Promise<CreditBalance>;

  /**
   * Check if scope has sufficient credits.
   */
  hasSufficient(scopeId: string, amount: number): Promise<boolean>;

  /**
   * Get credit transaction history for a scope.
   */
  getTransactions?(args: {
    scopeId: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: CreditTransaction[]; total: number }>;
}

/**
 * Set the credits provider implementation.
 * Call this at app bootstrap.
 */
export function setCreditsProvider(provider: CreditsPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the credits provider.
 * Throws if not configured.
 */
export function getCreditsProvider(): CreditsPort {
  const provider = getGlobalProvider<CreditsPort>(PROVIDER_KEY);
  if (!provider) {
    throw new Error(
      "CreditsPort not configured. Call setCreditsProvider() at bootstrap."
    );
  }
  return provider;
}

/**
 * Check if credits provider is configured.
 */
export function hasCreditsProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function: Consume credits via port.
 */
export async function consumeCreditsViaPort(args: {
  scopeId: string;
  amount: number;
  reason: string;
  feature?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ consumed: number; remaining: number }> {
  return getCreditsProvider().consume(args);
}

/**
 * Convenience function: Check if scope has sufficient credits via port.
 */
export async function hasSufficientCreditsViaPort(
  scopeId: string,
  amount: number
): Promise<boolean> {
  return getCreditsProvider().hasSufficient(scopeId, amount);
}
