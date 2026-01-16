import { z } from "zod";
import {
  ZBillingMode,
  DEFAULT_BILLING_MODE,
  BILLING_MODES,
} from "@unisane/kernel/client";

/**
 * Settings Module - Unified Configuration Source
 *
 * This file is the SINGLE SOURCE OF TRUTH for all platform and tenant settings.
 * It defines schemas, defaults, UI metadata, and access control in one place.
 *
 * ## Architecture: Dual Schema System
 *
 * We maintain TWO types of schemas for different purposes:
 *
 * 1. **Per-Setting Schemas** (this file - `settings.ts`):
 *    - Specific validation rules for each individual setting
 *    - Used by `patchTypedSetting` to validate values before saving
 *    - Example: `z.number().int().min(60).max(3600)` for OTP TTL
 *    - Purpose: Ensure data integrity and business rules
 *
 * 2. **Generic Transport Schemas** (`domain/schemas.ts`):
 *    - Generic CRUD schemas for API contracts
 *    - `ZPatchSetting`, `ZSettingOut`, `ZGetSetting`
 *    - Accept `z.unknown()` for value field (any JSON)
 *    - Purpose: Type-safe API layer without knowing specific setting types
 *
 * ## Why Both?
 *
 * - **Flexibility**: API can handle any setting without code changes
 * - **Safety**: Each setting validates against its specific schema
 * - **Separation**: Transport layer (API) vs Business logic (validation)
 *
 * ## Data Flow
 *
 * ```
 * Client → API (ZPatchSetting) → Service (finds definition) → Validate (specific schema) → Save
 * ```
 */

type Scope = "platform" | "tenant" | "user";
type Visibility = "platform-only" | "tenant-ui" | "hidden";
type UICategory = "runtime" | "billing" | "auth" | "webhooks";
type UIInputType = "text" | "number" | "boolean" | "select" | "textarea" | "array" | "custom";

export type SettingDefinition<T = unknown> = {
  namespace: string;
  key: string;
  scope: Scope;
  visibility: Visibility;
  schema: z.ZodType<T>;
  defaultValue: T;
  ui?: {
    label: string;
    description: string;
    category: UICategory;
    type: UIInputType;
    options?: { value: string; label: string }[];
    placeholder?: string;
    min?: number;
    max?: number;
    customComponent?: string; // Name of custom component to use
  };
};

// ============================================================================
// Setting Definitions (Single Source of Truth)
// ============================================================================

export const SETTING_DEFINITIONS = {
  // Runtime Settings
  "runtime.maintenanceBanner": {
    namespace: "runtime",
    key: "maintenanceBanner",
    scope: "platform",
    visibility: "platform-only",
    schema: z.object({
      enabled: z.boolean().default(false),
      message: z.string().max(200),
      variant: z.enum(["info", "warning", "danger"]).default("info"),
    }),
    defaultValue: {
      enabled: false,
      message: "",
      variant: "info" as const,
    },
    ui: {
      label: "Maintenance Banner",
      description: "Display a global banner across all workspaces during maintenance windows",
      category: "runtime" as const,
      type: "custom" as const,
      customComponent: "MaintenanceBannerCard",
    },
  },

  // Billing Settings
  "billing.mode": {
    namespace: "billing",
    key: "mode",
    scope: "platform",
    visibility: "platform-only",
    schema: ZBillingMode.default(DEFAULT_BILLING_MODE),
    defaultValue: DEFAULT_BILLING_MODE,
    ui: {
      label: "Billing Mode",
      description: "Controls how billing works across the platform",
      category: "billing" as const,
      type: "select" as const,
      options: BILLING_MODES.map((mode) => ({
        value: mode,
        label: mode.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    },
  },

  "billing.defaultCurrency": {
    namespace: "billing",
    key: "defaultCurrency",
    scope: "platform",
    visibility: "platform-only",
    schema: z.string().default("USD"),
    defaultValue: "USD",
    ui: {
      label: "Default Currency",
      description: "Default currency for billing operations",
      category: "billing" as const,
      type: "select" as const,
      options: [
        { value: "USD", label: "USD - US Dollar" },
        { value: "EUR", label: "EUR - Euro" },
        { value: "GBP", label: "GBP - British Pound" },
        { value: "INR", label: "INR - Indian Rupee" },
      ],
    },
  },

  // Auth Settings
  "auth.otpTtlSeconds": {
    namespace: "auth",
    key: "otpTtlSeconds",
    scope: "platform",
    visibility: "platform-only",
    schema: z.number().int().positive().default(600),
    defaultValue: 600,
    ui: {
      label: "OTP TTL (seconds)",
      description: "Time-to-live for one-time password codes",
      category: "auth" as const,
      type: "number" as const,
      min: 60,
      max: 3600,
      placeholder: "600",
    },
  },

  "auth.otpLength": {
    namespace: "auth",
    key: "otpLength",
    scope: "platform",
    visibility: "platform-only",
    schema: z.number().int().min(4).max(8).default(6),
    defaultValue: 6,
    ui: {
      label: "OTP Code Length",
      description: "Number of digits in OTP codes",
      category: "auth" as const,
      type: "number" as const,
      min: 4,
      max: 8,
      placeholder: "6",
    },
  },

  "auth.resetTokenTtlSeconds": {
    namespace: "auth",
    key: "resetTokenTtlSeconds",
    scope: "platform",
    visibility: "platform-only",
    schema: z.number().int().positive().default(3600),
    defaultValue: 3600,
    ui: {
      label: "Password Reset Token TTL (seconds)",
      description: "Time-to-live for password reset tokens",
      category: "auth" as const,
      type: "number" as const,
      min: 300,
      max: 86400,
      placeholder: "3600",
    },
  },

  // Webhook Settings
  "webhooks.allowedHosts": {
    namespace: "webhooks",
    key: "allowedHosts",
    scope: "platform",
    visibility: "platform-only",
    schema: z.array(z.string().min(1)).default([]),
    defaultValue: [],
    ui: {
      label: "Global Allowed Webhook Hosts",
      description: "Platform-wide allowlist for outbound webhook targets (one per line)",
      category: "webhooks" as const,
      type: "array" as const,
      placeholder: "hooks.partner.com\n.example.com",
    },
  },

  "webhooks.retentionDays": {
    namespace: "webhooks",
    key: "retentionDays",
    scope: "platform",
    visibility: "platform-only",
    schema: z.number().int().nonnegative().default(30),
    defaultValue: 30,
    ui: {
      label: "Event Retention (days)",
      description: "How long to keep webhook event history",
      category: "webhooks" as const,
      type: "number" as const,
      min: 1,
      max: 365,
      placeholder: "30",
    },
  },

  // Tenant-scoped settings (not shown in platform admin UI)
  "branding.name": {
    namespace: "branding",
    key: "name",
    scope: "tenant",
    visibility: "tenant-ui",
    schema: z.string().max(80),
    defaultValue: "Your App",
    // No UI config - tenant-scoped, managed elsewhere
  },

  "app.banner": {
    namespace: "app",
    key: "banner",
    scope: "tenant",
    visibility: "tenant-ui",
    schema: z
      .union([
        z.string().max(200),
        z.object({
          message: z.string().max(200),
          variant: z.enum(["info", "warning", "success"]).default("info"),
        }),
      ])
      .transform((value) =>
        typeof value === "string"
          ? { message: value, variant: "info" as const }
          : value
      ),
    defaultValue: { message: "", variant: "info" as const },
    // No UI config - tenant-scoped, managed elsewhere
  },

  "webhooks.allowedHosts.tenant": {
    namespace: "webhooks",
    key: "allowedHosts",
    scope: "tenant",
    visibility: "platform-only",
    schema: z.array(z.string().min(1)).default([]),
    defaultValue: [],
    // No UI config - tenant-specific override, managed elsewhere
  },

  "plan.overrides": {
    namespace: "plan",
    key: "overrides",
    scope: "tenant",
    visibility: "platform-only",
    schema: z
      .object({
        capacities: z
          .object({
            seats: z.number().int().positive().optional(),
          })
          .optional(),
        quotas: z
          .record(z.string(), z.number().int().nonnegative())
          .optional(),
      })
      .default({}),
    defaultValue: {},
    // No UI config - complex object, needs custom UI
  },

  "plan.addons": {
    namespace: "plan",
    key: "addons",
    scope: "tenant",
    visibility: "platform-only",
    schema: z
      .object({
        credits: z
          .record(
            z.string(),
            z.object({
              grant: z.number().int().nonnegative(),
              period: z.enum(["month", "year"]).optional(),
            })
          )
          .optional(),
      })
      .default({}),
    defaultValue: {},
    // No UI config - complex object, needs custom UI
  },
} as const satisfies Record<string, SettingDefinition>;

// ============================================================================
// Derived Types
// ============================================================================

export type SettingKey = keyof typeof SETTING_DEFINITIONS;

export type SettingValueType<K extends SettingKey> = z.infer<
  (typeof SETTING_DEFINITIONS)[K]["schema"]
>;

// ============================================================================
// Helper Functions
// ============================================================================

export function getSettingDefinition(
  namespace: string,
  key: string
): SettingDefinition | null {
  const settingKey = `${namespace}.${key}` as SettingKey;
  return SETTING_DEFINITIONS[settingKey] ?? null;
}

export function getAllDefinitions(): SettingDefinition[] {
  return Object.values(SETTING_DEFINITIONS);
}

export function getPlatformDefinitions(): SettingDefinition[] {
  return getAllDefinitions().filter((def) => def.scope === "platform");
}

export function getUIDefinitions(): SettingDefinition[] {
  return getAllDefinitions().filter((def) => def.ui !== undefined);
}
