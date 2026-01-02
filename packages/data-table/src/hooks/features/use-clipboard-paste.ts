"use client";

import { useCallback, useRef, useEffect } from "react";
import type { CellPosition } from "../../types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * Parsed clipboard data from TSV/CSV format
 */
export interface ParsedClipboardData {
  /** 2D array of cell values (rows × columns) */
  values: string[][];
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Original raw text */
  rawText: string;
}

/**
 * Cell update to be applied after paste validation
 */
export interface PasteCellUpdate<T> {
  /** Row ID */
  rowId: string;
  /** Column key */
  columnKey: string;
  /** Parsed value to apply */
  value: unknown;
  /** Original string value from clipboard */
  rawValue: string;
  /** The row data */
  row: T;
  /** Row index in data array */
  rowIndex: number;
  /** Column index in column keys array */
  columnIndex: number;
}

/**
 * Result of paste validation
 */
export interface PasteValidationResult<T> {
  /** Whether all cells passed validation */
  isValid: boolean;
  /** Cells that passed validation and can be pasted */
  validCells: PasteCellUpdate<T>[];
  /** Cells that failed validation */
  invalidCells: Array<{
    cell: PasteCellUpdate<T>;
    error: string;
  }>;
  /** Error messages for display */
  errors: string[];
}

/**
 * Result of a paste operation
 */
export interface PasteResult<T> {
  /** Whether the paste was successful */
  success: boolean;
  /** Number of cells updated */
  cellsUpdated: number;
  /** The cell updates that were applied */
  updates: PasteCellUpdate<T>[];
  /** Any errors that occurred */
  errors: string[];
}

export interface UseClipboardPasteOptions<T extends { id: string }> {
  /**
   * Whether clipboard paste is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Current data rows.
   */
  data: T[];

  /**
   * Column keys in display order.
   */
  columnKeys: string[];

  /**
   * Get the currently active cell position (paste anchor point).
   */
  getActiveCell: () => CellPosition | null;

  /**
   * Parse a raw string value into the appropriate type for a column.
   * If not provided, values are kept as strings.
   */
  parseValue?: (columnKey: string, rawValue: string, row: T) => unknown;

  /**
   * Validate a cell update before applying.
   * Return error string if invalid, null/undefined if valid.
   */
  validateCell?: (
    rowId: string,
    columnKey: string,
    value: unknown,
    row: T
  ) => string | null | undefined;

  /**
   * Callback to apply a single cell update.
   * Should update the data source.
   */
  onCellChange?: (
    rowId: string,
    columnKey: string,
    value: unknown,
    row: T
  ) => void | Promise<void>;

  /**
   * Callback for batch update (more efficient for multiple cells).
   * If provided, will be called instead of multiple onCellChange calls.
   */
  onBatchChange?: (updates: PasteCellUpdate<T>[]) => void | Promise<void>;

  /**
   * Callback when paste operation starts.
   */
  onPasteStart?: () => void;

  /**
   * Callback when paste operation completes.
   */
  onPasteComplete?: (result: PasteResult<T>) => void;

  /**
   * Callback when paste validation fails.
   * If not provided, paste will be cancelled on validation errors.
   * Return true to proceed with valid cells only.
   */
  onValidationError?: (result: PasteValidationResult<T>) => boolean | Promise<boolean>;

  /**
   * Whether to allow pasting beyond existing rows.
   * If true, will only paste to existing rows.
   * @default true
   */
  constrainToData?: boolean;

  /**
   * Whether to allow pasting beyond existing columns.
   * If true, will only paste to existing columns.
   * @default true
   */
  constrainToColumns?: boolean;

  /**
   * Custom clipboard read function (for testing or custom implementations).
   * Defaults to navigator.clipboard.readText()
   */
  readClipboard?: () => Promise<string>;
}

export interface UseClipboardPasteReturn<T extends { id: string }> {
  /**
   * Whether a paste operation is currently in progress.
   */
  isPasting: boolean;

  /**
   * Parse clipboard text into structured data.
   */
  parseClipboardText: (text: string) => ParsedClipboardData;

  /**
   * Validate a paste operation without applying it.
   */
  validatePaste: (
    clipboardData: ParsedClipboardData,
    startPosition: CellPosition
  ) => PasteValidationResult<T>;

  /**
   * Execute paste from the current active cell.
   */
  paste: () => Promise<PasteResult<T>>;

  /**
   * Execute paste from a specific position.
   */
  pasteAt: (
    startPosition: CellPosition,
    clipboardData?: ParsedClipboardData
  ) => Promise<PasteResult<T>>;

  /**
   * Copy selected cells to clipboard.
   * Requires a function to get cell values.
   */
  copy: (getCellValue: (rowId: string, columnKey: string) => unknown) => Promise<boolean>;

  /**
   * Keyboard event handler to attach to the table container.
   */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TAB = "\t";
const NEWLINE = /\r?\n/;

// ─── UTILITIES ───────────────────────────────────────────────────────────────

/**
 * Parse TSV/CSV clipboard text into a 2D array.
 * Handles both tab-separated (Excel/Sheets) and newline-separated data.
 */
function parseClipboardText(text: string): ParsedClipboardData {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return { values: [], rowCount: 0, columnCount: 0, rawText: text };
  }

  // Split by newlines first
  const lines = trimmedText.split(NEWLINE);

  // Parse each line by tabs
  const values = lines.map((line) => {
    // Split by tabs for Excel/Sheets compatibility
    return line.split(TAB);
  });

  // Get max column count
  const columnCount = Math.max(...values.map((row) => row.length), 0);

  return {
    values,
    rowCount: values.length,
    columnCount,
    rawText: text,
  };
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for handling clipboard paste operations in data tables.
 *
 * Features:
 * - Parse TSV/CSV clipboard data (Excel, Google Sheets compatible)
 * - Validate cells before pasting
 * - Support batch updates for performance
 * - Constrain paste to existing data bounds
 * - Copy selected cells to clipboard
 *
 * @example
 * ```tsx
 * const { handleKeyDown, paste } = useClipboardPaste({
 *   data: rows,
 *   columnKeys: ["name", "email", "age"],
 *   getActiveCell: () => cellSelection.state.activeCell,
 *   parseValue: (colKey, rawValue) => {
 *     if (colKey === "age") return parseInt(rawValue, 10);
 *     return rawValue;
 *   },
 *   validateCell: (rowId, colKey, value) => {
 *     if (colKey === "email" && !value?.toString().includes("@")) {
 *       return "Invalid email";
 *     }
 *     return null;
 *   },
 *   onBatchChange: async (updates) => {
 *     await api.batchUpdateCells(updates);
 *   },
 * });
 *
 * return <div onKeyDown={handleKeyDown}>...</div>;
 * ```
 */
export function useClipboardPaste<T extends { id: string }>({
  enabled = true,
  data,
  columnKeys,
  getActiveCell,
  parseValue,
  validateCell,
  onCellChange,
  onBatchChange,
  onPasteStart,
  onPasteComplete,
  onValidationError,
  constrainToData = true,
  constrainToColumns = true,
  readClipboard,
}: UseClipboardPasteOptions<T>): UseClipboardPasteReturn<T> {
  // ─── REFS ─────────────────────────────────────────────────────────────────

  const isPastingRef = useRef(false);
  const dataRef = useRef(data);
  const columnKeysRef = useRef(columnKeys);

  // Keep refs updated
  useEffect(() => {
    dataRef.current = data;
    columnKeysRef.current = columnKeys;
  }, [data, columnKeys]);

  // ─── PARSE ────────────────────────────────────────────────────────────────

  const parseClipboard = useCallback((text: string): ParsedClipboardData => {
    return parseClipboardText(text);
  }, []);

  // ─── VALIDATE ─────────────────────────────────────────────────────────────

  const validatePaste = useCallback(
    (
      clipboardData: ParsedClipboardData,
      startPosition: CellPosition
    ): PasteValidationResult<T> => {
      const currentData = dataRef.current;
      const currentColumnKeys = columnKeysRef.current;

      const validCells: PasteCellUpdate<T>[] = [];
      const invalidCells: Array<{ cell: PasteCellUpdate<T>; error: string }> = [];
      const errors: string[] = [];

      // Find start indices
      const startRowIndex = currentData.findIndex((row) => row.id === startPosition.rowId);
      const startColIndex = currentColumnKeys.indexOf(startPosition.columnKey);

      if (startRowIndex === -1) {
        errors.push(`Start row not found: ${startPosition.rowId}`);
        return { isValid: false, validCells, invalidCells, errors };
      }

      if (startColIndex === -1) {
        errors.push(`Start column not found: ${startPosition.columnKey}`);
        return { isValid: false, validCells, invalidCells, errors };
      }

      // Process each cell in clipboard data
      for (let rowOffset = 0; rowOffset < clipboardData.rowCount; rowOffset++) {
        const targetRowIndex = startRowIndex + rowOffset;

        // Check row bounds
        if (constrainToData && targetRowIndex >= currentData.length) {
          continue; // Skip rows beyond data bounds
        }

        const row = currentData[targetRowIndex];
        if (!row) continue;

        const clipboardRow = clipboardData.values[rowOffset];
        if (!clipboardRow) continue;

        for (let colOffset = 0; colOffset < clipboardRow.length; colOffset++) {
          const targetColIndex = startColIndex + colOffset;

          // Check column bounds
          if (constrainToColumns && targetColIndex >= currentColumnKeys.length) {
            continue; // Skip columns beyond column bounds
          }

          const columnKey = currentColumnKeys[targetColIndex];
          if (!columnKey) continue;

          const rawValue = clipboardRow[colOffset] ?? "";

          // Parse value
          const parsedValue = parseValue ? parseValue(columnKey, rawValue, row) : rawValue;

          const cellUpdate: PasteCellUpdate<T> = {
            rowId: row.id,
            columnKey,
            value: parsedValue,
            rawValue,
            row,
            rowIndex: targetRowIndex,
            columnIndex: targetColIndex,
          };

          // Validate
          if (validateCell) {
            const error = validateCell(row.id, columnKey, parsedValue, row);
            if (error) {
              invalidCells.push({ cell: cellUpdate, error });
              errors.push(`Cell (${row.id}, ${columnKey}): ${error}`);
              continue;
            }
          }

          validCells.push(cellUpdate);
        }
      }

      return {
        isValid: invalidCells.length === 0,
        validCells,
        invalidCells,
        errors,
      };
    },
    [constrainToData, constrainToColumns, parseValue, validateCell]
  );

  // ─── PASTE ────────────────────────────────────────────────────────────────

  const pasteAt = useCallback(
    async (
      startPosition: CellPosition,
      clipboardData?: ParsedClipboardData
    ): Promise<PasteResult<T>> => {
      if (!enabled || isPastingRef.current) {
        return { success: false, cellsUpdated: 0, updates: [], errors: ["Paste not enabled or already in progress"] };
      }

      isPastingRef.current = true;
      onPasteStart?.();

      try {
        // Get clipboard data if not provided
        let data = clipboardData;
        if (!data) {
          const clipboardReader = readClipboard || (() => navigator.clipboard.readText());
          const text = await clipboardReader();
          data = parseClipboard(text);
        }

        if (data.rowCount === 0 || data.columnCount === 0) {
          const result: PasteResult<T> = {
            success: false,
            cellsUpdated: 0,
            updates: [],
            errors: ["No data to paste"],
          };
          onPasteComplete?.(result);
          return result;
        }

        // Validate
        const validation = validatePaste(data, startPosition);

        if (!validation.isValid) {
          // Ask if we should proceed with valid cells only
          let shouldProceed = false;
          if (onValidationError) {
            shouldProceed = await onValidationError(validation);
          }

          if (!shouldProceed || validation.validCells.length === 0) {
            const result: PasteResult<T> = {
              success: false,
              cellsUpdated: 0,
              updates: [],
              errors: validation.errors,
            };
            onPasteComplete?.(result);
            return result;
          }
        }

        // Apply changes
        const cellsToUpdate = validation.validCells;

        if (onBatchChange) {
          // Use batch update
          await onBatchChange(cellsToUpdate);
        } else if (onCellChange) {
          // Update cells one by one
          for (const update of cellsToUpdate) {
            await onCellChange(update.rowId, update.columnKey, update.value, update.row);
          }
        }

        const result: PasteResult<T> = {
          success: true,
          cellsUpdated: cellsToUpdate.length,
          updates: cellsToUpdate,
          errors: validation.errors,
        };

        onPasteComplete?.(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Paste failed";
        const result: PasteResult<T> = {
          success: false,
          cellsUpdated: 0,
          updates: [],
          errors: [errorMessage],
        };
        onPasteComplete?.(result);
        return result;
      } finally {
        isPastingRef.current = false;
      }
    },
    [
      enabled,
      parseClipboard,
      validatePaste,
      onPasteStart,
      onPasteComplete,
      onValidationError,
      onBatchChange,
      onCellChange,
      readClipboard,
    ]
  );

  const paste = useCallback(async (): Promise<PasteResult<T>> => {
    const activeCell = getActiveCell();
    if (!activeCell) {
      return {
        success: false,
        cellsUpdated: 0,
        updates: [],
        errors: ["No active cell selected"],
      };
    }
    return pasteAt(activeCell);
  }, [getActiveCell, pasteAt]);

  // ─── COPY ─────────────────────────────────────────────────────────────────

  const copy = useCallback(
    async (getCellValue: (rowId: string, columnKey: string) => unknown): Promise<boolean> => {
      if (!enabled) return false;

      // This function needs to be called with cell selection data
      // The actual implementation depends on how cells are selected
      // For now, just copy the active cell value

      const activeCell = getActiveCell();
      if (!activeCell) return false;

      try {
        const value = getCellValue(activeCell.rowId, activeCell.columnKey);
        const textValue = value == null ? "" : String(value);
        await navigator.clipboard.writeText(textValue);
        return true;
      } catch {
        return false;
      }
    },
    [enabled, getActiveCell]
  );

  // ─── KEYBOARD HANDLER ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled) return;

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (isCtrlOrMeta && event.key.toLowerCase() === "v") {
        event.preventDefault();
        paste();
      }
    },
    [enabled, paste]
  );

  // ─── RETURN ───────────────────────────────────────────────────────────────

  return {
    isPasting: isPastingRef.current,
    parseClipboardText: parseClipboard,
    validatePaste,
    paste,
    pasteAt,
    copy,
    handleKeyDown,
  };
}

export default useClipboardPaste;
