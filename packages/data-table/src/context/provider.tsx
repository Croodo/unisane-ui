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
import { I18nProvider } from "../i18n/index";

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
  // Sort config
  maxSortColumns = 3,
  // Controlled props
  sortState: externalSortState,
  onSortChange,
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
  locale,
}: DataTableProviderProps<T>) {
  // Compute effective column borders based on variant
  const effectiveColumnBorders = columnBorders ?? variant === "grid";

  // Flatten columns and check for groups
  const flatColumns = useMemo(() => flattenColumns(columns), [columns]);
  const hasGroups = useMemo(() => hasColumnGroups(columns), [columns]);

  // Validate columns on mount/change and warn about issues
  useEffect(() => {
    if (!columns || columns.length === 0) {
      console.warn("DataTable: No columns provided. Table will not render correctly.");
      return;
    }

    // Check for duplicate keys
    const keys = flatColumns.map((col) => String(col.key));
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      console.error(
        `DataTable: Duplicate column keys detected: ${[...new Set(duplicates)].join(", ")}. ` +
        "Each column must have a unique key."
      );
    }

    // Check for missing headers
    const missingHeaders = flatColumns.filter((col) => !col.header);
    if (missingHeaders.length > 0) {
      console.warn(
        `DataTable: Columns missing headers: ${missingHeaders.map((c) => String(c.key)).join(", ")}. ` +
        "Consider adding header text for better UX."
      );
    }
  }, [columns, flatColumns]);

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

  // Save settings to localStorage (using requestIdleCallback to avoid blocking UI)
  useEffect(() => {
    if (!tableId || typeof localStorage === "undefined") return;

    const settings = {
      hiddenColumns: Array.from(state.hiddenColumns),
      columnWidths: state.columnWidths,
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    const saveToStorage = () => {
      try {
        localStorage.setItem(getStorageKey(tableId, "settings"), JSON.stringify(settings));
      } catch (e) {
        console.warn("Failed to save DataTable settings to localStorage:", e);
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(saveToStorage, { timeout: 1000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(saveToStorage, 0);
      return () => clearTimeout(id);
    }
  }, [tableId, state.hiddenColumns, state.columnWidths]);

  // Save pin state (using requestIdleCallback to avoid blocking UI)
  useEffect(() => {
    if (!tableId || externalPinState || typeof localStorage === "undefined") return;

    const savePinState = () => {
      try {
        if (Object.keys(state.columnPinState).length > 0) {
          localStorage.setItem(
            getStorageKey(tableId, "pins"),
            JSON.stringify(state.columnPinState)
          );
        } else {
          localStorage.removeItem(getStorageKey(tableId, "pins"));
        }
      } catch (e) {
        console.warn("Failed to save DataTable pin state to localStorage:", e);
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(savePinState, { timeout: 1000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(savePinState, 0);
      return () => clearTimeout(id);
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
      sortState: externalSortState,
      filters: controlledFilters,
      search: searchValue,
      pinState: externalPinState,
      columnOrder: externalColumnOrder,
      selectedIds: externalSelectedIds,
      groupBy: externalGroupBy,
    }),
    [externalSortState, controlledFilters, searchValue, externalPinState, externalColumnOrder, externalSelectedIds, externalGroupBy]
  );

  const contextValue = useMemo<DataTableContextValue<T>>(
    () => ({
      state,
      dispatch,
      config,
      controlled,
      maxSortColumns,
      onSortChange,
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
      maxSortColumns,
      onSortChange,
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
    <I18nProvider locale={locale}>
      <DataTableContext.Provider value={contextValue as DataTableContextValue}>
        {children}
      </DataTableContext.Provider>
    </I18nProvider>
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
