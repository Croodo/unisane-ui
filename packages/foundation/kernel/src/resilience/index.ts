/**
 * Resilience Module
 *
 * Patterns for handling failures in distributed systems:
 * - Circuit Breaker: Prevent cascading failures
 * - Retry: Automatic retry with exponential backoff
 * - Failover: Automatic provider failover
 * - Graceful Degradation: Fallback behavior for service failures
 *
 * @module resilience
 *
 * @example
 * ```typescript
 * import {
 *   CircuitBreaker,
 *   retry,
 *   createFailoverAdapter,
 *   withFallback,
 *   createDegradedModeManager,
 * } from '@unisane/kernel';
 *
 * // Circuit Breaker
 * const breaker = new CircuitBreaker('stripe', { failureThreshold: 5 });
 * await breaker.execute(() => stripeCall());
 *
 * // Retry with backoff
 * const data = await retry(() => fetchExternalApi(), {
 *   maxRetries: 3,
 *   baseDelayMs: 1000,
 * });
 *
 * // Failover adapter
 * const payment = createFailoverAdapter(stripe, [paypal, razorpay]);
 * await payment.execute(p => p.charge(100));
 *
 * // Graceful degradation
 * const result = await withFallback(
 *   () => fetchRecommendations(),
 *   () => getCachedRecommendations(),
 * );
 * ```
 */

// Circuit Breaker
export * from './circuit-breaker';

// Retry with exponential backoff
export * from './retry';

// Failover adapter
export * from './failover';

// Graceful degradation
export * from './degradation';

// Resilient Adapter (combines all patterns)
export * from './resilient-adapter';

// Metrics exporter for observability
export * from './metrics';
