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
import type { PinPosition, SortDirection, MultiSortState, Column } from "../types";
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
  reorderable = false,
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
      sortState: controlledSortState,
      filters: controlledFilters,
      search: searchValue,
      pinState: externalPinState,
      columnOrder: externalColumnOrder,
      selectedIds: externalSelectedIds,
    }),
    [controlledSort, controlledSortState, controlledFilters, searchValue, externalPinState, externalColumnOrder, externalSelectedIds]
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
  const {
    state,
    dispatch,
    controlled,
    multiSort: multiSortEnabled,
    maxSortColumns,
    onSortChange,
    onMultiSortChange,
  } = useDataTableContext();

  // Legacy single-sort values (for backward compatibility)
  const sortKey = controlled.sort?.key ?? state.sortKey;
  const sortDirection = controlled.sort?.direction ?? state.sortDirection;

  // Multi-sort state (ensure always an array)
  const sortState: MultiSortState = controlled.sortState ?? state.sortState ?? [];

  // Legacy single-sort setter
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

  // Multi-sort setter
  const setMultiSort = useCallback(
    (newSortState: MultiSortState) => {
      if (controlled.sortState) {
        onMultiSortChange?.(newSortState);
      } else {
        dispatch({ type: "SET_MULTI_SORT", sortState: newSortState });
        onMultiSortChange?.(newSortState);
      }

      // Also notify legacy callback with primary sort
      if (newSortState.length > 0) {
        const primary = newSortState[0]!;
        onSortChange?.(primary.key, primary.direction);
      } else {
        onSortChange?.(null, null);
      }
    },
    [controlled.sortState, onMultiSortChange, onSortChange, dispatch]
  );

  // Add or cycle a column in multi-sort (Shift+Click behavior)
  const addSort = useCallback(
    (key: string) => {
      if (controlled.sortState) {
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
        onMultiSortChange?.(newState);
        // Notify legacy callback
        if (newState.length > 0) {
          const primary = newState[0]!;
          onSortChange?.(primary.key, primary.direction);
        } else {
          onSortChange?.(null, null);
        }
      } else {
        dispatch({ type: "ADD_SORT", key, maxColumns: maxSortColumns });
        // Callbacks will be handled by the state change
      }
    },
    [controlled.sortState, onMultiSortChange, onSortChange, dispatch, maxSortColumns]
  );

  // Remove a column from multi-sort
  const removeSort = useCallback(
    (key: string) => {
      if (controlled.sortState) {
        const newState = controlled.sortState.filter((s) => s.key !== key);
        onMultiSortChange?.(newState);
        if (newState.length > 0) {
          const primary = newState[0]!;
          onSortChange?.(primary.key, primary.direction);
        } else {
          onSortChange?.(null, null);
        }
      } else {
        dispatch({ type: "REMOVE_SORT", key });
      }
    },
    [controlled.sortState, onMultiSortChange, onSortChange, dispatch]
  );

  // Clear all sorts
  const clearSort = useCallback(() => {
    if (controlled.sortState) {
      onMultiSortChange?.([]);
      onSortChange?.(null, null);
    } else {
      dispatch({ type: "CLEAR_SORT" });
      onSortChange?.(null, null);
      onMultiSortChange?.([]);
    }
  }, [controlled.sortState, onMultiSortChange, onSortChange, dispatch]);

  // Unified cycle sort that respects multiSort mode
  const cycleSort = useCallback(
    (key: string, addToMultiSort: boolean = false) => {
      // If multiSort enabled and Shift held (addToMultiSort), use multi-sort
      if (multiSortEnabled && addToMultiSort) {
        addSort(key);
        return;
      }

      // In multi-sort mode, check sortState for current column state
      if (multiSortEnabled) {
        const currentSort = sortState.find((s) => s.key === key);

        if (!currentSort) {
          // Not sorted - start with asc
          setMultiSort([{ key, direction: "asc" }]);
        } else if (currentSort.direction === "asc") {
          // Currently asc - change to desc
          setMultiSort([{ key, direction: "desc" }]);
        } else {
          // Currently desc - clear sort
          clearSort();
        }
        return;
      }

      // Legacy single-sort behavior
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
    [multiSortEnabled, sortKey, sortDirection, sortState, addSort, setSort, setMultiSort, clearSort]
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

  return {
    // Legacy single-sort (backward compatible)
    sortKey,
    sortDirection,
    setSort,
    // Multi-sort
    sortState,
    setMultiSort,
    addSort,
    removeSort,
    clearSort,
    // Unified
    cycleSort,
    getSortInfo,
    // Config
    multiSortEnabled,
    maxSortColumns,
  };
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
  const { state, dispatch, config, controlled, onColumnPinChange, onColumnOrderChange } =
    useDataTableContext<T>();

  const pinState = controlled.pinState ?? state.columnPinState;
  const columnOrder = controlled.columnOrder ?? state.columnOrder;

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

  // Column order management
  const setColumnOrder = useCallback(
    (order: string[]) => {
      if (controlled.columnOrder) {
        onColumnOrderChange?.(order);
      } else {
        dispatch({ type: "SET_COLUMN_ORDER", order });
        onColumnOrderChange?.(order);
      }
    },
    [controlled.columnOrder, onColumnOrderChange, dispatch]
  );

  // Move a column from one index to another
  const reorderColumn = useCallback(
    (fromKey: string, toKey: string) => {
      // Get current column keys in order
      const currentOrder = columnOrder.length > 0
        ? columnOrder
        : config.columns.map((col) => String(col.key));

      const fromIndex = currentOrder.indexOf(fromKey);
      const toIndex = currentOrder.indexOf(toKey);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return;
      }

      // Create new order array
      const newOrder = [...currentOrder];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed!);

      setColumnOrder(newOrder);
    },
    [columnOrder, config.columns, setColumnOrder]
  );

  const resetColumnOrder = useCallback(
    () => {
      if (controlled.columnOrder) {
        onColumnOrderChange?.([]);
      } else {
        dispatch({ type: "SET_COLUMN_ORDER", order: [] });
        onColumnOrderChange?.([]);
      }
    },
    [controlled.columnOrder, onColumnOrderChange, dispatch]
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

  // Visible columns - respects column order if set
  const visibleColumns = useMemo(() => {
    const visible = config.columns.filter(
      (col) => !state.hiddenColumns.has(String(col.key))
    );

    // If no custom order, return default order
    if (columnOrder.length === 0) {
      return visible;
    }

    // Sort by column order
    const orderMap = new Map(columnOrder.map((key, index) => [key, index]));
    return [...visible].sort((a, b) => {
      const aIndex = orderMap.get(String(a.key)) ?? Infinity;
      const bIndex = orderMap.get(String(b.key)) ?? Infinity;
      return aIndex - bIndex;
    });
  }, [config.columns, state.hiddenColumns, columnOrder]);

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
    columnOrder,
    toggleVisibility,
    hideColumn,
    showAllColumns,
    setColumnWidth,
    resetColumnWidths,
    setColumnPin,
    resetColumnPins,
    setColumnOrder,
    reorderColumn,
    resetColumnOrder,
    getEffectivePinPosition,
    getColumnWidth: (key: string, defaultWidth: number = 150) =>
      state.columnWidths[key] ?? defaultWidth,
    reorderable: config.reorderable,
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
