/**
 * Context Implementation
 *
 * AsyncLocalStorage-based request context for multi-tenant applications.
 * Provides automatic tenant scoping and request-scoped data access.
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContext, ContextAPI, CreateContextOptions } from './types';
import { generateId } from '../utils/ids';

/**
 * AsyncLocalStorage instance for storing request context.
 * This allows context to flow through async operations automatically.
 */
const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Error thrown when attempting to access context outside of a ctx.run() scope.
 */
export class ContextNotInitializedError extends Error {
  constructor() {
    super('Context not initialized. Ensure ctx.run() wraps this call.');
    this.name = 'ContextNotInitializedError';
  }
}

/**
 * Error thrown when a required context field is missing.
 */
export class ContextFieldRequiredError extends Error {
  constructor(field: string) {
    super(`Context field '${field}' is required but not set.`);
    this.name = 'ContextFieldRequiredError';
  }
}

/**
 * Injectable loaders for lazy-loaded context data.
 * These are set by the application during bootstrap to avoid circular dependencies.
 */
type PlanLoader = (tenantId: string) => Promise<string>;
type FlagsLoader = (tenantId: string) => Promise<Record<string, boolean>>;

let planLoader: PlanLoader | null = null;
let flagsLoader: FlagsLoader | null = null;

/**
 * Set the plan loader function (called during app bootstrap).
 * This allows the context to lazy-load tenant plans without circular deps.
 */
export function setPlanLoader(loader: PlanLoader): void {
  planLoader = loader;
}

/**
 * Set the flags loader function (called during app bootstrap).
 * This allows the context to lazy-load feature flags without circular deps.
 */
export function setFlagsLoader(loader: FlagsLoader): void {
  flagsLoader = loader;
}

/**
 * The main context API.
 *
 * @example
 * ```typescript
 * // In your request handler / middleware
 * await ctx.run({ requestId: 'req_123', tenantId: 'tenant_456', startTime: Date.now() }, async () => {
 *   // All code here has access to context
 *   const { tenantId } = ctx.get();
 *   await someService.doSomething(); // Services can use ctx.get() internally
 * });
 *
 * // In a service
 * export async function getSubscription() {
 *   const { tenantId } = ctx.get(); // Automatically gets tenant from context
 *   return db.subscriptions.findOne({ tenantId });
 * }
 * ```
 */
export const ctx: ContextAPI = {
  /**
   * Run a function within a context scope.
   * The context will be available to all code executed within fn().
   */
  run<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return storage.run(context, fn);
  },

  /**
   * Get the current context.
   * @throws ContextNotInitializedError if not within a ctx.run() scope
   */
  get(): RequestContext {
    const context = storage.getStore();
    if (!context) {
      throw new ContextNotInitializedError();
    }
    return context;
  },

  /**
   * Try to get the current context.
   * @returns The context or undefined if not in a context scope
   */
  tryGet(): RequestContext | undefined {
    return storage.getStore();
  },

  /**
   * Get the current tenant's plan (lazy-loaded and cached).
   * On first call, fetches using the registered plan loader and caches in context.
   */
  async getPlan(): Promise<string> {
    const context = this.get();
    if (!context.tenantId) {
      throw new ContextFieldRequiredError('tenantId');
    }

    // Return cached if available
    if (context.plan) {
      return context.plan;
    }

    // Use registered loader or return default
    if (planLoader) {
      const plan = await planLoader(context.tenantId);
      context.plan = plan;
      return plan;
    }

    // No loader registered, return default
    return 'free';
  },

  /**
   * Get the current tenant's feature flags (lazy-loaded and cached).
   * On first call, fetches using the registered flags loader and caches in context.
   */
  async getFlags(): Promise<Record<string, boolean>> {
    const context = this.get();
    if (!context.tenantId) {
      throw new ContextFieldRequiredError('tenantId');
    }

    // Return cached if available
    if (context.flags) {
      return context.flags;
    }

    // Use registered loader or return empty
    if (flagsLoader) {
      const flags = await flagsLoader(context.tenantId);
      context.flags = flags;
      return flags;
    }

    // No loader registered, return empty
    return {};
  },
};

/**
 * Create a new request context with sensible defaults.
 *
 * @example
 * ```typescript
 * const context = createContext({ tenantId: 'tenant_123', userId: 'user_456' });
 * await ctx.run(context, async () => { ... });
 * ```
 */
export function createContext(options: CreateContextOptions = {}): RequestContext {
  return {
    requestId: options.requestId || generateId('req'),
    tenantId: options.tenantId,
    userId: options.userId,
    startTime: Date.now(),
    metadata: options.metadata,
  };
}

/**
 * Convenience function to run code within a new context.
 *
 * @example
 * ```typescript
 * await runInContext({ tenantId: 'tenant_123' }, async () => {
 *   // Your code here
 * });
 * ```
 */
export async function runInContext<T>(
  options: CreateContextOptions,
  fn: () => Promise<T>
): Promise<T> {
  const context = createContext(options);
  return ctx.run(context, fn);
}

/**
 * Get the current tenant ID from context.
 * Convenience function for the common case.
 *
 * @throws ContextNotInitializedError if not in context
 * @throws ContextFieldRequiredError if tenantId not set
 */
export function getTenantId(): string {
  const context = ctx.get();
  if (!context.tenantId) {
    throw new ContextFieldRequiredError('tenantId');
  }
  return context.tenantId;
}

/**
 * Get the current user ID from context.
 * Convenience function for the common case.
 *
 * @throws ContextNotInitializedError if not in context
 * @throws ContextFieldRequiredError if userId not set
 */
export function getUserId(): string {
  const context = ctx.get();
  if (!context.userId) {
    throw new ContextFieldRequiredError('userId');
  }
  return context.userId;
}

/**
 * Get the current request ID from context.
 * Always available within a context scope.
 */
export function getRequestId(): string {
  return ctx.get().requestId;
}
