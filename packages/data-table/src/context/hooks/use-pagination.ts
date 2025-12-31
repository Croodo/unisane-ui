"use client";

import { useCallback } from "react";
import { useDataTableContext } from "../provider";

/**
 * Hook for pagination functionality
 */
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
