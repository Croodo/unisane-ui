/**
 * Scope Context Implementation
 *
 * AsyncLocalStorage-based universal scope context for multi-tenant,
 * multi-user, and multi-merchant applications.
 *
 * This is the core of the universal scope system, enabling the same
 * codebase to work for SaaS, e-commerce, and marketplace platforms.
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { Scope, ScopeContext, CreateScopeContextOptions, ScopeType } from './types';
import { generateId } from '../utils/ids';

/**
 * AsyncLocalStorage instance for storing scope context.
 * This allows context to flow through async operations automatically.
 *
 * IMPORTANT: Stored on global to ensure single instance across module copies in Next.js/Turbopack.
 * Without this, different module instances would have different AsyncLocalStorage instances,
 * breaking context propagation across chunks.
 */
const globalForScope = global as unknown as {
  __kernelScopeStorage?: AsyncLocalStorage<ScopeContext>;
};

if (!globalForScope.__kernelScopeStorage) {
  globalForScope.__kernelScopeStorage = new AsyncLocalStorage<ScopeContext>();
}

const storage = globalForScope.__kernelScopeStorage;

/**
 * Error thrown when attempting to access scope outside of a scoped context.
 */
export class ScopeNotInitializedError extends Error {
  constructor(message = 'Scope context required for this operation. Ensure runWithScope() wraps this call.') {
    super(message);
    this.name = 'ScopeNotInitializedError';
  }
}

/**
 * Error thrown when scope type doesn't match expected type.
 */
export class ScopeTypeMismatchError extends Error {
  constructor(expected: ScopeType, actual: ScopeType) {
    super(`Scope type mismatch: expected '${expected}', got '${actual}'`);
    this.name = 'ScopeTypeMismatchError';
  }
}

/**
 * Error thrown when a required scope context field is missing.
 */
export class ScopeFieldRequiredError extends Error {
  constructor(field: string) {
    super(`Scope field '${field}' is required but not set.`);
    this.name = 'ScopeFieldRequiredError';
  }
}

/**
 * Injectable loaders for lazy-loaded scope data.
 * These are set by the application during bootstrap to avoid circular dependencies.
 * IMPORTANT: Stored on global to ensure single instance across module copies.
 */
type PlanLoader = (scopeType: ScopeType, scopeId: string) => Promise<string>;
type FlagsLoader = (scopeType: ScopeType, scopeId: string) => Promise<Record<string, boolean>>;

const globalForLoaders = global as unknown as {
  __kernelScopePlanLoader?: PlanLoader | null;
  __kernelScopeFlagsLoader?: FlagsLoader | null;
};

/**
 * Set the plan loader function (called during app bootstrap).
 * This allows the scope context to lazy-load plans without circular deps.
 * Pass null to clear the loader.
 */
export function setScopePlanLoader(loader: PlanLoader | null): void {
  globalForLoaders.__kernelScopePlanLoader = loader;
}

/**
 * Set the flags loader function (called during app bootstrap).
 * This allows the scope context to lazy-load feature flags without circular deps.
 * Pass null to clear the loader.
 */
export function setScopeFlagsLoader(loader: FlagsLoader | null): void {
  globalForLoaders.__kernelScopeFlagsLoader = loader;
}

/**
 * Get the current scope.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 *
 * @example
 * ```typescript
 * const scope = getScope();
 * // scope.type: 'tenant' | 'user' | 'merchant' | 'organization'
 * // scope.id: 'team_123' | 'user_456' | 'shop_789'
 * ```
 */
export function getScope(): Scope {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new ScopeNotInitializedError();
  }
  return ctx.scope;
}

/**
 * Try to get the current scope without throwing.
 *
 * @returns The scope or null if not in a scope context
 */
export function getScopeOrNull(): Scope | null {
  return storage.getStore()?.scope ?? null;
}

/**
 * Get the current scope ID (shorthand for getScope().id).
 *
 * @param options.required - Whether to throw if scope is missing (default: true)
 * @returns The scope ID, or undefined if not required and scope is missing
 * @throws ScopeNotInitializedError if required=true and not within a scope context
 */
export function getScopeId(): string;
export function getScopeId(options: { required: false }): string | undefined;
export function getScopeId(options: { required: true }): string;
export function getScopeId(options: { required?: boolean } = {}): string | undefined {
  const { required = true } = options;
  if (required) {
    return getScope().id;
  }
  return getScopeOrNull()?.id;
}

/**
 * Get the current scope type (shorthand for getScope().type).
 *
 * @throws ScopeNotInitializedError if not within a scope context
 */
export function getScopeType(): ScopeType {
  return getScope().type;
}

/**
 * Get the full scope context.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 */
export function getScopeContext(): ScopeContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new ScopeNotInitializedError();
  }
  return ctx;
}

/**
 * Try to get the full scope context without throwing.
 *
 * @returns The scope context or undefined if not in a scope context
 */
export function tryGetScopeContext(): ScopeContext | undefined {
  return storage.getStore();
}

/**
 * Run a function within a scope context.
 *
 * @example
 * ```typescript
 * // SaaS tenant scope
 * await runWithScope({ type: 'tenant', id: 'team_123' }, async () => {
 *   const scope = getScope();
 *   await someService.doSomething();
 * });
 *
 * // E-commerce user scope
 * await runWithScope({ type: 'user', id: 'user_456' }, async () => {
 *   const orders = await getOrders(); // Scoped to user
 * });
 * ```
 */
export function runWithScope<T>(scope: Scope, fn: () => T): T {
  const ctx: ScopeContext = {
    scope,
    requestId: generateId('req'),
    startTime: Date.now(),
  };
  return storage.run(ctx, fn);
}

/**
 * Run a function within a full scope context with additional options.
 *
 * @example
 * ```typescript
 * await runWithScopeContext({
 *   scope: { type: 'tenant', id: 'team_123' },
 *   userId: 'user_456',
 *   requestId: 'req_custom',
 * }, async () => {
 *   // ...
 * });
 * ```
 */
export function runWithScopeContext<T>(
  options: CreateScopeContextOptions,
  fn: () => T
): T {
  const ctx: ScopeContext = {
    scope: options.scope,
    requestId: options.requestId ?? generateId('req'),
    userId: options.userId,
    startTime: Date.now(),
    metadata: options.metadata,
  };
  return storage.run(ctx, fn);
}

/**
 * Run a function within a pre-built scope context.
 * This allows full control over the context, including plan/flags caching.
 * Used internally for backward compatibility with the old context API.
 *
 * @internal
 */
export function runWithFullScopeContext<T>(
  ctx: ScopeContext,
  fn: () => T
): T {
  return storage.run(ctx, fn);
}

/**
 * Get the user ID from the current scope context.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 * @throws ScopeFieldRequiredError if userId is not set
 */
export function getScopeUserId(): string {
  const ctx = getScopeContext();
  if (!ctx.userId) {
    throw new ScopeFieldRequiredError('userId');
  }
  return ctx.userId;
}

/**
 * Get the request ID from the current scope context.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 */
export function getScopeRequestId(): string {
  return getScopeContext().requestId;
}

/**
 * Get the current scope's plan (lazy-loaded and cached).
 * On first call, fetches using the registered plan loader and caches in context.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 * @throws ScopeFieldRequiredError if scope.id is not set
 */
export async function getScopePlan(): Promise<string> {
  const ctx = getScopeContext();

  // Require scope.id to be set
  if (!ctx.scope.id) {
    throw new ScopeFieldRequiredError('scopeId');
  }

  // Return cached if available
  if (ctx.plan) {
    return ctx.plan;
  }

  // Use registered loader or return default
  if (globalForLoaders.__kernelScopePlanLoader) {
    const plan = await globalForLoaders.__kernelScopePlanLoader(
      ctx.scope.type,
      ctx.scope.id
    );
    ctx.plan = plan;
    return plan;
  }

  // No loader registered, return default
  return 'free';
}

/**
 * Get the current scope's feature flags (lazy-loaded and cached).
 * On first call, fetches using the registered flags loader and caches in context.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 * @throws ScopeFieldRequiredError if scope.id is not set
 */
export async function getScopeFlags(): Promise<Record<string, boolean>> {
  const ctx = getScopeContext();

  // Require scope.id to be set
  if (!ctx.scope.id) {
    throw new ScopeFieldRequiredError('scopeId');
  }

  // Return cached if available
  if (ctx.flags) {
    return ctx.flags;
  }

  // Use registered loader or return empty
  if (globalForLoaders.__kernelScopeFlagsLoader) {
    const flags = await globalForLoaders.__kernelScopeFlagsLoader(
      ctx.scope.type,
      ctx.scope.id
    );
    ctx.flags = flags;
    return flags;
  }

  // No loader registered, return empty
  return {};
}

/**
 * Check if the current scope matches an expected type.
 *
 * @example
 * ```typescript
 * if (isScopeType('tenant')) {
 *   // We're in a tenant context
 *   const tenantId = getScopeId();
 * }
 * ```
 */
export function isScopeType(expectedType: ScopeType): boolean {
  const scope = getScopeOrNull();
  return scope?.type === expectedType;
}

/**
 * Assert that the current scope is of a specific type.
 *
 * @throws ScopeNotInitializedError if not within a scope context
 * @throws ScopeTypeMismatchError if scope type doesn't match
 *
 * @example
 * ```typescript
 * assertScopeType('tenant');
 * // If we get here, we know we're in a tenant scope
 * const tenantId = getScopeId();
 * ```
 */
export function assertScopeType(expectedType: ScopeType): void {
  const scope = getScope();
  if (scope.type !== expectedType) {
    throw new ScopeTypeMismatchError(expectedType, scope.type);
  }
}
