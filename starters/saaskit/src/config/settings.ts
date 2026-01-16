import { z } from "zod";
import {
  define,
  getSettingRegistry,
  type SettingDefinition,
} from "@unisane/config";
import {
  ZBillingMode,
  DEFAULT_BILLING_MODE,
  BILLING_MODES,
} from "@unisane/kernel/client";

/**
 * SaasKit Settings
 *
 * Uses @unisane/config for streamlined setting definitions.
 * See @unisane/config for the dual-schema architecture documentation.
 */

// ============================================================================
// Setting Definitions
// ============================================================================

const CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;

export const SETTING_DEFINITIONS = {
  // -------------------------------------------------------------------------
  // Runtime Settings
  // -------------------------------------------------------------------------
  "runtime.maintenanceBanner": define.custom(
    "runtime",
    "maintenanceBanner",
    z.object({
      enabled: z.boolean().default(false),
      message: z.string().max(200),
      variant: z.enum(["info", "warning", "danger"]).default("info"),
    }),
    { enabled: false, message: "", variant: "info" as const },
    {
      label: "Maintenance Banner",
      description: "Display a global banner across all workspaces during maintenance windows",
      category: "runtime",
      customComponent: "MaintenanceBannerCard",
    }
  ),

  // -------------------------------------------------------------------------
  // Billing Settings
  // -------------------------------------------------------------------------
  "billing.mode": define.custom(
    "billing",
    "mode",
    ZBillingMode.default(DEFAULT_BILLING_MODE),
    DEFAULT_BILLING_MODE,
    {
      label: "Billing Mode",
      description: "Controls how billing works across the platform",
      category: "billing",
    }
  ),

  "billing.defaultCurrency": define.select("billing", "defaultCurrency", CURRENCIES, {
    default: "USD",
    label: "Default Currency",
    description: "Default currency for billing operations",
    category: "billing",
    formatLabel: (v: string) => {
      const labels: Record<string, string> = {
        USD: "USD - US Dollar",
        EUR: "EUR - Euro",
        GBP: "GBP - British Pound",
        INR: "INR - Indian Rupee",
      };
      return labels[v] ?? v;
    },
  }),

  // -------------------------------------------------------------------------
  // Auth Settings
  // -------------------------------------------------------------------------
  "auth.otpTtlSeconds": define.number("auth", "otpTtlSeconds", {
    default: 600,
    integer: true,
    positive: true,
    min: 60,
    max: 3600,
    label: "OTP TTL (seconds)",
    description: "Time-to-live for one-time password codes",
    category: "auth",
    placeholder: "600",
  }),

  "auth.otpLength": define.number("auth", "otpLength", {
    default: 6,
    integer: true,
    min: 4,
    max: 8,
    label: "OTP Code Length",
    description: "Number of digits in OTP codes",
    category: "auth",
    placeholder: "6",
  }),

  "auth.resetTokenTtlSeconds": define.number("auth", "resetTokenTtlSeconds", {
    default: 3600,
    integer: true,
    positive: true,
    min: 300,
    max: 86400,
    label: "Password Reset Token TTL (seconds)",
    description: "Time-to-live for password reset tokens",
    category: "auth",
    placeholder: "3600",
  }),

  // -------------------------------------------------------------------------
  // Webhook Settings
  // -------------------------------------------------------------------------
  "webhooks.allowedHosts": define.array("webhooks", "allowedHosts", {
    default: [],
    label: "Global Allowed Webhook Hosts",
    description: "Platform-wide allowlist for outbound webhook targets (one per line)",
    category: "webhooks",
    placeholder: "hooks.partner.com\n.example.com",
  }),

  "webhooks.retentionDays": define.number("webhooks", "retentionDays", {
    default: 30,
    integer: true,
    nonnegative: true,
    min: 1,
    max: 365,
    label: "Event Retention (days)",
    description: "How long to keep webhook event history",
    category: "webhooks",
    placeholder: "30",
  }),

  // -------------------------------------------------------------------------
  // Tenant-scoped Settings (not shown in platform admin UI)
  // -------------------------------------------------------------------------
  "branding.name": define.text("branding", "name", {
    default: "Your App",
    maxLength: 80,
    scope: "tenant",
    visibility: "tenant-ui",
  }),

  "app.banner": define.custom(
    "app",
    "banner",
    z
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
    { message: "", variant: "info" as const },
    { scope: "tenant", visibility: "tenant-ui" }
  ),

  "webhooks.allowedHosts.tenant": define.array("webhooks", "allowedHosts", {
    default: [],
    scope: "tenant",
    visibility: "platform-only",
  }),

  "plan.overrides": define.object(
    "plan",
    "overrides",
    {
      capacities: z
        .object({ seats: z.number().int().positive().optional() })
        .optional(),
      quotas: z.record(z.string(), z.number().int().nonnegative()).optional(),
    },
    { default: {}, scope: "tenant", visibility: "platform-only" }
  ),

  "plan.addons": define.object(
    "plan",
    "addons",
    {
      credits: z
        .record(
          z.string(),
          z.object({
            grant: z.number().int().nonnegative(),
            period: z.enum(["month", "year"]).optional(),
          })
        )
        .optional(),
    },
    { default: {}, scope: "tenant", visibility: "platform-only" }
  ),
} as const;

// Register with global registry
getSettingRegistry().register(SETTING_DEFINITIONS);

// ============================================================================
// Derived Types
// ============================================================================

export type SettingKey = keyof typeof SETTING_DEFINITIONS;

export type SettingValueType<K extends SettingKey> = z.infer<
  (typeof SETTING_DEFINITIONS)[K]["schema"]
>;

// ============================================================================
// Helper Functions (delegate to registry)
// ============================================================================

const registry = getSettingRegistry();

export function getSettingDefinition(
  namespace: string,
  key: string
): SettingDefinition | null {
  return registry.getByNamespaceAndKey(namespace, key) ?? null;
}

export function getAllDefinitions(): SettingDefinition[] {
  return registry.getAll();
}

export function getPlatformDefinitions(): SettingDefinition[] {
  return registry.getPlatformSettings();
}

export function getUIDefinitions(): SettingDefinition[] {
  return registry.getUISettings();
}

// Re-export SettingDefinition type for backwards compatibility
export type { SettingDefinition };
