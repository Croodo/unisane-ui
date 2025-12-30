"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type {
  DataTableContextValue,
  DataTableProviderProps,
  DataTableConfig,
} from "./types";
import { dataTableReducer, createInitialState } from "./reducer";
import type { PinPosition, SortDirection, Column } from "../types";
import { flattenColumns, hasColumnGroups } from "../types";

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
  initialPageSize,
  // Controlled props
  controlledSort,
  onSortChange,
  controlledFilters,
  onFilterChange,
  searchValue,
  onSearchChange,
  columnPinState: externalPinState,
  onColumnPinChange,
  selectedIds: externalSelectedIds,
  onSelectionChange,
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

  // ─── MOBILE DETECTION ──────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    dispatch({ type: "SET_MOBILE", isMobile: mediaQuery.matches });

    const handleChange = (e: MediaQueryListEvent) => {
      dispatch({ type: "SET_MOBILE", isMobile: e.matches });
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
      filters: controlledFilters,
      search: searchValue,
      pinState: externalPinState,
      selectedIds: externalSelectedIds,
    }),
    [controlledSort, controlledFilters, searchValue, externalPinState, externalSelectedIds]
  );

  const contextValue = useMemo<DataTableContextValue<T>>(
    () => ({
      state,
      dispatch,
      config,
      controlled,
      onSortChange,
      onFilterChange,
      onSearchChange,
      onColumnPinChange,
      onSelectionChange,
      onSelectAllFiltered,
      onPaginationChange,
    }),
    [
      state,
      config,
      controlled,
      onSortChange,
      onFilterChange,
      onSearchChange,
      onColumnPinChange,
      onSelectionChange,
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

// ─── SPECIALIZED HOOKS ──────────────────────────────────────────────────────

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

export function useSorting() {
  const { state, dispatch, controlled, onSortChange } = useDataTableContext();

  const sortKey = controlled.sort?.key ?? state.sortKey;
  const sortDirection = controlled.sort?.direction ?? state.sortDirection;

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

  const cycleSort = useCallback(
    (key: string) => {
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
    [sortKey, sortDirection, setSort]
  );

  return { sortKey, sortDirection, setSort, cycleSort };
}

export function useFiltering() {
  const { state, dispatch, controlled, onFilterChange, onSearchChange } =
    useDataTableContext();

  const searchText = controlled.search ?? state.searchText;
  const columnFilters = controlled.filters ?? state.columnFilters;

  const setSearch = useCallback(
    (value: string) => {
      if (controlled.search !== undefined) {
        onSearchChange?.(value);
      } else {
        dispatch({ type: "SET_SEARCH", value });
        onSearchChange?.(value);
      }
    },
    [controlled.search, onSearchChange, dispatch]
  );

  const setFilter = useCallback(
    (key: string, value: unknown) => {
      if (controlled.filters) {
        const next = { ...controlled.filters };
        if (
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete next[key];
        } else {
          next[key] = value;
        }
        onFilterChange?.(next);
      } else {
        dispatch({ type: "SET_FILTER", key, value });
        const next = { ...state.columnFilters };
        if (
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete next[key];
        } else {
          next[key] = value;
        }
        onFilterChange?.(next);
      }
    },
    [controlled.filters, onFilterChange, dispatch, state.columnFilters]
  );

  const removeFilter = useCallback(
    (key: string) => {
      if (controlled.filters) {
        const next = { ...controlled.filters };
        delete next[key];
        onFilterChange?.(next);
      } else {
        dispatch({ type: "REMOVE_FILTER", key });
        const next = { ...state.columnFilters };
        delete next[key];
        onFilterChange?.(next);
      }
    },
    [controlled.filters, onFilterChange, dispatch, state.columnFilters]
  );

  const clearAllFilters = useCallback(() => {
    dispatch({ type: "CLEAR_ALL_FILTERS" });
    onSearchChange?.("");
    onFilterChange?.({});
  }, [dispatch, onSearchChange, onFilterChange]);

  const activeFiltersCount =
    Object.keys(columnFilters).length + (searchText ? 1 : 0);

  return {
    searchText,
    columnFilters,
    setSearch,
    setFilter,
    removeFilter,
    clearAllFilters,
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
  };
}

export function usePagination() {
  const { state, dispatch, onPaginationChange } = useDataTableContext();

  const setPage = useCallback(
    (page: number) => {
      dispatch({ type: "SET_PAGE", page });
      onPaginationChange?.(page, state.pagination.pageSize);
    },
    [dispatch, onPaginationChange, state.pagination.pageSize]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      dispatch({ type: "SET_PAGE_SIZE", pageSize });
      // Page resets to 1 when page size changes
      onPaginationChange?.(1, pageSize);
    },
    [dispatch, onPaginationChange]
  );

  const nextPage = useCallback(() => {
    const newPage = state.pagination.page + 1;
    dispatch({ type: "NEXT_PAGE" });
    onPaginationChange?.(newPage, state.pagination.pageSize);
  }, [dispatch, onPaginationChange, state.pagination.page, state.pagination.pageSize]);

  const prevPage = useCallback(() => {
    const newPage = Math.max(1, state.pagination.page - 1);
    dispatch({ type: "PREV_PAGE" });
    onPaginationChange?.(newPage, state.pagination.pageSize);
  }, [dispatch, onPaginationChange, state.pagination.page, state.pagination.pageSize]);

  /**
   * Reset pagination to page 1 and notify parent.
   * Call this when sort/filter changes reset the page.
   */
  const resetPage = useCallback(() => {
    dispatch({ type: "SET_PAGE", page: 1 });
    onPaginationChange?.(1, state.pagination.pageSize);
  }, [dispatch, onPaginationChange, state.pagination.pageSize]);

  return {
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    resetPage,
  };
}

export function useColumns<T>() {
  const { state, dispatch, config, controlled, onColumnPinChange } =
    useDataTableContext<T>();

  const pinState = controlled.pinState ?? state.columnPinState;

  const toggleVisibility = useCallback(
    (key: string) => dispatch({ type: "TOGGLE_COLUMN_VISIBILITY", key }),
    [dispatch]
  );

  const hideColumn = useCallback(
    (key: string) => dispatch({ type: "HIDE_COLUMN", key }),
    [dispatch]
  );

  const showAllColumns = useCallback(
    () => dispatch({ type: "SHOW_ALL_COLUMNS" }),
    [dispatch]
  );

  const setColumnWidth = useCallback(
    (key: string, width: number) =>
      dispatch({ type: "SET_COLUMN_WIDTH", key, width }),
    [dispatch]
  );

  const resetColumnWidths = useCallback(
    () => dispatch({ type: "RESET_COLUMN_WIDTHS" }),
    [dispatch]
  );

  const setColumnPin = useCallback(
    (key: string, position: PinPosition) => {
      if (controlled.pinState) {
        onColumnPinChange?.(key, position);
      } else {
        dispatch({ type: "SET_COLUMN_PIN", key, position });
        onColumnPinChange?.(key, position);
      }
    },
    [controlled.pinState, onColumnPinChange, dispatch]
  );

  const resetColumnPins = useCallback(
    () => dispatch({ type: "RESET_COLUMN_PINS" }),
    [dispatch]
  );

  // Get effective pin position (user override > column definition)
  const getEffectivePinPosition = useCallback(
    (col: Column<T>) => {
      const key = String(col.key);
      if (pinState[key] !== undefined) {
        return pinState[key];
      }
      return col.pinned ?? null;
    },
    [pinState]
  );

  const visibleColumns = useMemo(
    () =>
      config.columns.filter((col) => !state.hiddenColumns.has(String(col.key))),
    [config.columns, state.hiddenColumns]
  );

  const pinnedLeftColumns = useMemo(
    () => visibleColumns.filter((col) => getEffectivePinPosition(col) === "left"),
    [visibleColumns, getEffectivePinPosition]
  );

  const pinnedRightColumns = useMemo(
    () => visibleColumns.filter((col) => getEffectivePinPosition(col) === "right"),
    [visibleColumns, getEffectivePinPosition]
  );

  const unpinnedColumns = useMemo(
    () => visibleColumns.filter((col) => getEffectivePinPosition(col) === null),
    [visibleColumns, getEffectivePinPosition]
  );

  return {
    columns: config.columns,
    visibleColumns,
    pinnedLeftColumns,
    pinnedRightColumns,
    unpinnedColumns,
    hiddenColumns: state.hiddenColumns,
    columnWidths: state.columnWidths,
    pinState,
    toggleVisibility,
    hideColumn,
    showAllColumns,
    setColumnWidth,
    resetColumnWidths,
    setColumnPin,
    resetColumnPins,
    getEffectivePinPosition,
    getColumnWidth: (key: string, defaultWidth: number = 150) =>
      state.columnWidths[key] ?? defaultWidth,
  };
}

export function useTableUI() {
  const { state, dispatch, config } = useDataTableContext();

  const resetAll = useCallback(
    () => dispatch({ type: "RESET_ALL" }),
    [dispatch]
  );

  return {
    isMobile: state.isMobile,
    config,
    resetAll,
    hasCustomizations:
      Object.keys(state.columnPinState).length > 0 ||
      Object.keys(state.columnWidths).length > 0 ||
      state.hiddenColumns.size > 0,
  };
}
