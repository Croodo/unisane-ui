import { PERM } from "./permissions";
import type { Permission } from "./permissions";
import type { RoleId } from "./roles";

/**
 * Role → Permission Bundles (CRUD Pattern)
 *
 * This is the SSOT for role-to-permission mapping.
 * Each role is assigned a set of permissions that determine what actions
 * members with that role can perform.
 *
 * Roles hierarchy (highest to lowest):
 * - owner: Full access + workspace management (delete, transfer)
 * - admin: Full access except workspace destruction
 * - member: Read-only access + limited storage write
 * - billing: Billing-focused access only
 */
export const ROLE_PERMS: Record<RoleId, Permission[]> = {
  owner: [
    // Full access to everything + workspace management
    PERM.SETTINGS_READ,
    PERM.SETTINGS_WRITE,
    PERM.MEMBERS_READ,
    PERM.MEMBERS_WRITE,
    PERM.MEMBERS_DELETE,
    PERM.APIKEYS_READ,
    PERM.APIKEYS_WRITE,
    PERM.APIKEYS_DELETE,
    PERM.BILLING_READ,
    PERM.BILLING_WRITE,
    PERM.FLAGS_READ,
    PERM.FLAGS_WRITE,
    PERM.AUDIT_READ,
    PERM.STORAGE_READ,
    PERM.STORAGE_WRITE,
    PERM.STORAGE_DELETE,
    PERM.WEBHOOKS_READ,
    PERM.WEBHOOKS_WRITE,
    PERM.WORKSPACE_DELETE,
    PERM.WORKSPACE_TRANSFER,
  ],
  admin: [
    // Full access except workspace destruction
    PERM.SETTINGS_READ,
    PERM.SETTINGS_WRITE,
    PERM.MEMBERS_READ,
    PERM.MEMBERS_WRITE,
    PERM.MEMBERS_DELETE,
    PERM.APIKEYS_READ,
    PERM.APIKEYS_WRITE,
    PERM.APIKEYS_DELETE,
    PERM.BILLING_READ,
    PERM.BILLING_WRITE,
    PERM.FLAGS_READ,
    PERM.FLAGS_WRITE,
    PERM.AUDIT_READ,
    PERM.STORAGE_READ,
    PERM.STORAGE_WRITE,
    PERM.STORAGE_DELETE,
    PERM.WEBHOOKS_READ,
    PERM.WEBHOOKS_WRITE,
  ],
  member: [
    // Read-only access + storage write
    PERM.SETTINGS_READ,
    PERM.FLAGS_READ,
    PERM.STORAGE_READ,
    PERM.STORAGE_WRITE,
  ],
  billing: [
    // Billing-focused access
    PERM.BILLING_READ,
    PERM.BILLING_WRITE,
    PERM.SETTINGS_READ,
  ],
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: RoleId): Permission[] {
  return ROLE_PERMS[role] ?? [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPerm(role: RoleId, perm: Permission): boolean {
  return ROLE_PERMS[role]?.includes(perm) ?? false;
}
