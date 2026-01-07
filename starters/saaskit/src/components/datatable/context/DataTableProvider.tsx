"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type {
  DataTableState,
  DataTableAction,
  DataTableContextValue,
  DataTableProviderProps,
  DataTableConfig,
  DensityLevel,
} from "./types";
import { dataTableReducer, createInitialState } from "./reducer";
import type { PinPosition, FilterState, SortDirection } from "../types";

const DataTableContext = createContext<DataTableContextValue | null>(null);

export function DataTableProvider<T extends { id: string }>({
  children,
  tableId,
  columns,
  mode = "local",
  paginationMode = "page",
  variant = "list",
  selectable,
  showColumnBorders,
  zebra = false,
  compact,
  initialPageSize,
  cursorLimit,
  config: configOverride,
  // Controlled props
  controlledSort,
  onSortChange,
  controlledFilters,
  onFiltersChange,
  searchValue,
  onSearchChange,
  columnPinState: externalPinState,
  onColumnPinChange,
}: DataTableProviderProps<T>) {
  // Compute effective variant settings
  const effectiveSelectable = selectable ?? variant === "grid";
  const effectiveColumnBorders = showColumnBorders ?? variant !== "log";
  const effectiveCompact = compact ?? variant === "log";

  const config: DataTableConfig<T> = useMemo(
    () => ({
      tableId,
      columns,
      mode,
      paginationMode,
      variant,
      selectable: effectiveSelectable,
      showColumnBorders: effectiveColumnBorders,
      zebra,
      compact: effectiveCompact,
    }),
    [
      tableId,
      columns,
      mode,
      paginationMode,
      variant,
      effectiveSelectable,
      effectiveColumnBorders,
      zebra,
      effectiveCompact,
    ]
  );

  const [state, dispatch] = useReducer(
    dataTableReducer<T>,
    { pageSize: initialPageSize },
    createInitialState
  );

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!tableId) return;

    const saved = localStorage.getItem(`datatable_settings_${tableId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.density) {
          dispatch({
            type: "SET_DENSITY",
            density: parsed.density as DensityLevel,
          });
        }
        if (parsed.hiddenColumns) {
          parsed.hiddenColumns.forEach((key: string) => {
            dispatch({ type: "TOGGLE_COLUMN_VISIBILITY", key });
          });
        }
        if (parsed.columnWidths) {
          Object.entries(parsed.columnWidths).forEach(([key, width]) => {
            dispatch({ type: "SET_COLUMN_WIDTH", key, width: width as number });
          });
        }
      } catch (e) {
        console.error("Failed to load table settings:", e);
      }
    }

    // Load pin state separately
    if (!externalPinState) {
      const savedPins = localStorage.getItem(`datatable-pins-${tableId}`);
      if (savedPins) {
        try {
          const parsed = JSON.parse(savedPins);
          Object.entries(parsed).forEach(([key, position]) => {
            dispatch({
              type: "SET_COLUMN_PIN",
              key,
              position: position as PinPosition,
            });
          });
        } catch (e) {
          console.error("Failed to load pin state:", e);
        }
      }
    }
  }, [tableId, externalPinState]);

  // Save settings to localStorage on change
  useEffect(() => {
    if (!tableId) return;

    const settings = {
      density: state.density,
      hiddenColumns: Array.from(state.hiddenColumns),
      columnWidths: state.columnWidths,
    };
    localStorage.setItem(
      `datatable_settings_${tableId}`,
      JSON.stringify(settings)
    );
  }, [tableId, state.density, state.hiddenColumns, state.columnWidths]);

  // Save pin state separately
  useEffect(() => {
    if (!tableId || externalPinState) return;

    if (Object.keys(state.columnPinState).length > 0) {
      localStorage.setItem(
        `datatable-pins-${tableId}`,
        JSON.stringify(state.columnPinState)
      );
    } else {
      localStorage.removeItem(`datatable-pins-${tableId}`);
    }
  }, [tableId, state.columnPinState, externalPinState]);

  // Track mobile screen size
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

  // Merge controlled state with internal state
  const controlled = useMemo(
    () => ({
      sort: controlledSort,
      filters: controlledFilters,
      search: searchValue,
      pinState: externalPinState,
    }),
    [controlledSort, controlledFilters, searchValue, externalPinState]
  );

  const contextValue = useMemo<DataTableContextValue<T>>(
    () => ({
      state: state as DataTableState<T>,
      dispatch,
      config,
      controlled,
      onSortChange,
      onFiltersChange,
      onSearchChange,
      onPinChange: onColumnPinChange,
    }),
    [
      state,
      config,
      controlled,
      onSortChange,
      onFiltersChange,
      onSearchChange,
      onColumnPinChange,
    ]
  );

  return (
    <DataTableContext.Provider value={contextValue as DataTableContextValue}>
      {children}
    </DataTableContext.Provider>
  );
}

// Base hook for accessing context
export function useDataTableContext<T = unknown>(): DataTableContextValue<T> {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error(
      "useDataTableContext must be used within a DataTableProvider"
    );
  }
  return context as DataTableContextValue<T>;
}

// Specialized hooks for cleaner access
export function useSelection() {
  const { state, dispatch } = useDataTableContext();

  const selectRow = useCallback(
    (id: string) => dispatch({ type: "SELECT_ROW", id }),
    [dispatch]
  );

  const deselectRow = useCallback(
    (id: string) => dispatch({ type: "DESELECT_ROW", id }),
    [dispatch]
  );

  const selectAll = useCallback(
    (ids: string[]) => dispatch({ type: "SELECT_ALL", ids }),
    [dispatch]
  );

  const deselectAll = useCallback(
    () => dispatch({ type: "DESELECT_ALL" }),
    [dispatch]
  );

  const toggleExpand = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_EXPAND", id }),
    [dispatch]
  );

  return {
    selectedRows: state.selectedRows,
    expandedRows: state.expandedRows,
    selectRow,
    deselectRow,
    selectAll,
    deselectAll,
    toggleExpand,
  };
}

export function useSorting() {
  const { state, dispatch, controlled, onSortChange } = useDataTableContext();

  // Use controlled state if provided, otherwise internal
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
      let nextDir: SortDirection = "asc";
      let nextKey: string | null = key;

      if (sortKey === key) {
        nextDir =
          sortDirection === "asc"
            ? "desc"
            : sortDirection === "desc"
              ? null
              : "asc";
        if (sortDirection === "desc") nextKey = null;
      }

      setSort(nextKey, nextDir);
    },
    [sortKey, sortDirection, setSort]
  );

  return { sortKey, sortDirection, setSort, cycleSort };
}

export function useFiltering() {
  const { state, dispatch, controlled, onFiltersChange, onSearchChange } =
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
        onFiltersChange?.(next);
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
        onFiltersChange?.(next);
      }
    },
    [controlled.filters, onFiltersChange, dispatch, state.columnFilters]
  );

  const removeFilter = useCallback(
    (key: string) => {
      if (controlled.filters) {
        const next = { ...controlled.filters };
        delete next[key];
        onFiltersChange?.(next);
      } else {
        dispatch({ type: "REMOVE_FILTER", key });
        const next = { ...state.columnFilters };
        delete next[key];
        onFiltersChange?.(next);
      }
    },
    [controlled.filters, onFiltersChange, dispatch, state.columnFilters]
  );

  const clearAllFilters = useCallback(() => {
    dispatch({ type: "CLEAR_ALL_FILTERS" });
    onSearchChange?.("");
    onFiltersChange?.({});
  }, [dispatch, onSearchChange, onFiltersChange]);

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
  };
}

export function usePagination() {
  const { state, dispatch } = useDataTableContext();

  const setPage = useCallback(
    (page: number) => dispatch({ type: "SET_PAGE", page }),
    [dispatch]
  );

  const setPageSize = useCallback(
    (pageSize: number) => dispatch({ type: "SET_PAGE_SIZE", pageSize }),
    [dispatch]
  );

  return {
    pagination: state.pagination,
    setPage,
    setPageSize,
  };
}

export function useColumns() {
  const { state, dispatch, config, controlled, onPinChange } =
    useDataTableContext();

  const pinState = controlled.pinState ?? state.columnPinState;

  const toggleVisibility = useCallback(
    (key: string) => dispatch({ type: "TOGGLE_COLUMN_VISIBILITY", key }),
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
        onPinChange?.(key, position);
      } else {
        dispatch({ type: "SET_COLUMN_PIN", key, position });
        onPinChange?.(key, position);
      }
    },
    [controlled.pinState, onPinChange, dispatch]
  );

  const resetColumnPins = useCallback(
    () => dispatch({ type: "RESET_COLUMN_PINS" }),
    [dispatch]
  );

  // Get effective pin state (user override > static config)
  const getEffectivePinState = useCallback(
    (col: { key: string; pinned?: "left" | "right" | undefined }) => {
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

  return {
    columns: config.columns,
    visibleColumns,
    hiddenColumns: state.hiddenColumns,
    columnWidths: state.columnWidths,
    pinState,
    toggleVisibility,
    showAllColumns,
    setColumnWidth,
    resetColumnWidths,
    setColumnPin,
    resetColumnPins,
    getEffectivePinState,
  };
}

export function useTableUI() {
  const { state, dispatch, config } = useDataTableContext();

  const setDensity = useCallback(
    (density: DensityLevel) => dispatch({ type: "SET_DENSITY", density }),
    [dispatch]
  );

  const resetAll = useCallback(
    () => dispatch({ type: "RESET_ALL" }),
    [dispatch]
  );

  return {
    density: state.density,
    isMobile: state.isMobile,
    config,
    setDensity,
    resetAll,
  };
}
