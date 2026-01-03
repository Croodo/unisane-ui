"use client";

import { useMemo, useRef } from "react";
import type { Column, RowGroup } from "../../types";
import { buildGroupedData } from "../../utils/grouping";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface UseGroupedDataOptions<T> {
  /** Data rows to group */
  data: T[];
  /** Array of column keys to group by (supports multi-level) */
  groupByKeys: string[];
  /** Function to check if a group is expanded */
  isGroupExpanded: (groupId: string) => boolean;
  /** All columns (for aggregation detection) */
  columns: Column<T>[];
  /** Whether grouping is enabled */
  enabled: boolean;
}

export interface UseGroupedDataReturn<T> {
  /** Grouped data structure */
  groupedData: RowGroup<T>[];
  /** Whether data is grouped */
  isGrouped: boolean;
  /** Cache hit info (for debugging) */
  cacheInfo: { hit: boolean; dataHash: string };
}

// ─── CACHE KEY GENERATION ────────────────────────────────────────────────────

/**
 * Generate a stable hash for data array.
 * Uses row IDs for O(n) performance instead of full serialization.
 */
function generateDataHash<T extends { id: string }>(data: T[]): string {
  if (data.length === 0) return "empty";
  if (data.length > 1000) {
    // For large datasets, sample to keep hashing fast
    const sample = [
      data[0]?.id,
      data[Math.floor(data.length / 2)]?.id,
      data[data.length - 1]?.id,
      data.length,
    ].join("|");
    return sample;
  }
  // For smaller datasets, use all IDs
  return data.map((row) => row.id).join("|");
}

/**
 * Generate cache key from grouping parameters
 */
function generateCacheKey<T extends { id: string }>(
  data: T[],
  groupByKeys: string[],
  expandedGroups: Set<string>
): string {
  const dataHash = generateDataHash(data);
  const groupByHash = groupByKeys.join(",");
  const expandedHash = Array.from(expandedGroups).sort().join(",");
  return `${dataHash}::${groupByHash}::${expandedHash}`;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for memoized grouped data calculation.
 *
 * Optimizations:
 * - Memoizes based on data IDs, groupBy keys, and expanded state
 * - Caches previous result to avoid recalculation on unrelated renders
 * - Uses shallow comparison where possible
 *
 * @example
 * ```tsx
 * const { groupedData, isGrouped } = useGroupedData({
 *   data: processedData,
 *   groupByKeys: ["category", "status"],
 *   isGroupExpanded,
 *   columns,
 *   enabled: groupingEnabled,
 * });
 * ```
 */
export function useGroupedData<T extends { id: string }>({
  data,
  groupByKeys,
  isGroupExpanded,
  columns,
  enabled,
}: UseGroupedDataOptions<T>): UseGroupedDataReturn<T> {
  // Cache for expanded groups state (convert function to comparable value)
  const expandedGroupsRef = useRef<Set<string>>(new Set());
  const lastCacheKeyRef = useRef<string>("");
  const lastResultRef = useRef<RowGroup<T>[]>([]);

  // Get columns with aggregation configured
  const aggregationColumns = useMemo(
    () => columns.filter((col) => col.aggregation),
    [columns]
  );

  // Build grouped data with memoization
  const result = useMemo(() => {
    // Not grouping - return empty
    if (!enabled || groupByKeys.length === 0 || data.length === 0) {
      return {
        groupedData: [] as RowGroup<T>[],
        isGrouped: false,
        cacheInfo: { hit: false, dataHash: "disabled" },
      };
    }

    // Build expanded groups set from the function
    // We need to check all possible group IDs to detect changes
    const expandedGroups = new Set<string>();
    const buildExpandedSet = (rows: T[], keys: string[], parentId: string | null) => {
      if (keys.length === 0) return;

      const currentKey = keys[0]!;
      const groupMap = new Map<string, T[]>();

      for (const row of rows) {
        const value = (row as Record<string, unknown>)[currentKey];
        const valueKey = String(value ?? "__null__");
        if (!groupMap.has(valueKey)) {
          groupMap.set(valueKey, []);
        }
        groupMap.get(valueKey)!.push(row);
      }

      for (const [valueKey, groupRows] of groupMap) {
        const groupId = parentId ? `${parentId}::${valueKey}` : valueKey;
        if (isGroupExpanded(groupId)) {
          expandedGroups.add(groupId);
        }
        // Recurse for nested groups
        if (keys.length > 1) {
          buildExpandedSet(groupRows, keys.slice(1), groupId);
        }
      }
    };

    buildExpandedSet(data, groupByKeys, null);

    // Generate cache key
    const dataHash = generateDataHash(data);
    const cacheKey = generateCacheKey(data, groupByKeys, expandedGroups);

    // Check cache
    if (cacheKey === lastCacheKeyRef.current) {
      return {
        groupedData: lastResultRef.current,
        isGrouped: true,
        cacheInfo: { hit: true, dataHash },
      };
    }

    // Build groups
    const groupedData = buildGroupedData({
      data,
      groupByKeys,
      isGroupExpanded,
      aggregationColumns,
    });

    // Update cache
    lastCacheKeyRef.current = cacheKey;
    lastResultRef.current = groupedData;
    expandedGroupsRef.current = expandedGroups;

    return {
      groupedData,
      isGrouped: true,
      cacheInfo: { hit: false, dataHash },
    };
  }, [data, groupByKeys, isGroupExpanded, aggregationColumns, enabled]);

  return result;
}

export default useGroupedData;
