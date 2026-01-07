"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import type { Column } from "../types";

export interface FocusPosition {
  rowIndex: number;
  colIndex: number;
}

export interface UseKeyboardNavigationOptions<T extends { id: string }> {
  /** Visible data rows */
  data: T[];
  /** Visible columns */
  columns: Column<T>[];
  /** Whether selection is enabled */
  selectable: boolean;
  /** Number of fixed columns (checkbox, expander) */
  fixedColumnCount: number;
  /** Called when selection changes via keyboard */
  onSelectRow?: ((id: string, selected: boolean) => void) | undefined;
  /** Called when row is activated (Enter key) */
  onRowActivate?: ((row: T) => void) | undefined;
  /** Called when all rows should be selected (Ctrl+A) */
  onSelectAll?: (() => void) | undefined;
  /** Called when pagination should advance */
  onNextPage?: (() => void) | undefined;
  onPrevPage?: (() => void) | undefined;
  /** Whether the table is in loading state */
  isLoading?: boolean | undefined;
}

export interface UseKeyboardNavigationReturn {
  /** Current focus position */
  focusPosition: FocusPosition | null;
  /** Set focus to a specific cell */
  setFocus: (position: FocusPosition | null) => void;
  /** Focus the first cell */
  focusFirst: () => void;
  /** Focus the last cell */
  focusLast: () => void;
  /** Ref to attach to the table container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Key handler to attach to container */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Check if a cell is focused */
  isCellFocused: (rowIndex: number, colIndex: number) => boolean;
  /** Check if a row is focused (any cell in the row) */
  isRowFocused: (rowIndex: number) => boolean;
  /** Get ARIA attributes for a cell */
  getCellAriaProps: (
    rowIndex: number,
    colIndex: number
  ) => {
    tabIndex: number;
    "aria-selected": boolean;
    role: string;
  };
  /** Get ARIA attributes for the table container */
  getContainerAriaProps: () => {
    role: string;
    "aria-rowcount": number;
    "aria-colcount": number;
  };
}

/**
 * Hook to provide keyboard navigation for DataTable
 *
 * Keyboard shortcuts:
 * - Arrow keys: Navigate between cells
 * - Home/End: Go to first/last cell in row
 * - Ctrl+Home/End: Go to first/last row
 * - Page Up/Down: Navigate pages
 * - Space: Toggle selection (when on row)
 * - Enter: Activate row (click handler)
 * - Ctrl+A: Select all (when selection enabled)
 * - Escape: Clear focus
 */
export function useKeyboardNavigation<T extends { id: string }>({
  data,
  columns,
  selectable,
  fixedColumnCount,
  onSelectRow,
  onRowActivate,
  onSelectAll,
  onNextPage,
  onPrevPage,
  isLoading,
}: UseKeyboardNavigationOptions<T>): UseKeyboardNavigationReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusPosition, setFocusPosition] = useState<FocusPosition | null>(
    null
  );

  // Total columns including fixed (checkbox, expander) + data columns
  const totalColumns = (selectable ? 1 : 0) + fixedColumnCount + columns.length;
  const totalRows = data.length;

  // Clamp position to valid range
  const clampPosition = useCallback(
    (pos: FocusPosition): FocusPosition => {
      return {
        rowIndex: Math.max(0, Math.min(pos.rowIndex, totalRows - 1)),
        colIndex: Math.max(0, Math.min(pos.colIndex, totalColumns - 1)),
      };
    },
    [totalRows, totalColumns]
  );

  // Set focus and scroll into view
  const setFocus = useCallback(
    (position: FocusPosition | null) => {
      if (position === null) {
        setFocusPosition(null);
        return;
      }

      const clamped = clampPosition(position);
      setFocusPosition(clamped);

      // Scroll the focused cell into view
      requestAnimationFrame(() => {
        const cell = containerRef.current?.querySelector(
          `[data-row="${clamped.rowIndex}"][data-col="${clamped.colIndex}"]`
        );
        cell?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    },
    [clampPosition]
  );

  const focusFirst = useCallback(() => {
    if (totalRows > 0) {
      setFocus({ rowIndex: 0, colIndex: 0 });
    }
  }, [totalRows, setFocus]);

  const focusLast = useCallback(() => {
    if (totalRows > 0) {
      setFocus({
        rowIndex: totalRows - 1,
        colIndex: totalColumns - 1,
      });
    }
  }, [totalRows, totalColumns, setFocus]);

  // Move focus in a direction
  const moveFocus = useCallback(
    (deltaRow: number, deltaCol: number) => {
      setFocusPosition((prev) => {
        if (prev === null) {
          return { rowIndex: 0, colIndex: 0 };
        }
        return clampPosition({
          rowIndex: prev.rowIndex + deltaRow,
          colIndex: prev.colIndex + deltaCol,
        });
      });
    },
    [clampPosition]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ignore key events that originate from interactive inputs/editors
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isLoading || totalRows === 0) return;

      const { key, ctrlKey, metaKey, shiftKey } = e;
      const cmdOrCtrl = ctrlKey || metaKey;

      switch (key) {
        // Arrow navigation
        case "ArrowUp":
          e.preventDefault();
          moveFocus(-1, 0);
          break;

        case "ArrowDown":
          e.preventDefault();
          moveFocus(1, 0);
          break;

        case "ArrowLeft":
          e.preventDefault();
          moveFocus(0, -1);
          break;

        case "ArrowRight":
          e.preventDefault();
          moveFocus(0, 1);
          break;

        // Home/End
        case "Home":
          e.preventDefault();
          if (cmdOrCtrl) {
            // Ctrl+Home: Go to first row
            setFocus({ rowIndex: 0, colIndex: focusPosition?.colIndex ?? 0 });
          } else {
            // Home: Go to first cell in current row
            setFocusPosition((prev) =>
              prev ? { ...prev, colIndex: 0 } : { rowIndex: 0, colIndex: 0 }
            );
          }
          break;

        case "End":
          e.preventDefault();
          if (cmdOrCtrl) {
            // Ctrl+End: Go to last row
            setFocus({
              rowIndex: totalRows - 1,
              colIndex: focusPosition?.colIndex ?? 0,
            });
          } else {
            // End: Go to last cell in current row
            setFocusPosition((prev) =>
              prev
                ? { ...prev, colIndex: totalColumns - 1 }
                : { rowIndex: 0, colIndex: totalColumns - 1 }
            );
          }
          break;

        // Page navigation
        case "PageUp":
          e.preventDefault();
          if (focusPosition?.rowIndex === 0 && onPrevPage) {
            onPrevPage();
          } else {
            // Jump up by ~10 rows or to top
            moveFocus(-Math.min(10, focusPosition?.rowIndex ?? 0), 0);
          }
          break;

        case "PageDown":
          e.preventDefault();
          if (focusPosition?.rowIndex === totalRows - 1 && onNextPage) {
            onNextPage();
          } else {
            // Jump down by ~10 rows or to bottom
            const remaining = totalRows - 1 - (focusPosition?.rowIndex ?? 0);
            moveFocus(Math.min(10, remaining), 0);
          }
          break;

        // Selection
        case " ": // Space
          if (selectable && focusPosition !== null && !shiftKey) {
            e.preventDefault();
            const row = data[focusPosition.rowIndex];
            if (row) {
              // Toggle selection - actual selection state is managed externally
              onSelectRow?.(row.id, true);
            }
          }
          break;

        // Activate row
        case "Enter":
          if (focusPosition !== null) {
            e.preventDefault();
            const row = data[focusPosition.rowIndex];
            if (row) {
              onRowActivate?.(row);
            }
          }
          break;

        // Select all
        case "a":
        case "A":
          if (cmdOrCtrl && selectable && onSelectAll) {
            e.preventDefault();
            onSelectAll();
          }
          break;

        // Clear focus
        case "Escape":
          e.preventDefault();
          setFocus(null);
          break;

        // Tab: Move to next/prev cell
        case "Tab":
          if (focusPosition !== null) {
            e.preventDefault();
            if (shiftKey) {
              // Move to previous cell
              if (focusPosition.colIndex > 0) {
                moveFocus(0, -1);
              } else if (focusPosition.rowIndex > 0) {
                setFocus({
                  rowIndex: focusPosition.rowIndex - 1,
                  colIndex: totalColumns - 1,
                });
              }
            } else {
              // Move to next cell
              if (focusPosition.colIndex < totalColumns - 1) {
                moveFocus(0, 1);
              } else if (focusPosition.rowIndex < totalRows - 1) {
                setFocus({
                  rowIndex: focusPosition.rowIndex + 1,
                  colIndex: 0,
                });
              }
            }
          }
          break;
      }
    },
    [
      isLoading,
      totalRows,
      totalColumns,
      focusPosition,
      selectable,
      data,
      moveFocus,
      setFocus,
      onSelectRow,
      onRowActivate,
      onSelectAll,
      onPrevPage,
      onNextPage,
    ]
  );

  // Focus table when focus position is set
  useEffect(() => {
    if (focusPosition !== null && containerRef.current) {
      // Ensure the container is focusable and focused
      if (document.activeElement !== containerRef.current) {
        containerRef.current.focus();
      }
    }
  }, [focusPosition]);

  // Helper functions
  const isCellFocused = useCallback(
    (rowIndex: number, colIndex: number) => {
      return (
        focusPosition?.rowIndex === rowIndex &&
        focusPosition?.colIndex === colIndex
      );
    },
    [focusPosition]
  );

  const isRowFocused = useCallback(
    (rowIndex: number) => {
      return focusPosition?.rowIndex === rowIndex;
    },
    [focusPosition]
  );

  const getCellAriaProps = useCallback(
    (rowIndex: number, colIndex: number) => {
      const isFocused = isCellFocused(rowIndex, colIndex);
      return {
        tabIndex: isFocused ? 0 : -1,
        "aria-selected": isFocused,
        role: "gridcell",
      };
    },
    [isCellFocused]
  );

  const getContainerAriaProps = useCallback(
    () => ({
      role: "grid",
      "aria-rowcount": totalRows,
      "aria-colcount": totalColumns,
    }),
    [totalRows, totalColumns]
  );

  return {
    focusPosition,
    setFocus,
    focusFirst,
    focusLast,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    handleKeyDown,
    isCellFocused,
    isRowFocused,
    getCellAriaProps,
    getContainerAriaProps,
  };
}

export default useKeyboardNavigation;
