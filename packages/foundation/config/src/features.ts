import { z } from "zod";

/**
 * Feature Flags Configuration
 *
 * Type-safe feature flag definitions with metadata for UI rendering.
 *
 * @example
 * ```ts
 * const features = defineFeatures({
 *   "billing.enabled": {
 *     label: "Billing",
 *     description: "Enable billing functionality",
 *     default: true,
 *     scope: "platform",
 *   },
 *   "ai.enabled": {
 *     label: "AI Features",
 *     description: "Enable AI-powered features",
 *     default: false,
 *     scope: "tenant",
 *   },
 * });
 *
 * // Type-safe flag access
 * const isEnabled = features.evaluate("billing.enabled", context);
 * ```
 */

// ============================================================================
// Feature Scope
// ============================================================================

export const FEATURE_SCOPES = ["platform", "tenant", "user"] as const;
export type FeatureScope = (typeof FEATURE_SCOPES)[number];
export const ZFeatureScope = z.enum(FEATURE_SCOPES);

// ============================================================================
// Feature Definition
// ============================================================================

export const ZFeatureDefinition = z.object({
  // Display info
  label: z.string().min(1),
  description: z.string().optional(),

  // Default value
  default: z.boolean(),

  // Scope determines where flag can be overridden
  scope: ZFeatureScope.default("platform"),

  // If true, flag cannot be overridden at lower scopes
  locked: z.boolean().default(false),

  // Tags for grouping in UI
  tags: z.array(z.string()).optional(),

  // Deprecation info
  deprecated: z.boolean().optional(),
  deprecatedMessage: z.string().optional(),
});

export type FeatureDefinition = z.infer<typeof ZFeatureDefinition>;

// ============================================================================
// Feature Registry
// ============================================================================

export type FeatureDefinitions = Record<string, FeatureDefinition>;

export class FeatureRegistry<T extends FeatureDefinitions> {
  constructor(private definitions: T) {}

  /**
   * Get all feature keys
   */
  keys(): (keyof T)[] {
    return Object.keys(this.definitions) as (keyof T)[];
  }

  /**
   * Get a feature definition
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.definitions[key];
  }

  /**
   * Get all definitions
   */
  getAll(): T {
    return this.definitions;
  }

  /**
   * Get features by scope
   */
  getByScope(scope: FeatureScope): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, def] of Object.entries(this.definitions)) {
      if (def.scope === scope) {
        result[key as keyof T] = def as T[keyof T];
      }
    }
    return result;
  }

  /**
   * Get features by tag
   */
  getByTag(tag: string): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, def] of Object.entries(this.definitions)) {
      if (def.tags?.includes(tag)) {
        result[key as keyof T] = def as T[keyof T];
      }
    }
    return result;
  }

  /**
   * Get default value for a feature
   */
  getDefault<K extends keyof T>(key: K): boolean {
    const def = this.definitions[key];
    return def ? def.default : false;
  }

  /**
   * Get all defaults as a record
   */
  getDefaults(): Record<keyof T, boolean> {
    const result = {} as Record<keyof T, boolean>;
    for (const key of this.keys()) {
      const def = this.definitions[key];
      if (def) {
        result[key] = def.default;
      }
    }
    return result;
  }

  /**
   * Evaluate a feature flag with overrides
   */
  evaluate<K extends keyof T>(
    key: K,
    overrides?: {
      platform?: Partial<Record<keyof T, boolean>>;
      tenant?: Partial<Record<keyof T, boolean>>;
      user?: Partial<Record<keyof T, boolean>>;
    }
  ): boolean {
    const def = this.definitions[key];
    if (!def) return false;

    // Start with default
    let value = def.default;

    // Apply platform override
    if (overrides?.platform?.[key] !== undefined) {
      value = overrides.platform[key]!;
    }

    // Apply tenant override (if scope allows)
    if (
      !def.locked &&
      def.scope !== "platform" &&
      overrides?.tenant?.[key] !== undefined
    ) {
      value = overrides.tenant[key]!;
    }

    // Apply user override (if scope allows)
    if (
      !def.locked &&
      def.scope === "user" &&
      overrides?.user?.[key] !== undefined
    ) {
      value = overrides.user[key]!;
    }

    return value;
  }
}

/**
 * Define feature flags with validation and type inference
 */
export function defineFeatures<T extends Record<string, Partial<FeatureDefinition>>>(
  features: T
): FeatureRegistry<{ [K in keyof T]: FeatureDefinition }> {
  const validated = {} as { [K in keyof T]: FeatureDefinition };

  for (const [key, def] of Object.entries(features)) {
    validated[key as keyof T] = ZFeatureDefinition.parse(def);
  }

  return new FeatureRegistry(validated);
}

/**
 * Type helper to infer feature keys from registry
 */
export type InferFeatureKey<R extends FeatureRegistry<FeatureDefinitions>> =
  R extends FeatureRegistry<infer T> ? keyof T : never;

// ============================================================================
// Metering Feature Keys
// ============================================================================

/**
 * Metering feature definition for usage tracking
 */
export const ZMeteringFeature = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("units"), // e.g., "tokens", "requests", "GB"
  trackable: z.boolean().default(true),
});

export type MeteringFeature = z.infer<typeof ZMeteringFeature>;

/**
 * Define metering features for usage tracking
 */
export function defineMeteringFeatures<T extends Record<string, Partial<MeteringFeature>>>(
  features: T
): { [K in keyof T]: MeteringFeature } {
  const validated = {} as { [K in keyof T]: MeteringFeature };

  for (const [key, def] of Object.entries(features)) {
    validated[key as keyof T] = ZMeteringFeature.parse(def);
  }

  return validated;
}

/**
 * Type helper to infer metering feature keys
 */
export type InferMeteringKey<T extends Record<string, MeteringFeature>> = keyof T & string;
