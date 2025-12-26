/**
 * Component Registry - Backward Compatibility Layer
 *
 * This file re-exports from the new data structure for backward compatibility.
 * New code should import directly from "@/lib/docs/data" or "@/lib/docs/types".
 */

export {
  COMPONENT_REGISTRY,
  getComponentBySlug,
  getComponentsByCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from "./data";

export type {
  ComponentCategory,
  ComponentStatus,
  ComponentDoc,
} from "./types";
