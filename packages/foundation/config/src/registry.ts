import type {
  SettingDefinition,
  SettingKey,
  SettingDefinitions,
  Scope,
  UICategory,
} from "./types";

/**
 * Setting Registry
 *
 * Centralized registry for managing setting definitions across modules.
 * Supports module-based registration and querying.
 *
 * @example
 * ```ts
 * // In a module
 * registry.register("auth", AUTH_SETTINGS);
 *
 * // Query settings
 * const platformSettings = registry.getByScope("platform");
 * const authSettings = registry.getByNamespace("auth");
 * ```
 */

export class SettingRegistry {
  private definitions: Map<SettingKey, SettingDefinition> = new Map();
  private byNamespace: Map<string, Set<SettingKey>> = new Map();
  private byScope: Map<Scope, Set<SettingKey>> = new Map();
  private byCategory: Map<UICategory, Set<SettingKey>> = new Map();

  /**
   * Register a single setting definition
   */
  set<T>(key: SettingKey, definition: SettingDefinition<T>): this {
    this.definitions.set(key, definition as SettingDefinition);

    // Index by namespace
    if (!this.byNamespace.has(definition.namespace)) {
      this.byNamespace.set(definition.namespace, new Set());
    }
    this.byNamespace.get(definition.namespace)!.add(key);

    // Index by scope
    if (!this.byScope.has(definition.scope)) {
      this.byScope.set(definition.scope, new Set());
    }
    this.byScope.get(definition.scope)!.add(key);

    // Index by category if UI config exists
    if (definition.ui?.category) {
      if (!this.byCategory.has(definition.ui.category)) {
        this.byCategory.set(definition.ui.category, new Set());
      }
      this.byCategory.get(definition.ui.category)!.add(key);
    }

    return this;
  }

  /**
   * Register multiple settings from a definitions object
   */
  register(definitions: SettingDefinitions): this {
    for (const [key, definition] of Object.entries(definitions)) {
      this.set(key as SettingKey, definition);
    }
    return this;
  }

  /**
   * Register settings from a module with a namespace prefix
   */
  registerModule(
    moduleId: string,
    definitions: Record<string, SettingDefinition>
  ): this {
    for (const [key, definition] of Object.entries(definitions)) {
      const fullKey = `${moduleId}.${key}` as SettingKey;
      this.set(fullKey, { ...definition, namespace: moduleId });
    }
    return this;
  }

  /**
   * Get a setting definition by its full key
   */
  get(key: SettingKey): SettingDefinition | undefined {
    return this.definitions.get(key);
  }

  /**
   * Get a setting definition by namespace and key
   */
  getByNamespaceAndKey(
    namespace: string,
    key: string
  ): SettingDefinition | undefined {
    return this.definitions.get(`${namespace}.${key}` as SettingKey);
  }

  /**
   * Check if a setting exists
   */
  has(key: SettingKey): boolean {
    return this.definitions.has(key);
  }

  /**
   * Get all setting definitions
   */
  getAll(): SettingDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get all setting keys
   */
  getAllKeys(): SettingKey[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get settings by namespace
   */
  getByNamespace(namespace: string): SettingDefinition[] {
    const keys = this.byNamespace.get(namespace);
    if (!keys) return [];
    return Array.from(keys).map((key) => this.definitions.get(key)!);
  }

  /**
   * Get settings by scope
   */
  getByScope(scope: Scope): SettingDefinition[] {
    const keys = this.byScope.get(scope);
    if (!keys) return [];
    return Array.from(keys).map((key) => this.definitions.get(key)!);
  }

  /**
   * Get settings by UI category
   */
  getByCategory(category: UICategory): SettingDefinition[] {
    const keys = this.byCategory.get(category);
    if (!keys) return [];
    return Array.from(keys).map((key) => this.definitions.get(key)!);
  }

  /**
   * Get all platform-scoped settings
   */
  getPlatformSettings(): SettingDefinition[] {
    return this.getByScope("platform");
  }

  /**
   * Get all tenant-scoped settings
   */
  getTenantSettings(): SettingDefinition[] {
    return this.getByScope("tenant");
  }

  /**
   * Get all settings that have UI configuration
   */
  getUISettings(): SettingDefinition[] {
    return this.getAll().filter((def) => def.ui !== undefined);
  }

  /**
   * Get all namespaces registered
   */
  getNamespaces(): string[] {
    return Array.from(this.byNamespace.keys());
  }

  /**
   * Get all categories with settings
   */
  getCategories(): UICategory[] {
    return Array.from(this.byCategory.keys());
  }

  /**
   * Get count of registered settings
   */
  get size(): number {
    return this.definitions.size;
  }

  /**
   * Clear all registered settings
   */
  clear(): void {
    this.definitions.clear();
    this.byNamespace.clear();
    this.byScope.clear();
    this.byCategory.clear();
  }

  /**
   * Export all definitions as a plain object
   */
  toObject(): SettingDefinitions {
    const result: SettingDefinitions = {};
    for (const [key, def] of this.definitions) {
      result[key] = def;
    }
    return result;
  }
}

// Global singleton instance
let globalRegistry: SettingRegistry | null = null;

/**
 * Get the global setting registry instance
 */
export function getSettingRegistry(): SettingRegistry {
  if (!globalRegistry) {
    globalRegistry = new SettingRegistry();
  }
  return globalRegistry;
}

/**
 * Create a new isolated registry (useful for testing)
 */
export function createSettingRegistry(): SettingRegistry {
  return new SettingRegistry();
}
