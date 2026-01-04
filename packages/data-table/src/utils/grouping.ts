import type { Column, RowGroup } from "../types";
import { getNestedValue } from "./get-nested-value";

// Re-export for backwards compatibility
export { getNestedValue };

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface BuildGroupsOptions<T extends object> {
  /** Data rows to group */
  data: T[];
  /** Array of column keys to group by (supports multi-level) */
  groupByKeys: string[];
  /** Function to check if a group is expanded */
  isGroupExpanded: (groupId: string) => boolean;
  /** Columns with aggregation config */
  aggregationColumns: Column<T>[];
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Format a group value for display
 */
export function formatGroupLabel(value: unknown): string {
  if (value == null) return "(Empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Calculate aggregation for a set of rows
 */
export function calculateAggregation<T extends object>(
  rows: T[],
  columnKey: string,
  aggregationType: "sum" | "average" | "count" | "min" | "max"
): number | null {
  const values = rows
    .map((row) => {
      const val = getNestedValue(row, columnKey);
      return typeof val === "number" ? val : null;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;

  switch (aggregationType) {
    case "sum":
      return values.reduce((acc, v) => acc + v, 0);
    case "average":
      return values.reduce((acc, v) => acc + v, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return null;
  }
}

// ─── GROUP BUILDING ─────────────────────────────────────────────────────────

/**
 * Recursively build nested groups from data.
 *
 * Supports multi-level grouping where each level groups by a different column.
 * Only the deepest level contains actual data rows.
 */
export function buildNestedGroups<T extends object>(
  rows: T[],
  groupByKeys: string[],
  depth: number,
  parentGroupId: string | null,
  isGroupExpanded: (groupId: string) => boolean,
  aggregationColumns: Column<T>[]
): RowGroup<T>[] {
  if (groupByKeys.length === 0 || rows.length === 0) {
    return [];
  }

  const currentKey = groupByKeys[0]!;
  const remainingKeys = groupByKeys.slice(1);
  const isDeepestLevel = remainingKeys.length === 0;

  // Group rows by the current groupBy column value
  const groupMap = new Map<string, T[]>();
  const groupValues = new Map<string, unknown>();

  for (const row of rows) {
    const value = getNestedValue(row, currentKey);
    const valueKey = String(value ?? "__null__");

    let group = groupMap.get(valueKey);
    if (!group) {
      group = [];
      groupMap.set(valueKey, group);
      groupValues.set(valueKey, value);
    }
    group.push(row);
  }

  // Convert to array and sort alphabetically
  const groupEntries = Array.from(groupMap.entries());
  groupEntries.sort(([a], [b]) => a.localeCompare(b));

  // Build group objects
  return groupEntries.map(([valueKey, groupRows]) => {
    // Create compound group ID for nested groups
    const groupId = parentGroupId ? `${parentGroupId}::${valueKey}` : valueKey;
    const groupValue = groupValues.get(valueKey) as
      | string
      | number
      | boolean
      | null;
    const groupLabel = formatGroupLabel(groupValue);

    // Calculate aggregations for columns that have aggregation configured
    const aggregations: Record<string, unknown> = {};
    for (const col of aggregationColumns) {
      const key = String(col.key);
      const result = calculateAggregation(groupRows, key, col.aggregation!);
      if (result !== null) {
        aggregations[col.header] = result;
      }
    }

    // Recursively build child groups if not at deepest level
    const childGroups = isDeepestLevel
      ? undefined
      : buildNestedGroups(
          groupRows,
          remainingKeys,
          depth + 1,
          groupId,
          isGroupExpanded,
          aggregationColumns
        );

    return {
      type: "group" as const,
      groupId,
      groupValue,
      groupLabel,
      // Only include rows at the deepest level
      rows: isDeepestLevel ? groupRows : [],
      isExpanded: isGroupExpanded(groupId),
      aggregations,
      depth,
      groupByKey: currentKey,
      childGroups,
      parentGroupId,
    };
  });
}

/**
 * Build grouped data structure from flat data.
 *
 * @param data - Data rows to group
 * @param groupByKeys - Column keys to group by (supports multi-level)
 * @param isGroupExpanded - Function to check if a group is expanded
 * @param aggregationColumns - Columns with aggregation config
 * @returns Array of RowGroup objects
 */
export function buildGroupedData<T extends object>(
  options: BuildGroupsOptions<T>
): RowGroup<T>[] {
  const { data, groupByKeys, isGroupExpanded, aggregationColumns } = options;

  if (groupByKeys.length === 0) {
    return [];
  }

  return buildNestedGroups(
    data,
    groupByKeys,
    0,
    null,
    isGroupExpanded,
    aggregationColumns
  );
}
