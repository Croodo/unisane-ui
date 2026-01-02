"use client";

import { useCallback, useMemo, useState, useEffect, useRef, type RefObject } from "react";
import { useDataTableContext } from "../provider";
import type { Column, PinPosition } from "../../types";
import { RESPONSIVE } from "../../constants";

/**
 * Hook for column management functionality
 */
export function useColumns<T>() {
  const {
    state,
    dispatch,
    config,
    controlled,
    onColumnPinChange,
    onColumnOrderChange,
    onColumnVisibilityChange,
  } = useDataTableContext<T>();

  const pinState = controlled.pinState ?? state.columnPinState;
  const columnOrder = controlled.columnOrder ?? state.columnOrder;

  // Track container width for responsive column visibility
  const [containerWidth, setContainerWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  // Track if we're using container-based width (vs window fallback)
  const isUsingContainerWidth = useRef(false);

  // Update container width on window resize (fallback when no container is observed)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      // Only use window width if we're not observing a container
      if (!isUsingContainerWidth.current) {
        setContainerWidth(window.innerWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Observe a container element for width changes using ResizeObserver.
   * Call this from the component that has the container ref.
   * Returns a cleanup function.
   */
  const observeContainer = useCallback((containerRef: RefObject<HTMLElement | null>) => {
    if (typeof window === "undefined" || !containerRef.current) return () => {};

    const element = containerRef.current;
    isUsingContainerWidth.current = true;

    // Set initial width
    setContainerWidth(element.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Use contentRect for accurate content width
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      isUsingContainerWidth.current = false;
    };
  }, []);

  const toggleVisibility = useCallback(
    (key: string) => {
      dispatch({ type: "TOGGLE_COLUMN_VISIBILITY", key });
      // Notify about visibility change (after state updates)
      const newHiddenColumns = state.hiddenColumns.has(key)
        ? [...state.hiddenColumns].filter((k) => k !== key)
        : [...state.hiddenColumns, key];
      onColumnVisibilityChange?.(newHiddenColumns);
    },
    [dispatch, state.hiddenColumns, onColumnVisibilityChange]
  );

  const hideColumn = useCallback(
    (key: string) => {
      dispatch({ type: "HIDE_COLUMN", key });
      if (!state.hiddenColumns.has(key)) {
        onColumnVisibilityChange?.([...state.hiddenColumns, key]);
      }
    },
    [dispatch, state.hiddenColumns, onColumnVisibilityChange]
  );

  const showAllColumns = useCallback(() => {
    dispatch({ type: "SHOW_ALL_COLUMNS" });
    onColumnVisibilityChange?.([]);
  }, [dispatch, onColumnVisibilityChange]);

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

  // Check if pinning should be active based on container width
  const isPinningEnabled = containerWidth >= RESPONSIVE.MIN_WIDTH_FOR_PINNING;

  // Get effective pin position (user override > column definition)
  // Returns null on small screens to disable pinning
  const getEffectivePinPosition = useCallback(
    (col: Column<T>) => {
      // Disable pinning on small screens
      if (!isPinningEnabled) {
        return null;
      }

      const key = String(col.key);
      if (pinState[key] !== undefined) {
        return pinState[key];
      }
      return col.pinned ?? null;
    },
    [pinState, isPinningEnabled]
  );

  // Check if a column should be visible based on responsive settings
  const isColumnResponsivelyVisible = useCallback(
    (col: Column<T>) => {
      // If column has minVisibleWidth, check against container width
      if (col.minVisibleWidth !== undefined) {
        return containerWidth >= col.minVisibleWidth;
      }
      return true;
    },
    [containerWidth]
  );

  // Visible columns - respects column order, user hidden state, and responsive visibility
  const visibleColumns = useMemo(() => {
    const visible = config.columns.filter((col) => {
      const key = String(col.key);
      // Check user-hidden state
      if (state.hiddenColumns.has(key)) {
        return false;
      }
      // Check responsive visibility
      if (!isColumnResponsivelyVisible(col)) {
        return false;
      }
      return true;
    });

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
  }, [config.columns, state.hiddenColumns, columnOrder, isColumnResponsivelyVisible]);

  // Columns hidden due to responsive settings (for UI indicator)
  const responsivelyHiddenColumns = useMemo(() => {
    return config.columns.filter(
      (col) => !state.hiddenColumns.has(String(col.key)) && !isColumnResponsivelyVisible(col)
    );
  }, [config.columns, state.hiddenColumns, isColumnResponsivelyVisible]);

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
    // Responsive features
    containerWidth,
    responsivelyHiddenColumns,
    isColumnResponsivelyVisible,
    isPinningEnabled,
    /** Observe a container element for accurate width detection */
    observeContainer,
  };
}
