/**
 * Flags Port
 *
 * Port interface for feature flag evaluation.
 * This allows modules to check feature flags without direct coupling to the flags module.
 */

import type { AppEnv } from "../constants/env";
import type { PlanId } from "../constants/plan";
import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'flags';

/**
 * Context for flag evaluation
 */
export type FlagEvalCtx = {
  plan?: PlanId;
  userId?: string;
  tenantId?: string;
  country?: string;
  email?: string;
  tenantTags?: string[];
  now?: Date;
};

/**
 * Arguments for isEnabledForScope
 */
export type IsEnabledForScopeArgs = {
  env?: AppEnv;
  key: string;
  scopeId: string;
  userId?: string;
  ctx?: FlagEvalCtx;
};

/**
 * Flags port interface for hexagonal architecture.
 * Implementations are provided by the flags module adapter.
 */
export interface FlagsPort {
  /**
   * Check if a flag is enabled for a given scope (tenant/user)
   * Checks user override → scope override → rules → default
   */
  isEnabledForScope(args: IsEnabledForScopeArgs): Promise<boolean>;
}

/**
 * Set the flags provider implementation.
 * Called at app bootstrap.
 */
export function setFlagsProvider(provider: FlagsPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the flags provider. Throws if not configured.
 */
export function getFlagsProvider(): FlagsPort {
  const provider = getGlobalProvider<FlagsPort>(PROVIDER_KEY);
  if (!provider) {
    throw new Error(
      "FlagsPort not configured. Call setFlagsProvider() at bootstrap."
    );
  }
  return provider;
}

/**
 * Check if flags provider is configured.
 */
export function hasFlagsProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function: Check if a flag is enabled for a scope.
 * Uses the configured FlagsPort provider.
 */
export async function isEnabledForScope(args: IsEnabledForScopeArgs): Promise<boolean> {
  return getFlagsProvider().isEnabledForScope(args);
}
