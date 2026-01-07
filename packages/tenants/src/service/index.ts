/**
 * Tenants Service Barrel Export
 *
 * Re-exports all service functions for clean imports.
 */

// Core tenant operations
export { getCurrentTenant } from "./getCurrentTenant";
export { readTenant } from "./readTenant";
export { readTenantBySlug } from "./readTenantBySlug";
export { listTenants } from "./listTenants";
export { deleteTenant } from "./deleteTenant";
export type { DeleteTenantArgs, DeleteTenantResult } from "./deleteTenant";
export {
  bootstrapFirstTenantForUser,
  configureTenantBootstrap,
} from "./bootstrapTenant";
export type { TenantBootstrapProviders } from "./bootstrapTenant";
