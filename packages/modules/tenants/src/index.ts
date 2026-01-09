/**
 * @module @unisane/tenants
 * @description Tenant and membership management for multi-tenant applications
 * @layer 3
 *
 * Provides:
 * - Tenant CRUD operations
 * - Membership management
 * - Invitation system
 * - Admin operations
 *
 * @example
 * ```typescript
 * import {
 *   getCurrentTenant,
 *   readTenant,
 *   deleteTenant,
 *   TenantNotFoundError,
 *   TENANT_EVENTS,
 *   tenantKeys,
 * } from '@unisane/tenants';
 *
 * // Get current tenant from context
 * const tenant = await getCurrentTenant();
 *
 * // Read tenant by ID (cross-module)
 * const tenant = await readTenant('tenant_123');
 *
 * // Use cache keys
 * const cached = await cacheGet(tenantKeys.byId(tenantId));
 *
 * // Listen for events
 * events.on(TENANT_EVENTS.CREATED, async (event) => {
 *   console.log('New tenant:', event.payload.tenantId);
 * });
 * ```
 */

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export {
  getCurrentTenant,
  readTenant,
  readTenantBySlug,
  listTenants,
  deleteTenant,
  bootstrapFirstTenantForUser,
  configureTenantBootstrap,
} from "./service";

export type {
  DeleteTenantArgs,
  DeleteTenantResult,
  TenantBootstrapProviders,
} from "./service";

// Admin services
export * from "./service/admin/list";
export * from "./service/admin/read";
export * from "./service/admin/export";
export * from "./service/admin/stats";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Types
// ════════════════════════════════════════════════════════════════════════════

export type {
  TenantRow,
  TenantAdminView,
  LatestSub,
} from "./domain/types";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas (for validation)
// ════════════════════════════════════════════════════════════════════════════

export {
  ZTenantAdminView,
  ZTenantAdminSubscription,
} from "./domain/schemas";

export type { TenantAdminViewDto } from "./domain/schemas";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  TenantNotFoundError,
  TenantSlugConflictError,
  TenantAccessDeniedError,
  TenantHasActiveSubscriptionError,
  MembershipNotFoundError,
  LastOwnerError,
  InvitationExpiredError,
  InvitationNotFoundError,
} from "./domain/errors";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export {
  TENANT_EVENTS,
  TENANT_ROLES,
  INVITATION_STATUS,
  TENANT_DEFAULTS,
  TENANT_COLLECTIONS,
} from "./domain/constants";

export type {
  TenantRole,
  InvitationStatus,
} from "./domain/constants";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { tenantKeys } from "./domain/keys";
export type { TenantKeyBuilder } from "./domain/keys";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Ports (Repository Interfaces)
// ════════════════════════════════════════════════════════════════════════════

export * from "./domain/ports";

// ════════════════════════════════════════════════════════════════════════════
// Data - Repository (for advanced use cases)
// ════════════════════════════════════════════════════════════════════════════

export { TenantsRepo } from "./data/tenants.repository";
