"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo, useCallback, useEffect } from "react";
import type { RowGroup } from "../../types";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type VirtualizedGroupItem<T> =
  | { type: "group"; group: RowGroup<T>; index: number }
  | { type: "row"; data: T; groupId: string; index: number };

export interface UseVirtualizedGroupedRowsOptions<T extends { id: string }> {
  /** Grouped data - array of groups with their rows */
  groups: RowGroup<T>[];
  /** Whether grouping is active */
  isGrouped: boolean;
  /** Fallback: flat data for non-grouped mode */
  flatData: T[];
  /** Estimated height for group headers */
  estimateGroupHeaderHeight?: number;
  /** Estimated height for data rows */
  estimateRowHeight?: number;
  /** Overscan count for smoother scrolling */
  overscan?: number;
  /** Whether virtualization is enabled */
  enabled?: boolean;
  /** Minimum total item count to enable virtualization */
  threshold?: number;
}

export interface VirtualGroupedRow<T> {
  index: number;
  start: number;
  size: number;
  key: string;
  item: VirtualizedGroupItem<T>;
}

export interface UseVirtualizedGroupedRowsReturn<T> {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Virtualized items to render (groups and rows) */
  virtualItems: VirtualGroupedRow<T>[];
  /** Total height for the virtual list */
  totalHeight: number;
  /** Whether virtualization is active */
  isVirtualized: boolean;
  /** Scroll to a specific item index */
  scrollToIndex: (
    index: number,
    options?: { align?: "start" | "center" | "end" }
  ) => void;
  /** Scroll to a specific group */
  scrollToGroup: (
    groupId: string,
    options?: { align?: "start" | "center" | "end" }
  ) => void;
  /** Get styles for the inner container */
  getInnerContainerStyle: () => React.CSSProperties;
  /** Get styles for a virtual item */
  getItemStyle: (virtualItem: VirtualGroupedRow<T>) => React.CSSProperties;
  /** Measure element for dynamic heights */
  measureElement: (element: HTMLElement | null) => void;
  /** Total flattened item count */
  totalItemCount: number;
}

/**
 * Hook to virtualize grouped table rows for performance with large datasets
 *
 * Handles mixed content: group headers and data rows with different heights.
 * Uses @tanstack/react-virtual under the hood.
 *
 * @example
 * ```tsx
 * const {
 *   containerRef,
 *   virtualItems,
 *   getItemStyle,
 *   getInnerContainerStyle,
 * } = useVirtualizedGroupedRows({
 *   groups,
 *   isGrouped: true,
 *   flatData: data,
 *   estimateGroupHeaderHeight: 48,
 *   estimateRowHeight: 40,
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={getInnerContainerStyle()}>
 *       {virtualItems.map(vItem => (
 *         <div key={vItem.key} style={getItemStyle(vItem)}>
 *           {vItem.item.type === 'group' ? (
 *             <GroupHeader group={vItem.item.group} />
 *           ) : (
 *             <DataRow data={vItem.item.data} />
 *           )}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualizedGroupedRows<T extends { id: string }>({
  groups,
  isGrouped,
  flatData,
  estimateGroupHeaderHeight = 48,
  estimateRowHeight = 40,
  overscan = 5,
  enabled = true,
  threshold = 50,
}: UseVirtualizedGroupedRowsOptions<T>): UseVirtualizedGroupedRowsReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build flattened list of items (groups + visible rows)
  const flattenedItems = useMemo<VirtualizedGroupItem<T>[]>(() => {
    if (!isGrouped) {
      // Non-grouped: just data rows
      return flatData.map((data, index) => ({
        type: "row" as const,
        data,
        groupId: "",
        index,
      }));
    }

    // Grouped: interleave group headers with their visible rows
    const items: VirtualizedGroupItem<T>[] = [];
    let itemIndex = 0;

    for (const group of groups) {
      // Add group header
      items.push({
        type: "group",
        group,
        index: itemIndex++,
      });

      // Add rows if group is expanded
      if (group.isExpanded) {
        for (const row of group.rows) {
          items.push({
            type: "row",
            data: row,
            groupId: group.groupId,
            index: itemIndex++,
          });
        }
      }
    }

    return items;
  }, [isGrouped, groups, flatData]);

  // Determine if virtualization should be active
  const shouldVirtualize = enabled && flattenedItems.length > threshold;

  // Track data identity to reset scroll position
  const prevDataIdentityRef = useRef<string | undefined>(undefined);
  const dataIdentity = useMemo(() => {
    if (isGrouped && groups.length > 0) {
      return groups.map((g) => g.groupId).join(",");
    }
    return flatData[0]?.id;
  }, [isGrouped, groups, flatData]);

  // Create a map for quick group index lookup
  const groupIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    flattenedItems.forEach((item, idx) => {
      if (item.type === "group") {
        map.set(item.group.groupId, idx);
      }
    });
    return map;
  }, [flattenedItems]);

  // Estimate size function for different item types
  const estimateSize = useCallback(
    (index: number) => {
      const item = flattenedItems[index];
      if (!item) return estimateRowHeight;
      return item.type === "group" ? estimateGroupHeaderHeight : estimateRowHeight;
    },
    [flattenedItems, estimateGroupHeaderHeight, estimateRowHeight]
  );

  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan,
    enabled: shouldVirtualize,
    getItemKey: (index) => {
      const item = flattenedItems[index];
      if (!item) return `item-${index}`;
      if (item.type === "group") {
        return `group-${item.group.groupId}`;
      }
      return `row-${item.groupId}-${item.data.id}`;
    },
  });

  // Reset scroll position when data changes significantly
  useEffect(() => {
    if (
      shouldVirtualize &&
      prevDataIdentityRef.current !== undefined &&
      prevDataIdentityRef.current !== dataIdentity
    ) {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      virtualizer.scrollToIndex(0);
    }
    prevDataIdentityRef.current = dataIdentity;
  }, [dataIdentity, shouldVirtualize, virtualizer]);

  // Build virtual items array
  const virtualItems = useMemo<VirtualGroupedRow<T>[]>(() => {
    if (!shouldVirtualize) {
      // Return all items when not virtualized
      return flattenedItems.map((item, index) => ({
        index,
        start: 0, // Not used when not virtualized
        size: item.type === "group" ? estimateGroupHeaderHeight : estimateRowHeight,
        key:
          item.type === "group"
            ? `group-${item.group.groupId}`
            : `row-${item.groupId}-${item.data.id}`,
        item,
      }));
    }

    // Return only visible items from virtualizer
    return virtualizer
      .getVirtualItems()
      .filter((vItem) => flattenedItems[vItem.index] !== undefined)
      .map((vItem) => ({
        index: vItem.index,
        start: vItem.start,
        size: vItem.size,
        key: String(vItem.key),
        item: flattenedItems[vItem.index]!,
      }));
  }, [
    shouldVirtualize,
    flattenedItems,
    virtualizer,
    estimateGroupHeaderHeight,
    estimateRowHeight,
  ]);

  const totalHeight = shouldVirtualize
    ? virtualizer.getTotalSize()
    : flattenedItems.reduce(
        (acc, item) =>
          acc + (item.type === "group" ? estimateGroupHeaderHeight : estimateRowHeight),
        0
      );

  const scrollToIndex = useCallback(
    (index: number, options?: { align?: "start" | "center" | "end" }) => {
      if (shouldVirtualize) {
        virtualizer.scrollToIndex(index, options);
      } else if (containerRef.current) {
        // Calculate approximate scroll position
        let scrollTop = 0;
        for (let i = 0; i < index && i < flattenedItems.length; i++) {
          scrollTop +=
            flattenedItems[i]!.type === "group"
              ? estimateGroupHeaderHeight
              : estimateRowHeight;
        }
        containerRef.current.scrollTop = scrollTop;
      }
    },
    [
      shouldVirtualize,
      virtualizer,
      flattenedItems,
      estimateGroupHeaderHeight,
      estimateRowHeight,
    ]
  );

  const scrollToGroup = useCallback(
    (groupId: string, options?: { align?: "start" | "center" | "end" }) => {
      const index = groupIndexMap.get(groupId);
      if (index !== undefined) {
        scrollToIndex(index, options);
      }
    },
    [groupIndexMap, scrollToIndex]
  );

  const getInnerContainerStyle = useCallback(
    (): React.CSSProperties => ({
      height: totalHeight,
      width: "100%",
      position: "relative",
    }),
    [totalHeight]
  );

  const getItemStyle = useCallback(
    (virtualItem: VirtualGroupedRow<T>): React.CSSProperties =>
      shouldVirtualize
        ? {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualItem.start}px)`,
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
    virtualItems,
    totalHeight,
    isVirtualized: shouldVirtualize,
    scrollToIndex,
    scrollToGroup,
    getInnerContainerStyle,
    getItemStyle,
    measureElement,
    totalItemCount: flattenedItems.length,
  };
}

export default useVirtualizedGroupedRows;
