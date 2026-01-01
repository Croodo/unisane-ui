"use client";

import { useCallback } from "react";
import { useDataTableContext } from "../provider";
import type { MultiSortState } from "../../types";

/**
 * Hook for sorting functionality
 * Supports both single-sort and multi-sort modes
 */
export function useSorting() {
  const {
    state,
    dispatch,
    controlled,
    maxSortColumns,
    onSortChange,
  } = useDataTableContext();

  // Get current sort state (controlled or internal)
  const sortState: MultiSortState = controlled.sortState ?? state.sortState ?? [];

  // Set sort state directly
  const setSort = useCallback(
    (newSortState: MultiSortState) => {
      if (controlled.sortState !== undefined) {
        // Controlled mode - notify parent
        onSortChange?.(newSortState);
      } else {
        // Uncontrolled mode - update internal state
        dispatch({ type: "SET_SORT", sortState: newSortState });
        onSortChange?.(newSortState);
      }
    },
    [controlled.sortState, onSortChange, dispatch]
  );

  // Add or cycle a column in multi-sort (Shift+Click behavior)
  const addSort = useCallback(
    (key: string) => {
      if (controlled.sortState !== undefined) {
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
        onSortChange?.(newState);
      } else {
        dispatch({ type: "ADD_SORT", key, maxColumns: maxSortColumns });
      }
    },
    [controlled.sortState, onSortChange, dispatch, maxSortColumns]
  );

  // Remove a column from sort
  const removeSort = useCallback(
    (key: string) => {
      if (controlled.sortState !== undefined) {
        const newState = controlled.sortState.filter((s) => s.key !== key);
        onSortChange?.(newState);
      } else {
        dispatch({ type: "REMOVE_SORT", key });
      }
    },
    [controlled.sortState, onSortChange, dispatch]
  );

  // Clear all sorts
  const clearSort = useCallback(() => {
    if (controlled.sortState !== undefined) {
      onSortChange?.([]);
    } else {
      dispatch({ type: "CLEAR_SORT" });
      onSortChange?.([]);
    }
  }, [controlled.sortState, onSortChange, dispatch]);

  // Cycle sort for a column (asc -> desc -> none)
  // addToMultiSort: if true, adds to existing sorts instead of replacing
  const cycleSort = useCallback(
    (key: string, addToMultiSort: boolean = false) => {
      if (addToMultiSort) {
        // Multi-sort mode: add/cycle this column in the sort array
        addSort(key);
        return;
      }

      // Single-sort mode: replace entire sort with just this column
      const currentSort = sortState.find((s) => s.key === key);

      if (!currentSort) {
        // Not sorted - start with asc
        setSort([{ key, direction: "asc" }]);
      } else if (currentSort.direction === "asc") {
        // Currently asc - change to desc
        setSort([{ key, direction: "desc" }]);
      } else {
        // Currently desc - clear sort
        clearSort();
      }
    },
    [sortState, addSort, setSort, clearSort]
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

  // Check if a column is sorted
  const isSorted = useCallback(
    (key: string): boolean => {
      return sortState.some((s) => s.key === key);
    },
    [sortState]
  );

  // Get the primary sort (first in array)
  const primarySort = sortState.length > 0 ? sortState[0] : null;

  return {
    // Sort state
    sortState,
    primarySort,
    // Actions
    setSort,
    addSort,
    removeSort,
    clearSort,
    cycleSort,
    // Helpers
    getSortInfo,
    isSorted,
    // Config
    maxSortColumns,
  };
}
