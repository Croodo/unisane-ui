"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo, useCallback, useEffect } from "react";

export interface UseVirtualizedRowsOptions<T> {
  /** Data rows */
  data: T[];
  /** Estimated row height in pixels */
  estimateRowHeight?: number | undefined;
  /** Overscan count for smoother scrolling */
  overscan?: number | undefined;
  /** Whether virtualization is enabled */
  enabled?: boolean | undefined;
  /** Minimum row count to enable virtualization */
  threshold?: number | undefined;
}

export interface VirtualRow<T> {
  index: number;
  start: number;
  size: number;
  key: string | number;
  data: T;
}

export interface UseVirtualizedRowsReturn<T> {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Virtualized rows to render */
  virtualRows: VirtualRow<T>[];
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
  getRowStyle: (virtualRow: VirtualRow<T>) => React.CSSProperties;
  /** Measure element for dynamic row heights */
  measureElement: (element: HTMLElement | null) => void;
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
  threshold = 50,
}: UseVirtualizedRowsOptions<T>): UseVirtualizedRowsReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);

  // Enable virtualization when data exceeds threshold
  const shouldVirtualize = enabled && data.length > threshold;

  // Track data identity to reset scroll position on page changes
  const prevDataFirstIdRef = useRef<string | undefined>(undefined);
  const dataFirstId = data[0]?.id;

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    enabled: shouldVirtualize,
  });

  // Reset scroll position when data set changes (e.g., pagination)
  // We detect this by checking if the first item ID changed
  useEffect(() => {
    if (shouldVirtualize && prevDataFirstIdRef.current !== undefined && prevDataFirstIdRef.current !== dataFirstId) {
      // Data changed (likely page change), scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      virtualizer.scrollToIndex(0);
    }
    prevDataFirstIdRef.current = dataFirstId;
  }, [dataFirstId, shouldVirtualize, virtualizer]);

  const virtualRows = useMemo<VirtualRow<T>[]>(() => {
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
    (virtualRow: VirtualRow<T>): React.CSSProperties =>
      shouldVirtualize
        ? {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }
        : {},
    [shouldVirtualize]
  );

  const measureElement = useCallback(
    (element: HTMLElement | null) => {
      if (shouldVirtualize && element) {
        virtualizer.measureElement(element);
      }
    },
    [shouldVirtualize, virtualizer]
  );

  return {
    containerRef,
    virtualRows,
    totalHeight,
    isVirtualized: shouldVirtualize,
    scrollToIndex,
    getInnerContainerStyle,
    getRowStyle,
    measureElement,
  };
}

export default useVirtualizedRows;
