/**
 * Global Provider Storage Utility
 *
 * Provides a mechanism to store provider instances that are shared across
 * module instances. This is critical for Next.js 16 with Turbopack where
 * module isolation can cause providers set in instrumentation hooks to be
 * invisible to route handlers.
 *
 * Uses Symbol.for() to ensure the same symbol is used across all module instances.
 *
 * ## KERN-015 Design Note: Service Locator Pattern
 *
 * This module implements a service locator pattern, which is generally considered
 * an anti-pattern because it hides dependencies and makes testing harder.
 *
 * **Why we use it anyway:**
 *
 * 1. **Next.js Module Isolation**: Turbopack creates separate module instances
 *    per chunk. Without global storage, providers set in instrumentation.ts
 *    wouldn't be visible to route handlers.
 *
 * 2. **Bootstrapping Order**: Providers need to be available before the DI
 *    container is fully initialized, creating a chicken-and-egg problem.
 *
 * 3. **Test Isolation**: The `clearAllGlobalProviders()` function allows tests
 *    to reset state between test cases.
 *
 * **Mitigations:**
 *
 * - Provider keys are explicitly typed and documented
 * - All providers should be set during app bootstrap (instrumentation.ts)
 * - Code should prefer DI where possible, falling back to global providers
 *   only for cross-chunk access
 *
 * @see https://martinfowler.com/articles/injection.html#ServiceLocator
 */

// Global storage key
const PROVIDERS_KEY = Symbol.for('@@unisane/kernel/providers');

// Type for the global providers storage
type ProvidersMap = Map<string, unknown>;

// Get or initialize the global providers map
function getProvidersMap(): ProvidersMap {
  const g = globalThis as typeof globalThis & { [PROVIDERS_KEY]?: ProvidersMap };
  if (!g[PROVIDERS_KEY]) {
    g[PROVIDERS_KEY] = new Map();
  }
  return g[PROVIDERS_KEY];
}

/**
 * Set a provider in global storage.
 * @param key - Unique key for this provider (e.g., 'settings', 'flags')
 * @param provider - The provider instance
 */
export function setGlobalProvider<T>(key: string, provider: T): void {
  getProvidersMap().set(key, provider);
}

/**
 * Get a provider from global storage.
 * @param key - Unique key for this provider
 * @returns The provider instance or undefined
 */
export function getGlobalProvider<T>(key: string): T | undefined {
  return getProvidersMap().get(key) as T | undefined;
}

/**
 * Check if a provider exists in global storage.
 * @param key - Unique key for this provider
 */
export function hasGlobalProvider(key: string): boolean {
  return getProvidersMap().has(key);
}

/**
 * Clear a provider from global storage (for testing).
 * @param key - Unique key for this provider
 */
export function clearGlobalProvider(key: string): void {
  getProvidersMap().delete(key);
}

/**
 * Clear all providers from global storage (for testing).
 */
export function clearAllGlobalProviders(): void {
  getProvidersMap().clear();
}
