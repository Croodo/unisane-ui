/**
 * Bootstrap Readiness Module
 *
 * Provides a mechanism to track and wait for application bootstrap completion.
 * This is critical for Next.js 16 with Turbopack where API routes may execute
 * before the instrumentation hook completes bootstrap.
 *
 * IMPORTANT: Uses globalThis to share state across module instances.
 * Next.js Turbopack can create isolated module instances between
 * instrumentation hooks and route handlers - globalThis ensures they
 * all see the same bootstrap state.
 *
 * Usage:
 * 1. At end of bootstrap: call signalBootstrapReady()
 * 2. In handlers: await waitForBootstrap() or check isBootstrapReady()
 */

// Symbol key for globalThis to avoid collisions
const BOOTSTRAP_KEY = Symbol.for('@@unisane/kernel/bootstrap');

// Type for the global bootstrap state
interface BootstrapState {
  ready: boolean;
  resolvers: Array<() => void>;
}

// Get or initialize the global state
function getState(): BootstrapState {
  const g = globalThis as typeof globalThis & { [BOOTSTRAP_KEY]?: BootstrapState };
  if (!g[BOOTSTRAP_KEY]) {
    g[BOOTSTRAP_KEY] = { ready: false, resolvers: [] };
  }
  return g[BOOTSTRAP_KEY];
}

/**
 * Signal that bootstrap has completed.
 * Call this at the end of your bootstrap function.
 */
export function signalBootstrapReady(): void {
  const state = getState();
  state.ready = true;
  // Resolve all waiting promises
  for (const resolve of state.resolvers) {
    resolve();
  }
  state.resolvers = [];
}

/**
 * Check if bootstrap has completed.
 */
export function isBootstrapReady(): boolean {
  return getState().ready;
}

/**
 * Wait for bootstrap to complete.
 * If already complete, resolves immediately.
 *
 * @param timeoutMs - Optional timeout in milliseconds (default: 30000)
 * @throws Error if timeout is exceeded
 */
export async function waitForBootstrap(timeoutMs = 30000): Promise<void> {
  const state = getState();
  if (state.ready) return;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove this resolver from the list
      const idx = state.resolvers.indexOf(wrappedResolve);
      if (idx >= 0) state.resolvers.splice(idx, 1);
      reject(new Error(`Bootstrap timeout exceeded (${timeoutMs}ms). Platform may not be properly initialized.`));
    }, timeoutMs);

    const wrappedResolve = () => {
      clearTimeout(timer);
      resolve();
    };

    state.resolvers.push(wrappedResolve);
  });
}

/**
 * Reset bootstrap state (for testing only).
 * @internal
 */
export function _resetBootstrapState(): void {
  const state = getState();
  state.ready = false;
  state.resolvers = [];
}
