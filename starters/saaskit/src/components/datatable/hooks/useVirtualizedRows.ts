"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo, useCallback } from "react";

export interface UseVirtualizedRowsOptions<T> {
  /** Data rows */
  data: T[];
  /** Estimated row height in pixels */
  estimateRowHeight?: number | undefined;
  /** Container height (if not auto) */
  containerHeight?: number | undefined;
  /** Overscan count for smoother scrolling */
  overscan?: number | undefined;
  /** Whether virtualization is enabled */
  enabled?: boolean | undefined;
}

export interface UseVirtualizedRowsReturn<T> {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Virtualized rows to render */
  virtualRows: {
    index: number;
    start: number;
    size: number;
    key: string | number;
    data: T;
  }[];
  /** Total height for the virtual list */
  totalHeight: number;
  /** Whether virtualization is active */
  isVirtualized: boolean;
  /** Scroll to a specific row index */
  scrollToIndex: (
    index: number,
    options?: { align?: "start" | "center" | "end" }
  ) => void;
  /** Get styles for the inner container that holds rows */
  getInnerContainerStyle: () => React.CSSProperties;
  /** Get styles for a virtual row */
  getRowStyle: (virtualRow: {
    start: number;
    size: number;
  }) => React.CSSProperties;
}

/**
 * Hook to virtualize table rows for performance with large datasets
 *
 * Uses @tanstack/react-virtual under the hood
 *
 * @example
 * ```tsx
 * const { containerRef, virtualRows, totalHeight, getRowStyle } = useVirtualizedRows({
 *   data: items,
 *   estimateRowHeight: 48,
 *   enabled: items.length > 100,
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualRows.map(vRow => (
 *         <div key={vRow.key} style={getRowStyle(vRow)}>
 *           <TableRow data={vRow.data} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualizedRows<T extends { id: string }>({
  data,
  estimateRowHeight = 48,
  overscan = 5,
  enabled = true,
}: UseVirtualizedRowsOptions<T>): UseVirtualizedRowsReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);

  // Threshold for enabling virtualization (more than 50 rows)
  const shouldVirtualize = enabled && data.length > 50;

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    enabled: shouldVirtualize,
  });

  const virtualRows = useMemo(() => {
    if (!shouldVirtualize) {
      // Return all rows when not virtualized
      return data.map((item, index) => ({
        index,
        start: index * estimateRowHeight,
        size: estimateRowHeight,
        key: item.id,
        data: item,
      }));
    }

    // Return only visible rows from virtualizer
    return virtualizer
      .getVirtualItems()
      .filter((virtualItem) => data[virtualItem.index] !== undefined)
      .map((virtualItem) => ({
        index: virtualItem.index,
        start: virtualItem.start,
        size: virtualItem.size,
        key: data[virtualItem.index]?.id ?? virtualItem.index,
        data: data[virtualItem.index] as T,
      }));
  }, [shouldVirtualize, data, virtualizer, estimateRowHeight]);

  const totalHeight = shouldVirtualize
    ? virtualizer.getTotalSize()
    : data.length * estimateRowHeight;

  const scrollToIndex = useCallback(
    (index: number, options?: { align?: "start" | "center" | "end" }) => {
      if (shouldVirtualize) {
        virtualizer.scrollToIndex(index, options);
      } else if (containerRef.current) {
        const scrollTop = index * estimateRowHeight;
        containerRef.current.scrollTop = scrollTop;
      }
    },
    [shouldVirtualize, virtualizer, estimateRowHeight]
  );

  const getInnerContainerStyle = useCallback(
    (): React.CSSProperties => ({
      height: totalHeight,
      width: "100%",
      position: "relative",
    }),
    [totalHeight]
  );

  const getRowStyle = useCallback(
    (virtualRow: { start: number; size: number }): React.CSSProperties =>
      shouldVirtualize
        ? {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
            height: virtualRow.size,
          }
        : {},
    [shouldVirtualize]
  );

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    virtualRows,
    totalHeight,
    isVirtualized: shouldVirtualize,
    scrollToIndex,
    getInnerContainerStyle,
    getRowStyle,
  };
}

export default useVirtualizedRows;
