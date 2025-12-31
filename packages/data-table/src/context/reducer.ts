import type { DataTableState, DataTableAction } from "./types";
import type { SortDirection, MultiSortState } from "../types/index";
import { DEFAULT_PAGE_SIZE } from "../constants/index";

export function createInitialState(options?: {
  pageSize?: number;
}): DataTableState {
  return {
    selectedRows: new Set(),
    expandedRows: new Set(),
    sortKey: null,
    sortDirection: null,
    sortState: [],
    searchText: "",
    columnFilters: {},
    pagination: {
      page: 1,
      pageSize: options?.pageSize ?? DEFAULT_PAGE_SIZE,
    },
    hiddenColumns: new Set(),
    columnWidths: {},
    columnPinState: {},
    columnOrder: [],
    isMobile: false,
    // Row Grouping
    groupBy: null,
    expandedGroups: new Set(),
  };
}

function cycleSort(currentKey: string | null, currentDir: SortDirection, newKey: string): { key: string | null; direction: SortDirection } {
  if (currentKey !== newKey) {
    return { key: newKey, direction: "asc" };
  }

  // Cycle: asc -> desc -> null
  if (currentDir === "asc") {
    return { key: newKey, direction: "desc" };
  }
  if (currentDir === "desc") {
    return { key: null, direction: null };
  }
  return { key: newKey, direction: "asc" };
}

/**
 * Add or cycle a sort column in multi-sort mode
 * - If column not in sort state: add as asc
 * - If column already asc: change to desc
 * - If column already desc: remove from sort state
 */
function addOrCycleMultiSort(
  currentState: MultiSortState,
  key: string,
  maxColumns: number = 3
): MultiSortState {
  const existingIndex = currentState.findIndex((s) => s.key === key);

  if (existingIndex === -1) {
    // Column not in sort state - add as asc (respecting max)
    const newState = [...currentState, { key, direction: "asc" as const }];
    // If exceeds max, remove the oldest sort
    if (newState.length > maxColumns) {
      return newState.slice(-maxColumns);
    }
    return newState;
  }

  const existing = currentState[existingIndex]!;

  if (existing.direction === "asc") {
    // Change to desc
    const newState = [...currentState];
    newState[existingIndex] = { key, direction: "desc" };
    return newState;
  }

  // Direction is desc - remove from sort state
  return currentState.filter((_, i) => i !== existingIndex);
}

/**
 * Sync sortState to legacy sortKey/sortDirection (first item in array)
 */
function syncLegacySort(sortState: MultiSortState): { key: string | null; direction: SortDirection } {
  if (sortState.length === 0) {
    return { key: null, direction: null };
  }
  const first = sortState[0]!;
  return { key: first.key, direction: first.direction };
}

export function dataTableReducer(
  state: DataTableState,
  action: DataTableAction
): DataTableState {
  switch (action.type) {
    // ─── SELECTION ───────────────────────────────────────────────────────────
    case "SELECT_ROW": {
      const next = new Set(state.selectedRows);
      next.add(action.id);
      return { ...state, selectedRows: next };
    }

    case "DESELECT_ROW": {
      const next = new Set(state.selectedRows);
      next.delete(action.id);
      return { ...state, selectedRows: next };
    }

    case "TOGGLE_SELECT": {
      const next = new Set(state.selectedRows);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return { ...state, selectedRows: next };
    }

    case "SELECT_ALL":
      return { ...state, selectedRows: new Set(action.ids) };

    case "DESELECT_ALL":
      return { ...state, selectedRows: new Set() };

    case "TOGGLE_EXPAND": {
      const next = new Set(state.expandedRows);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return { ...state, expandedRows: next };
    }

    case "EXPAND_ROW": {
      const next = new Set(state.expandedRows);
      next.add(action.id);
      return { ...state, expandedRows: next };
    }

    case "COLLAPSE_ROW": {
      const next = new Set(state.expandedRows);
      next.delete(action.id);
      return { ...state, expandedRows: next };
    }

    // ─── SORTING (Single-sort for backward compatibility) ─────────────────────
    case "SET_SORT": {
      // Also update sortState to stay in sync
      const sortState: MultiSortState =
        action.key && action.direction
          ? [{ key: action.key, direction: action.direction }]
          : [];
      return {
        ...state,
        sortKey: action.key,
        sortDirection: action.direction,
        sortState,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    case "CYCLE_SORT": {
      const { key, direction } = cycleSort(state.sortKey, state.sortDirection, action.key);
      // Also update sortState to stay in sync
      const sortState: MultiSortState =
        key && direction ? [{ key, direction }] : [];
      return {
        ...state,
        sortKey: key,
        sortDirection: direction,
        sortState,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    // ─── MULTI-SORT ───────────────────────────────────────────────────────────
    case "SET_MULTI_SORT": {
      const { key, direction } = syncLegacySort(action.sortState);
      return {
        ...state,
        sortState: action.sortState,
        sortKey: key,
        sortDirection: direction,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    case "ADD_SORT": {
      const newSortState = addOrCycleMultiSort(
        state.sortState,
        action.key,
        action.maxColumns ?? 3
      );
      const { key, direction } = syncLegacySort(newSortState);
      return {
        ...state,
        sortState: newSortState,
        sortKey: key,
        sortDirection: direction,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    case "REMOVE_SORT": {
      const newSortState = state.sortState.filter((s) => s.key !== action.key);
      const { key, direction } = syncLegacySort(newSortState);
      return {
        ...state,
        sortState: newSortState,
        sortKey: key,
        sortDirection: direction,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    case "CLEAR_SORT":
      return {
        ...state,
        sortState: [],
        sortKey: null,
        sortDirection: null,
        pagination: { ...state.pagination, page: 1 },
      };

    // ─── FILTERING ───────────────────────────────────────────────────────────
    case "SET_SEARCH":
      return {
        ...state,
        searchText: action.value,
        pagination: { ...state.pagination, page: 1 },
      };

    case "SET_FILTER": {
      const next = { ...state.columnFilters };
      const value = action.value;

      // Remove empty filters
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete next[action.key];
      } else {
        next[action.key] = value;
      }

      return {
        ...state,
        columnFilters: next,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    case "REMOVE_FILTER": {
      const next = { ...state.columnFilters };
      delete next[action.key];
      return {
        ...state,
        columnFilters: next,
        pagination: { ...state.pagination, page: 1 },
      };
    }

    case "CLEAR_ALL_FILTERS":
      return {
        ...state,
        searchText: "",
        columnFilters: {},
        pagination: { ...state.pagination, page: 1 },
      };

    // ─── PAGINATION ──────────────────────────────────────────────────────────
    case "SET_PAGE":
      return {
        ...state,
        pagination: { ...state.pagination, page: action.page },
      };

    case "SET_PAGE_SIZE":
      return {
        ...state,
        pagination: { page: 1, pageSize: action.pageSize },
      };

    case "NEXT_PAGE":
      return {
        ...state,
        pagination: { ...state.pagination, page: state.pagination.page + 1 },
      };

    case "PREV_PAGE":
      return {
        ...state,
        pagination: { ...state.pagination, page: Math.max(1, state.pagination.page - 1) },
      };

    // ─── COLUMNS ─────────────────────────────────────────────────────────────
    case "TOGGLE_COLUMN_VISIBILITY": {
      const next = new Set(state.hiddenColumns);
      if (next.has(action.key)) {
        next.delete(action.key);
      } else {
        next.add(action.key);
      }
      return { ...state, hiddenColumns: next };
    }

    case "HIDE_COLUMN": {
      const next = new Set(state.hiddenColumns);
      next.add(action.key);
      return { ...state, hiddenColumns: next };
    }

    case "SHOW_ALL_COLUMNS":
      return { ...state, hiddenColumns: new Set() };

    case "SET_COLUMN_WIDTH":
      return {
        ...state,
        columnWidths: { ...state.columnWidths, [action.key]: action.width },
      };

    case "RESET_COLUMN_WIDTHS":
      return { ...state, columnWidths: {} };

    case "SET_COLUMN_PIN":
      if (action.position === null) {
        const next = { ...state.columnPinState };
        delete next[action.key];
        return { ...state, columnPinState: next };
      }
      return {
        ...state,
        columnPinState: { ...state.columnPinState, [action.key]: action.position },
      };

    case "RESET_COLUMN_PINS":
      return { ...state, columnPinState: {} };

    case "SET_COLUMN_ORDER":
      return { ...state, columnOrder: action.order };

    // ─── ROW GROUPING ─────────────────────────────────────────────────────────
    case "SET_GROUP_BY":
      return {
        ...state,
        groupBy: action.key,
        expandedGroups: new Set(), // Reset expanded state when changing groupBy
      };

    case "ADD_GROUP_BY": {
      // Add a column to multi-level grouping
      const currentGroupBy = state.groupBy;
      let newGroupBy: string[];

      if (currentGroupBy === null) {
        newGroupBy = [action.key];
      } else if (Array.isArray(currentGroupBy)) {
        // Don't add if already present
        if (currentGroupBy.includes(action.key)) {
          return state;
        }
        newGroupBy = [...currentGroupBy, action.key];
      } else {
        // Single string, convert to array
        if (currentGroupBy === action.key) {
          return state;
        }
        newGroupBy = [currentGroupBy, action.key];
      }

      return {
        ...state,
        groupBy: newGroupBy,
        expandedGroups: new Set(), // Reset expanded state when adding groupBy
      };
    }

    case "REMOVE_GROUP_BY": {
      const currentGroupBy = state.groupBy;

      if (currentGroupBy === null) {
        return state;
      }

      if (Array.isArray(currentGroupBy)) {
        const newGroupBy = currentGroupBy.filter((k) => k !== action.key);
        return {
          ...state,
          groupBy: newGroupBy.length === 0 ? null : newGroupBy.length === 1 ? newGroupBy[0]! : newGroupBy,
          expandedGroups: new Set(),
        };
      }

      // Single string
      if (currentGroupBy === action.key) {
        return {
          ...state,
          groupBy: null,
          expandedGroups: new Set(),
        };
      }

      return state;
    }

    case "TOGGLE_GROUP_EXPAND": {
      const next = new Set(state.expandedGroups);
      if (next.has(action.groupId)) {
        next.delete(action.groupId);
      } else {
        next.add(action.groupId);
      }
      return { ...state, expandedGroups: next };
    }

    case "EXPAND_ALL_GROUPS":
      return { ...state, expandedGroups: new Set(action.groupIds) };

    case "COLLAPSE_ALL_GROUPS":
      return { ...state, expandedGroups: new Set() };

    // ─── UI ──────────────────────────────────────────────────────────────────
    case "SET_MOBILE":
      return { ...state, isMobile: action.isMobile };

    // ─── BULK ────────────────────────────────────────────────────────────────
    case "RESET_ALL": {
      const initial = createInitialState({ pageSize: state.pagination.pageSize });
      return { ...initial, sortState: [] };
    }

    case "HYDRATE":
      return { ...state, ...action.state };

    default:
      return state;
  }
}
