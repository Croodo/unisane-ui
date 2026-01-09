// Canonical feature flag keys used across the app
// Keep this tiny and opinionated; expand as your app evolves.
export const FLAG = {
  // Platform / Ops (env-wide)
  PLATFORM_MAINTENANCE: 'platform.maintenance',
  MAIL_ENABLED: 'mail.enabled',
  WEBHOOKS_OUTBOUND_ENABLED: 'webhooks.outbound.enabled',
  JOBS_DISPATCH_ENABLED: 'jobs.dispatch.enabled',

  // UI / Admin
  UI_NEW_NAV: 'ui.newNav',
  UI_ADMIN_DASH: 'ui.adminDash',

  // Auth flows
  // Auth (master switch for password-based auth)
  AUTH_PASSWORD_ENABLED: 'auth.password.enabled',
  AUTH_OTP: 'auth.otp',
  AUTH_SSO: 'auth.sso', // planned/optional

  // Billing & subscriptions
  BILLING_ENABLED: 'billing.enabled',
  BILLING_REFUND: 'billing.refund',
  BILLING_ACTIONS_ENABLED: 'billing.actions.enabled',
  BILLING_PROV_STRIPE: 'billing.providers.stripe',
  BILLING_PROV_RAZORPAY: 'billing.providers.razorpay',

  // Pricing experiments (optional)
  PRICING_EXPERIMENT: 'pricing.experiment',

  // Credits
  CREDITS_ENABLED: 'credits.enabled',

  // AI + PDF demos
  AI_BETA: 'ai.beta',
  AI_GENERATE: 'ai.generate',
  PDF_RENDER: 'pdf.render',

  // Notify (product surfaces)
  NOTIFY_EMAIL_ENABLED: 'notify.email.enabled',
  NOTIFY_INAPP_ENABLED: 'notify.inapp.enabled',

  // Import/Export
  IMPORT_ENABLED: 'import.enabled',
  EXPORT_ENABLED: 'export.enabled',

  // API Keys
  APIKEYS_ENABLED: 'apikeys.enabled',

  // Admin surface
  ADMIN_SURFACE_ENABLED: 'admin.surface.enabled',
  ADMIN_JOBS_ENABLED: 'admin.jobs.enabled',
} as const;

export type FlagKey = (typeof FLAG)[keyof typeof FLAG];

export type FlagMeta = {
  key: FlagKey;
  label: string;
  description: string;
  category: string;
};

const META_OVERRIDES: Partial<Record<FlagKey, Omit<FlagMeta, "key">>> = {
  [FLAG.PLATFORM_MAINTENANCE]: {
    label: "Platform maintenance mode",
    description:
      "Puts the entire app into maintenance mode. Use only during planned downtime.",
    category: "Platform",
  },
  [FLAG.MAIL_ENABLED]: {
    label: "Outbound mail",
    description:
      "Master switch for transactional emails sent via Notify. Disable in emergencies.",
    category: "Platform",
  },
  [FLAG.WEBHOOKS_OUTBOUND_ENABLED]: {
    label: "Outbound webhooks",
    description:
      "Controls delivery of outbound webhooks to partners. Disable to stop external calls.",
    category: "Platform",
  },
  [FLAG.JOBS_DISPATCH_ENABLED]: {
    label: "Jobs dispatch",
    description:
      "Controls background job dispatch. Disable only when investigating incidents.",
    category: "Platform",
  },
  [FLAG.UI_NEW_NAV]: {
    label: "New navigation UI",
    description: "Enables the new navigation shell across the app.",
    category: "UI",
  },
  [FLAG.UI_ADMIN_DASH]: {
    label: "Admin dashboard",
    description:
      "Controls visibility of the internal admin dashboard pages.",
    category: "UI",
  },
  [FLAG.AUTH_PASSWORD_ENABLED]: {
    label: "Password auth",
    description:
      "Master switch for email/password signup, signin, and reset flows.",
    category: "Auth",
  },
  [FLAG.BILLING_ENABLED]: {
    label: "Billing enabled",
    description:
      "Controls whether billing surfaces are enabled for tenants.",
    category: "Billing",
  },
  [FLAG.BILLING_REFUND]: {
    label: "Refunds",
    description:
      "Allows issuing refunds via the configured billing provider.",
    category: "Billing",
  },
  [FLAG.BILLING_ACTIONS_ENABLED]: {
    label: "Billing actions",
    description:
      "Controls high-risk billing operations (e.g., destructive or manual actions).",
    category: "Billing",
  },
  [FLAG.BILLING_PROV_STRIPE]: {
    label: "Stripe provider (UI)",
    description:
      "Controls visibility of Stripe-specific billing UI. Runtime provider comes from env.",
    category: "Billing",
  },
  [FLAG.BILLING_PROV_RAZORPAY]: {
    label: "Razorpay provider (UI)",
    description:
      "Controls visibility of Razorpay-specific billing UI. Runtime provider comes from env.",
    category: "Billing",
  },
  [FLAG.CREDITS_ENABLED]: {
    label: "Credits enabled",
    description:
      "Enables credit ledgers and checks for metered features.",
    category: "Usage",
  },
  [FLAG.AI_BETA]: {
    label: "AI beta UI",
    description:
      "Gates AI beta surfaces (e.g., demo prompts) for eligible tenants.",
    category: "AI",
  },
  [FLAG.AI_GENERATE]: {
    label: "AI generate",
    description:
      "Controls access to the AI generate operation, usually plan-gated.",
    category: "AI",
  },
  [FLAG.PDF_RENDER]: {
    label: "PDF render",
    description:
      "Controls access to the PDF render operation, usually plan-gated.",
    category: "PDF",
  },
  [FLAG.NOTIFY_EMAIL_ENABLED]: {
    label: "Notify: email",
    description:
      "Enables email notifications via Notify (subject to provider configuration).",
    category: "Notify",
  },
  [FLAG.NOTIFY_INAPP_ENABLED]: {
    label: "Notify: in-app",
    description:
      "Enables in-app notifications and streams for tenants.",
    category: "Notify",
  },
  [FLAG.IMPORT_ENABLED]: {
    label: "Import",
    description: "Controls access to data import flows.",
    category: "Import/Export",
  },
  [FLAG.EXPORT_ENABLED]: {
    label: "Export",
    description: "Controls access to data export flows.",
    category: "Import/Export",
  },
  [FLAG.APIKEYS_ENABLED]: {
    label: "API keys",
    description:
      "Controls whether tenants can create and use API keys.",
    category: "API",
  },
  [FLAG.ADMIN_SURFACE_ENABLED]: {
    label: "Admin surface",
    description:
      "Enables the internal admin area for platform operators.",
    category: "Admin",
  },
  [FLAG.ADMIN_JOBS_ENABLED]: {
    label: "Admin jobs",
    description:
      "Enables manual job triggers and internal job tooling in admin.",
    category: "Admin",
  },
};

export function getFlagMeta(key: FlagKey): FlagMeta {
  const override = META_OVERRIDES[key];
  if (override) {
    return {
      key,
      label: override.label,
      description: override.description,
      category: override.category,
    };
  }
  const raw = key as string;
  const parts = raw.split(".");
  const label =
    parts
      .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ""))
      .join(" ") || raw;
  const description = `Controls the ${parts[parts.length - 1] ?? raw} feature.`;
  const category =
    parts[0] && parts[0].length
      ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
      : "Other";
  return { key, label, description, category };
}

// Platform-only flags are controlled by platform operators (super_admin / platform owner)
// and should not be overridden at tenant/user scope by default.
const PLATFORM_ONLY_KEYS = new Set<string>([
  // Env-wide maintenance and ops kill switches
  FLAG.PLATFORM_MAINTENANCE,
  FLAG.MAIL_ENABLED,
  FLAG.WEBHOOKS_OUTBOUND_ENABLED,
  FLAG.JOBS_DISPATCH_ENABLED,
  FLAG.BILLING_ACTIONS_ENABLED,
  // High-risk billing and provider toggles
  FLAG.BILLING_ENABLED,
  FLAG.BILLING_REFUND,
  FLAG.BILLING_PROV_STRIPE,
  FLAG.BILLING_PROV_RAZORPAY,
  // Auth flow masters (login surface safety)
  FLAG.AUTH_PASSWORD_ENABLED,
  FLAG.AUTH_OTP,
  FLAG.AUTH_SSO,
  // Outbound channels (spam / delivery risk)
  FLAG.NOTIFY_EMAIL_ENABLED,
  FLAG.NOTIFY_INAPP_ENABLED,
]);

export function isPlatformOnlyFlag(key: string): boolean {
  return PLATFORM_ONLY_KEYS.has(key);
}
