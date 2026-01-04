"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type {
  CellPosition,
  CellSelectionState,
  CellSelectionContext,
  UseCellSelectionOptions,
  UseCellSelectionReturn,
} from "../../types";
import { CELL_ID_SEPARATOR, getCellSelector, parseCellId, DEFAULT_KEYBOARD_PAGE_SIZE } from "../../constants";
import { useSafeRAF } from "../use-safe-raf";
import { first, last } from "../../utils/type-guards";

// ─── UTILITIES ──────────────────────────────────────────────────────────────

/**
 * Create a cell key for Set storage
 * Uses the centralized separator from constants
 */
function cellKey(rowId: string, columnKey: string): string {
  return `${rowId}${CELL_ID_SEPARATOR}${columnKey}`;
}

/**
 * Parse a cell key back to position
 * Uses the centralized parser from constants
 */
function parseKey(key: string): CellPosition {
  const parsed = parseCellId(key);
  if (!parsed) {
    // Fallback for malformed keys - should not happen in normal usage
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Invalid cell key format: ${key}`);
    }
    return { rowId: key, columnKey: "" };
  }
  return parsed;
}

// ─── HOOK ───────────────────────────────────────────────────────────────────

export function useCellSelection<T extends { id: string }>({
  data,
  columnKeys,
  onSelectionChange,
  onActiveCellChange,
  multiSelect = true,
  rangeSelect = true,
  enabled = false,
  onAnnounce,
  columnDisplayNames = {},
  getCellValue,
}: UseCellSelectionOptions<T>): UseCellSelectionReturn {
  // State
  const [state, setState] = useState<CellSelectionState>({
    selectedCells: new Set<string>(),
    activeCell: null,
    rangeAnchor: null,
    isSelecting: false,
  });

  // Refs for stable callbacks
  const dataRef = useRef(data);
  const columnKeysRef = useRef(columnKeys);
  dataRef.current = data;
  columnKeysRef.current = columnKeys;

  // Safe RAF for focus operations
  const { requestFrame } = useSafeRAF();

  // Helper to get column display name
  const getColumnDisplayName = useCallback(
    (columnKey: string) => columnDisplayNames[columnKey] || columnKey,
    [columnDisplayNames]
  );

  // Helper to announce for screen readers
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      onAnnounce?.(message, priority);
    },
    [onAnnounce]
  );

  // Build row index map for efficient lookups
  const rowIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((row, index) => map.set(row.id, index));
    return map;
  }, [data]);

  // Build column index map for efficient lookups
  const columnIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    columnKeys.forEach((key, index) => map.set(key, index));
    return map;
  }, [columnKeys]);

  // ─── SELECTION HELPERS ──────────────────────────────────────────────────────

  /**
   * Get all cells in a rectangular range between two positions
   * Uses refs for latest data to avoid stale closure issues
   */
  const getCellsInRange = useCallback(
    (start: CellPosition, end: CellPosition): Set<string> => {
      const cells = new Set<string>();

      // Use refs for latest data/columnKeys to avoid stale indices
      const currentData = dataRef.current;
      const currentColumnKeys = columnKeysRef.current;

      // Validate inputs
      if (!currentData || !Array.isArray(currentData) || currentData.length === 0) {
        return cells;
      }
      if (!currentColumnKeys || !Array.isArray(currentColumnKeys) || currentColumnKeys.length === 0) {
        return cells;
      }

      const startRowIdx = rowIndexMap.get(start.rowId) ?? -1;
      const endRowIdx = rowIndexMap.get(end.rowId) ?? -1;
      const startColIdx = columnIndexMap.get(start.columnKey) ?? -1;
      const endColIdx = columnIndexMap.get(end.columnKey) ?? -1;

      if (startRowIdx === -1 || endRowIdx === -1 || startColIdx === -1 || endColIdx === -1) {
        return cells;
      }

      const minRow = Math.min(startRowIdx, endRowIdx);
      const maxRow = Math.max(startRowIdx, endRowIdx);
      const minCol = Math.min(startColIdx, endColIdx);
      const maxCol = Math.max(startColIdx, endColIdx);

      // Clamp to actual data bounds
      const safeMaxRow = Math.min(maxRow, currentData.length - 1);
      const safeMaxCol = Math.min(maxCol, currentColumnKeys.length - 1);

      for (let rowIdx = minRow; rowIdx <= safeMaxRow; rowIdx++) {
        const row = currentData[rowIdx];
        if (!row) continue;

        for (let colIdx = minCol; colIdx <= safeMaxCol; colIdx++) {
          const colKey = currentColumnKeys[colIdx];
          if (colKey) {
            cells.add(cellKey(row.id, colKey));
          }
        }
      }

      return cells;
    },
    [data, columnKeys, rowIndexMap, columnIndexMap]
  );

  // ─── ACTIONS ────────────────────────────────────────────────────────────────

  /**
   * Select a single cell
   */
  const selectCell = useCallback(
    (cell: CellPosition, addToSelection = false) => {
      if (!enabled) return;

      const columnName = getColumnDisplayName(cell.columnKey);
      const rowIdx = rowIndexMap.get(cell.rowId);
      const rowNum = rowIdx !== undefined ? rowIdx + 1 : "?";

      setState((prev) => {
        const key = cellKey(cell.rowId, cell.columnKey);
        let newSelectedCells: Set<string>;

        if (addToSelection && multiSelect) {
          // Toggle this cell in the selection
          newSelectedCells = new Set(prev.selectedCells);
          if (newSelectedCells.has(key)) {
            newSelectedCells.delete(key);
            // Announce cell deselected
            announce(`Row ${rowNum}, ${columnName} deselected`);
          } else {
            newSelectedCells.add(key);
            // Announce cell selected
            announce(`Row ${rowNum}, ${columnName} selected`);
          }
        } else {
          // Replace selection with just this cell
          newSelectedCells = new Set([key]);
          // Announce active cell
          announce(`Row ${rowNum}, ${columnName}`);
        }

        return {
          ...prev,
          selectedCells: newSelectedCells,
          activeCell: cell,
          rangeAnchor: cell,
          isSelecting: false,
        };
      });

      onActiveCellChange?.(cell);
    },
    [enabled, multiSelect, onActiveCellChange, getColumnDisplayName, rowIndexMap, announce]
  );

  /**
   * Select a range of cells (from anchor to end)
   * When start === end, this selects a single cell with proper range styling
   */
  const selectRange = useCallback(
    (start: CellPosition, end: CellPosition) => {
      if (!enabled || !rangeSelect) return;

      const rangeCells = getCellsInRange(start, end);

      // If range selection resulted in no cells (invalid positions),
      // fall back to selecting just the end cell
      if (rangeCells.size === 0) {
        const key = cellKey(end.rowId, end.columnKey);
        rangeCells.add(key);
      }

      // Announce range selection
      const cellCount = rangeCells.size;
      if (cellCount > 1) {
        announce(`${cellCount} cells selected`);
      }

      setState((prev) => ({
        ...prev,
        selectedCells: rangeCells,
        activeCell: end,
        // Preserve rangeAnchor for subsequent range selections
        rangeAnchor: prev.rangeAnchor ?? start,
        isSelecting: false,
      }));
    },
    [enabled, rangeSelect, getCellsInRange, announce]
  );

  /**
   * Clear all selection
   */
  const clearSelection = useCallback(() => {
    setState({
      selectedCells: new Set(),
      activeCell: null,
      rangeAnchor: null,
      isSelecting: false,
    });
    onActiveCellChange?.(null);
    announce("Selection cleared");
  }, [onActiveCellChange, announce]);

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  /**
   * Check if a cell is selected
   */
  const isCellSelected = useCallback(
    (rowId: string, columnKey: string): boolean => {
      return state.selectedCells.has(cellKey(rowId, columnKey));
    },
    [state.selectedCells]
  );

  /**
   * Check if a cell is active
   */
  const isCellActive = useCallback(
    (rowId: string, columnKey: string): boolean => {
      return (
        state.activeCell?.rowId === rowId &&
        state.activeCell?.columnKey === columnKey
      );
    },
    [state.activeCell]
  );

  /**
   * Get cell selection context for rendering
   */
  const getCellSelectionContext = useCallback(
    (rowId: string, columnKey: string): CellSelectionContext => {
      const key = cellKey(rowId, columnKey);
      const isSelected = state.selectedCells.has(key);
      const isActive =
        state.activeCell?.rowId === rowId &&
        state.activeCell?.columnKey === columnKey;

      // Determine if cell is in the current selection range
      const isInRange = isSelected;

      // Calculate range edges for border styling
      const rowIdx = rowIndexMap.get(rowId) ?? -1;
      const colIdx = columnIndexMap.get(columnKey) ?? -1;

      const isRangeEdge = {
        top: false,
        right: false,
        bottom: false,
        left: false,
      };

      if (isSelected && rowIdx !== -1 && colIdx !== -1) {
        // Check adjacent cells to determine edges
        const prevRow = data[rowIdx - 1]?.id;
        const nextRow = data[rowIdx + 1]?.id;
        const prevCol = columnKeys[colIdx - 1];
        const nextCol = columnKeys[colIdx + 1];

        // Top edge if no selected cell above
        if (!prevRow || !state.selectedCells.has(cellKey(prevRow, columnKey))) {
          isRangeEdge.top = true;
        }
        // Bottom edge if no selected cell below
        if (!nextRow || !state.selectedCells.has(cellKey(nextRow, columnKey))) {
          isRangeEdge.bottom = true;
        }
        // Left edge if no selected cell to the left
        if (!prevCol || !state.selectedCells.has(cellKey(rowId, prevCol))) {
          isRangeEdge.left = true;
        }
        // Right edge if no selected cell to the right
        if (!nextCol || !state.selectedCells.has(cellKey(rowId, nextCol))) {
          isRangeEdge.right = true;
        }
      }

      return {
        isSelected,
        isActive,
        isInRange,
        isRangeEdge,
      };
    },
    [state.selectedCells, state.activeCell, data, columnKeys, rowIndexMap, columnIndexMap]
  );

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────────

  /**
   * Handle cell click
   */
  const handleCellClick = useCallback(
    (rowId: string, columnKey: string, event: React.MouseEvent) => {
      if (!enabled) return;

      const cell: CellPosition = { rowId, columnKey };

      if (event.shiftKey && rangeSelect && state.rangeAnchor) {
        // Shift+Click: extend selection from anchor to this cell
        selectRange(state.rangeAnchor, cell);
      } else if ((event.ctrlKey || event.metaKey) && multiSelect) {
        // Ctrl/Cmd+Click: add/remove this cell from selection
        selectCell(cell, true);
      } else {
        // Regular click: select only this cell
        selectCell(cell, false);
      }
    },
    [enabled, rangeSelect, multiSelect, state.rangeAnchor, selectRange, selectCell]
  );

  /**
   * Focus a cell in the DOM by its position
   */
  const focusCellElement = useCallback((cell: CellPosition) => {
    // Use safe RAF to ensure DOM has updated and cleanup on unmount
    requestFrame(() => {
      const cellElement = document.querySelector(
        getCellSelector(cell.rowId, cell.columnKey)
      );
      if (cellElement instanceof HTMLElement) {
        cellElement.focus();
      }
    });
  }, [requestFrame]);

  /**
   * Move active cell in a direction
   */
  const moveActiveCell = useCallback(
    (direction: "up" | "down" | "left" | "right", extend = false) => {
      if (!enabled || !state.activeCell) return;

      const currentRowIdx = rowIndexMap.get(state.activeCell.rowId) ?? -1;
      const currentColIdx = columnIndexMap.get(state.activeCell.columnKey) ?? -1;

      if (currentRowIdx === -1 || currentColIdx === -1) return;

      let newRowIdx = currentRowIdx;
      let newColIdx = currentColIdx;

      switch (direction) {
        case "up":
          newRowIdx = Math.max(0, currentRowIdx - 1);
          break;
        case "down":
          newRowIdx = Math.min(data.length - 1, currentRowIdx + 1);
          break;
        case "left":
          newColIdx = Math.max(0, currentColIdx - 1);
          break;
        case "right":
          newColIdx = Math.min(columnKeys.length - 1, currentColIdx + 1);
          break;
      }

      const newRow = data[newRowIdx];
      const newCol = columnKeys[newColIdx];

      if (!newRow || !newCol) return;

      const newCell: CellPosition = { rowId: newRow.id, columnKey: newCol };

      if (extend && rangeSelect && state.rangeAnchor) {
        // Shift+Arrow: extend selection
        selectRange(state.rangeAnchor, newCell);
        // Focus the new active cell (end of range)
        focusCellElement(newCell);
      } else {
        // Arrow only: move active cell
        selectCell(newCell, false);
        // Focus the new active cell
        focusCellElement(newCell);
      }
    },
    [enabled, state.activeCell, state.rangeAnchor, data, columnKeys, rowIndexMap, columnIndexMap, rangeSelect, selectRange, selectCell, focusCellElement]
  );

  /**
   * Move to next/previous cell with Tab behavior (wraps to next/previous row)
   * - Tab at last column: moves to first column of next row
   * - Shift+Tab at first column: moves to last column of previous row
   * - Tab at last cell of table: stays at last cell
   * - Shift+Tab at first cell of table: stays at first cell
   */
  const moveTabNavigation = useCallback(
    (reverse = false) => {
      if (!enabled || !state.activeCell) return;

      const currentRowIdx = rowIndexMap.get(state.activeCell.rowId) ?? -1;
      const currentColIdx = columnIndexMap.get(state.activeCell.columnKey) ?? -1;

      if (currentRowIdx === -1 || currentColIdx === -1) return;

      let newRowIdx = currentRowIdx;
      let newColIdx = currentColIdx;

      if (reverse) {
        // Shift+Tab: move left, wrap to previous row if at first column
        if (currentColIdx > 0) {
          newColIdx = currentColIdx - 1;
        } else if (currentRowIdx > 0) {
          // Wrap to last column of previous row
          newRowIdx = currentRowIdx - 1;
          newColIdx = columnKeys.length - 1;
        }
        // If at first cell (row 0, col 0), stay there
      } else {
        // Tab: move right, wrap to next row if at last column
        if (currentColIdx < columnKeys.length - 1) {
          newColIdx = currentColIdx + 1;
        } else if (currentRowIdx < data.length - 1) {
          // Wrap to first column of next row
          newRowIdx = currentRowIdx + 1;
          newColIdx = 0;
        }
        // If at last cell (last row, last col), stay there
      }

      const newRow = data[newRowIdx];
      const newCol = columnKeys[newColIdx];

      if (!newRow || !newCol) return;

      const newCell: CellPosition = { rowId: newRow.id, columnKey: newCol };

      selectCell(newCell, false);
      focusCellElement(newCell);
    },
    [enabled, state.activeCell, data, columnKeys, rowIndexMap, columnIndexMap, selectCell, focusCellElement]
  );

  /**
   * Handle keyboard navigation
   */
  const handleCellKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled || !state.activeCell) return;

      const isShift = event.shiftKey;
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          if (isCtrlOrMeta) {
            // Ctrl+Arrow: jump to first row (Excel standard)
            const firstRow = first(data);
            if (firstRow) {
              const targetCell: CellPosition = { rowId: firstRow.id, columnKey: state.activeCell.columnKey };
              if (isShift && rangeSelect && state.rangeAnchor) {
                selectRange(state.rangeAnchor, targetCell);
              } else {
                selectCell(targetCell, false);
              }
              focusCellElement(targetCell);
            }
          } else {
            moveActiveCell("up", isShift);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (isCtrlOrMeta) {
            // Ctrl+Arrow: jump to last row (Excel standard)
            const lastRow = last(data);
            if (lastRow) {
              const targetCell: CellPosition = { rowId: lastRow.id, columnKey: state.activeCell.columnKey };
              if (isShift && rangeSelect && state.rangeAnchor) {
                selectRange(state.rangeAnchor, targetCell);
              } else {
                selectCell(targetCell, false);
              }
              focusCellElement(targetCell);
            }
          } else {
            moveActiveCell("down", isShift);
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (isCtrlOrMeta) {
            // Ctrl+Arrow: jump to first column (Excel standard)
            const firstColKey = first(columnKeys);
            if (firstColKey) {
              const targetCell: CellPosition = { rowId: state.activeCell.rowId, columnKey: firstColKey };
              if (isShift && rangeSelect && state.rangeAnchor) {
                selectRange(state.rangeAnchor, targetCell);
              } else {
                selectCell(targetCell, false);
              }
              focusCellElement(targetCell);
            }
          } else {
            moveActiveCell("left", isShift);
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (isCtrlOrMeta) {
            // Ctrl+Arrow: jump to last column (Excel standard)
            const lastColKey = last(columnKeys);
            if (lastColKey) {
              const targetCell: CellPosition = { rowId: state.activeCell.rowId, columnKey: lastColKey };
              if (isShift && rangeSelect && state.rangeAnchor) {
                selectRange(state.rangeAnchor, targetCell);
              } else {
                selectCell(targetCell, false);
              }
              focusCellElement(targetCell);
            }
          } else {
            moveActiveCell("right", isShift);
          }
          break;
        case "Tab":
          event.preventDefault();
          moveTabNavigation(isShift);
          break;
        case "Enter":
          event.preventDefault();
          // Move down (or up with Shift) and focus the new cell
          {
            const currentRowIdx = rowIndexMap.get(state.activeCell.rowId) ?? -1;
            const currentColIdx = columnIndexMap.get(state.activeCell.columnKey) ?? -1;
            if (currentRowIdx !== -1 && currentColIdx !== -1) {
              const newRowIdx = isShift
                ? Math.max(0, currentRowIdx - 1)
                : Math.min(data.length - 1, currentRowIdx + 1);
              const newRow = data[newRowIdx];
              if (newRow) {
                const targetCell: CellPosition = { rowId: newRow.id, columnKey: state.activeCell.columnKey };
                selectCell(targetCell, false);
                focusCellElement(targetCell);
              }
            }
          }
          break;
        case "Escape":
          event.preventDefault();
          clearSelection();
          break;
        case "a":
        case "A":
          if (isCtrlOrMeta && multiSelect) {
            event.preventDefault();
            // Select all cells
            const allCells = new Set<string>();
            data.forEach((row) => {
              columnKeys.forEach((colKey) => {
                allCells.add(cellKey(row.id, colKey));
              });
            });
            setState((prev) => ({
              ...prev,
              selectedCells: allCells,
            }));
            announce(`All ${allCells.size} cells selected`);
          }
          break;
        case "c":
        case "C":
          if (isCtrlOrMeta) {
            event.preventDefault();
            copyToClipboard();
          }
          break;
        case "Home": {
          event.preventDefault();
          const firstRowHome = first(data);
          const firstColHome = first(columnKeys);
          if (firstRowHome && firstColHome) {
            // Ctrl+Home: first cell of table (Excel standard)
            // Home: first column of current row (Excel standard)
            const targetCell: CellPosition = isCtrlOrMeta
              ? { rowId: firstRowHome.id, columnKey: firstColHome }
              : { rowId: state.activeCell.rowId, columnKey: firstColHome };
            if (isShift && rangeSelect && state.rangeAnchor) {
              selectRange(state.rangeAnchor, targetCell);
            } else {
              selectCell(targetCell, false);
            }
            focusCellElement(targetCell);
          }
          break;
        }
        case "End": {
          event.preventDefault();
          const lastRowEnd = last(data);
          const lastColEnd = last(columnKeys);
          if (lastRowEnd && lastColEnd) {
            // Ctrl+End: last cell of table (Excel standard)
            // End: last column of current row (Excel standard)
            const targetCell: CellPosition = isCtrlOrMeta
              ? { rowId: lastRowEnd.id, columnKey: lastColEnd }
              : { rowId: state.activeCell.rowId, columnKey: lastColEnd };
            if (isShift && rangeSelect && state.rangeAnchor) {
              selectRange(state.rangeAnchor, targetCell);
            } else {
              selectCell(targetCell, false);
            }
            focusCellElement(targetCell);
          }
          break;
        }
        case "PageUp":
          event.preventDefault();
          // Move up by page (Excel standard)
          {
            const currentRowIdx = rowIndexMap.get(state.activeCell.rowId) ?? -1;
            if (currentRowIdx !== -1 && data.length > 0) {
              const newRowIdx = Math.max(0, currentRowIdx - DEFAULT_KEYBOARD_PAGE_SIZE);
              const newRow = data[newRowIdx];
              if (newRow) {
                const targetCell: CellPosition = { rowId: newRow.id, columnKey: state.activeCell.columnKey };
                if (isShift && rangeSelect && state.rangeAnchor) {
                  selectRange(state.rangeAnchor, targetCell);
                } else {
                  selectCell(targetCell, false);
                }
                focusCellElement(targetCell);
              }
            }
          }
          break;
        case "PageDown":
          event.preventDefault();
          // Move down by page (Excel standard)
          {
            const currentRowIdx = rowIndexMap.get(state.activeCell.rowId) ?? -1;
            if (currentRowIdx !== -1 && data.length > 0) {
              const newRowIdx = Math.min(data.length - 1, currentRowIdx + DEFAULT_KEYBOARD_PAGE_SIZE);
              const newRow = data[newRowIdx];
              if (newRow) {
                const targetCell: CellPosition = { rowId: newRow.id, columnKey: state.activeCell.columnKey };
                if (isShift && rangeSelect && state.rangeAnchor) {
                  selectRange(state.rangeAnchor, targetCell);
                } else {
                  selectCell(targetCell, false);
                }
                focusCellElement(targetCell);
              }
            }
          }
          break;
      }
    },
    [enabled, state.activeCell, state.rangeAnchor, data, columnKeys, moveActiveCell, moveTabNavigation, clearSelection, selectCell, selectRange, multiSelect, rangeSelect, focusCellElement]
  );

  // ─── CLIPBOARD ──────────────────────────────────────────────────────────────

  /**
   * Get selected cell values as a 2D array
   */
  const getSelectedValues = useCallback(
    <V>(getData: (rowId: string, columnKey: string) => V): V[][] => {
      if (state.selectedCells.size === 0) return [];

      // Parse all selected cells
      const selectedPositions = Array.from(state.selectedCells).map(parseKey);

      // Get unique rows and columns in order
      const rowIds = Array.from(new Set(selectedPositions.map((p) => p.rowId)));
      const colKeys = Array.from(new Set(selectedPositions.map((p) => p.columnKey)));

      // Sort by original order
      rowIds.sort((a, b) => (rowIndexMap.get(a) ?? 0) - (rowIndexMap.get(b) ?? 0));
      colKeys.sort((a, b) => (columnIndexMap.get(a) ?? 0) - (columnIndexMap.get(b) ?? 0));

      // Build 2D array
      const result: V[][] = [];
      for (const rowId of rowIds) {
        const row: V[] = [];
        for (const colKey of colKeys) {
          if (state.selectedCells.has(cellKey(rowId, colKey))) {
            row.push(getData(rowId, colKey));
          }
        }
        if (row.length > 0) {
          result.push(row);
        }
      }

      return result;
    },
    [state.selectedCells, rowIndexMap, columnIndexMap]
  );

  /**
   * Copy selected cells to clipboard as TSV (Excel-compatible)
   */
  const copyToClipboard = useCallback(async () => {
    if (!getCellValue || state.selectedCells.size === 0) {
      return;
    }

    // Get selected cell values as 2D array using the getSelectedValues helper
    const values = getSelectedValues((rowId, columnKey) => getCellValue(rowId, columnKey));

    if (values.length === 0) {
      return;
    }

    // Convert to TSV format (Tab-separated values)
    const tsvText = values
      .map(row =>
        row.map(value => {
          // Escape tabs and newlines in cell values
          const textValue = value == null ? "" : String(value).replace(/\t/g, " ").replace(/\n/g, " ");
          return textValue;
        }).join("\t")
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(tsvText);
      announce(`${state.selectedCells.size} cells copied to clipboard`);
    } catch {
      // Clipboard write failed (likely permissions)
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to copy to clipboard");
      }
    }
  }, [getCellValue, state.selectedCells, getSelectedValues, announce]);

  // ─── EFFECTS ────────────────────────────────────────────────────────────────

  // Notify when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const cells = Array.from(state.selectedCells).map(parseKey);
      onSelectionChange(cells);
    }
  }, [state.selectedCells, onSelectionChange]);

  // ─── RETURN ─────────────────────────────────────────────────────────────────

  return {
    state,
    selectCell,
    selectRange,
    clearSelection,
    isCellSelected,
    isCellActive,
    getCellSelectionContext,
    handleCellClick,
    handleCellKeyDown,
    moveActiveCell,
    copyToClipboard,
    getSelectedValues,
  };
}

export default useCellSelection;
