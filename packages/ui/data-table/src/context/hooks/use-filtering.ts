"use client";

import { useCallback } from "react";
import { useDataTableContext } from "../provider";
import type { FilterValue } from "../../types";

/**
 * Hook for filtering functionality
 */
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
    (key: string, value: FilterValue) => {
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
