"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type {
  CellPosition,
  CellSelectionState,
  CellSelectionContext,
  UseCellSelectionOptions,
  UseCellSelectionReturn,
} from "../../types";

// ─── UTILITIES ──────────────────────────────────────────────────────────────

/**
 * Separator for cell keys. Using a double pipe which is unlikely to appear
 * in row IDs or column keys. This fixes the bug where IDs containing ":"
 * would break the parseKey function.
 */
const CELL_KEY_SEPARATOR = "||";

/**
 * Create a cell key for Set storage
 * Uses a safe separator that won't conflict with typical ID formats
 */
function cellKey(rowId: string, columnKey: string): string {
  return `${rowId}${CELL_KEY_SEPARATOR}${columnKey}`;
}

/**
 * Parse a cell key back to position
 * Uses indexOf to find the first separator, ensuring correct parsing
 * even if the separator appears in the columnKey (unlikely but safe)
 */
function parseKey(key: string): CellPosition {
  const separatorIndex = key.indexOf(CELL_KEY_SEPARATOR);
  if (separatorIndex === -1) {
    // Fallback for malformed keys - should not happen in normal usage
    console.warn(`Invalid cell key format: ${key}`);
    return { rowId: key, columnKey: "" };
  }
  const rowId = key.slice(0, separatorIndex);
  const columnKey = key.slice(separatorIndex + CELL_KEY_SEPARATOR.length);
  return { rowId, columnKey };
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

      setState((prev) => {
        const key = cellKey(cell.rowId, cell.columnKey);
        let newSelectedCells: Set<string>;

        if (addToSelection && multiSelect) {
          // Toggle this cell in the selection
          newSelectedCells = new Set(prev.selectedCells);
          if (newSelectedCells.has(key)) {
            newSelectedCells.delete(key);
          } else {
            newSelectedCells.add(key);
          }
        } else {
          // Replace selection with just this cell
          newSelectedCells = new Set([key]);
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
    [enabled, multiSelect, onActiveCellChange]
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

      setState((prev) => ({
        ...prev,
        selectedCells: rangeCells,
        activeCell: end,
        // Preserve rangeAnchor for subsequent range selections
        rangeAnchor: prev.rangeAnchor ?? start,
        isSelecting: false,
      }));
    },
    [enabled, rangeSelect, getCellsInRange]
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
  }, [onActiveCellChange]);

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
      } else {
        // Arrow only: move active cell
        selectCell(newCell, false);
      }
    },
    [enabled, state.activeCell, state.rangeAnchor, data, columnKeys, rowIndexMap, columnIndexMap, rangeSelect, selectRange, selectCell]
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
          moveActiveCell("up", isShift);
          break;
        case "ArrowDown":
          event.preventDefault();
          moveActiveCell("down", isShift);
          break;
        case "ArrowLeft":
          event.preventDefault();
          moveActiveCell("left", isShift);
          break;
        case "ArrowRight":
          event.preventDefault();
          moveActiveCell("right", isShift);
          break;
        case "Tab":
          event.preventDefault();
          moveActiveCell(isShift ? "left" : "right", false);
          break;
        case "Enter":
          event.preventDefault();
          moveActiveCell(isShift ? "up" : "down", false);
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
          }
          break;
        case "c":
        case "C":
          if (isCtrlOrMeta) {
            event.preventDefault();
            copyToClipboard();
          }
          break;
        case "Home":
          event.preventDefault();
          if (data.length > 0 && columnKeys.length > 0) {
            const firstCell: CellPosition = { rowId: data[0]!.id, columnKey: columnKeys[0]! };
            if (isShift && rangeSelect && state.rangeAnchor) {
              selectRange(state.rangeAnchor, firstCell);
            } else {
              selectCell(firstCell, false);
            }
          }
          break;
        case "End":
          event.preventDefault();
          if (data.length > 0 && columnKeys.length > 0) {
            const lastCell: CellPosition = {
              rowId: data[data.length - 1]!.id,
              columnKey: columnKeys[columnKeys.length - 1]!,
            };
            if (isShift && rangeSelect && state.rangeAnchor) {
              selectRange(state.rangeAnchor, lastCell);
            } else {
              selectCell(lastCell, false);
            }
          }
          break;
      }
    },
    [enabled, state.activeCell, state.rangeAnchor, data, columnKeys, moveActiveCell, clearSelection, selectCell, selectRange, multiSelect, rangeSelect]
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
    // This will be called by the consumer with actual data
    // For now, we just notify that copy was requested
    // The actual implementation needs to be done at the component level
    // where we have access to the actual cell values
  }, []);

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
