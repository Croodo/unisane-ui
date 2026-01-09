"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * Text direction
 */
export type Direction = "ltr" | "rtl";

/**
 * Logical direction for keyboard navigation
 */
export type LogicalDirection = "start" | "end" | "up" | "down";

/**
 * Physical direction for rendering
 */
export type PhysicalDirection = "left" | "right" | "up" | "down";

/**
 * Pin position mapping for RTL
 */
export type LogicalPinPosition = "start" | "end" | "none";

export interface RTLContextValue {
  /**
   * Current text direction
   */
  direction: Direction;

  /**
   * Whether the direction is RTL
   */
  isRTL: boolean;

  /**
   * Convert logical direction to physical direction
   * In LTR: start -> left, end -> right
   * In RTL: start -> right, end -> left
   */
  toPhysical: (logical: LogicalDirection) => PhysicalDirection;

  /**
   * Convert physical direction to logical direction
   * In LTR: left -> start, right -> end
   * In RTL: left -> end, right -> start
   */
  toLogical: (physical: PhysicalDirection) => LogicalDirection;

  /**
   * Convert logical pin position to physical
   * In LTR: start -> left, end -> right
   * In RTL: start -> right, end -> left
   */
  pinToPhysical: (logical: LogicalPinPosition) => "left" | "right" | "none";

  /**
   * Convert physical pin position to logical
   */
  pinToLogical: (physical: "left" | "right" | "none") => LogicalPinPosition;

  /**
   * Flip horizontal values for RTL (margins, paddings, positions)
   * e.g., { left: 10, right: 20 } becomes { left: 20, right: 10 } in RTL
   */
  flipHorizontal: <T extends Record<string, unknown>>(
    obj: T,
    leftKey?: string,
    rightKey?: string
  ) => T;

  /**
   * Get the start/end inset properties for CSS
   * Returns { insetInlineStart, insetInlineEnd } or { left, right } for older browsers
   */
  getInlineInset: (start: number | string, end: number | string) => {
    left?: number | string;
    right?: number | string;
    insetInlineStart?: number | string;
    insetInlineEnd?: number | string;
  };

  /**
   * Get transform for horizontal scroll indicator
   */
  getScrollTransform: (scrollLeft: number) => string;

  /**
   * Adjust scroll position for RTL
   * Different browsers handle RTL scrollLeft differently
   */
  normalizeScrollLeft: (scrollLeft: number, scrollWidth: number, clientWidth: number) => number;
}

export interface UseRTLOptions {
  /**
   * Text direction. If not provided, will be detected from DOM.
   */
  direction?: Direction;

  /**
   * Whether to use CSS logical properties (inset-inline-start/end)
   * or physical properties (left/right).
   * @default true
   */
  useLogicalProperties?: boolean;
}

export interface UseRTLReturn extends RTLContextValue {}

export interface RTLProviderProps {
  /**
   * Text direction
   */
  direction?: Direction;

  /**
   * Whether to use CSS logical properties
   * @default true
   */
  useLogicalProperties?: boolean;

  children: ReactNode;
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const RTLContext = createContext<RTLContextValue | null>(null);

// ─── PROVIDER ────────────────────────────────────────────────────────────────

/**
 * Provider for RTL support in DataTable.
 *
 * @example
 * ```tsx
 * <RTLProvider direction="rtl">
 *   <DataTable data={data} columns={columns} />
 * </RTLProvider>
 * ```
 */
export function RTLProvider({
  direction: directionProp,
  useLogicalProperties = true,
  children,
}: RTLProviderProps) {
  const value = useRTL({ direction: directionProp, useLogicalProperties });

  return <RTLContext.Provider value={value}>{children}</RTLContext.Provider>;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for RTL support in DataTable.
 *
 * Provides utilities for:
 * - Converting between logical and physical directions
 * - Handling pinned column positions in RTL
 * - Flipping horizontal CSS values
 * - Normalizing scroll positions across browsers
 *
 * @example
 * ```tsx
 * const { isRTL, toPhysical, pinToPhysical } = useRTL({ direction: "rtl" });
 *
 * // Convert keyboard arrow to physical direction
 * const physicalDir = toPhysical("start"); // Returns "right" in RTL
 *
 * // Convert pinned column position
 * const pinPosition = pinToPhysical("start"); // Returns "right" in RTL
 * ```
 */
export function useRTL({
  direction: directionProp,
  useLogicalProperties = true,
}: UseRTLOptions = {}): UseRTLReturn {
  // Detect direction from prop or default to LTR
  const direction: Direction = directionProp ?? "ltr";
  const isRTL = direction === "rtl";

  // ─── DIRECTION CONVERSION ──────────────────────────────────────────────────

  const toPhysical = useCallback(
    (logical: LogicalDirection): PhysicalDirection => {
      if (logical === "up" || logical === "down") {
        return logical;
      }
      if (logical === "start") {
        return isRTL ? "right" : "left";
      }
      // logical === "end"
      return isRTL ? "left" : "right";
    },
    [isRTL]
  );

  const toLogical = useCallback(
    (physical: PhysicalDirection): LogicalDirection => {
      if (physical === "up" || physical === "down") {
        return physical;
      }
      if (physical === "left") {
        return isRTL ? "end" : "start";
      }
      // physical === "right"
      return isRTL ? "start" : "end";
    },
    [isRTL]
  );

  // ─── PIN POSITION CONVERSION ───────────────────────────────────────────────

  const pinToPhysical = useCallback(
    (logical: LogicalPinPosition): "left" | "right" | "none" => {
      if (logical === "none") return "none";
      if (logical === "start") {
        return isRTL ? "right" : "left";
      }
      // logical === "end"
      return isRTL ? "left" : "right";
    },
    [isRTL]
  );

  const pinToLogical = useCallback(
    (physical: "left" | "right" | "none"): LogicalPinPosition => {
      if (physical === "none") return "none";
      if (physical === "left") {
        return isRTL ? "end" : "start";
      }
      // physical === "right"
      return isRTL ? "start" : "end";
    },
    [isRTL]
  );

  // ─── CSS UTILITIES ─────────────────────────────────────────────────────────

  const flipHorizontal = useCallback(
    <T extends Record<string, unknown>>(
      obj: T,
      leftKey = "left",
      rightKey = "right"
    ): T => {
      if (!isRTL) return obj;

      const result = { ...obj };
      const leftValue = result[leftKey];
      const rightValue = result[rightKey];

      if (leftValue !== undefined || rightValue !== undefined) {
        result[leftKey as keyof T] = rightValue as T[keyof T];
        result[rightKey as keyof T] = leftValue as T[keyof T];
      }

      return result;
    },
    [isRTL]
  );

  const getInlineInset = useCallback(
    (start: number | string, end: number | string) => {
      if (useLogicalProperties) {
        return {
          insetInlineStart: start,
          insetInlineEnd: end,
        };
      }

      // Fall back to physical properties
      if (isRTL) {
        return { left: end, right: start };
      }
      return { left: start, right: end };
    },
    [isRTL, useLogicalProperties]
  );

  // ─── SCROLL UTILITIES ──────────────────────────────────────────────────────

  const getScrollTransform = useCallback(
    (scrollLeft: number): string => {
      // In RTL, scrollLeft can be negative (Firefox) or positive but reversed (Chrome/Safari)
      // This provides a consistent transform
      return `translateX(${isRTL ? scrollLeft : -scrollLeft}px)`;
    },
    [isRTL]
  );

  const normalizeScrollLeft = useCallback(
    (scrollLeft: number, scrollWidth: number, clientWidth: number): number => {
      if (!isRTL) return scrollLeft;

      // Browsers handle RTL scrollLeft differently:
      // - Chrome/Safari: scrollLeft starts at 0, goes negative
      // - Firefox: scrollLeft starts at 0, goes negative
      // - Edge (old): scrollLeft starts at (scrollWidth - clientWidth), goes to 0
      //
      // We normalize to: 0 = start of content, positive = scrolled right (logically left in RTL)
      if (scrollLeft <= 0) {
        // Firefox/Chrome behavior: already negative or zero
        return Math.abs(scrollLeft);
      }

      // Edge/IE behavior: positive, need to invert
      return scrollWidth - clientWidth - scrollLeft;
    },
    [isRTL]
  );

  // ─── RETURN VALUE ──────────────────────────────────────────────────────────

  return useMemo(
    () => ({
      direction,
      isRTL,
      toPhysical,
      toLogical,
      pinToPhysical,
      pinToLogical,
      flipHorizontal,
      getInlineInset,
      getScrollTransform,
      normalizeScrollLeft,
    }),
    [
      direction,
      isRTL,
      toPhysical,
      toLogical,
      pinToPhysical,
      pinToLogical,
      flipHorizontal,
      getInlineInset,
      getScrollTransform,
      normalizeScrollLeft,
    ]
  );
}

// ─── CONTEXT HOOK ────────────────────────────────────────────────────────────

/**
 * Use RTL context from provider.
 * Falls back to LTR defaults if no provider is present.
 */
export function useRTLContext(): RTLContextValue {
  const context = useContext(RTLContext);

  // Return LTR defaults if no provider
  if (!context) {
    return {
      direction: "ltr",
      isRTL: false,
      toPhysical: (logical) => {
        if (logical === "up" || logical === "down") return logical;
        return logical === "start" ? "left" : "right";
      },
      toLogical: (physical) => {
        if (physical === "up" || physical === "down") return physical;
        return physical === "left" ? "start" : "end";
      },
      pinToPhysical: (logical) => {
        if (logical === "none") return "none";
        return logical === "start" ? "left" : "right";
      },
      pinToLogical: (physical) => {
        if (physical === "none") return "none";
        return physical === "left" ? "start" : "end";
      },
      flipHorizontal: (obj) => obj,
      getInlineInset: (start, end) => ({
        insetInlineStart: start,
        insetInlineEnd: end,
      }),
      getScrollTransform: (scrollLeft) => `translateX(${-scrollLeft}px)`,
      normalizeScrollLeft: (scrollLeft) => scrollLeft,
    };
  }

  return context;
}

// ─── KEYBOARD UTILITIES ──────────────────────────────────────────────────────

/**
 * Map arrow keys to logical directions based on RTL mode.
 *
 * In LTR:
 * - ArrowLeft -> "start" (left)
 * - ArrowRight -> "end" (right)
 *
 * In RTL:
 * - ArrowLeft -> "end" (visually right, logically end)
 * - ArrowRight -> "start" (visually left, logically start)
 *
 * @param key The keyboard event key
 * @param isRTL Whether in RTL mode
 * @returns Logical direction or null if not an arrow key
 */
export function arrowKeyToLogical(
  key: string,
  isRTL: boolean
): LogicalDirection | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      // In RTL, left arrow moves to the "end" (logically)
      return isRTL ? "end" : "start";
    case "ArrowRight":
      // In RTL, right arrow moves to the "start" (logically)
      return isRTL ? "start" : "end";
    default:
      return null;
  }
}

/**
 * Map arrow keys to physical directions (unchanged by RTL).
 * Use this when you need raw physical movement.
 */
export function arrowKeyToPhysical(key: string): PhysicalDirection | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

/**
 * Convert Tab direction based on Shift key and RTL mode.
 *
 * In LTR:
 * - Tab -> "end" (move right/forward)
 * - Shift+Tab -> "start" (move left/backward)
 *
 * In RTL: Same logical behavior, but physical direction is flipped
 */
export function tabToLogical(isShift: boolean): LogicalDirection {
  return isShift ? "start" : "end";
}

export default useRTL;
