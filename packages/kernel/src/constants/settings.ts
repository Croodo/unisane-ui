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

// Setting definition registry
export interface SettingDefinition {
  namespace: string;
  key: string;
  visibility?: 'platform-only' | 'tenant' | 'user';
  scope?: 'platform' | 'tenant' | 'user';
  schema?: unknown;
  defaultValue?: unknown;
}

const settingsRegistry: Map<string, SettingDefinition> = new Map();

export function registerSettingDefinition(def: SettingDefinition): void {
  settingsRegistry.set(`${def.namespace}:${def.key}`, def);
}

export function getSettingDefinition(namespace: string, key: string): SettingDefinition | undefined {
  return settingsRegistry.get(`${namespace}:${key}`);
}

