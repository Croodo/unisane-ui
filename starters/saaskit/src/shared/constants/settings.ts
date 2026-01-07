export const SETTINGS_NS = {
  PLAN: "plan",
  NOTIFY: "notify",
  WEBHOOKS: "webhooks",
  BRANDING: "branding",
} as const;

export type SettingsNamespace =
  (typeof SETTINGS_NS)[keyof typeof SETTINGS_NS];

export const PLAN_SETTING_KEYS = {
  ADDONS: "addons",
  OVERRIDES: "overrides",
} as const;

export const WEBHOOKS_SETTING_KEYS = {
  ALLOWED_HOSTS: "allowedHosts",
} as const;

