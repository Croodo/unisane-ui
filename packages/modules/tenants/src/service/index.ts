/**
 * Tenants Service Barrel Export
 *
 * Re-exports all service functions for clean imports.
 */

// Core tenant operations
export { getCurrentTenant } from "./get-current-tenant";
export { readTenant } from "./read-tenant";
export { readTenantBySlug } from "./read-tenant-by-slug";
export { listTenants } from "./list-tenants";
export { deleteTenant } from "./delete-tenant";
export type { DeleteTenantArgs, DeleteTenantResult } from "./delete-tenant";
export {
  bootstrapFirstTenantForUser,
  configureTenantBootstrap,
} from "./bootstrap-tenant";
export type { TenantBootstrapProviders } from "./bootstrap-tenant";

// Status management
export {
  updateTenantStatus,
  suspendTenant,
  activateTenant,
} from "./update-tenant-status";
export type {
  UpdateTenantStatusInput,
  UpdateTenantStatusResult,
} from "./update-tenant-status";
