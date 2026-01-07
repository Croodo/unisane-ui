/**
 * Context Module
 *
 * Provides AsyncLocalStorage-based request context for multi-tenant applications.
 *
 * @example
 * ```typescript
 * import { ctx, createContext, runInContext } from '@unisane/kernel';
 *
 * // Option 1: Manual context creation
 * const context = createContext({ tenantId: 'tenant_123', userId: 'user_456' });
 * await ctx.run(context, async () => {
 *   const { tenantId } = ctx.get();
 *   // All services can access ctx.get() here
 * });
 *
 * // Option 2: Convenience wrapper
 * await runInContext({ tenantId: 'tenant_123' }, async () => {
 *   // Your code here
 * });
 *
 * // In services
 * export async function getSubscription() {
 *   const { tenantId } = ctx.get(); // Get tenant from context
 *   return db.subscriptions.findOne({ tenantId });
 * }
 * ```
 */

// Types
export type {
  RequestContext,
  ContextAPI,
  CreateContextOptions,
  WithContext,
} from './types';

// Main API
export {
  ctx,
  createContext,
  runInContext,
  getTenantId,
  getUserId,
  getRequestId,
  ContextNotInitializedError,
  ContextFieldRequiredError,
  // Loader setters for bootstrap
  setPlanLoader,
  setFlagsLoader,
} from './context';
