/**
 * Circuit Breaker Pattern
 *
 * Protects external service calls from cascading failures.
 * When failures exceed a threshold, the circuit "opens" and fast-fails
 * subsequent calls until the service recovers.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fast-fail
 * - HALF_OPEN: Testing if service recovered
 *
 * @example
 * ```typescript
 * import { CircuitBreaker } from '@unisane/kernel';
 *
 * const stripeBreaker = new CircuitBreaker('stripe', {
 *   failureThreshold: 5,
 *   resetTimeout: 30000, // 30 seconds
 * });
 *
 * async function chargeCustomer(amount: number) {
 *   return stripeBreaker.execute(async () => {
 *     return stripe.paymentIntents.create({ amount });
 *   });
 * }
 * ```
 *
 * @module resilience/circuit-breaker
 */

import { logger } from '../observability/logger';
import {
  recordCircuitState,
  recordResilienceFailure,
  recordResilienceSuccess,
} from './metrics';

/**
 * Default circuit breaker thresholds.
 * Use these constants when configuring adapters to ensure consistency.
 */
export const CIRCUIT_BREAKER_DEFAULTS = {
  /** Number of failures before opening circuit */
  failureThreshold: 5,
  /** Time in ms before attempting recovery */
  resetTimeout: 30_000,
  /** Number of successful calls to close circuit */
  successThreshold: 2,
  /** Timeout for individual calls in ms */
  callTimeout: 10_000,
} as const;

/**
 * Circuit breaker states.
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration options.
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;

  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeout?: number;

  /** Number of successful calls to close circuit (default: 2) */
  successThreshold?: number;

  /** Timeout for individual calls in ms (default: 10000) */
  callTimeout?: number;

  /** Callback when circuit opens */
  onOpen?: (name: string) => void;

  /** Callback when circuit closes */
  onClose?: (name: string) => void;

  /** Callback when circuit enters half-open state */
  onHalfOpen?: (name: string) => void;
}

/**
 * Error thrown when circuit is open.
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly nextAttemptAt: Date
  ) {
    super(`Circuit '${circuitName}' is open. Next attempt at ${nextAttemptAt.toISOString()}`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit breaker statistics.
 */
export interface CircuitStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  openedAt?: Date;
  closedAt?: Date;
}

/**
 * Circuit breaker implementation.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private openedAt?: Date;
  private closedAt?: Date;
  private resetTimer?: ReturnType<typeof setTimeout>;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly callTimeout: number;
  private readonly onOpen?: (name: string) => void;
  private readonly onClose?: (name: string) => void;
  private readonly onHalfOpen?: (name: string) => void;

  constructor(
    public readonly name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.failureThreshold = options.failureThreshold ?? CIRCUIT_BREAKER_DEFAULTS.failureThreshold;
    this.resetTimeout = options.resetTimeout ?? CIRCUIT_BREAKER_DEFAULTS.resetTimeout;
    this.successThreshold = options.successThreshold ?? CIRCUIT_BREAKER_DEFAULTS.successThreshold;
    this.callTimeout = options.callTimeout ?? CIRCUIT_BREAKER_DEFAULTS.callTimeout;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onHalfOpen = options.onHalfOpen;
  }

  /**
   * Execute a function through the circuit breaker.
   *
   * @param fn - Async function to execute
   * @param operation - Optional operation name for metrics (default: 'execute')
   * @returns The function result if successful
   * @throws CircuitOpenError if circuit is open
   * @throws Original error if function fails
   */
  async execute<T>(fn: () => Promise<T>, operation = 'execute'): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      throw new CircuitOpenError(
        this.name,
        new Date((this.openedAt?.getTime() ?? Date.now()) + this.resetTimeout)
      );
    }

    const startTime = Date.now();
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      const durationMs = Date.now() - startTime;
      this.onSuccess(operation, durationMs);
      return result;
    } catch (error) {
      this.onFailure(error, operation);
      throw error;
    }
  }

  /**
   * Execute with call timeout.
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Circuit '${this.name}' call timeout after ${this.callTimeout}ms`)),
          this.callTimeout
        )
      ),
    ]);
  }

  /**
   * Handle successful execution.
   */
  private onSuccess(operation: string, durationMs: number): void {
    this.lastSuccess = new Date();
    this.successes++;

    // Record success metrics
    recordResilienceSuccess(this.name, operation, durationMs);

    if (this.state === 'HALF_OPEN') {
      if (this.successes >= this.successThreshold) {
        this.close();
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution.
   */
  private onFailure(error: unknown, operation: string): void {
    this.lastFailure = new Date();
    this.failures++;

    // Record failure metrics
    recordResilienceFailure(this.name, operation);

    logger.warn(`Circuit '${this.name}' failure #${this.failures}`, {
      circuit: this.name,
      failures: this.failures,
      threshold: this.failureThreshold,
      error: error instanceof Error ? error.message : String(error),
    });

    if (this.state === 'HALF_OPEN') {
      // Any failure in half-open reopens the circuit
      this.open();
    } else if (this.state === 'CLOSED' && this.failures >= this.failureThreshold) {
      this.open();
    }
  }

  /**
   * Open the circuit.
   */
  private open(): void {
    if (this.state === 'OPEN') return;

    this.state = 'OPEN';
    this.openedAt = new Date();
    this.successes = 0;

    // Record state change metrics
    recordCircuitState(this.name, 'OPEN');

    logger.warn(`Circuit '${this.name}' opened`, {
      circuit: this.name,
      failures: this.failures,
      resetTimeout: this.resetTimeout,
    });

    this.onOpen?.(this.name);

    // Schedule transition to half-open
    this.scheduleHalfOpen();
  }

  /**
   * Close the circuit.
   */
  private close(): void {
    if (this.state === 'CLOSED') return;

    this.state = 'CLOSED';
    this.closedAt = new Date();
    this.failures = 0;
    this.successes = 0;

    // Record state change metrics
    recordCircuitState(this.name, 'CLOSED');

    logger.info(`Circuit '${this.name}' closed`, { circuit: this.name });

    this.onClose?.(this.name);

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  /**
   * Schedule transition to half-open state.
   */
  private scheduleHalfOpen(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.halfOpen();
    }, this.resetTimeout);
  }

  /**
   * Transition to half-open state.
   */
  private halfOpen(): void {
    if (this.state !== 'OPEN') return;

    this.state = 'HALF_OPEN';
    this.successes = 0;

    // Record state change metrics
    recordCircuitState(this.name, 'HALF_OPEN');

    logger.info(`Circuit '${this.name}' half-open`, { circuit: this.name });

    this.onHalfOpen?.(this.name);
  }

  /**
   * Get current circuit state.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics.
   */
  getStats(): CircuitStats {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      openedAt: this.openedAt,
      closedAt: this.closedAt,
    };
  }

  /**
   * Manually reset the circuit to closed state.
   * Use with caution - for testing or manual recovery.
   */
  reset(): void {
    // Clear any pending timer first (defensive - close() also clears, but be explicit)
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    this.close();
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = undefined;
    this.lastSuccess = undefined;
    this.openedAt = undefined;
    this.closedAt = undefined;
  }

  /**
   * Manually open the circuit.
   * Use for maintenance or manual intervention.
   */
  trip(): void {
    this.open();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuit Breaker Registry
// ─────────────────────────────────────────────────────────────────────────────

const circuits = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker by name.
 *
 * Circuit breakers are stored in a global registry by name, which means the same
 * circuit breaker instance is returned for the same name. This is intentional for
 * tracking failures across multiple calls.
 *
 * @note In tests, call `resetAllCircuitBreakers()` in `beforeEach` to ensure test isolation.
 *
 * @example
 * ```typescript
 * const breaker = getCircuitBreaker('stripe', { failureThreshold: 3 });
 * await breaker.execute(() => stripeCall());
 * ```
 */
export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  let breaker = circuits.get(name);

  if (!breaker) {
    breaker = new CircuitBreaker(name, options);
    circuits.set(name, breaker);
  }

  return breaker;
}

/**
 * Get all registered circuit breakers.
 */
export function getAllCircuitBreakers(): CircuitBreaker[] {
  return Array.from(circuits.values());
}

/**
 * Get statistics for all circuits.
 */
export function getAllCircuitStats(): CircuitStats[] {
  return getAllCircuitBreakers().map((c) => c.getStats());
}

/**
 * Reset all circuit breakers.
 * Use with caution - for testing only.
 */
export function resetAllCircuitBreakers(): void {
  for (const breaker of circuits.values()) {
    breaker.reset();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a function with circuit breaker protection.
 *
 * @example
 * ```typescript
 * const result = await withCircuitBreaker('stripe', async () => {
 *   return stripe.paymentIntents.create({ amount: 1000 });
 * });
 * ```
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options?: CircuitBreakerOptions
): Promise<T> {
  const breaker = getCircuitBreaker(name, options);
  return breaker.execute(fn);
}
