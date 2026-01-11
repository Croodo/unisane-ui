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

// Use globalThis to share registry across Next.js bundles (instrumentation vs route handlers)
const REGISTRY_KEY = '__unisane_settings_registry__';

function getRegistry(): Map<string, SettingDefinition> {
  const g = globalThis as unknown as Record<string, Map<string, SettingDefinition>>;
  if (!g[REGISTRY_KEY]) {
    g[REGISTRY_KEY] = new Map();
  }
  return g[REGISTRY_KEY];
}

export function registerSettingDefinition(def: SettingDefinition): void {
  const registry = getRegistry();
  const regKey = `${def.namespace}:${def.key}`;
  registry.set(regKey, def);
}

export function getSettingDefinition(namespace: string, key: string): SettingDefinition | undefined {
  const registry = getRegistry();
  const regKey = `${namespace}:${key}`;
  return registry.get(regKey);
}

