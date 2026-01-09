"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { useDataTableContext } from "../provider";
import { DataTableError, DataTableErrorCode } from "../../errors";

/**
 * Hook for row selection functionality
 *
 * Supports two selection modes:
 * 1. Standard selection: Uses Set<string> for selected IDs (default)
 * 2. Sparse selection: Uses SparseSelectionController for O(1) select-all (opt-in via sparseSelection prop)
 *
 * Fixed: Race condition where onSelectionChange was called before reducer updated.
 * Now uses useEffect to fire callbacks after state changes are committed.
 */
export function useSelection() {
  const { state, dispatch, controlled, onSelectionChange, onSelectAllFiltered, onError } = useDataTableContext();

  // Check if sparse selection is being used (takes precedence)
  const sparseSelection = controlled.sparseSelection;
  const usingSparseSelection = sparseSelection !== undefined;

  // Track if we're in controlled mode to avoid duplicate callbacks
  const isControlled = controlled.selectedIds !== undefined || usingSparseSelection;

  // Track previous selection to detect changes (for uncontrolled mode callback)
  const prevSelectionRef = useRef<Set<string>>(state.selectedRows);

  // Track if this is the initial mount to skip the first effect
  const isInitialMount = useRef(true);

  // Use sparse selection state if provided, otherwise use standard controlled/uncontrolled state
  const selectedRows = useMemo(() => {
    if (usingSparseSelection) {
      // For sparse selection, we create a "virtual" Set that uses the sparse isSelected function
      // This maintains API compatibility while using O(1) lookups
      return state.selectedRows; // We'll override isSelected below
    }
    if (controlled.selectedIds !== undefined) {
      return new Set(controlled.selectedIds);
    }
    return state.selectedRows;
  }, [usingSparseSelection, controlled.selectedIds, state.selectedRows]);

  // Fire onSelectionChange callback when uncontrolled state changes
  // This ensures the callback is fired AFTER the reducer has updated
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevSelectionRef.current = state.selectedRows;
      return;
    }

    // Skip if controlled (parent manages state and callbacks)
    if (isControlled) return;

    // Check if selection actually changed
    const prev = prevSelectionRef.current;
    const current = state.selectedRows;

    // Compare sets - check if they're different
    const hasChanged = prev.size !== current.size ||
      [...current].some(id => !prev.has(id)) ||
      [...prev].some(id => !current.has(id));

    if (hasChanged && onSelectionChange) {
      onSelectionChange(Array.from(current));
    }

    prevSelectionRef.current = current;
  }, [state.selectedRows, isControlled, onSelectionChange]);

  const selectRow = useCallback(
    (id: string) => {
      if (usingSparseSelection && sparseSelection) {
        // Delegate to sparse selection controller
        sparseSelection.select(id);
      } else if (isControlled && controlled.selectedIds) {
        // Controlled: notify parent immediately, parent updates selectedIds prop
        const next = [...controlled.selectedIds, id];
        onSelectionChange?.(next);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "SELECT_ROW", id });
      }
    },
    [dispatch, isControlled, usingSparseSelection, sparseSelection, controlled.selectedIds, onSelectionChange]
  );

  const deselectRow = useCallback(
    (id: string) => {
      if (usingSparseSelection && sparseSelection) {
        // Delegate to sparse selection controller
        sparseSelection.deselect(id);
      } else if (isControlled && controlled.selectedIds) {
        // Controlled: notify parent immediately
        const next = controlled.selectedIds.filter((i) => i !== id);
        onSelectionChange?.(next);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "DESELECT_ROW", id });
      }
    },
    [dispatch, isControlled, usingSparseSelection, sparseSelection, controlled.selectedIds, onSelectionChange]
  );

  const toggleSelect = useCallback(
    (id: string) => {
      if (usingSparseSelection && sparseSelection) {
        // Delegate to sparse selection controller
        sparseSelection.toggle(id);
      } else {
        const isRowSelected = selectedRows.has(id);
        if (isRowSelected) {
          deselectRow(id);
        } else {
          selectRow(id);
        }
      }
    },
    [usingSparseSelection, sparseSelection, selectedRows, selectRow, deselectRow]
  );

  const selectAll = useCallback(
    (ids: string[]) => {
      if (usingSparseSelection && sparseSelection) {
        // Use O(1) selectAll from sparse selection
        sparseSelection.selectAll();
      } else if (isControlled) {
        onSelectionChange?.(ids);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "SELECT_ALL", ids });
      }
    },
    [dispatch, isControlled, usingSparseSelection, sparseSelection, onSelectionChange]
  );

  const deselectAll = useCallback(() => {
    if (usingSparseSelection && sparseSelection) {
      // Use O(1) deselectAll from sparse selection
      sparseSelection.deselectAll();
    } else if (isControlled) {
      onSelectionChange?.([]);
    } else {
      // Uncontrolled: dispatch to reducer, useEffect will fire callback
      dispatch({ type: "DESELECT_ALL" });
    }
  }, [dispatch, isControlled, usingSparseSelection, sparseSelection, onSelectionChange]);

  /**
   * Select all rows across the entire filtered dataset (server-backed).
   * Uses the onSelectAllFiltered callback if provided.
   * Returns the selected IDs or null if the callback is not available.
   */
  const selectAllFiltered = useCallback(async (): Promise<string[] | null> => {
    if (!onSelectAllFiltered) {
      return null;
    }

    try {
      const ids = await onSelectAllFiltered();
      if (isControlled) {
        onSelectionChange?.(ids);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "SELECT_ALL", ids });
      }
      return ids;
    } catch (error) {
      const dtError = new DataTableError(
        "Failed to select all filtered rows",
        DataTableErrorCode.SELECTION_ERROR,
        { cause: error instanceof Error ? error : new Error(String(error)) }
      );

      // Log in development
      if (process.env.NODE_ENV !== "production") {
        console.error(dtError.message, error);
      }

      // Propagate to onError callback if available
      onError?.({
        type: "selection",
        message: dtError.message,
        error: dtError,
        context: { operation: "selectAllFiltered" },
      });

      return null;
    }
  }, [onSelectAllFiltered, isControlled, onSelectionChange, dispatch, onError]);

  const toggleExpand = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_EXPAND", id }),
    [dispatch]
  );

  // Compute selectedCount based on selection mode
  const selectedCount = usingSparseSelection && sparseSelection
    ? sparseSelection.selectedCount
    : selectedRows.size;

  // Create isSelected function that uses sparse selection when available
  const isSelected = useCallback(
    (id: string) => {
      if (usingSparseSelection && sparseSelection) {
        return sparseSelection.isSelected(id);
      }
      return selectedRows.has(id);
    },
    [usingSparseSelection, sparseSelection, selectedRows]
  );

  return {
    selectedRows,
    selectedCount,
    expandedRows: state.expandedRows,
    selectRow,
    deselectRow,
    toggleSelect,
    selectAll,
    deselectAll,
    selectAllFiltered,
    hasSelectAllFiltered: !!onSelectAllFiltered,
    toggleExpand,
    isSelected,
    isExpanded: (id: string) => state.expandedRows.has(id),
    // Expose sparse selection state for consumers that need it
    sparseSelectionState: sparseSelection?.state,
    isAllSelected: sparseSelection?.isAllSelected,
    isIndeterminate: sparseSelection?.isIndeterminate,
    usingSparseSelection,
  };
}
