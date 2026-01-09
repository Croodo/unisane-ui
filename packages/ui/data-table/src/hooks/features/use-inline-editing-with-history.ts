"use client";

import { useCallback, useRef } from "react";
import type { UseInlineEditingOptions, InlineEditingController } from "../../types";
import { useInlineEditing } from "./use-inline-editing";
import { useEditHistory, type EditChange, type UseEditHistoryOptions } from "./use-edit-history";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface UseInlineEditingWithHistoryOptions<T extends { id: string }>
  extends Omit<UseInlineEditingOptions<T>, "onCellChange"> {
  /**
   * Callback when a cell value changes (after commit).
   * This is called for both direct edits and undo/redo operations.
   */
  onCellChange?: (
    rowId: string,
    columnKey: string,
    value: unknown,
    row: T
  ) => void | Promise<void>;

  /**
   * Callback for batch changes (more efficient for multi-cell undo/redo).
   * If provided, will be called instead of multiple onCellChange calls.
   */
  onBatchChange?: (
    changes: Array<{
      rowId: string;
      columnKey: string;
      value: unknown;
    }>
  ) => void | Promise<void>;

  /**
   * Maximum number of edits to keep in history.
   * @default 50
   */
  maxHistorySize?: number;

  /**
   * Whether to enable undo/redo history.
   * @default true
   */
  historyEnabled?: boolean;

  /**
   * Callback when undo is performed.
   */
  onUndo?: UseEditHistoryOptions["onUndo"];

  /**
   * Callback when redo is performed.
   */
  onRedo?: UseEditHistoryOptions["onRedo"];
}

export interface UseInlineEditingWithHistoryReturn<T extends { id: string }>
  extends InlineEditingController<T> {
  /**
   * Whether undo is available.
   */
  canUndo: boolean;

  /**
   * Whether redo is available.
   */
  canRedo: boolean;

  /**
   * Number of edits that can be undone.
   */
  undoCount: number;

  /**
   * Number of edits that can be redone.
   */
  redoCount: number;

  /**
   * Undo the last edit.
   */
  undo: () => Promise<boolean>;

  /**
   * Redo the last undone edit.
   */
  redo: () => Promise<boolean>;

  /**
   * Clear all history.
   */
  clearHistory: () => void;

  /**
   * Get description of what will be undone.
   */
  getUndoDescription: () => string | null;

  /**
   * Get description of what will be redone.
   */
  getRedoDescription: () => string | null;

  /**
   * Combined keyboard handler for editing (Enter, Escape) and history (Ctrl+Z, Ctrl+Y).
   */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook that combines inline editing with undo/redo history.
 *
 * This hook wraps `useInlineEditing` and `useEditHistory` to provide
 * a unified experience where all edits are automatically tracked
 * and can be undone/redone.
 *
 * Features:
 * - All inline edits are automatically recorded to history
 * - Undo/redo operations apply changes back to the data
 * - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo)
 * - Batch undo/redo for paste operations
 *
 * @example
 * ```tsx
 * const {
 *   // Inline editing props
 *   editingCell,
 *   startEdit,
 *   commitEdit,
 *   getCellEditProps,
 *   getInputProps,
 *   // History props
 *   canUndo,
 *   canRedo,
 *   undo,
 *   redo,
 *   handleKeyDown,
 * } = useInlineEditingWithHistory({
 *   data: rows,
 *   onCellChange: async (rowId, columnKey, value) => {
 *     await api.updateCell(rowId, columnKey, value);
 *   },
 *   maxHistorySize: 100,
 * });
 *
 * // Render
 * return (
 *   <div onKeyDown={handleKeyDown}>
 *     <button onClick={undo} disabled={!canUndo}>Undo</button>
 *     <button onClick={redo} disabled={!canRedo}>Redo</button>
 *     <DataTable ... />
 *   </div>
 * );
 * ```
 */
export function useInlineEditingWithHistory<T extends { id: string }>({
  data,
  onCellChange,
  onBatchChange,
  onCancelEdit,
  onStartEdit,
  validateCell,
  enabled = true,
  maxHistorySize = 50,
  historyEnabled = true,
  onUndo,
  onRedo,
}: UseInlineEditingWithHistoryOptions<T>): UseInlineEditingWithHistoryReturn<T> {
  // ─── REFS ────────────────────────────────────────────────────────────────

  // Track original value for history recording
  const editOriginalValueRef = useRef<unknown>(null);
  const editCellRef = useRef<{ rowId: string; columnKey: string } | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // ─── EDIT HISTORY ────────────────────────────────────────────────────────

  const editHistory = useEditHistory<unknown>({
    enabled: historyEnabled,
    maxHistorySize,
    onApplyChange: useCallback(
      async (change: EditChange<unknown>) => {
        // Find the row
        const row = dataRef.current.find((r) => r.id === change.rowId);
        if (!row) return;

        // Apply the change (newValue contains the value to apply)
        if (onCellChange) {
          await onCellChange(change.rowId, change.columnKey, change.newValue, row);
        }
      },
      [onCellChange]
    ),
    onBatchApplyChange: useCallback(
      async (changes: EditChange<unknown>[]) => {
        if (onBatchChange) {
          await onBatchChange(
            changes.map((c) => ({
              rowId: c.rowId,
              columnKey: c.columnKey,
              value: c.newValue,
            }))
          );
        } else if (onCellChange) {
          // Fall back to individual calls
          for (const change of changes) {
            const row = dataRef.current.find((r) => r.id === change.rowId);
            if (row) {
              await onCellChange(change.rowId, change.columnKey, change.newValue, row);
            }
          }
        }
      },
      [onCellChange, onBatchChange]
    ),
    onUndo,
    onRedo,
  });

  // ─── INLINE EDITING ──────────────────────────────────────────────────────

  const inlineEditing = useInlineEditing({
    data,
    enabled,
    validateCell,
    onStartEdit: useCallback(
      (rowId: string, columnKey: string) => {
        // Capture the original value for history
        const row = dataRef.current.find((r) => r.id === rowId);
        if (row) {
          const columnValue = (row as Record<string, unknown>)[columnKey];
          editOriginalValueRef.current = columnValue;
          editCellRef.current = { rowId, columnKey };
        }
        onStartEdit?.(rowId, columnKey);
      },
      [onStartEdit]
    ),
    onCancelEdit: useCallback(
      (rowId: string, columnKey: string) => {
        editOriginalValueRef.current = null;
        editCellRef.current = null;
        onCancelEdit?.(rowId, columnKey);
      },
      [onCancelEdit]
    ),
    onCellChange: useCallback(
      async (rowId: string, columnKey: string, value: unknown, row: T) => {
        // Record the edit to history BEFORE applying
        if (historyEnabled && editCellRef.current) {
          editHistory.recordCellEdit(
            rowId,
            columnKey,
            editOriginalValueRef.current,
            value,
            `Edit ${columnKey}`
          );
        }

        // Apply the change
        if (onCellChange) {
          await onCellChange(rowId, columnKey, value, row);
        }

        // Clear refs
        editOriginalValueRef.current = null;
        editCellRef.current = null;
      },
      [historyEnabled, editHistory, onCellChange]
    ),
  });

  // ─── UNDO/REDO WRAPPERS ──────────────────────────────────────────────────

  const undo = useCallback(async (): Promise<boolean> => {
    const result = await editHistory.undo();
    return result.success;
  }, [editHistory]);

  const redo = useCallback(async (): Promise<boolean> => {
    const result = await editHistory.redo();
    return result.success;
  }, [editHistory]);

  // ─── COMBINED KEYBOARD HANDLER ───────────────────────────────────────────

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Let edit history handle Ctrl+Z/Y first
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (isCtrlOrMeta && (key === "z" || key === "y")) {
        // Undo/Redo - let edit history handle it
        editHistory.handleKeyDown(event);
        return;
      }

      // Otherwise, inline editing handles Enter/Escape/Tab
      // (handled internally by getInputProps)
    },
    [editHistory]
  );

  // ─── RETURN ──────────────────────────────────────────────────────────────

  return {
    // Inline editing controller
    ...inlineEditing,
    // History state
    canUndo: editHistory.canUndo,
    canRedo: editHistory.canRedo,
    undoCount: editHistory.undoCount,
    redoCount: editHistory.redoCount,
    // History actions
    undo,
    redo,
    clearHistory: editHistory.clearHistory,
    getUndoDescription: editHistory.getUndoDescription,
    getRedoDescription: editHistory.getRedoDescription,
    // Combined keyboard handler
    handleKeyDown,
  };
}

export default useInlineEditingWithHistory;
