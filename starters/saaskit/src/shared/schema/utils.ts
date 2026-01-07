import type { z } from "zod";
import { ENUM_CONSTANTS } from "@/src/shared/constants/registry";
import type { EntitySchema, SchemaDefinition } from "./types";

export interface FacetFieldMetadata {
  path: string;
  ref: string;
  values: readonly string[];
  zodSchema: z.ZodTypeAny;
  typeName: string;
  importPath: string;
}

/**
 * Extracts facet fields from an entity schema.
 * Traverses the schema and identifies all enum fields that should become facets.
 *
 * @param schema - The entity schema to extract facets from
 * @returns Record of facet names to their metadata
 *
 * @example
 * const facets = extractFacetFields(TenantSchema);
 * // Returns:
 * // {
 * //   planId: { path: 'planId', ref: 'PlanId', values: PLANS, ... },
 * //   subscription_status: { path: 'subscription.status', ref: 'SubscriptionStatus', ... }
 * // }
 */
export function extractFacetFields(
  schema: EntitySchema
): Record<string, FacetFieldMetadata> {
  const facets: Record<string, FacetFieldMetadata> = {};

  function traverse(obj: SchemaDefinition, path: string = "") {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "object" && value !== null && "type" in value) {
        if (
          value.type === "enum" &&
          "ref" in value &&
          typeof value.ref === "string"
        ) {
          const enumDef =
            ENUM_CONSTANTS[value.ref as keyof typeof ENUM_CONSTANTS];
          if (enumDef) {
            // Convert nested paths to underscore notation (e.g., subscription.status -> subscription_status)
            const facetName = currentPath.replace(/\./g, "_");
            facets[facetName] = {
              path: currentPath,
              ref: value.ref,
              ...enumDef,
            };
          }
        } else if (value.type === "object" && "schema" in value) {
          // Recurse into nested objects
          traverse(value.schema as SchemaDefinition, currentPath);
        }
      }
    }
  }

  traverse(schema.schema);
  return facets;
}
