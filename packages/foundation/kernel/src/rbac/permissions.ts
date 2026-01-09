import { z } from "zod";

/**
 * RBAC Permissions - CRUD Pattern
 *
 * Format: `resource:action`
 * Actions: read, write, delete
 */
export const PERM = {
  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",

  // Team Members
  MEMBERS_READ: "members:read",
  MEMBERS_WRITE: "members:write",
  MEMBERS_DELETE: "members:delete",

  // API Keys
  APIKEYS_READ: "apikeys:read",
  APIKEYS_WRITE: "apikeys:write",
  APIKEYS_DELETE: "apikeys:delete",

  // Billing
  BILLING_READ: "billing:read",
  BILLING_WRITE: "billing:write",

  // Feature Flags
  FLAGS_READ: "flags:read",
  FLAGS_WRITE: "flags:write",

  // Audit Logs
  AUDIT_READ: "audit:read",

  // Storage
  STORAGE_READ: "storage:read",
  STORAGE_WRITE: "storage:write",
  STORAGE_DELETE: "storage:delete",

  // Webhooks
  WEBHOOKS_READ: "webhooks:read",
  WEBHOOKS_WRITE: "webhooks:write",

  // Workspace (Owner-only)
  WORKSPACE_DELETE: "workspace:delete",
  WORKSPACE_TRANSFER: "workspace:transfer",
} as const;

export type Permission = (typeof PERM)[keyof typeof PERM];
export const ZPermission = z.enum(
  Object.values(PERM) as [Permission, ...Permission[]]
);

export const ALL_PERMISSIONS = Object.values(PERM) as Permission[];
