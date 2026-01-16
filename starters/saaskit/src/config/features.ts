/**
 * Feature Flags Configuration
 *
 * Type-safe feature flag definitions using @unisane/config.
 * Provides structured metadata for UI rendering and scope control.
 */

import {
  defineFeatures,
  defineMeteringFeatures,
  type FeatureDefinition,
  type MeteringFeature,
} from "@unisane/config";

// ============================================================================
// Feature Flags (Boolean toggles)
// ============================================================================

export const FEATURES = defineFeatures({
  // ---------------------------------------------------------------------------
  // Platform / Ops (env-wide)
  // ---------------------------------------------------------------------------
  "platform.maintenance": {
    label: "Platform maintenance mode",
    description:
      "Puts the entire app into maintenance mode. Use only during planned downtime.",
    default: false,
    scope: "platform",
    locked: true,
    tags: ["platform", "ops"],
  },
  "mail.enabled": {
    label: "Outbound mail",
    description:
      "Master switch for transactional emails. Disable in emergencies.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["platform", "ops"],
  },
  "webhooks.outbound.enabled": {
    label: "Outbound webhooks",
    description: "Controls delivery of outbound webhooks to partners.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["platform", "webhooks"],
  },
  "jobs.dispatch.enabled": {
    label: "Jobs dispatch",
    description:
      "Controls background job dispatch. Disable only when investigating incidents.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["platform", "ops"],
  },

  // ---------------------------------------------------------------------------
  // UI / Admin
  // ---------------------------------------------------------------------------
  "ui.newNav": {
    label: "New navigation UI",
    description: "Enables the new navigation shell across the app.",
    default: false,
    scope: "tenant",
    tags: ["ui", "beta"],
  },
  "ui.adminDash": {
    label: "Admin dashboard",
    description: "Controls visibility of the internal admin dashboard pages.",
    default: true,
    scope: "platform",
    tags: ["ui", "admin"],
  },

  // ---------------------------------------------------------------------------
  // Auth flows
  // ---------------------------------------------------------------------------
  "auth.password.enabled": {
    label: "Password auth",
    description:
      "Master switch for email/password signup, signin, and reset flows.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["auth"],
  },
  "auth.otp": {
    label: "OTP authentication",
    description: "Enables one-time password authentication.",
    default: false,
    scope: "platform",
    locked: true,
    tags: ["auth"],
  },
  "auth.sso": {
    label: "SSO authentication",
    description: "Enables enterprise SSO (SAML/OIDC) authentication.",
    default: false,
    scope: "tenant",
    tags: ["auth", "enterprise"],
  },

  // ---------------------------------------------------------------------------
  // Billing & subscriptions
  // ---------------------------------------------------------------------------
  "billing.enabled": {
    label: "Billing enabled",
    description: "Controls whether billing surfaces are enabled for tenants.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["billing"],
  },
  "billing.refund": {
    label: "Refunds",
    description: "Allows issuing refunds via the configured billing provider.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["billing"],
  },
  "billing.actions.enabled": {
    label: "Billing actions",
    description:
      "Controls high-risk billing operations (e.g., destructive or manual actions).",
    default: false,
    scope: "platform",
    locked: true,
    tags: ["billing", "ops"],
  },
  "billing.providers.stripe": {
    label: "Stripe provider (UI)",
    description: "Controls visibility of Stripe-specific billing UI.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["billing", "provider"],
  },
  "billing.providers.razorpay": {
    label: "Razorpay provider (UI)",
    description: "Controls visibility of Razorpay-specific billing UI.",
    default: false,
    scope: "platform",
    locked: true,
    tags: ["billing", "provider"],
  },

  // ---------------------------------------------------------------------------
  // Credits
  // ---------------------------------------------------------------------------
  "credits.enabled": {
    label: "Credits enabled",
    description: "Enables credit ledgers and checks for metered features.",
    default: true,
    scope: "platform",
    tags: ["billing", "credits"],
  },

  // ---------------------------------------------------------------------------
  // AI + PDF
  // ---------------------------------------------------------------------------
  "ai.beta": {
    label: "AI beta UI",
    description:
      "Gates AI beta surfaces (e.g., demo prompts) for eligible tenants.",
    default: false,
    scope: "tenant",
    tags: ["ai", "beta"],
  },
  "ai.generate": {
    label: "AI generate",
    description:
      "Controls access to the AI generate operation, usually plan-gated.",
    default: false,
    scope: "tenant",
    tags: ["ai"],
  },
  "pdf.render": {
    label: "PDF render",
    description:
      "Controls access to the PDF render operation, usually plan-gated.",
    default: true,
    scope: "tenant",
    tags: ["pdf"],
  },

  // ---------------------------------------------------------------------------
  // Notify
  // ---------------------------------------------------------------------------
  "notify.email.enabled": {
    label: "Notify: email",
    description: "Enables email notifications via Notify.",
    default: true,
    scope: "platform",
    locked: true,
    tags: ["notify"],
  },
  "notify.inapp.enabled": {
    label: "Notify: in-app",
    description: "Enables in-app notifications and streams for tenants.",
    default: true,
    scope: "tenant",
    tags: ["notify"],
  },

  // ---------------------------------------------------------------------------
  // Import/Export
  // ---------------------------------------------------------------------------
  "import.enabled": {
    label: "Import",
    description: "Controls access to data import flows.",
    default: true,
    scope: "tenant",
    tags: ["import-export"],
  },
  "export.enabled": {
    label: "Export",
    description: "Controls access to data export flows.",
    default: true,
    scope: "tenant",
    tags: ["import-export"],
  },

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------
  "apikeys.enabled": {
    label: "API keys",
    description: "Controls whether tenants can create and use API keys.",
    default: true,
    scope: "tenant",
    tags: ["api"],
  },

  // ---------------------------------------------------------------------------
  // Admin surface
  // ---------------------------------------------------------------------------
  "admin.surface.enabled": {
    label: "Admin surface",
    description: "Enables the internal admin area for platform operators.",
    default: true,
    scope: "platform",
    tags: ["admin"],
  },
  "admin.jobs.enabled": {
    label: "Admin jobs",
    description:
      "Enables manual job triggers and internal job tooling in admin.",
    default: false,
    scope: "platform",
    tags: ["admin", "ops"],
  },
});

// Get keys from the FEATURES registry
const featureKeys = FEATURES.keys();
export type FeatureKey = (typeof featureKeys)[number];

// ============================================================================
// Metering Features (Usage tracking)
// ============================================================================

export const METERING_FEATURES = defineMeteringFeatures({
  "ai.generate": {
    label: "AI Generate",
    description: "AI text/image generation operations",
    unit: "tokens",
  },
  "pdf.render": {
    label: "PDF Render",
    description: "PDF rendering operations",
    unit: "pages",
  },
  "api.call": {
    label: "API Call",
    description: "API requests",
    unit: "requests",
  },
  "storage.gb": {
    label: "Storage",
    description: "File storage usage",
    unit: "GB",
  },
  "image.process": {
    label: "Image Process",
    description: "Image processing operations",
    unit: "images",
  },
});

export type MeteringKey = keyof typeof METERING_FEATURES;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Evaluate a feature flag with optional scope overrides
 */
export function isFeatureEnabled(
  key: Parameters<typeof FEATURES.evaluate>[0],
  overrides?: Parameters<typeof FEATURES.evaluate>[1]
): boolean {
  return FEATURES.evaluate(key, overrides);
}

/**
 * Get all feature flags with their defaults
 */
export function getFeatureDefaults() {
  return FEATURES.getDefaults();
}

/**
 * Get features by tag
 */
export function getFeaturesByTag(tag: string) {
  return FEATURES.getByTag(tag);
}

/**
 * Get platform-only features (cannot be overridden at tenant/user scope)
 */
export function getPlatformOnlyFeatures() {
  const all = FEATURES.getAll();
  return Object.entries(all)
    .filter(([, def]) => def.scope === "platform" && def.locked)
    .map(([key, def]) => ({ key, ...def }));
}
