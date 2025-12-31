"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_KEYBOARD_PAGE_SIZE } from "../../constants";

export interface UseKeyboardNavigationOptions {
  /** Total number of rows */
  rowCount: number;
  /** Callback when row is focused */
  onFocusChange?: (index: number | null) => void;
  /** Callback when row is selected via keyboard */
  onSelect?: (index: number) => void;
  /** Callback when row is activated (Enter key) */
  onActivate?: (index: number) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
  /** Container element ref for scoping events */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Number of rows to skip for PageUp/PageDown (defaults to 10) */
  pageSize?: number;
  /** Function to get the DOM id for a row at given index */
  getRowId?: (index: number) => string;
}

export interface UseKeyboardNavigationReturn {
  /** Currently focused row index */
  focusedIndex: number | null;
  /** Set focused row index manually */
  setFocusedIndex: (index: number | null) => void;
  /** Get props to spread on the table container */
  getContainerProps: () => {
    tabIndex: number;
    role: string;
    "aria-activedescendant": string | undefined;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
  };
  /** Get props to spread on each row */
  getRowProps: (index: number, rowId: string) => {
    id: string;
    "aria-selected": boolean;
    tabIndex: number;
  };
  /** Whether the table is currently focused */
  isFocused: boolean;
}

/**
 * Hook for keyboard navigation in DataTable
 *
 * Supports:
 * - Arrow Up/Down: Navigate between rows
 * - Home/End: Jump to first/last row
 * - Space: Toggle selection
 * - Enter: Activate row (trigger onRowClick)
 * - Page Up/Down: Navigate by page (10 rows)
 *
 * @example
 * ```tsx
 * const { focusedIndex, getContainerProps, getRowProps } = useKeyboardNavigation({
 *   rowCount: data.length,
 *   onSelect: (index) => toggleSelect(data[index].id),
 *   onActivate: (index) => onRowClick(data[index]),
 * });
 *
 * return (
 *   <div {...getContainerProps()}>
 *     {data.map((row, index) => (
 *       <tr {...getRowProps(index, row.id)}>...</tr>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useKeyboardNavigation({
  rowCount,
  onFocusChange,
  onSelect,
  onActivate,
  enabled = true,
  containerRef,
  pageSize = DEFAULT_KEYBOARD_PAGE_SIZE,
  getRowId,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [focusedIndex, setFocusedIndexState] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Update focused index and notify parent
  const setFocusedIndex = useCallback(
    (index: number | null) => {
      const clampedIndex = index !== null
        ? Math.max(0, Math.min(index, rowCount - 1))
        : null;
      setFocusedIndexState(clampedIndex);
      onFocusChange?.(clampedIndex);
    },
    [rowCount, onFocusChange]
  );

  // Reset focus when row count changes and focus is out of bounds
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= rowCount) {
      setFocusedIndex(rowCount > 0 ? rowCount - 1 : null);
    }
  }, [rowCount, focusedIndex, setFocusedIndex]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || rowCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(focusedIndex === null ? 0 : focusedIndex + 1);
          break;

        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(focusedIndex === null ? rowCount - 1 : focusedIndex - 1);
          break;

        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;

        case "End":
          e.preventDefault();
          setFocusedIndex(rowCount - 1);
          break;

        case "PageDown":
          e.preventDefault();
          setFocusedIndex(
            focusedIndex === null ? pageSize - 1 : Math.min(focusedIndex + pageSize, rowCount - 1)
          );
          break;

        case "PageUp":
          e.preventDefault();
          setFocusedIndex(
            focusedIndex === null ? 0 : Math.max(focusedIndex - pageSize, 0)
          );
          break;

        case " ": // Space
          e.preventDefault();
          if (focusedIndex !== null && onSelect) {
            onSelect(focusedIndex);
          }
          break;

        case "Enter":
          e.preventDefault();
          if (focusedIndex !== null && onActivate) {
            onActivate(focusedIndex);
          }
          break;

        case "Escape":
          e.preventDefault();
          setFocusedIndex(null);
          break;
      }
    },
    [enabled, rowCount, focusedIndex, setFocusedIndex, onSelect, onActivate, pageSize]
  );

  // Handle focus/blur
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Don't auto-focus first row - let user initiate with keyboard
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Get container props
  const getContainerProps = useCallback(() => {
    // Use custom getRowId if provided, otherwise fall back to default format
    const focusedRowId = focusedIndex !== null
      ? (getRowId ? getRowId(focusedIndex) : `row-${focusedIndex}`)
      : undefined;

    return {
      tabIndex: enabled ? 0 : -1,
      role: "grid" as const,
      "aria-activedescendant": focusedRowId,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
    };
  }, [enabled, focusedIndex, handleKeyDown, handleFocus, handleBlur, getRowId]);

  // Get row props
  const getRowProps = useCallback(
    (index: number, rowId: string) => ({
      id: `row-${index}`,
      "aria-selected": focusedIndex === index,
      tabIndex: -1, // Rows are not directly focusable, focus managed by container
    }),
    [focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    getContainerProps,
    getRowProps,
    isFocused,
  };
}

export default useKeyboardNavigation;
