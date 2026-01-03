"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type { Column, ColumnMeta, ColumnMetaMap } from "../../types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface VirtualColumn<T> {
  /** Original column index in the full column array */
  index: number;
  /** Column definition */
  column: Column<T>;
  /** Column metadata (width, position) */
  meta: ColumnMeta;
  /** Whether this column is pinned */
  isPinned: boolean;
  /** Pin position if pinned */
  pinPosition: "left" | "right" | null;
}

export interface UseVirtualizedColumnsOptions<T> {
  /** All columns (including hidden ones should be filtered out before passing) */
  columns: Column<T>[];
  /** Column metadata with computed widths */
  columnMeta: ColumnMetaMap;
  /** Function to get effective pin position for a column */
  getEffectivePinPosition: (columnKey: string) => "left" | "right" | null;
  /** Reference to the horizontal scroll container */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Whether virtualization is enabled */
  enabled?: boolean;
  /** Minimum column count to enable virtualization */
  threshold?: number;
  /** Number of columns to render outside visible area (overscan) */
  overscan?: number;
  /** Default column width when meta is not available */
  defaultColumnWidth?: number;
}

export interface UseVirtualizedColumnsReturn<T> {
  /** Columns to render (includes pinned + visible virtualized columns) */
  virtualColumns: VirtualColumn<T>[];
  /** Pinned left columns (always rendered) */
  pinnedLeftColumns: VirtualColumn<T>[];
  /** Pinned right columns (always rendered) */
  pinnedRightColumns: VirtualColumn<T>[];
  /** Scrollable (non-pinned) visible columns */
  scrollableColumns: VirtualColumn<T>[];
  /** Whether column virtualization is active */
  isVirtualized: boolean;
  /** Total width of all scrollable columns */
  totalScrollableWidth: number;
  /** Left padding for virtualized columns (width of hidden left columns) */
  leftPadding: number;
  /** Right padding for virtualized columns (width of hidden right columns) */
  rightPadding: number;
  /** Handler to attach to scroll container for tracking scroll position */
  onScroll: (event: React.UIEvent<HTMLElement>) => void;
  /** Get style for the scrollable columns container */
  getScrollableContainerStyle: () => React.CSSProperties;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_COLUMN_WIDTH = 150;
const DEFAULT_THRESHOLD = 20;
const DEFAULT_OVERSCAN = 3;

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook to virtualize table columns for performance with wide tables (100+ columns).
 *
 * Features:
 * - Only renders visible columns plus overscan buffer
 * - Pinned columns are always rendered
 * - Maintains scroll position and provides padding for hidden columns
 * - Respects column widths from columnMeta
 *
 * @example
 * ```tsx
 * const {
 *   virtualColumns,
 *   pinnedLeftColumns,
 *   pinnedRightColumns,
 *   scrollableColumns,
 *   isVirtualized,
 *   leftPadding,
 *   rightPadding,
 *   onScroll,
 *   getScrollableContainerStyle,
 * } = useVirtualizedColumns({
 *   columns: visibleColumns,
 *   columnMeta,
 *   getEffectivePinPosition,
 *   scrollContainerRef: tableContainerRef,
 *   enabled: visibleColumns.length > 20,
 * });
 *
 * // In header/body render:
 * <div style={getScrollableContainerStyle()}>
 *   {scrollableColumns.map(vCol => (
 *     <th key={vCol.column.key} style={{ width: vCol.meta.width }}>
 *       {vCol.column.header}
 *     </th>
 *   ))}
 * </div>
 * ```
 */
export function useVirtualizedColumns<T>({
  columns,
  columnMeta,
  getEffectivePinPosition,
  scrollContainerRef,
  enabled = true,
  threshold = DEFAULT_THRESHOLD,
  overscan = DEFAULT_OVERSCAN,
  defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
}: UseVirtualizedColumnsOptions<T>): UseVirtualizedColumnsReturn<T> {
  // ─── STATE ─────────────────────────────────────────────────────────────────

  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state to prevent setState after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── SHOULD VIRTUALIZE ─────────────────────────────────────────────────────

  const shouldVirtualize = enabled && columns.length > threshold;

  // ─── CATEGORIZE COLUMNS ────────────────────────────────────────────────────

  const categorizedColumns = useMemo(() => {
    const pinnedLeft: VirtualColumn<T>[] = [];
    const pinnedRight: VirtualColumn<T>[] = [];
    const scrollable: { col: Column<T>; index: number; meta: ColumnMeta }[] = [];

    columns.forEach((col, index) => {
      const key = String(col.key);
      const pinPosition = getEffectivePinPosition(key);
      const meta = columnMeta[key] ?? { width: defaultColumnWidth };

      const virtualCol: VirtualColumn<T> = {
        index,
        column: col,
        meta,
        isPinned: pinPosition !== null,
        pinPosition,
      };

      if (pinPosition === "left") {
        pinnedLeft.push(virtualCol);
      } else if (pinPosition === "right") {
        pinnedRight.push(virtualCol);
      } else {
        scrollable.push({ col, index, meta });
      }
    });

    return { pinnedLeft, pinnedRight, scrollable };
  }, [columns, columnMeta, getEffectivePinPosition, defaultColumnWidth]);

  // ─── SCROLLABLE COLUMN POSITIONS ───────────────────────────────────────────

  const scrollableColumnPositions = useMemo(() => {
    let cumulativeLeft = 0;
    return categorizedColumns.scrollable.map(({ col, index, meta }) => {
      const position = {
        col,
        index,
        meta,
        left: cumulativeLeft,
        right: cumulativeLeft + meta.width,
      };
      cumulativeLeft += meta.width;
      return position;
    });
  }, [categorizedColumns.scrollable]);

  const totalScrollableWidth = useMemo(() => {
    const lastCol = scrollableColumnPositions[scrollableColumnPositions.length - 1];
    return lastCol ? lastCol.right : 0;
  }, [scrollableColumnPositions]);

  // ─── CALCULATE VISIBLE COLUMNS ─────────────────────────────────────────────

  const { visibleScrollableColumns, leftPadding, rightPadding } = useMemo(() => {
    if (!shouldVirtualize || scrollableColumnPositions.length === 0) {
      // Return all scrollable columns when not virtualized
      return {
        visibleScrollableColumns: scrollableColumnPositions.map((pos): VirtualColumn<T> => ({
          index: pos.index,
          column: pos.col,
          meta: pos.meta,
          isPinned: false,
          pinPosition: null,
        })),
        leftPadding: 0,
        rightPadding: 0,
      };
    }

    const viewStart = scrollLeft;
    const viewEnd = scrollLeft + containerWidth;

    // Find first visible column (binary search for performance)
    let firstVisibleIdx = 0;
    let low = 0;
    let high = scrollableColumnPositions.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const col = scrollableColumnPositions[mid]!;
      if (col.right <= viewStart) {
        low = mid + 1;
      } else {
        firstVisibleIdx = mid;
        high = mid - 1;
      }
    }

    // Find last visible column
    let lastVisibleIdx = scrollableColumnPositions.length - 1;
    low = firstVisibleIdx;
    high = scrollableColumnPositions.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const col = scrollableColumnPositions[mid]!;
      if (col.left >= viewEnd) {
        high = mid - 1;
      } else {
        lastVisibleIdx = mid;
        low = mid + 1;
      }
    }

    // Apply overscan
    const startIdx = Math.max(0, firstVisibleIdx - overscan);
    const endIdx = Math.min(scrollableColumnPositions.length - 1, lastVisibleIdx + overscan);

    // Calculate padding
    let left = 0;
    for (let i = 0; i < startIdx; i++) {
      left += scrollableColumnPositions[i]!.meta.width;
    }

    let right = 0;
    for (let i = endIdx + 1; i < scrollableColumnPositions.length; i++) {
      right += scrollableColumnPositions[i]!.meta.width;
    }

    // Build visible columns array
    const visible: VirtualColumn<T>[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const pos = scrollableColumnPositions[i]!;
      visible.push({
        index: pos.index,
        column: pos.col,
        meta: pos.meta,
        isPinned: false,
        pinPosition: null,
      });
    }

    return {
      visibleScrollableColumns: visible,
      leftPadding: left,
      rightPadding: right,
    };
  }, [shouldVirtualize, scrollableColumnPositions, scrollLeft, containerWidth, overscan]);

  // ─── COMBINED VIRTUAL COLUMNS ──────────────────────────────────────────────

  const virtualColumns = useMemo(() => {
    return [
      ...categorizedColumns.pinnedLeft,
      ...visibleScrollableColumns,
      ...categorizedColumns.pinnedRight,
    ];
  }, [categorizedColumns.pinnedLeft, categorizedColumns.pinnedRight, visibleScrollableColumns]);

  // ─── SCROLL HANDLER ────────────────────────────────────────────────────────

  const onScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      // Prevent setState after unmount
      if (!isMountedRef.current) return;
      const target = event.target as HTMLElement;
      setScrollLeft(target.scrollLeft);
    });
  }, []);

  // ─── OBSERVE CONTAINER WIDTH ───────────────────────────────────────────────

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !shouldVirtualize) return;

    const updateWidth = () => {
      // Prevent setState after unmount
      if (!isMountedRef.current) return;
      setContainerWidth(container.clientWidth);
    };

    // Initial measurement
    updateWidth();

    // Use ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scrollContainerRef, shouldVirtualize]);

  // ─── STYLE GETTERS ─────────────────────────────────────────────────────────

  const getScrollableContainerStyle = useCallback((): React.CSSProperties => {
    if (!shouldVirtualize) {
      return {};
    }

    return {
      paddingLeft: leftPadding,
      paddingRight: rightPadding,
    };
  }, [shouldVirtualize, leftPadding, rightPadding]);

  // ─── RETURN ────────────────────────────────────────────────────────────────

  return {
    virtualColumns,
    pinnedLeftColumns: categorizedColumns.pinnedLeft,
    pinnedRightColumns: categorizedColumns.pinnedRight,
    scrollableColumns: visibleScrollableColumns,
    isVirtualized: shouldVirtualize,
    totalScrollableWidth,
    leftPadding,
    rightPadding,
    onScroll,
    getScrollableContainerStyle,
  };
}

export default useVirtualizedColumns;
