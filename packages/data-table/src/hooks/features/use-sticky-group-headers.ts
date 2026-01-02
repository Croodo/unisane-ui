"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * Information about a sticky group header
 */
export interface StickyGroupHeader {
  /** Group ID */
  groupId: string;
  /** Group label for display */
  groupLabel: string;
  /** Group value (the actual grouped value) */
  groupValue: unknown;
  /** Depth level (0 = root) */
  depth: number;
  /** Top position when sticky (from container top) */
  stickyTop: number;
  /** Original top position in document */
  originalTop: number;
  /** Height of the header */
  height: number;
  /** Whether the header is currently sticky */
  isSticky: boolean;
  /** Whether the header is about to be pushed off by next group */
  isPushing: boolean;
  /** Row count in this group */
  rowCount: number;
  /** Whether the group is expanded */
  isExpanded: boolean;
}

/**
 * Group position info for calculations
 */
export interface GroupPosition {
  /** Group ID */
  groupId: string;
  /** Group label */
  groupLabel: string;
  /** Group value */
  groupValue: unknown;
  /** Depth level */
  depth: number;
  /** Top position relative to scroll container */
  top: number;
  /** Bottom position (top + height of all rows in group) */
  bottom: number;
  /** Height of just the header row */
  headerHeight: number;
  /** Row count */
  rowCount: number;
  /** Whether expanded */
  isExpanded: boolean;
}

export interface UseStickyGroupHeadersOptions {
  /**
   * Whether sticky headers are enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Ref to the scroll container element.
   */
  containerRef: React.RefObject<HTMLElement | null>;

  /**
   * Group positions (must be updated when groups change or virtualization shifts).
   */
  groups: GroupPosition[];

  /**
   * Offset from the top of the container for sticky headers.
   * Useful if there's a fixed table header.
   * @default 0
   */
  stickyOffset?: number;

  /**
   * Whether to stack multiple levels of group headers.
   * If true, parent group headers stay sticky when scrolling through nested groups.
   * @default true
   */
  stackHeaders?: boolean;

  /**
   * Maximum number of stacked headers.
   * @default 3
   */
  maxStackedHeaders?: number;

  /**
   * Callback when sticky headers change.
   */
  onStickyChange?: (stickyHeaders: StickyGroupHeader[]) => void;

  /**
   * Custom header height (if not measuring dynamically).
   * @default 48
   */
  defaultHeaderHeight?: number;

  /**
   * Debounce scroll events (ms).
   * @default 10
   */
  scrollDebounce?: number;
}

export interface UseStickyGroupHeadersReturn {
  /**
   * Currently sticky group headers (in stack order, deepest last).
   */
  stickyHeaders: StickyGroupHeader[];

  /**
   * Get the topmost sticky header.
   */
  topStickyHeader: StickyGroupHeader | null;

  /**
   * Check if a specific group header is sticky.
   */
  isGroupSticky: (groupId: string) => boolean;

  /**
   * Get sticky info for a specific group.
   */
  getStickyInfo: (groupId: string) => StickyGroupHeader | null;

  /**
   * Total height of all stacked sticky headers.
   */
  totalStickyHeight: number;

  /**
   * CSS styles for the sticky header container.
   */
  stickyContainerStyle: React.CSSProperties;

  /**
   * Get style for an individual sticky header in the stack.
   */
  getStickyHeaderStyle: (groupId: string) => React.CSSProperties;

  /**
   * Force recalculation of sticky headers.
   */
  recalculate: () => void;

  /**
   * Whether any header is currently sticky.
   */
  hasSticky: boolean;

  /**
   * Current scroll position of the container.
   */
  scrollTop: number;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_HEADER_HEIGHT = 48;
const DEFAULT_SCROLL_DEBOUNCE = 10;
const DEFAULT_MAX_STACKED = 3;

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for managing sticky group headers in data tables.
 *
 * Features:
 * - Keeps group headers visible while scrolling through group content
 * - Supports nested/stacked headers for multi-level grouping
 * - Push animation when next group header approaches
 * - Works with virtualization
 * - Customizable offset for fixed table headers
 *
 * @example
 * ```tsx
 * const {
 *   stickyHeaders,
 *   stickyContainerStyle,
 *   getStickyHeaderStyle,
 * } = useStickyGroupHeaders({
 *   containerRef: tableContainerRef,
 *   groups: groupPositions,
 *   stickyOffset: 56, // Account for fixed table header
 *   stackHeaders: true,
 * });
 *
 * // Render sticky headers
 * <div style={stickyContainerStyle}>
 *   {stickyHeaders.map(header => (
 *     <div key={header.groupId} style={getStickyHeaderStyle(header.groupId)}>
 *       {header.groupLabel} ({header.rowCount} items)
 *     </div>
 *   ))}
 * </div>
 * ```
 */
export function useStickyGroupHeaders({
  enabled = true,
  containerRef,
  groups,
  stickyOffset = 0,
  stackHeaders = true,
  maxStackedHeaders = DEFAULT_MAX_STACKED,
  onStickyChange,
  defaultHeaderHeight = DEFAULT_HEADER_HEIGHT,
  scrollDebounce = DEFAULT_SCROLL_DEBOUNCE,
}: UseStickyGroupHeadersOptions): UseStickyGroupHeadersReturn {
  // ─── STATE ────────────────────────────────────────────────────────────────

  const [stickyHeaders, setStickyHeaders] = useState<StickyGroupHeader[]>([]);
  const [scrollTop, setScrollTop] = useState(0);

  // Refs
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── CALCULATION ──────────────────────────────────────────────────────────

  const calculateStickyHeaders = useCallback(() => {
    if (!enabled || !containerRef.current || groups.length === 0) {
      if (stickyHeaders.length > 0) {
        setStickyHeaders([]);
        onStickyChange?.([]);
      }
      return;
    }

    const container = containerRef.current;
    const currentScrollTop = container.scrollTop;
    setScrollTop(currentScrollTop);

    // Find groups that should be sticky
    const newStickyHeaders: StickyGroupHeader[] = [];
    let accumulatedHeight = stickyOffset;

    // Sort groups by depth and position
    const sortedGroups = [...groups].sort((a, b) => {
      // First by depth (parent groups first)
      if (a.depth !== b.depth) return a.depth - b.depth;
      // Then by position
      return a.top - b.top;
    });

    // Track which depth levels have a sticky header
    const stickyByDepth = new Map<number, GroupPosition>();

    for (const group of groups) {
      const groupTop = group.top - currentScrollTop;
      const groupBottom = group.bottom - currentScrollTop;
      const effectiveTop = stickyOffset + accumulatedHeight;

      // Group header should be sticky if:
      // 1. The group top has scrolled past the sticky position
      // 2. The group bottom hasn't scrolled past the sticky position yet
      const shouldBeSticky = groupTop < effectiveTop && groupBottom > effectiveTop;

      if (shouldBeSticky) {
        // Check if we should stack this header
        if (stackHeaders || newStickyHeaders.length === 0) {
          // For stacking, only show the deepest sticky header at each level
          const existingAtDepth = stickyByDepth.get(group.depth);
          if (!existingAtDepth || group.top > existingAtDepth.top) {
            stickyByDepth.set(group.depth, group);
          }
        }
      }
    }

    // Build sticky headers from the depth map
    const depths = Array.from(stickyByDepth.keys()).sort((a, b) => a - b);
    let currentTop = stickyOffset;

    for (const depth of depths) {
      if (newStickyHeaders.length >= maxStackedHeaders) break;

      const group = stickyByDepth.get(depth);
      if (!group) continue;

      const groupBottom = group.bottom - currentScrollTop;
      const nextGroupAtSameDepth = groups.find(
        (g) => g.depth === depth && g.top > group.top
      );

      // Check if being pushed by next group
      let isPushing = false;
      let pushOffset = 0;

      if (nextGroupAtSameDepth) {
        const nextTop = nextGroupAtSameDepth.top - currentScrollTop;
        const headerBottom = currentTop + group.headerHeight;

        if (nextTop < headerBottom + group.headerHeight) {
          isPushing = true;
          pushOffset = Math.max(0, headerBottom - nextTop);
        }
      }

      // Also check if group content is ending
      if (groupBottom < currentTop + group.headerHeight * 2) {
        isPushing = true;
        pushOffset = Math.max(pushOffset, currentTop + group.headerHeight - groupBottom + group.headerHeight);
      }

      newStickyHeaders.push({
        groupId: group.groupId,
        groupLabel: group.groupLabel,
        groupValue: group.groupValue,
        depth: group.depth,
        stickyTop: Math.max(0, currentTop - pushOffset),
        originalTop: group.top,
        height: group.headerHeight,
        isSticky: true,
        isPushing,
        rowCount: group.rowCount,
        isExpanded: group.isExpanded,
      });

      currentTop += group.headerHeight;
    }

    // Only update if changed
    const hasChanged =
      newStickyHeaders.length !== stickyHeaders.length ||
      newStickyHeaders.some((h, i) => {
        const prev = stickyHeaders[i];
        return (
          !prev ||
          h.groupId !== prev.groupId ||
          h.stickyTop !== prev.stickyTop ||
          h.isPushing !== prev.isPushing
        );
      });

    if (hasChanged) {
      setStickyHeaders(newStickyHeaders);
      onStickyChange?.(newStickyHeaders);
    }
  }, [
    enabled,
    containerRef,
    groups,
    stickyOffset,
    stackHeaders,
    maxStackedHeaders,
    stickyHeaders,
    onStickyChange,
  ]);

  // ─── SCROLL HANDLER ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleScroll = () => {
      // Debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        // Use RAF for smooth updates
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          calculateStickyHeaders();
        });
      }, scrollDebounce);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    // Initial calculation
    calculateStickyHeaders();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, containerRef, calculateStickyHeaders, scrollDebounce]);

  // Recalculate when groups change
  useEffect(() => {
    calculateStickyHeaders();
  }, [groups, calculateStickyHeaders]);

  // ─── DERIVED STATE ────────────────────────────────────────────────────────

  const topStickyHeader = useMemo((): StickyGroupHeader | null => {
    return stickyHeaders[0] ?? null;
  }, [stickyHeaders]);

  const totalStickyHeight = useMemo(() => {
    return stickyHeaders.reduce((sum, h) => sum + h.height, 0);
  }, [stickyHeaders]);

  const hasSticky = stickyHeaders.length > 0;

  // ─── GETTERS ──────────────────────────────────────────────────────────────

  const isGroupSticky = useCallback(
    (groupId: string): boolean => {
      return stickyHeaders.some((h) => h.groupId === groupId);
    },
    [stickyHeaders]
  );

  const getStickyInfo = useCallback(
    (groupId: string): StickyGroupHeader | null => {
      return stickyHeaders.find((h) => h.groupId === groupId) ?? null;
    },
    [stickyHeaders]
  );

  // ─── STYLES ───────────────────────────────────────────────────────────────

  const stickyContainerStyle = useMemo((): React.CSSProperties => {
    if (!hasSticky) {
      return { display: "none" };
    }

    return {
      position: "sticky",
      top: stickyOffset,
      zIndex: 20,
      pointerEvents: "auto",
    };
  }, [hasSticky, stickyOffset]);

  const getStickyHeaderStyle = useCallback(
    (groupId: string): React.CSSProperties => {
      const header = stickyHeaders.find((h) => h.groupId === groupId);
      if (!header) {
        return { display: "none" };
      }

      return {
        position: "absolute",
        top: header.stickyTop,
        left: 0,
        right: 0,
        height: header.height,
        zIndex: 20 - header.depth,
        transform: header.isPushing ? "translateY(-100%)" : undefined,
        transition: "transform 150ms ease-out",
      };
    },
    [stickyHeaders]
  );

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const recalculate = useCallback(() => {
    calculateStickyHeaders();
  }, [calculateStickyHeaders]);

  // ─── RETURN ───────────────────────────────────────────────────────────────

  return {
    stickyHeaders,
    topStickyHeader,
    isGroupSticky,
    getStickyInfo,
    totalStickyHeight,
    stickyContainerStyle,
    getStickyHeaderStyle,
    recalculate,
    hasSticky,
    scrollTop,
  };
}

export default useStickyGroupHeaders;
