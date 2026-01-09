"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  RowGroupingConfig,
  RowGroup,
  GroupedRow,
  GroupAggregation,
  Column,
} from "../../types";
import { getNestedValue } from "../../utils/get-nested-value";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface UseRowGroupingOptions<T extends { id: string }> {
  /** Data to group */
  data: T[];
  /** Column definitions (for label lookup) */
  columns: Column<T>[];
  /** Grouping configuration */
  config?: RowGroupingConfig<T>;
  /** Controlled groupBy value */
  groupBy?: string | null;
  /** Callback when groupBy changes */
  onGroupByChange?: (groupBy: string | null) => void;
  /** Whether grouping is enabled */
  enabled?: boolean;
}

export interface UseRowGroupingReturn<T extends { id: string }> {
  /** Current groupBy column key */
  groupBy: string | null;
  /** Set the groupBy column */
  setGroupBy: (key: string | null) => void;
  /** Whether grouping is active */
  isGrouped: boolean;
  /** Grouped data structure */
  groupedData: GroupedRow<T>[];
  /** Flattened rows respecting expand state */
  flattenedRows: Array<RowGroup<T> | T>;
  /** All group objects */
  groups: RowGroup<T>[];
  /** Check if a group is expanded */
  isGroupExpanded: (groupId: string) => boolean;
  /** Toggle group expand/collapse */
  toggleGroup: (groupId: string) => void;
  /** Expand all groups */
  expandAllGroups: () => void;
  /** Collapse all groups */
  collapseAllGroups: () => void;
  /** Get column key used for grouping */
  groupByColumn: Column<T> | undefined;
  /** Total number of groups */
  groupCount: number;
}

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Calculate aggregation for a group of rows
 */
function calculateAggregation<T extends object>(
  rows: T[],
  columnKey: string,
  aggregation: GroupAggregation<T>
): unknown {
  if (typeof aggregation === "function") {
    return aggregation(rows);
  }

  const values = rows
    .map((row) => getNestedValue(row, columnKey))
    .filter((v) => v != null && typeof v === "number") as number[];

  if (values.length === 0) return null;

  switch (aggregation) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "count":
      return rows.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "first":
      return getNestedValue(rows[0]!, columnKey);
    case "last":
      return getNestedValue(rows[rows.length - 1]!, columnKey);
    default:
      return null;
  }
}

/**
 * Format a group value for display
 */
function formatGroupLabel(value: unknown): string {
  if (value == null) return "(Empty)";
  if (value === "") return "(Empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) {
    // Handle invalid dates
    if (isNaN(value.getTime())) return "(Invalid Date)";
    return value.toLocaleDateString();
  }
  if (typeof value === "number" && isNaN(value)) return "(Invalid Number)";
  const stringValue = String(value);
  // Truncate very long values
  if (stringValue.length > 50) {
    return stringValue.slice(0, 47) + "...";
  }
  return stringValue;
}

// ─── HOOK ───────────────────────────────────────────────────────────────────

export function useRowGrouping<T extends { id: string }>({
  data,
  columns,
  config,
  groupBy: controlledGroupBy,
  onGroupByChange,
  enabled = true,
}: UseRowGroupingOptions<T>): UseRowGroupingReturn<T> {
  // Internal state for groupBy
  const [internalGroupBy, setInternalGroupBy] = useState<string | null>(
    config?.groupBy ? String(config.groupBy) : null
  );

  // Internal state for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // If defaultExpanded, we'll expand all groups dynamically
    return new Set<string>();
  });

  // Determine if we're controlled or uncontrolled
  const isControlled = controlledGroupBy !== undefined;
  const groupBy = isControlled ? controlledGroupBy : internalGroupBy;

  // Set groupBy handler
  const setGroupBy = useCallback(
    (key: string | null) => {
      if (isControlled) {
        onGroupByChange?.(key);
      } else {
        setInternalGroupBy(key);
      }
      // Reset expanded groups when changing groupBy
      setExpandedGroups(new Set());
    },
    [isControlled, onGroupByChange]
  );

  // Find the column being grouped by
  const groupByColumn = useMemo(
    () => columns.find((col) => String(col.key) === groupBy),
    [columns, groupBy]
  );

  // Check if grouping is active
  const isGrouped = enabled && groupBy !== null;

  // Build grouped data structure
  const { groups, groupedData } = useMemo(() => {
    if (!isGrouped || !groupBy) {
      return {
        groups: [] as RowGroup<T>[],
        groupedData: data.map((row) => ({
          type: "row" as const,
          data: row,
          groupId: "",
        })),
      };
    }

    // Group rows by the groupBy column value
    const groupMap = new Map<string, T[]>();
    const groupValues = new Map<string, unknown>();

    for (const row of data) {
      const value = getNestedValue(row, groupBy);
      const groupId = String(value ?? "__null__");

      let group = groupMap.get(groupId);
      if (!group) {
        group = [];
        groupMap.set(groupId, group);
        groupValues.set(groupId, value);
      }
      group.push(row);
    }

    // Convert to array and sort
    let groupEntries = Array.from(groupMap.entries());

    // Sort groups
    const sortFn = config?.sortGroups;
    if (sortFn === "asc") {
      groupEntries.sort(([a], [b]) => a.localeCompare(b));
    } else if (sortFn === "desc") {
      groupEntries.sort(([a], [b]) => b.localeCompare(a));
    } else if (typeof sortFn === "function") {
      groupEntries.sort(([a], [b]) => sortFn(a, b));
    } else {
      // Default: ascending
      groupEntries.sort(([a], [b]) => a.localeCompare(b));
    }

    // Build group objects
    const builtGroups: RowGroup<T>[] = groupEntries.map(([groupId, rows]) => {
      const groupValue = groupValues.get(groupId) as string | number | boolean | null;
      const groupLabel = formatGroupLabel(groupValue);

      // Calculate aggregations
      const aggregations: Record<string, unknown> = {};
      if (config?.aggregations) {
        for (const [key, agg] of Object.entries(config.aggregations)) {
          aggregations[key] = calculateAggregation(rows, key, agg);
        }
      }

      // Determine if expanded
      const defaultExpanded = config?.defaultExpanded ?? true;
      const isExpanded = expandedGroups.has(groupId)
        ? true
        : expandedGroups.size === 0 && defaultExpanded;

      return {
        type: "group" as const,
        groupId,
        groupValue,
        groupLabel,
        rows,
        isExpanded,
        aggregations,
        depth: 0,
        groupByKey: groupBy,
        childGroups: undefined,
        parentGroupId: null,
      };
    });

    // Build grouped data array
    const builtGroupedData: GroupedRow<T>[] = [];
    for (const group of builtGroups) {
      builtGroupedData.push(group);
      for (const row of group.rows) {
        builtGroupedData.push({
          type: "row",
          data: row,
          groupId: group.groupId,
        });
      }
    }

    return { groups: builtGroups, groupedData: builtGroupedData };
  }, [data, groupBy, isGrouped, config, expandedGroups]);

  // Flattened rows respecting expand state
  const flattenedRows = useMemo(() => {
    if (!isGrouped) {
      return data;
    }

    const result: Array<RowGroup<T> | T> = [];
    for (const group of groups) {
      result.push(group);
      if (group.isExpanded) {
        result.push(...group.rows);
      }
    }
    return result;
  }, [groups, isGrouped, data]);

  // Check if a group is expanded
  const isGroupExpanded = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.groupId === groupId);
      return group?.isExpanded ?? false;
    },
    [groups]
  );

  // Toggle group expand/collapse
  const toggleGroup = useCallback(
    (groupId: string) => {
      setExpandedGroups((prev) => {
        const next = new Set(prev);

        // If this is the first toggle and we haven't explicitly set any,
        // we need to initialize based on current state
        if (next.size === 0 && (config?.defaultExpanded ?? true)) {
          // Collapse all but toggle the clicked one to collapsed
          for (const group of groups) {
            if (group.groupId !== groupId) {
              next.add(group.groupId);
            }
          }
        } else {
          if (next.has(groupId)) {
            next.delete(groupId);
          } else {
            next.add(groupId);
          }
        }

        return next;
      });
    },
    [groups, config?.defaultExpanded]
  );

  // Expand all groups
  const expandAllGroups = useCallback(() => {
    setExpandedGroups(new Set(groups.map((g) => g.groupId)));
  }, [groups]);

  // Collapse all groups
  const collapseAllGroups = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  return {
    groupBy,
    setGroupBy,
    isGrouped,
    groupedData,
    flattenedRows,
    groups,
    isGroupExpanded,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    groupByColumn,
    groupCount: groups.length,
  };
}

export default useRowGrouping;
