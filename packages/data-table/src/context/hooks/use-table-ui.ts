"use client";

import { useCallback } from "react";
import { useDataTableContext } from "../provider";

/**
 * Hook for table UI state and configuration
 */
export function useTableUI() {
  const { state, dispatch, config } = useDataTableContext();

  const resetAll = useCallback(
    () => dispatch({ type: "RESET_ALL" }),
    [dispatch]
  );

  return {
    config,
    resetAll,
    hasCustomizations:
      Object.keys(state.columnPinState).length > 0 ||
      Object.keys(state.columnWidths).length > 0 ||
      state.hiddenColumns.size > 0,
  };
}
