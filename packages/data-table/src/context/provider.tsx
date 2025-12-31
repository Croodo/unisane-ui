"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from "react";
import type {
  DataTableContextValue,
  DataTableProviderProps,
  DataTableConfig,
} from "./types";
import { dataTableReducer, createInitialState } from "./reducer";
import { flattenColumns, hasColumnGroups } from "../types/index";

// ─── CONTEXT ────────────────────────────────────────────────────────────────

const DataTableContext = createContext<DataTableContextValue | null>(null);

// ─── STORAGE KEYS ───────────────────────────────────────────────────────────

const getStorageKey = (tableId: string, suffix: string) =>
  `unisane-datatable-${tableId}-${suffix}`;

// ─── PROVIDER ───────────────────────────────────────────────────────────────

export function DataTableProvider<T extends { id: string }>({
  children,
  tableId,
  columns,
  mode = "local",
  paginationMode = "offset",
  variant = "list",
  selectable = false,
  columnBorders,
  zebra = false,
  stickyHeader = true,
  resizable = true,
  pinnable = true,
  reorderable = false,
  groupingEnabled = false,
  showSummary = false,
  summaryLabel = "Summary",
  initialPageSize,
  // Multi-sort config
  multiSort = false,
  maxSortColumns = 3,
  // Controlled props
  controlledSort,
  controlledSortState,
  onSortChange,
  onMultiSortChange,
  controlledFilters,
  onFilterChange,
  searchValue,
  onSearchChange,
  columnPinState: externalPinState,
  onColumnPinChange,
  columnOrder: externalColumnOrder,
  onColumnOrderChange,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  groupBy: externalGroupBy,
  onGroupByChange,
  onSelectAllFiltered,
  onPaginationChange,
}: DataTableProviderProps<T>) {
  // Compute effective column borders based on variant
  const effectiveColumnBorders = columnBorders ?? variant === "grid";

  // Flatten columns and check for groups
  const flatColumns = useMemo(() => flattenColumns(columns), [columns]);
  const hasGroups = useMemo(() => hasColumnGroups(columns), [columns]);

  const config: DataTableConfig<T> = useMemo(
    () => ({
      tableId,
      columnDefinitions: columns,
      columns: flatColumns,
      hasGroups,
      mode,
      paginationMode,
      variant,
      selectable,
      columnBorders: effectiveColumnBorders,
      zebra,
      stickyHeader,
      resizable,
      pinnable,
      reorderable,
      groupingEnabled,
      showSummary,
      summaryLabel,
    }),
    [
      tableId,
      columns,
      flatColumns,
      hasGroups,
      mode,
      paginationMode,
      variant,
      selectable,
      effectiveColumnBorders,
      zebra,
      stickyHeader,
      resizable,
      pinnable,
      reorderable,
      groupingEnabled,
      showSummary,
      summaryLabel,
    ]
  );

  const [state, dispatch] = useReducer(
    dataTableReducer,
    { pageSize: initialPageSize },
    createInitialState
  );

  // ─── LOCALSTORAGE PERSISTENCE ──────────────────────────────────────────────

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!tableId || typeof localStorage === "undefined") return;

    try {
      // Load UI settings
      const savedSettings = localStorage.getItem(getStorageKey(tableId, "settings"));
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.hiddenColumns) {
          dispatch({
            type: "HYDRATE",
            state: { hiddenColumns: new Set(parsed.hiddenColumns) },
          });
        }
        if (parsed.columnWidths) {
          dispatch({
            type: "HYDRATE",
            state: { columnWidths: parsed.columnWidths },
          });
        }
      }

      // Load pin state (if not externally controlled)
      if (!externalPinState) {
        const savedPins = localStorage.getItem(getStorageKey(tableId, "pins"));
        if (savedPins) {
          const parsed = JSON.parse(savedPins);
          dispatch({ type: "HYDRATE", state: { columnPinState: parsed } });
        }
      }
    } catch (e) {
      console.error("Failed to load DataTable settings:", e);
    }
  }, [tableId, externalPinState]);

  // Save settings to localStorage
  useEffect(() => {
    if (!tableId || typeof localStorage === "undefined") return;

    const settings = {
      hiddenColumns: Array.from(state.hiddenColumns),
      columnWidths: state.columnWidths,
    };
    localStorage.setItem(getStorageKey(tableId, "settings"), JSON.stringify(settings));
  }, [tableId, state.hiddenColumns, state.columnWidths]);

  // Save pin state
  useEffect(() => {
    if (!tableId || externalPinState || typeof localStorage === "undefined") return;

    if (Object.keys(state.columnPinState).length > 0) {
      localStorage.setItem(
        getStorageKey(tableId, "pins"),
        JSON.stringify(state.columnPinState)
      );
    } else {
      localStorage.removeItem(getStorageKey(tableId, "pins"));
    }
  }, [tableId, state.columnPinState, externalPinState]);

  // Note: Mobile detection removed in favor of container queries.
  // Responsive behavior is now handled via:
  // - Container queries (@container) in components
  // - containerWidth in useColumns hook for responsive column visibility
  // - isPinningEnabled in useColumns hook for auto-disabling pins on small screens

  // ─── CONTROLLED STATE SYNC ─────────────────────────────────────────────────

  // Sync external selection to internal state
  useEffect(() => {
    if (externalSelectedIds !== undefined) {
      dispatch({ type: "SELECT_ALL", ids: externalSelectedIds });
    }
  }, [externalSelectedIds]);

  // ─── CONTEXT VALUE ─────────────────────────────────────────────────────────

  const controlled = useMemo(
    () => ({
      sort: controlledSort,
      sortState: controlledSortState,
      filters: controlledFilters,
      search: searchValue,
      pinState: externalPinState,
      columnOrder: externalColumnOrder,
      selectedIds: externalSelectedIds,
      groupBy: externalGroupBy,
    }),
    [controlledSort, controlledSortState, controlledFilters, searchValue, externalPinState, externalColumnOrder, externalSelectedIds, externalGroupBy]
  );

  const contextValue = useMemo<DataTableContextValue<T>>(
    () => ({
      state,
      dispatch,
      config,
      controlled,
      multiSort,
      maxSortColumns,
      onSortChange,
      onMultiSortChange,
      onFilterChange,
      onSearchChange,
      onColumnPinChange,
      onColumnOrderChange,
      onSelectionChange,
      onGroupByChange,
      onSelectAllFiltered,
      onPaginationChange,
    }),
    [
      state,
      config,
      controlled,
      multiSort,
      maxSortColumns,
      onSortChange,
      onMultiSortChange,
      onFilterChange,
      onSearchChange,
      onColumnPinChange,
      onColumnOrderChange,
      onSelectionChange,
      onGroupByChange,
      onSelectAllFiltered,
      onPaginationChange,
    ]
  );

  return (
    <DataTableContext.Provider value={contextValue as DataTableContextValue}>
      {children}
    </DataTableContext.Provider>
  );
}

// ─── BASE HOOK ──────────────────────────────────────────────────────────────

export function useDataTableContext<T = unknown>(): DataTableContextValue<T> {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error("useDataTableContext must be used within a DataTableProvider");
  }
  return context as DataTableContextValue<T>;
}

// ─── RE-EXPORT SPECIALIZED HOOKS ────────────────────────────────────────────
// Hooks are now in separate files for better maintainability.
// Re-exported here for backward compatibility.

export {
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useGrouping,
  useTableUI,
} from "./hooks";
