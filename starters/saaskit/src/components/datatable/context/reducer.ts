import type { DataTableState, DataTableAction, DensityLevel } from "./types";
import { DEFAULT_PAGE_SIZE } from "../constants";

export function createInitialState<T>(opts?: {
  pageSize?: number | undefined;
  density?: DensityLevel | undefined;
}): DataTableState<T> {
  return {
    selectedRows: new Set(),
    expandedRows: new Set(),
    sortKey: null,
    sortDirection: null,
    searchText: "",
    columnFilters: {},
    pagination: {
      page: 1,
      pageSize: opts?.pageSize ?? DEFAULT_PAGE_SIZE,
    },
    hiddenColumns: new Set(),
    columnWidths: {},
    columnPinState: {},
    density: opts?.density ?? "standard",
    isMobile: false,
  };
}

export function dataTableReducer<T>(
  state: DataTableState<T>,
  action: DataTableAction
): DataTableState<T> {
  switch (action.type) {
    // Selection
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
    case "SELECT_ALL": {
      return { ...state, selectedRows: new Set(action.ids) };
    }
    case "DESELECT_ALL": {
      return { ...state, selectedRows: new Set() };
    }
    case "TOGGLE_EXPAND": {
      const next = new Set(state.expandedRows);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return { ...state, expandedRows: next };
    }

    // Sorting
    case "SET_SORT": {
      return {
        ...state,
        sortKey: action.key,
        sortDirection: action.direction,
      };
    }

    // Filtering
    case "SET_SEARCH": {
      return {
        ...state,
        searchText: action.value,
        pagination: { ...state.pagination, page: 1 },
      };
    }
    case "SET_FILTER": {
      const next = { ...state.columnFilters };
      if (
        action.value === null ||
        action.value === "" ||
        (Array.isArray(action.value) && action.value.length === 0)
      ) {
        delete next[action.key];
      } else {
        next[action.key] = action.value;
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
    case "CLEAR_ALL_FILTERS": {
      return {
        ...state,
        searchText: "",
        columnFilters: {},
        pagination: { ...state.pagination, page: 1 },
      };
    }

    // Pagination
    case "SET_PAGE": {
      return {
        ...state,
        pagination: { ...state.pagination, page: action.page },
      };
    }
    case "SET_PAGE_SIZE": {
      return {
        ...state,
        pagination: { page: 1, pageSize: action.pageSize },
      };
    }

    // Columns
    case "TOGGLE_COLUMN_VISIBILITY": {
      const next = new Set(state.hiddenColumns);
      if (next.has(action.key)) {
        next.delete(action.key);
      } else {
        next.add(action.key);
      }
      return { ...state, hiddenColumns: next };
    }
    case "SHOW_ALL_COLUMNS": {
      return { ...state, hiddenColumns: new Set() };
    }
    case "SET_COLUMN_WIDTH": {
      return {
        ...state,
        columnWidths: { ...state.columnWidths, [action.key]: action.width },
      };
    }
    case "RESET_COLUMN_WIDTHS": {
      return { ...state, columnWidths: {} };
    }
    case "SET_COLUMN_PIN": {
      return {
        ...state,
        columnPinState: {
          ...state.columnPinState,
          [action.key]: action.position,
        },
      };
    }
    case "RESET_COLUMN_PINS": {
      return { ...state, columnPinState: {} };
    }

    // UI
    case "SET_DENSITY": {
      return { ...state, density: action.density };
    }
    case "SET_MOBILE": {
      return { ...state, isMobile: action.isMobile };
    }

    // Bulk Reset
    case "RESET_ALL": {
      return {
        ...state,
        hiddenColumns: new Set(),
        columnWidths: {},
        columnPinState: {},
        density: "standard",
        pagination: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
      };
    }

    default:
      return state;
  }
}
