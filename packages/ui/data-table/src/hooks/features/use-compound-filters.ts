"use client";

import { useState, useCallback, useMemo } from "react";
import type { FilterValue, FilterState } from "../../types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * Logical operator for combining filter conditions
 */
export type FilterLogicOperator = "and" | "or";

/**
 * Comparison operators for filter conditions
 */
export type FilterComparisonOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEquals"
  | "lessThan"
  | "lessThanOrEquals"
  | "between"
  | "notBetween"
  | "in"
  | "notIn"
  | "isEmpty"
  | "isNotEmpty"
  | "isTrue"
  | "isFalse";

/**
 * A single filter condition
 */
export interface FilterCondition {
  /** Unique ID for this condition */
  id: string;
  /** Column key to filter on */
  columnKey: string;
  /** Comparison operator */
  operator: FilterComparisonOperator;
  /** Filter value(s) */
  value: FilterValue;
  /** Secondary value for range operators (between) */
  value2?: FilterValue;
  /** Whether this condition is enabled */
  enabled?: boolean;
}

/**
 * A group of filter conditions with a logical operator
 */
export interface FilterGroup {
  /** Unique ID for this group */
  id: string;
  /** Logical operator to combine conditions/groups */
  operator: FilterLogicOperator;
  /** Conditions in this group */
  conditions: FilterCondition[];
  /** Nested filter groups */
  groups: FilterGroup[];
  /** Whether this group is enabled */
  enabled?: boolean;
}

/**
 * Complete compound filter configuration
 */
export interface CompoundFilter {
  /** Root filter group */
  root: FilterGroup;
  /** Whether the compound filter is active */
  active: boolean;
}

export interface UseCompoundFiltersOptions<T extends { id: string }> {
  /**
   * Whether compound filters are enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Initial compound filter configuration.
   */
  initialFilter?: CompoundFilter;

  /**
   * Data to filter (for client-side filtering).
   */
  data?: T[];

  /**
   * Get value from a row for a given column key.
   * Defaults to direct property access.
   */
  getValue?: (row: T, columnKey: string) => unknown;

  /**
   * Callback when filter changes.
   */
  onFilterChange?: (filter: CompoundFilter) => void;

  /**
   * Callback when filtered data changes.
   */
  onFilteredDataChange?: (data: T[]) => void;

  /**
   * Maximum nesting depth for filter groups.
   * @default 3
   */
  maxDepth?: number;

  /**
   * Maximum conditions per group.
   * @default 10
   */
  maxConditionsPerGroup?: number;

  /**
   * Convert compound filter to simple FilterState (for compatibility).
   * Only works for simple filters (single AND group with equals operators).
   */
  convertToSimple?: boolean;
}

export interface UseCompoundFiltersReturn<T extends { id: string }> {
  /**
   * Current compound filter configuration.
   */
  filter: CompoundFilter;

  /**
   * Filtered data (if data was provided).
   */
  filteredData: T[];

  /**
   * Whether any filter is active.
   */
  hasActiveFilter: boolean;

  /**
   * Total number of active conditions.
   */
  activeConditionCount: number;

  /**
   * Add a condition to a group.
   */
  addCondition: (groupId: string, condition: Omit<FilterCondition, "id">) => string;

  /**
   * Update a condition.
   */
  updateCondition: (conditionId: string, updates: Partial<Omit<FilterCondition, "id">>) => boolean;

  /**
   * Remove a condition.
   */
  removeCondition: (conditionId: string) => boolean;

  /**
   * Add a nested group.
   */
  addGroup: (parentGroupId: string, operator?: FilterLogicOperator) => string;

  /**
   * Update a group's operator.
   */
  updateGroupOperator: (groupId: string, operator: FilterLogicOperator) => boolean;

  /**
   * Remove a group.
   */
  removeGroup: (groupId: string) => boolean;

  /**
   * Toggle condition enabled state.
   */
  toggleCondition: (conditionId: string) => boolean;

  /**
   * Toggle group enabled state.
   */
  toggleGroup: (groupId: string) => boolean;

  /**
   * Clear all filters.
   */
  clearAll: () => void;

  /**
   * Reset to initial filter or empty.
   */
  reset: () => void;

  /**
   * Set the entire filter.
   */
  setFilter: (filter: CompoundFilter) => void;

  /**
   * Convert current filter to simple FilterState.
   * Returns null if filter is too complex.
   */
  toSimpleFilter: () => FilterState | null;

  /**
   * Import from simple FilterState.
   */
  fromSimpleFilter: (state: FilterState) => void;

  /**
   * Evaluate a row against the current filter.
   */
  evaluateRow: (row: T) => boolean;

  /**
   * Get filter as JSON string for persistence.
   */
  toJSON: () => string;

  /**
   * Load filter from JSON string.
   */
  fromJSON: (json: string) => boolean;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_CONDITIONS = 10;

// ─── UTILITIES ───────────────────────────────────────────────────────────────

let idCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

function createEmptyGroup(operator: FilterLogicOperator = "and"): FilterGroup {
  return {
    id: generateId("group"),
    operator,
    conditions: [],
    groups: [],
    enabled: true,
  };
}

function createEmptyFilter(): CompoundFilter {
  return {
    root: createEmptyGroup("and"),
    active: false,
  };
}

/**
 * Deep clone a filter group
 */
function cloneGroup(group: FilterGroup): FilterGroup {
  return {
    ...group,
    conditions: group.conditions.map((c) => ({ ...c })),
    groups: group.groups.map(cloneGroup),
  };
}

/**
 * Find a group by ID in the filter tree
 */
function findGroup(group: FilterGroup, groupId: string): FilterGroup | null {
  if (group.id === groupId) return group;
  for (const child of group.groups) {
    const found = findGroup(child, groupId);
    if (found) return found;
  }
  return null;
}

/**
 * Find and remove a condition by ID
 */
function removeConditionFromGroup(group: FilterGroup, conditionId: string): boolean {
  const index = group.conditions.findIndex((c) => c.id === conditionId);
  if (index !== -1) {
    group.conditions.splice(index, 1);
    return true;
  }
  for (const child of group.groups) {
    if (removeConditionFromGroup(child, conditionId)) return true;
  }
  return false;
}

/**
 * Find a condition by ID
 */
function findCondition(group: FilterGroup, conditionId: string): FilterCondition | null {
  const condition = group.conditions.find((c) => c.id === conditionId);
  if (condition) return condition;
  for (const child of group.groups) {
    const found = findCondition(child, conditionId);
    if (found) return found;
  }
  return null;
}

/**
 * Find parent group of a child group
 */
function findParentGroup(root: FilterGroup, childId: string): FilterGroup | null {
  for (const child of root.groups) {
    if (child.id === childId) return root;
    const found = findParentGroup(child, childId);
    if (found) return found;
  }
  return null;
}

/**
 * Count active conditions in a group tree
 */
function countActiveConditions(group: FilterGroup): number {
  if (group.enabled === false) return 0;
  let count = group.conditions.filter((c) => c.enabled !== false).length;
  for (const child of group.groups) {
    count += countActiveConditions(child);
  }
  return count;
}

/**
 * Get depth of a group in the tree
 */
function getGroupDepth(root: FilterGroup, groupId: string, depth = 0): number {
  if (root.id === groupId) return depth;
  for (const child of root.groups) {
    const found = getGroupDepth(child, groupId, depth + 1);
    if (found !== -1) return found;
  }
  return -1;
}

// ─── EVALUATION ──────────────────────────────────────────────────────────────

/**
 * Evaluate a single condition against a value
 */
function evaluateCondition(
  value: unknown,
  condition: FilterCondition
): boolean {
  if (condition.enabled === false) return true;

  const { operator, value: filterValue, value2 } = condition;

  // Handle null/undefined
  if (value === null || value === undefined) {
    if (operator === "isEmpty") return true;
    if (operator === "isNotEmpty") return false;
    return false;
  }

  // Convert to string for text operations
  const strValue = String(value).toLowerCase();
  const strFilterValue = filterValue != null ? String(filterValue).toLowerCase() : "";

  switch (operator) {
    case "equals":
      return value === filterValue || strValue === strFilterValue;

    case "notEquals":
      return value !== filterValue && strValue !== strFilterValue;

    case "contains":
      return strValue.includes(strFilterValue);

    case "notContains":
      return !strValue.includes(strFilterValue);

    case "startsWith":
      return strValue.startsWith(strFilterValue);

    case "endsWith":
      return strValue.endsWith(strFilterValue);

    case "greaterThan":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value > filterValue;
      }
      if (value instanceof Date && filterValue instanceof Date) {
        return value.getTime() > filterValue.getTime();
      }
      return strValue > strFilterValue;

    case "greaterThanOrEquals":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value >= filterValue;
      }
      if (value instanceof Date && filterValue instanceof Date) {
        return value.getTime() >= filterValue.getTime();
      }
      return strValue >= strFilterValue;

    case "lessThan":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value < filterValue;
      }
      if (value instanceof Date && filterValue instanceof Date) {
        return value.getTime() < filterValue.getTime();
      }
      return strValue < strFilterValue;

    case "lessThanOrEquals":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value <= filterValue;
      }
      if (value instanceof Date && filterValue instanceof Date) {
        return value.getTime() <= filterValue.getTime();
      }
      return strValue <= strFilterValue;

    case "between":
      if (typeof value === "number" && typeof filterValue === "number" && typeof value2 === "number") {
        return value >= filterValue && value <= value2;
      }
      return false;

    case "notBetween":
      if (typeof value === "number" && typeof filterValue === "number" && typeof value2 === "number") {
        return value < filterValue || value > value2;
      }
      return false;

    case "in":
      if (Array.isArray(filterValue)) {
        return filterValue.some((v) => v === value || String(v).toLowerCase() === strValue);
      }
      return false;

    case "notIn":
      if (Array.isArray(filterValue)) {
        return !filterValue.some((v) => v === value || String(v).toLowerCase() === strValue);
      }
      return true;

    case "isEmpty":
      return value === "" || (Array.isArray(value) && value.length === 0);

    case "isNotEmpty":
      return value !== "" && (!Array.isArray(value) || value.length > 0);

    case "isTrue":
      return value === true || value === "true" || value === 1;

    case "isFalse":
      return value === false || value === "false" || value === 0;

    default:
      return true;
  }
}

/**
 * Evaluate a filter group against a row
 */
function evaluateGroup<T>(
  row: T,
  group: FilterGroup,
  getValue: (row: T, key: string) => unknown
): boolean {
  if (group.enabled === false) return true;

  const conditionResults = group.conditions.map((condition) => {
    if (condition.enabled === false) return true;
    const value = getValue(row, condition.columnKey);
    return evaluateCondition(value, condition);
  });

  const groupResults = group.groups.map((childGroup) =>
    evaluateGroup(row, childGroup, getValue)
  );

  const allResults = [...conditionResults, ...groupResults];

  if (allResults.length === 0) return true;

  if (group.operator === "and") {
    return allResults.every((r) => r);
  } else {
    return allResults.some((r) => r);
  }
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for managing compound filters with AND/OR logic.
 *
 * Features:
 * - AND/OR logical operators
 * - Nested filter groups (up to configurable depth)
 * - Multiple comparison operators
 * - Client-side data filtering
 * - Convert to/from simple FilterState
 * - JSON serialization for persistence
 *
 * @example
 * ```tsx
 * const {
 *   filter,
 *   filteredData,
 *   addCondition,
 *   addGroup,
 *   updateGroupOperator,
 * } = useCompoundFilters({
 *   data: rows,
 *   getValue: (row, key) => row[key],
 *   onFilterChange: (filter) => console.log("Filter changed:", filter),
 * });
 *
 * // Add a condition: name contains "john"
 * addCondition(filter.root.id, {
 *   columnKey: "name",
 *   operator: "contains",
 *   value: "john",
 * });
 *
 * // Add a nested OR group
 * const orGroupId = addGroup(filter.root.id, "or");
 *
 * // Add conditions to the OR group
 * addCondition(orGroupId, { columnKey: "status", operator: "equals", value: "active" });
 * addCondition(orGroupId, { columnKey: "status", operator: "equals", value: "pending" });
 * ```
 */
export function useCompoundFilters<T extends { id: string }>({
  enabled = true,
  initialFilter,
  data = [],
  getValue = (row, key) => (row as Record<string, unknown>)[key],
  onFilterChange,
  onFilteredDataChange,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxConditionsPerGroup = DEFAULT_MAX_CONDITIONS,
}: UseCompoundFiltersOptions<T> = {}): UseCompoundFiltersReturn<T> {
  // ─── STATE ────────────────────────────────────────────────────────────────

  const [filter, setFilterState] = useState<CompoundFilter>(
    () => initialFilter ?? createEmptyFilter()
  );

  // ─── DERIVED STATE ────────────────────────────────────────────────────────

  const hasActiveFilter = useMemo(() => {
    if (!enabled || !filter.active) return false;
    return countActiveConditions(filter.root) > 0;
  }, [enabled, filter]);

  const activeConditionCount = useMemo(() => {
    if (!enabled) return 0;
    return countActiveConditions(filter.root);
  }, [enabled, filter]);

  // ─── FILTERED DATA ────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    if (!enabled || !hasActiveFilter || data.length === 0) {
      return data;
    }

    return data.filter((row) => evaluateGroup(row, filter.root, getValue));
  }, [enabled, hasActiveFilter, data, filter, getValue]);

  // Notify when filtered data changes
  useMemo(() => {
    onFilteredDataChange?.(filteredData);
  }, [filteredData, onFilteredDataChange]);

  // ─── SETTERS ──────────────────────────────────────────────────────────────

  const setFilter = useCallback(
    (newFilter: CompoundFilter) => {
      setFilterState(newFilter);
      onFilterChange?.(newFilter);
    },
    [onFilterChange]
  );

  const updateFilter = useCallback(
    (updater: (prev: CompoundFilter) => CompoundFilter) => {
      setFilterState((prev) => {
        const newFilter = updater(prev);
        onFilterChange?.(newFilter);
        return newFilter;
      });
    },
    [onFilterChange]
  );

  // ─── CONDITION ACTIONS ────────────────────────────────────────────────────

  const addCondition = useCallback(
    (groupId: string, condition: Omit<FilterCondition, "id">): string => {
      if (!enabled) return "";

      const id = generateId("cond");
      const fullCondition: FilterCondition = { ...condition, id, enabled: true };

      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        const group = findGroup(newRoot, groupId);

        if (!group) {
          console.warn(`Group ${groupId} not found`);
          return prev;
        }

        if (group.conditions.length >= maxConditionsPerGroup) {
          console.warn(`Maximum conditions (${maxConditionsPerGroup}) reached for group`);
          return prev;
        }

        group.conditions.push(fullCondition);

        return { root: newRoot, active: true };
      });

      return id;
    },
    [enabled, maxConditionsPerGroup, updateFilter]
  );

  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<Omit<FilterCondition, "id">>): boolean => {
      if (!enabled) return false;

      let found = false;
      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        const condition = findCondition(newRoot, conditionId);

        if (!condition) return prev;

        Object.assign(condition, updates);
        found = true;

        return { ...prev, root: newRoot };
      });

      return found;
    },
    [enabled, updateFilter]
  );

  const removeCondition = useCallback(
    (conditionId: string): boolean => {
      if (!enabled) return false;

      let found = false;
      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        found = removeConditionFromGroup(newRoot, conditionId);

        if (!found) return prev;

        // Check if filter is now empty
        const isEmpty = countActiveConditions(newRoot) === 0;

        return { root: newRoot, active: !isEmpty };
      });

      return found;
    },
    [enabled, updateFilter]
  );

  const toggleCondition = useCallback(
    (conditionId: string): boolean => {
      if (!enabled) return false;

      let found = false;
      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        const condition = findCondition(newRoot, conditionId);

        if (!condition) return prev;

        condition.enabled = condition.enabled === false ? true : false;
        found = true;

        return { ...prev, root: newRoot };
      });

      return found;
    },
    [enabled, updateFilter]
  );

  // ─── GROUP ACTIONS ────────────────────────────────────────────────────────

  const addGroup = useCallback(
    (parentGroupId: string, operator: FilterLogicOperator = "and"): string => {
      if (!enabled) return "";

      const newGroup = createEmptyGroup(operator);

      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        const parent = findGroup(newRoot, parentGroupId);

        if (!parent) {
          console.warn(`Parent group ${parentGroupId} not found`);
          return prev;
        }

        // Check depth
        const depth = getGroupDepth(newRoot, parentGroupId);
        if (depth >= maxDepth - 1) {
          console.warn(`Maximum nesting depth (${maxDepth}) reached`);
          return prev;
        }

        parent.groups.push(newGroup);

        return { ...prev, root: newRoot };
      });

      return newGroup.id;
    },
    [enabled, maxDepth, updateFilter]
  );

  const updateGroupOperator = useCallback(
    (groupId: string, operator: FilterLogicOperator): boolean => {
      if (!enabled) return false;

      let found = false;
      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        const group = findGroup(newRoot, groupId);

        if (!group) return prev;

        group.operator = operator;
        found = true;

        return { ...prev, root: newRoot };
      });

      return found;
    },
    [enabled, updateFilter]
  );

  const removeGroup = useCallback(
    (groupId: string): boolean => {
      if (!enabled) return false;

      // Can't remove root group
      updateFilter((prev) => {
        if (prev.root.id === groupId) {
          console.warn("Cannot remove root group");
          return prev;
        }

        const newRoot = cloneGroup(prev.root);
        const parent = findParentGroup(newRoot, groupId);

        if (!parent) return prev;

        const index = parent.groups.findIndex((g) => g.id === groupId);
        if (index !== -1) {
          parent.groups.splice(index, 1);
        }

        return { ...prev, root: newRoot };
      });

      return true;
    },
    [enabled, updateFilter]
  );

  const toggleGroup = useCallback(
    (groupId: string): boolean => {
      if (!enabled) return false;

      let found = false;
      updateFilter((prev) => {
        const newRoot = cloneGroup(prev.root);
        const group = findGroup(newRoot, groupId);

        if (!group) return prev;

        group.enabled = group.enabled === false ? true : false;
        found = true;

        return { ...prev, root: newRoot };
      });

      return found;
    },
    [enabled, updateFilter]
  );

  // ─── CLEAR/RESET ──────────────────────────────────────────────────────────

  const clearAll = useCallback(() => {
    setFilter(createEmptyFilter());
  }, [setFilter]);

  const reset = useCallback(() => {
    setFilter(initialFilter ?? createEmptyFilter());
  }, [initialFilter, setFilter]);

  // ─── CONVERSION ───────────────────────────────────────────────────────────

  const toSimpleFilter = useCallback((): FilterState | null => {
    // Only convert if it's a simple AND group with equals operators
    if (filter.root.operator !== "and") return null;
    if (filter.root.groups.length > 0) return null;

    const result: FilterState = {};

    for (const condition of filter.root.conditions) {
      if (condition.enabled === false) continue;
      if (condition.operator !== "equals" && condition.operator !== "in") {
        return null;
      }
      result[condition.columnKey] = condition.value;
    }

    return result;
  }, [filter]);

  const fromSimpleFilter = useCallback(
    (state: FilterState) => {
      const newRoot = createEmptyGroup("and");

      for (const [key, value] of Object.entries(state)) {
        if (value == null || value === "") continue;

        newRoot.conditions.push({
          id: generateId("cond"),
          columnKey: key,
          operator: Array.isArray(value) ? "in" : "equals",
          value,
          enabled: true,
        });
      }

      setFilter({
        root: newRoot,
        active: newRoot.conditions.length > 0,
      });
    },
    [setFilter]
  );

  // ─── EVALUATION ───────────────────────────────────────────────────────────

  const evaluateRow = useCallback(
    (row: T): boolean => {
      if (!enabled || !hasActiveFilter) return true;
      return evaluateGroup(row, filter.root, getValue);
    },
    [enabled, hasActiveFilter, filter, getValue]
  );

  // ─── SERIALIZATION ────────────────────────────────────────────────────────

  const toJSON = useCallback((): string => {
    return JSON.stringify(filter, null, 2);
  }, [filter]);

  const fromJSON = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json);
        if (!parsed.root || typeof parsed.active !== "boolean") {
          console.warn("Invalid compound filter JSON");
          return false;
        }
        setFilter(parsed);
        return true;
      } catch (e) {
        console.warn("Failed to parse compound filter JSON:", e);
        return false;
      }
    },
    [setFilter]
  );

  // ─── RETURN ───────────────────────────────────────────────────────────────

  return {
    filter,
    filteredData,
    hasActiveFilter,
    activeConditionCount,
    addCondition,
    updateCondition,
    removeCondition,
    addGroup,
    updateGroupOperator,
    removeGroup,
    toggleCondition,
    toggleGroup,
    clearAll,
    reset,
    setFilter,
    toSimpleFilter,
    fromSimpleFilter,
    evaluateRow,
    toJSON,
    fromJSON,
  };
}

export default useCompoundFilters;
