"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  startTransition,
} from "react";
import type {
  DataTableContextValue,
  DataTableProviderProps,
  DataTableConfig,
  DataTableCallbacks,
  SelectionSlice,
  SortSlice,
  FilterSlice,
  PaginationSlice,
  ColumnSlice,
  GroupingSlice,
  StateSlices,
} from "./types";
import { dataTableReducer, createInitialState } from "./reducer";
import { flattenColumns, hasColumnGroups } from "../types/index";
import { I18nProvider } from "../i18n/index";
import { FeedbackProvider } from "../feedback";

// ─── CONTEXT ────────────────────────────────────────────────────────────────

// Context uses `unknown` as default type parameter - consumers use useDataTableContext<T>() to get typed access
const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

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
  rowSelectionEnabled = false,
  showColumnDividers,
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
  sparseSelection,
  onPaginationChange,
  onColumnVisibilityChange,
  onScroll,
  onError,
  locale,
  dir = "ltr",
  // Feedback
  enableFeedback = true,
  disableToasts = false,
  disableAnnouncements = false,
}: DataTableProviderProps<T>) {
  // Default showColumnDividers based on variant if not explicitly set
  const effectiveShowColumnDividers = showColumnDividers ?? (variant === "grid");

  // Flatten columns and check for groups
  const flatColumns = useMemo(() => flattenColumns(columns), [columns]);
  const hasGroups = useMemo(() => hasColumnGroups(columns), [columns]);

  // Validate columns on mount/change and warn about issues (development only)
  useEffect(() => {
    // Skip validation in production for performance
    if (process.env.NODE_ENV === "production") return;

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
      rowSelectionEnabled,
      showColumnDividers: effectiveShowColumnDividers,
      zebra,
      stickyHeader,
      resizable,
      pinnable,
      reorderable,
      groupingEnabled,
      showSummary,
      summaryLabel,
      dir,
    }),
    [
      tableId,
      columns,
      flatColumns,
      hasGroups,
      mode,
      paginationMode,
      variant,
      rowSelectionEnabled,
      effectiveShowColumnDividers,
      zebra,
      stickyHeader,
      resizable,
      pinnable,
      reorderable,
      groupingEnabled,
      showSummary,
      summaryLabel,
      dir,
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

  // Sync external selection to internal state using startTransition
  // to prevent flickering on rapid updates (fixes race condition)
  useEffect(() => {
    if (externalSelectedIds !== undefined) {
      startTransition(() => {
        dispatch({ type: "SELECT_ALL", ids: externalSelectedIds });
      });
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
      sparseSelection,
    }),
    [externalSortState, controlledFilters, searchValue, externalPinState, externalColumnOrder, externalSelectedIds, externalGroupBy, sparseSelection]
  );

  // ─── MEMOIZED STATE SLICES ─────────────────────────────────────────────────
  // Each slice only updates when its specific state changes, preventing
  // unnecessary re-renders in components that use specialized hooks.

  const selectionSlice = useMemo<SelectionSlice>(
    () => ({
      selectedRows: state.selectedRows,
      expandedRows: state.expandedRows,
    }),
    [state.selectedRows, state.expandedRows]
  );

  const sortSlice = useMemo<SortSlice>(
    () => ({
      sortState: state.sortState,
    }),
    [state.sortState]
  );

  const filterSlice = useMemo<FilterSlice>(
    () => ({
      searchText: state.searchText,
      columnFilters: state.columnFilters,
    }),
    [state.searchText, state.columnFilters]
  );

  const paginationSlice = useMemo<PaginationSlice>(
    () => ({
      pagination: state.pagination,
    }),
    [state.pagination]
  );

  const columnSlice = useMemo<ColumnSlice>(
    () => ({
      hiddenColumns: state.hiddenColumns,
      columnWidths: state.columnWidths,
      columnPinState: state.columnPinState,
      columnOrder: state.columnOrder,
    }),
    [state.hiddenColumns, state.columnWidths, state.columnPinState, state.columnOrder]
  );

  const groupingSlice = useMemo<GroupingSlice>(
    () => ({
      groupBy: state.groupBy,
      expandedGroups: state.expandedGroups,
    }),
    [state.groupBy, state.expandedGroups]
  );

  // Combine slices into a single object for the context
  const stateSlices = useMemo<StateSlices>(
    () => ({
      selection: selectionSlice,
      sort: sortSlice,
      filter: filterSlice,
      pagination: paginationSlice,
      column: columnSlice,
      grouping: groupingSlice,
    }),
    [selectionSlice, sortSlice, filterSlice, paginationSlice, columnSlice, groupingSlice]
  );

  // Store callbacks in refs for stable references
  // Updated synchronously during render (refs don't trigger re-renders)
  const callbacksRef = useRef<DataTableCallbacks>({
    onSortChange,
    onFilterChange,
    onSearchChange,
    onColumnPinChange,
    onColumnOrderChange,
    onSelectionChange,
    onGroupByChange,
    onSelectAllFiltered,
    onPaginationChange,
    onColumnVisibilityChange,
    onScroll,
    onError,
  });

  // Update ref synchronously during render - safe because refs don't trigger re-renders
  // This pattern ensures callbacks are always fresh without useEffect overhead
  callbacksRef.current = {
    onSortChange,
    onFilterChange,
    onSearchChange,
    onColumnPinChange,
    onColumnOrderChange,
    onSelectionChange,
    onGroupByChange,
    onSelectAllFiltered,
    onPaginationChange,
    onColumnVisibilityChange,
    onScroll,
    onError,
  };

  // Stable callback getters that don't change reference
  const getCallbacks = useCallback(() => callbacksRef.current, []);

  const contextValue = useMemo<DataTableContextValue<T>>(
    () => ({
      state,
      stateSlices,
      dispatch,
      config,
      controlled,
      maxSortColumns,
      // Include direct callback references for backward compatibility
      onSortChange: callbacksRef.current.onSortChange,
      onFilterChange: callbacksRef.current.onFilterChange,
      onSearchChange: callbacksRef.current.onSearchChange,
      onColumnPinChange: callbacksRef.current.onColumnPinChange,
      onColumnOrderChange: callbacksRef.current.onColumnOrderChange,
      onSelectionChange: callbacksRef.current.onSelectionChange,
      onGroupByChange: callbacksRef.current.onGroupByChange,
      onSelectAllFiltered: callbacksRef.current.onSelectAllFiltered,
      onPaginationChange: callbacksRef.current.onPaginationChange,
      onColumnVisibilityChange: callbacksRef.current.onColumnVisibilityChange,
      onScroll: callbacksRef.current.onScroll,
      onError: callbacksRef.current.onError,
      // Getter for stable callback access
      getCallbacks,
    }),
    [
      state,
      stateSlices,
      config,
      controlled,
      maxSortColumns,
      getCallbacks,
    ]
  );

  // Note: We cast to DataTableContextValue<unknown> because React Context doesn't support generics.
  // The generic type T is preserved through useDataTableContext<T>() which casts back.
  // This is a safe cast because:
  // 1. T extends { id: string } constraint is maintained
  // 2. All T-dependent operations go through typed hooks (useColumns<T>, etc.)
  // 3. The context consumer (useDataTableContext<T>) restores the correct type
  const tableContent = (
    <DataTableContext.Provider value={contextValue as DataTableContextValue<unknown>}>
      {children}
    </DataTableContext.Provider>
  );

  // Wrap with FeedbackProvider if feedback is enabled
  // FeedbackProvider must be inside I18nProvider because it uses useI18n()
  const contentWithFeedback = enableFeedback ? (
    <FeedbackProvider
      disabled={!enableFeedback}
      disableToasts={disableToasts}
      disableAnnouncements={disableAnnouncements}
    >
      {tableContent}
    </FeedbackProvider>
  ) : (
    tableContent
  );

  // I18nProvider must be the outermost wrapper
  return <I18nProvider locale={locale}>{contentWithFeedback}</I18nProvider>;
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
