/**
 * Context Types
 *
 * Defines the request context interface for AsyncLocalStorage-based
 * request scoping throughout the application.
 */

/**
 * Request context that flows through the entire request lifecycle.
 * Stored in AsyncLocalStorage and accessible via ctx.get().
 */
export interface RequestContext {
  /** Unique identifier for this request (for tracing/logging) */
  requestId: string;

  /** Tenant ID for multi-tenant scoping (optional for public routes) */
  tenantId?: string;

  /** User ID of the authenticated user (optional for public routes) */
  userId?: string;

  /** Cached tenant plan (lazy-loaded via ctx.getPlan()) */
  plan?: string;

  /** Cached feature flags (lazy-loaded via ctx.getFlags()) */
  flags?: Record<string, boolean>;

  /** Request start time for duration tracking */
  startTime: number;

  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Context API for accessing request-scoped data.
 */
export interface ContextAPI {
  /**
   * Run a function within a context scope.
   * All code executed within fn() will have access to the context via get().
   */
  run<T>(context: RequestContext, fn: () => Promise<T>): Promise<T>;

  /**
   * Get the current context. Throws if not within a context scope.
   * Use this when you REQUIRE a context to exist.
   */
  get(): RequestContext;

  /**
   * Try to get the current context. Returns undefined if not in a context scope.
   * Use this for optional context access (e.g., logging outside request scope).
   */
  tryGet(): RequestContext | undefined;

  /**
   * Get the current tenant's plan (lazy-loaded and cached).
   * Requires tenantId in context.
   */
  getPlan(): Promise<string>;

  /**
   * Get the current tenant's feature flags (lazy-loaded and cached).
   * Requires tenantId in context.
   */
  getFlags(): Promise<Record<string, boolean>>;
}

/**
 * Helper type for functions that require a context
 */
export type WithContext<T> = T & { __contextRequired: true };

/**
 * Options for creating a new request context
 */
export interface CreateContextOptions {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
