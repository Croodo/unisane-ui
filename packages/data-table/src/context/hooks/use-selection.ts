"use client";

import { useCallback } from "react";
import { useDataTableContext } from "../provider";

/**
 * Hook for row selection functionality
 */
export function useSelection() {
  const { state, dispatch, controlled, onSelectionChange, onSelectAllFiltered } = useDataTableContext();

  // Use controlled state if provided
  const selectedRows = controlled.selectedIds
    ? new Set(controlled.selectedIds)
    : state.selectedRows;

  const selectRow = useCallback(
    (id: string) => {
      if (controlled.selectedIds) {
        const next = [...controlled.selectedIds, id];
        onSelectionChange?.(next);
      } else {
        // Create the new state first, then dispatch and notify with correct state
        const newSelection = new Set(state.selectedRows);
        newSelection.add(id);
        dispatch({ type: "SELECT_ROW", id });
        onSelectionChange?.(Array.from(newSelection));
      }
    },
    [dispatch, controlled.selectedIds, onSelectionChange, state.selectedRows]
  );

  const deselectRow = useCallback(
    (id: string) => {
      if (controlled.selectedIds) {
        const next = controlled.selectedIds.filter((i) => i !== id);
        onSelectionChange?.(next);
      } else {
        // Create the new state first, then dispatch and notify with correct state
        const newSelection = new Set(state.selectedRows);
        newSelection.delete(id);
        dispatch({ type: "DESELECT_ROW", id });
        onSelectionChange?.(Array.from(newSelection));
      }
    },
    [dispatch, controlled.selectedIds, onSelectionChange, state.selectedRows]
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
      if (controlled.selectedIds) {
        onSelectionChange?.(ids);
      } else {
        dispatch({ type: "SELECT_ALL", ids });
        onSelectionChange?.(ids);
      }
    },
    [dispatch, controlled.selectedIds, onSelectionChange]
  );

  const deselectAll = useCallback(() => {
    if (controlled.selectedIds) {
      onSelectionChange?.([]);
    } else {
      dispatch({ type: "DESELECT_ALL" });
      onSelectionChange?.([]);
    }
  }, [dispatch, controlled.selectedIds, onSelectionChange]);

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
      if (controlled.selectedIds) {
        onSelectionChange?.(ids);
      } else {
        dispatch({ type: "SELECT_ALL", ids });
        onSelectionChange?.(ids);
      }
      return ids;
    } catch (error) {
      console.error("Failed to select all filtered rows:", error);
      return null;
    }
  }, [onSelectAllFiltered, controlled.selectedIds, onSelectionChange, dispatch]);

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
