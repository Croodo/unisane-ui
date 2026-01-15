/**
 * Usage Port
 *
 * Port interface for usage tracking and metering.
 * Used by modules (billing, ai) to track and query usage metrics.
 * Usage module implements this port, consumers depend on the interface.
 */

import type { UsageWindow } from "../constants/time";
import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'usage';

/**
 * Usage record
 */
export interface UsageRecord {
  id: string;
  scopeId: string;
  metric: string; // e.g., 'api.requests', 'ai.tokens', 'storage.bytes'
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated usage for a period
 */
export interface UsageAggregate {
  period: string; // ISO date string for the period start
  value: number;
  count: number; // number of records in this period
}

/**
 * Current period usage with limit info
 */
export interface CurrentUsage {
  used: number;
  limit: number | null; // null means unlimited
  remaining: number | null; // null if unlimited
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Port interface for usage operations.
 * Used by billing module for metered billing, ai module for tracking.
 */
export interface UsagePort {
  /**
   * Record a usage event.
   */
  record(args: {
    scopeId: string;
    metric: string;
    value: number;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  /**
   * Record multiple usage events in batch.
   */
  recordBatch?(
    events: Array<{
      scopeId: string;
      metric: string;
      value: number;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void>;

  /**
   * Get aggregated usage for a period.
   */
  getUsage(args: {
    scopeId: string;
    metric: string;
    from: Date;
    to: Date;
    window: UsageWindow;
  }): Promise<UsageAggregate[]>;

  /**
   * Get current billing period usage for a metric.
   * Used for limit checking and display.
   */
  getCurrentPeriodUsage(args: {
    scopeId: string;
    metric: string;
  }): Promise<CurrentUsage>;

  /**
   * Check if scope is within usage limits.
   */
  isWithinLimit?(args: {
    scopeId: string;
    metric: string;
    additionalUsage?: number;
  }): Promise<boolean>;
}

/**
 * Set the usage provider implementation.
 * Call this at app bootstrap.
 */
export function setUsageProvider(provider: UsagePort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the usage provider.
 * Throws if not configured.
 */
export function getUsageProvider(): UsagePort {
  const provider = getGlobalProvider<UsagePort>(PROVIDER_KEY);
  if (!provider) {
    throw new Error(
      "UsagePort not configured. Call setUsageProvider() at bootstrap."
    );
  }
  return provider;
}

/**
 * Check if usage provider is configured.
 */
export function hasUsageProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function: Record usage via port.
 */
export async function recordUsageViaPort(args: {
  scopeId: string;
  metric: string;
  value: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  return getUsageProvider().record(args);
}

/**
 * Convenience function: Get current period usage via port.
 */
export async function getCurrentUsageViaPort(args: {
  scopeId: string;
  metric: string;
}): Promise<CurrentUsage> {
  return getUsageProvider().getCurrentPeriodUsage(args);
}
