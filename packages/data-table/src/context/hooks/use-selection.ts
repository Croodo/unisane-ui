"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDataTableContext } from "../provider";

/**
 * Hook for row selection functionality
 *
 * Fixed: Race condition where onSelectionChange was called before reducer updated.
 * Now uses useEffect to fire callbacks after state changes are committed.
 */
export function useSelection() {
  const { state, dispatch, controlled, onSelectionChange, onSelectAllFiltered } = useDataTableContext();

  // Track if we're in controlled mode to avoid duplicate callbacks
  const isControlled = controlled.selectedIds !== undefined;

  // Track previous selection to detect changes (for uncontrolled mode callback)
  const prevSelectionRef = useRef<Set<string>>(state.selectedRows);

  // Track if this is the initial mount to skip the first effect
  const isInitialMount = useRef(true);

  // Use controlled state if provided
  const selectedRows = isControlled
    ? new Set(controlled.selectedIds)
    : state.selectedRows;

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
      if (isControlled) {
        // Controlled: notify parent immediately, parent updates selectedIds prop
        const next = [...controlled.selectedIds!, id];
        onSelectionChange?.(next);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "SELECT_ROW", id });
      }
    },
    [dispatch, isControlled, controlled.selectedIds, onSelectionChange]
  );

  const deselectRow = useCallback(
    (id: string) => {
      if (isControlled) {
        // Controlled: notify parent immediately
        const next = controlled.selectedIds!.filter((i) => i !== id);
        onSelectionChange?.(next);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "DESELECT_ROW", id });
      }
    },
    [dispatch, isControlled, controlled.selectedIds, onSelectionChange]
  );

  const toggleSelect = useCallback(
    (id: string) => {
      const isSelected = selectedRows.has(id);
      if (isSelected) {
        deselectRow(id);
      } else {
        selectRow(id);
      }
    },
    [selectedRows, selectRow, deselectRow]
  );

  const selectAll = useCallback(
    (ids: string[]) => {
      if (isControlled) {
        onSelectionChange?.(ids);
      } else {
        // Uncontrolled: dispatch to reducer, useEffect will fire callback
        dispatch({ type: "SELECT_ALL", ids });
      }
    },
    [dispatch, isControlled, onSelectionChange]
  );

  const deselectAll = useCallback(() => {
    if (isControlled) {
      onSelectionChange?.([]);
    } else {
      // Uncontrolled: dispatch to reducer, useEffect will fire callback
      dispatch({ type: "DESELECT_ALL" });
    }
  }, [dispatch, isControlled, onSelectionChange]);

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
      console.error("Failed to select all filtered rows:", error);
      return null;
    }
  }, [onSelectAllFiltered, isControlled, onSelectionChange, dispatch]);

  const toggleExpand = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_EXPAND", id }),
    [dispatch]
  );

  return {
    selectedRows,
    selectedCount: selectedRows.size,
    expandedRows: state.expandedRows,
    selectRow,
    deselectRow,
    toggleSelect,
    selectAll,
    deselectAll,
    selectAllFiltered,
    hasSelectAllFiltered: !!onSelectAllFiltered,
    toggleExpand,
    isSelected: (id: string) => selectedRows.has(id),
    isExpanded: (id: string) => state.expandedRows.has(id),
  };
}
