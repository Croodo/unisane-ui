"use client";

import { useCallback } from "react";
import { useDataTableContext } from "../provider";
import type { SortDirection, MultiSortState } from "../../types";

/**
 * Hook for sorting functionality
 */
export function useSorting() {
  const {
    state,
    dispatch,
    controlled,
    multiSort: multiSortEnabled,
    maxSortColumns,
    onSortChange,
    onMultiSortChange,
  } = useDataTableContext();

  // Legacy single-sort values (for backward compatibility)
  const sortKey = controlled.sort?.key ?? state.sortKey;
  const sortDirection = controlled.sort?.direction ?? state.sortDirection;

  // Multi-sort state (ensure always an array)
  const sortState: MultiSortState = controlled.sortState ?? state.sortState ?? [];

  // Legacy single-sort setter
  const setSort = useCallback(
    (key: string | null, direction: SortDirection) => {
      if (controlled.sort) {
        onSortChange?.(key, direction);
      } else {
        dispatch({ type: "SET_SORT", key, direction });
        onSortChange?.(key, direction);
      }
    },
    [controlled.sort, onSortChange, dispatch]
  );

  // Multi-sort setter
  const setMultiSort = useCallback(
    (newSortState: MultiSortState) => {
      if (controlled.sortState) {
        onMultiSortChange?.(newSortState);
      } else {
        dispatch({ type: "SET_MULTI_SORT", sortState: newSortState });
        onMultiSortChange?.(newSortState);
      }

      // Also notify legacy callback with primary sort
      if (newSortState.length > 0) {
        const primary = newSortState[0]!;
        onSortChange?.(primary.key, primary.direction);
      } else {
        onSortChange?.(null, null);
      }
    },
    [controlled.sortState, onMultiSortChange, onSortChange, dispatch]
  );

  // Add or cycle a column in multi-sort (Shift+Click behavior)
  const addSort = useCallback(
    (key: string) => {
      if (controlled.sortState) {
        // Calculate new state for controlled mode
        const existingIndex = controlled.sortState.findIndex((s) => s.key === key);
        let newState: MultiSortState;

        if (existingIndex === -1) {
          newState = [...controlled.sortState, { key, direction: "asc" }];
          if (newState.length > maxSortColumns) {
            newState = newState.slice(-maxSortColumns);
          }
        } else {
          const existing = controlled.sortState[existingIndex]!;
          if (existing.direction === "asc") {
            newState = [...controlled.sortState];
            newState[existingIndex] = { key, direction: "desc" };
          } else {
            newState = controlled.sortState.filter((_, i) => i !== existingIndex);
          }
        }
        onMultiSortChange?.(newState);
        // Notify legacy callback
        if (newState.length > 0) {
          const primary = newState[0]!;
          onSortChange?.(primary.key, primary.direction);
        } else {
          onSortChange?.(null, null);
        }
      } else {
        dispatch({ type: "ADD_SORT", key, maxColumns: maxSortColumns });
        // Callbacks will be handled by the state change
      }
    },
    [controlled.sortState, onMultiSortChange, onSortChange, dispatch, maxSortColumns]
  );

  // Remove a column from multi-sort
  const removeSort = useCallback(
    (key: string) => {
      if (controlled.sortState) {
        const newState = controlled.sortState.filter((s) => s.key !== key);
        onMultiSortChange?.(newState);
        if (newState.length > 0) {
          const primary = newState[0]!;
          onSortChange?.(primary.key, primary.direction);
        } else {
          onSortChange?.(null, null);
        }
      } else {
        dispatch({ type: "REMOVE_SORT", key });
      }
    },
    [controlled.sortState, onMultiSortChange, onSortChange, dispatch]
  );

  // Clear all sorts
  const clearSort = useCallback(() => {
    if (controlled.sortState) {
      onMultiSortChange?.([]);
      onSortChange?.(null, null);
    } else {
      dispatch({ type: "CLEAR_SORT" });
      onSortChange?.(null, null);
      onMultiSortChange?.([]);
    }
  }, [controlled.sortState, onMultiSortChange, onSortChange, dispatch]);

  // Unified cycle sort that respects multiSort mode
  const cycleSort = useCallback(
    (key: string, addToMultiSort: boolean = false) => {
      // If multiSort enabled and Shift held (addToMultiSort), use multi-sort
      if (multiSortEnabled && addToMultiSort) {
        addSort(key);
        return;
      }

      // In multi-sort mode, check sortState for current column state
      if (multiSortEnabled) {
        const currentSort = sortState.find((s) => s.key === key);

        if (!currentSort) {
          // Not sorted - start with asc
          setMultiSort([{ key, direction: "asc" }]);
        } else if (currentSort.direction === "asc") {
          // Currently asc - change to desc
          setMultiSort([{ key, direction: "desc" }]);
        } else {
          // Currently desc - clear sort
          clearSort();
        }
        return;
      }

      // Legacy single-sort behavior
      let nextKey: string | null = key;
      let nextDir: SortDirection = "asc";

      if (sortKey === key) {
        if (sortDirection === "asc") {
          nextDir = "desc";
        } else if (sortDirection === "desc") {
          nextKey = null;
          nextDir = null;
        }
      }

      setSort(nextKey, nextDir);
    },
    [multiSortEnabled, sortKey, sortDirection, sortState, addSort, setSort, setMultiSort, clearSort]
  );

  // Get sort info for a specific column
  const getSortInfo = useCallback(
    (key: string): { direction: "asc" | "desc" | null; priority: number | null } => {
      const index = sortState.findIndex((s) => s.key === key);
      if (index === -1) {
        return { direction: null, priority: null };
      }
      return {
        direction: sortState[index]!.direction,
        priority: sortState.length > 1 ? index + 1 : null,
      };
    },
    [sortState]
  );

  return {
    // Legacy single-sort (backward compatible)
    sortKey,
    sortDirection,
    setSort,
    // Multi-sort
    sortState,
    setMultiSort,
    addSort,
    removeSort,
    clearSort,
    // Unified
    cycleSort,
    getSortInfo,
    // Config
    multiSortEnabled,
    maxSortColumns,
  };
}
