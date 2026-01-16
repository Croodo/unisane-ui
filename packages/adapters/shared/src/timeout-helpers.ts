/**
 * Timeout Helper Utilities
 *
 * Shared timeout handling logic used across adapters.
 * Provides consistent timeout behavior with proper cleanup.
 *
 * L-003 FIX: Centralizes timeout constants and helpers.
 * M-006 FIX: Provides proper Promise.race timeout pattern.
 */

/**
 * Default timeout values in milliseconds.
 */
export const TIMEOUT_DEFAULTS = {
  /** Default request timeout (10 seconds) */
  REQUEST: 10_000,
  /** Default connect timeout (5 seconds) */
  CONNECT: 5_000,
  /** Maximum allowed timeout (60 seconds) */
  MAX: 60_000,
  /** Minimum allowed timeout (1 second) */
  MIN: 1_000,
} as const;

/**
 * Result of a timed operation.
 */
export type TimeoutResult<T> =
  | { success: true; value: T }
  | { success: false; error: Error };

/**
 * Execute a promise with a timeout using Promise.race.
 * This ensures the timeout is honored even if the underlying operation
 * doesn't respect AbortSignal.
 *
 * M-006 FIX: Provides reliable timeout handling.
 *
 * @param operation - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name of the operation for error messages
 * @returns The operation result
 * @throws Error if timeout is exceeded
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName = 'Operation'
): Promise<T> {
  const clampedTimeout = Math.max(TIMEOUT_DEFAULTS.MIN, Math.min(timeoutMs, TIMEOUT_DEFAULTS.MAX));

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${clampedTimeout}ms`));
    }, clampedTimeout);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Execute a promise with a timeout, returning a result object instead of throwing.
 *
 * @param operation - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name of the operation for error messages
 * @returns Result object with success/failure
 */
export async function withTimeoutResult<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName = 'Operation'
): Promise<TimeoutResult<T>> {
  try {
    const value = await withTimeout(operation, timeoutMs, operationName);
    return { success: true, value };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Create an AbortController with automatic timeout cleanup.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object with controller and cleanup function
 */
export function createTimeoutController(
  timeoutMs: number
): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const clampedTimeout = Math.max(TIMEOUT_DEFAULTS.MIN, Math.min(timeoutMs, TIMEOUT_DEFAULTS.MAX));

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, clampedTimeout);

  const cleanup = () => {
    clearTimeout(timeoutId);
  };

  return { controller, cleanup };
}

/**
 * Execute an async function with an AbortController that times out.
 * The function receives the AbortSignal to pass to underlying APIs.
 *
 * @param fn - Function to execute (receives AbortSignal)
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name of the operation for error messages
 * @returns The function result
 * @throws Error if timeout is exceeded
 */
export async function withAbortableTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  operationName = 'Operation'
): Promise<T> {
  const { controller, cleanup } = createTimeoutController(timeoutMs);

  try {
    const result = await fn(controller.signal);
    cleanup();
    return result;
  } catch (error) {
    cleanup();

    // Convert AbortError to timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${operationName} timed out after ${timeoutMs}ms`);
    }
    if (controller.signal.aborted) {
      throw new Error(`${operationName} timed out after ${timeoutMs}ms`);
    }

    throw error;
  }
}
