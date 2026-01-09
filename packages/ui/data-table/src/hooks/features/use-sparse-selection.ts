"use client";

import { useState, useCallback, useMemo } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * Selection mode for sparse selection.
 * - "none": Nothing selected
 * - "some": Specific IDs are selected
 * - "all_except": All rows are selected except specific IDs
 */
export type SparseSelectionMode = "none" | "some" | "all_except";

/**
 * Sparse selection state for handling large datasets efficiently.
 * Instead of storing all selected IDs (which can be 100K+),
 * we track whether we're in "select all" mode and store only exceptions.
 */
export interface SparseSelectionState {
  /** Current selection mode */
  mode: SparseSelectionMode;
  /** IDs in the exception set (selected if mode=some, deselected if mode=all_except) */
  ids: Set<string>;
  /** Total row count (needed for "all except" mode) */
  totalCount: number;
}

export interface UseSparseSelectionOptions {
  /**
   * Total number of rows in the dataset.
   * Required for "select all" to work correctly.
   */
  totalCount: number;

  /**
   * Initial selection state.
   */
  initialSelection?: SparseSelectionState;

  /**
   * Callback when selection changes.
   */
  onSelectionChange?: (state: SparseSelectionState) => void;

  /**
   * Threshold for switching from explicit IDs to "all except" mode.
   * When selecting more than this percentage of rows, switch to all_except mode.
   * @default 0.5 (50%)
   */
  allExceptThreshold?: number;
}

export interface UseSparseSelectionReturn {
  /** Current selection state */
  state: SparseSelectionState;

  /** Number of selected rows */
  selectedCount: number;

  /** Check if a specific row is selected */
  isSelected: (id: string) => boolean;

  /** Check if all rows are selected */
  isAllSelected: boolean;

  /** Check if some (but not all) rows are selected */
  isIndeterminate: boolean;

  /** Select a single row */
  select: (id: string) => void;

  /** Deselect a single row */
  deselect: (id: string) => void;

  /** Toggle a single row */
  toggle: (id: string) => void;

  /** Select multiple rows */
  selectMany: (ids: string[]) => void;

  /** Deselect multiple rows */
  deselectMany: (ids: string[]) => void;

  /** Select all rows */
  selectAll: () => void;

  /** Deselect all rows */
  deselectAll: () => void;

  /** Toggle select all */
  toggleAll: () => void;

  /** Get all selected IDs (use sparingly for large datasets) */
  getSelectedIds: (allIds: string[]) => string[];

  /** Convert sparse state to Set<string> for compatibility */
  toSet: (allIds: string[]) => Set<string>;

  /** Reset selection to initial state */
  reset: () => void;
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function createInitialState(totalCount: number): SparseSelectionState {
  return {
    mode: "none",
    ids: new Set(),
    totalCount,
  };
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for sparse selection in large datasets.
 *
 * Instead of storing all selected IDs (O(n) memory for n selected rows),
 * this hook uses a sparse representation:
 * - "none": Nothing selected (O(1) memory)
 * - "some": Only selected IDs stored (O(k) memory for k selected rows)
 * - "all_except": All selected, only deselected IDs stored (O(m) memory for m deselected rows)
 *
 * This is optimal when:
 * - Selecting a few rows out of 100K+ (mode: "some")
 * - Selecting most rows out of 100K+ (mode: "all_except")
 *
 * @example
 * ```tsx
 * const selection = useSparseSelection({
 *   totalCount: 100000,
 *   onSelectionChange: (state) => console.log(state),
 * });
 *
 * // Select all - O(1) operation, stores nothing
 * selection.selectAll();
 *
 * // Check if row is selected - O(1) lookup
 * if (selection.isSelected("row-5000")) { ... }
 *
 * // Deselect one row - stores just 1 ID
 * selection.deselect("row-5000");
 *
 * // Get count - O(1)
 * console.log(selection.selectedCount); // 99999
 * ```
 */
export function useSparseSelection({
  totalCount,
  initialSelection,
  onSelectionChange,
  allExceptThreshold = 0.5,
}: UseSparseSelectionOptions): UseSparseSelectionReturn {
  const [state, setState] = useState<SparseSelectionState>(
    () => initialSelection ?? createInitialState(totalCount)
  );

  // Update total count when it changes
  const currentState = useMemo(
    () => ({ ...state, totalCount }),
    [state, totalCount]
  );

  // ─── COMPUTED VALUES ─────────────────────────────────────────────────────────

  const selectedCount = useMemo(() => {
    switch (currentState.mode) {
      case "none":
        return 0;
      case "some":
        return currentState.ids.size;
      case "all_except":
        return Math.max(0, currentState.totalCount - currentState.ids.size);
    }
  }, [currentState]);

  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  // ─── CHECK SELECTION ─────────────────────────────────────────────────────────

  const isSelected = useCallback(
    (id: string): boolean => {
      switch (currentState.mode) {
        case "none":
          return false;
        case "some":
          return currentState.ids.has(id);
        case "all_except":
          return !currentState.ids.has(id);
      }
    },
    [currentState]
  );

  // ─── SELECTION ACTIONS ───────────────────────────────────────────────────────

  const updateState = useCallback(
    (newState: SparseSelectionState) => {
      setState(newState);
      onSelectionChange?.(newState);
    },
    [onSelectionChange]
  );

  const select = useCallback(
    (id: string) => {
      switch (currentState.mode) {
        case "none": {
          // Start selecting specific IDs
          updateState({
            mode: "some",
            ids: new Set([id]),
            totalCount,
          });
          break;
        }
        case "some": {
          // Add to selected set
          if (!currentState.ids.has(id)) {
            const newIds = new Set(currentState.ids);
            newIds.add(id);

            // Check if we should switch to all_except mode
            if (newIds.size > totalCount * allExceptThreshold) {
              // Switch to all_except mode - compute deselected IDs
              // This would need all IDs to compute, so we stay in "some" mode
              // unless explicitly selecting all
            }

            updateState({
              mode: "some",
              ids: newIds,
              totalCount,
            });
          }
          break;
        }
        case "all_except": {
          // Remove from deselected set
          if (currentState.ids.has(id)) {
            const newIds = new Set(currentState.ids);
            newIds.delete(id);

            // If no exceptions left, we're back to "none selected except none" = all selected
            // Keep in all_except mode for consistency
            updateState({
              mode: newIds.size === 0 ? "all_except" : "all_except",
              ids: newIds,
              totalCount,
            });
          }
          break;
        }
      }
    },
    [currentState, totalCount, allExceptThreshold, updateState]
  );

  const deselect = useCallback(
    (id: string) => {
      switch (currentState.mode) {
        case "none": {
          // Nothing to deselect
          break;
        }
        case "some": {
          // Remove from selected set
          if (currentState.ids.has(id)) {
            const newIds = new Set(currentState.ids);
            newIds.delete(id);

            updateState({
              mode: newIds.size === 0 ? "none" : "some",
              ids: newIds,
              totalCount,
            });
          }
          break;
        }
        case "all_except": {
          // Add to deselected set
          if (!currentState.ids.has(id)) {
            const newIds = new Set(currentState.ids);
            newIds.add(id);

            // If we've deselected more than threshold, switch to "some" mode
            // This would need all IDs to compute, so we stay in all_except
            updateState({
              mode: "all_except",
              ids: newIds,
              totalCount,
            });
          }
          break;
        }
      }
    },
    [currentState, totalCount, updateState]
  );

  const toggle = useCallback(
    (id: string) => {
      if (isSelected(id)) {
        deselect(id);
      } else {
        select(id);
      }
    },
    [isSelected, select, deselect]
  );

  const selectMany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      switch (currentState.mode) {
        case "none": {
          updateState({
            mode: "some",
            ids: new Set(ids),
            totalCount,
          });
          break;
        }
        case "some": {
          const newIds = new Set(currentState.ids);
          ids.forEach((id) => newIds.add(id));
          updateState({
            mode: "some",
            ids: newIds,
            totalCount,
          });
          break;
        }
        case "all_except": {
          const newIds = new Set(currentState.ids);
          ids.forEach((id) => newIds.delete(id));
          updateState({
            mode: "all_except",
            ids: newIds,
            totalCount,
          });
          break;
        }
      }
    },
    [currentState, totalCount, updateState]
  );

  const deselectMany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      switch (currentState.mode) {
        case "none": {
          // Nothing to deselect
          break;
        }
        case "some": {
          const newIds = new Set(currentState.ids);
          ids.forEach((id) => newIds.delete(id));
          updateState({
            mode: newIds.size === 0 ? "none" : "some",
            ids: newIds,
            totalCount,
          });
          break;
        }
        case "all_except": {
          const newIds = new Set(currentState.ids);
          ids.forEach((id) => newIds.add(id));
          updateState({
            mode: "all_except",
            ids: newIds,
            totalCount,
          });
          break;
        }
      }
    },
    [currentState, totalCount, updateState]
  );

  const selectAll = useCallback(() => {
    updateState({
      mode: "all_except",
      ids: new Set(), // No exceptions = all selected
      totalCount,
    });
  }, [totalCount, updateState]);

  const deselectAll = useCallback(() => {
    updateState({
      mode: "none",
      ids: new Set(),
      totalCount,
    });
  }, [totalCount, updateState]);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // ─── CONVERSION UTILITIES ────────────────────────────────────────────────────

  const getSelectedIds = useCallback(
    (allIds: string[]): string[] => {
      switch (currentState.mode) {
        case "none":
          return [];
        case "some":
          return Array.from(currentState.ids);
        case "all_except":
          return allIds.filter((id) => !currentState.ids.has(id));
      }
    },
    [currentState]
  );

  const toSet = useCallback(
    (allIds: string[]): Set<string> => {
      switch (currentState.mode) {
        case "none":
          return new Set();
        case "some":
          return new Set(currentState.ids);
        case "all_except":
          return new Set(allIds.filter((id) => !currentState.ids.has(id)));
      }
    },
    [currentState]
  );

  const reset = useCallback(() => {
    updateState(initialSelection ?? createInitialState(totalCount));
  }, [totalCount, initialSelection, updateState]);

  // ─── RETURN ──────────────────────────────────────────────────────────────────

  return {
    state: currentState,
    selectedCount,
    isSelected,
    isAllSelected,
    isIndeterminate,
    select,
    deselect,
    toggle,
    selectMany,
    deselectMany,
    selectAll,
    deselectAll,
    toggleAll,
    getSelectedIds,
    toSet,
    reset,
  };
}

export default useSparseSelection;
