import type { SettingConfig } from "./types";
import { getUIDefinitions } from "@/src/shared/settings/definitions";

// ============================================================================
// Settings Configuration (Auto-generated from definitions)
// ============================================================================

export const SETTINGS_CONFIG: SettingConfig[] = getUIDefinitions().map(
  (def) => {
    const config: SettingConfig = {
      namespace: def.namespace,
      key: def.key,
      label: def.ui!.label,
      description: def.ui!.description,
      category: def.ui!.category,
      type: def.ui!.type,
      defaultValue: def.defaultValue,
    };

    // Add optional properties only if they exist
    if (def.ui!.options) config.options = def.ui!.options;
    if (def.ui!.placeholder) config.placeholder = def.ui!.placeholder;
    if (def.ui!.min !== undefined) config.min = def.ui!.min;
    if (def.ui!.max !== undefined) config.max = def.ui!.max;
    if (def.ui!.customComponent)
      config.customComponent = def.ui!.customComponent;

    return config;
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

export function getSettingsByCategory(category: string): SettingConfig[] {
  return SETTINGS_CONFIG.filter((s) => s.category === category);
}

export function searchSettings(query: string): SettingConfig[] {
  const lowerQuery = query.toLowerCase();
  return SETTINGS_CONFIG.filter(
    (s) =>
      s.label.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.key.toLowerCase().includes(lowerQuery)
  );
}
