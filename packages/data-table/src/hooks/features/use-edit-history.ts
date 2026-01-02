"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * A single edit entry in the history stack
 */
export interface EditHistoryEntry<T = unknown> {
  /** Unique ID for this edit */
  id: string;
  /** Timestamp of the edit */
  timestamp: number;
  /** Type of edit operation */
  type: "cell" | "batch" | "paste" | "delete" | "custom";
  /** Description for display/debugging */
  description?: string;
  /** The changes made - array for batch edits */
  changes: EditChange<T>[];
}

/**
 * A single cell change within an edit
 */
export interface EditChange<T = unknown> {
  /** Row ID */
  rowId: string;
  /** Column key */
  columnKey: string;
  /** Value before the edit */
  previousValue: T;
  /** Value after the edit */
  newValue: T;
}

/**
 * Result of an undo/redo operation
 */
export interface UndoRedoResult<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** The edit that was undone/redone */
  entry: EditHistoryEntry<T> | null;
  /** Error message if failed */
  error?: string;
}

export interface UseEditHistoryOptions<T = unknown> {
  /**
   * Maximum number of edits to keep in history.
   * @default 50
   */
  maxHistorySize?: number;

  /**
   * Whether to enable the history tracking.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback to apply an edit change (for undo/redo).
   * This should update the data source.
   */
  onApplyChange?: (change: EditChange<T>) => void | Promise<void>;

  /**
   * Callback for batch apply (more efficient for multi-cell undo/redo).
   */
  onBatchApplyChange?: (changes: EditChange<T>[]) => void | Promise<void>;

  /**
   * Callback when undo is performed.
   */
  onUndo?: (entry: EditHistoryEntry<T>) => void;

  /**
   * Callback when redo is performed.
   */
  onRedo?: (entry: EditHistoryEntry<T>) => void;

  /**
   * Callback when history changes.
   */
  onHistoryChange?: (history: EditHistoryEntry<T>[], redoStack: EditHistoryEntry<T>[]) => void;
}

export interface UseEditHistoryReturn<T = unknown> {
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
   * The undo history stack (oldest first).
   */
  history: EditHistoryEntry<T>[];

  /**
   * The redo stack (most recent undo first).
   */
  redoStack: EditHistoryEntry<T>[];

  /**
   * Record a new edit to the history.
   */
  recordEdit: (
    type: EditHistoryEntry<T>["type"],
    changes: EditChange<T>[],
    description?: string
  ) => string;

  /**
   * Record a single cell edit.
   */
  recordCellEdit: (
    rowId: string,
    columnKey: string,
    previousValue: T,
    newValue: T,
    description?: string
  ) => string;

  /**
   * Undo the last edit.
   */
  undo: () => Promise<UndoRedoResult<T>>;

  /**
   * Redo the last undone edit.
   */
  redo: () => Promise<UndoRedoResult<T>>;

  /**
   * Clear all history.
   */
  clearHistory: () => void;

  /**
   * Get the last edit in history.
   */
  getLastEdit: () => EditHistoryEntry<T> | null;

  /**
   * Get description of what will be undone.
   */
  getUndoDescription: () => string | null;

  /**
   * Get description of what will be redone.
   */
  getRedoDescription: () => string | null;

  /**
   * Keyboard event handler for Ctrl+Z (undo) and Ctrl+Y/Ctrl+Shift+Z (redo).
   */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_MAX_HISTORY_SIZE = 50;

// ─── UTILITIES ───────────────────────────────────────────────────────────────

let editIdCounter = 0;

function generateEditId(): string {
  return `edit-${Date.now()}-${++editIdCounter}`;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for managing edit history with undo/redo functionality.
 *
 * Features:
 * - Tracks cell edits in a history stack
 * - Supports undo (Ctrl+Z) and redo (Ctrl+Y or Ctrl+Shift+Z)
 * - Configurable history size limit
 * - Batch edit support for multi-cell operations
 * - Callbacks for applying changes
 *
 * @example
 * ```tsx
 * const editHistory = useEditHistory({
 *   maxHistorySize: 100,
 *   onApplyChange: async (change) => {
 *     await api.updateCell(change.rowId, change.columnKey, change.newValue);
 *   },
 *   onUndo: (entry) => console.log("Undid:", entry.description),
 * });
 *
 * // Record an edit
 * editHistory.recordCellEdit(rowId, columnKey, oldValue, newValue);
 *
 * // Undo/Redo
 * await editHistory.undo();
 * await editHistory.redo();
 *
 * // Keyboard support
 * <div onKeyDown={editHistory.handleKeyDown}>...</div>
 * ```
 */
export function useEditHistory<T = unknown>({
  maxHistorySize = DEFAULT_MAX_HISTORY_SIZE,
  enabled = true,
  onApplyChange,
  onBatchApplyChange,
  onUndo,
  onRedo,
  onHistoryChange,
}: UseEditHistoryOptions<T> = {}): UseEditHistoryReturn<T> {
  // ─── STATE ────────────────────────────────────────────────────────────────

  const [history, setHistory] = useState<EditHistoryEntry<T>[]>([]);
  const [redoStack, setRedoStack] = useState<EditHistoryEntry<T>[]>([]);

  // Refs for stable callbacks
  const isProcessingRef = useRef(false);

  // ─── DERIVED STATE ────────────────────────────────────────────────────────

  const canUndo = enabled && history.length > 0;
  const canRedo = enabled && redoStack.length > 0;
  const undoCount = history.length;
  const redoCount = redoStack.length;

  // ─── HISTORY CHANGE CALLBACK ──────────────────────────────────────────────

  useEffect(() => {
    onHistoryChange?.(history, redoStack);
  }, [history, redoStack, onHistoryChange]);

  // ─── RECORD EDIT ──────────────────────────────────────────────────────────

  const recordEdit = useCallback(
    (
      type: EditHistoryEntry<T>["type"],
      changes: EditChange<T>[],
      description?: string
    ): string => {
      if (!enabled || changes.length === 0) {
        return "";
      }

      const entry: EditHistoryEntry<T> = {
        id: generateEditId(),
        timestamp: Date.now(),
        type,
        description,
        changes,
      };

      setHistory((prev) => {
        const newHistory = [...prev, entry];
        // Trim to max size
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(-maxHistorySize);
        }
        return newHistory;
      });

      // Clear redo stack when a new edit is made
      setRedoStack([]);

      return entry.id;
    },
    [enabled, maxHistorySize]
  );

  const recordCellEdit = useCallback(
    (
      rowId: string,
      columnKey: string,
      previousValue: T,
      newValue: T,
      description?: string
    ): string => {
      const change: EditChange<T> = {
        rowId,
        columnKey,
        previousValue,
        newValue,
      };

      return recordEdit(
        "cell",
        [change],
        description ?? `Edit ${columnKey}`
      );
    },
    [recordEdit]
  );

  // ─── UNDO ─────────────────────────────────────────────────────────────────

  const undo = useCallback(async (): Promise<UndoRedoResult<T>> => {
    if (!enabled || !canUndo || isProcessingRef.current) {
      return {
        success: false,
        entry: null,
        error: !enabled ? "History disabled" : !canUndo ? "Nothing to undo" : "Already processing",
      };
    }

    isProcessingRef.current = true;

    try {
      // Get the last entry
      const lastEntry = history[history.length - 1];
      if (!lastEntry) {
        return { success: false, entry: null, error: "No entry to undo" };
      }

      // Apply the reverse changes
      const reverseChanges = lastEntry.changes.map((change) => ({
        ...change,
        previousValue: change.newValue,
        newValue: change.previousValue,
      }));

      if (onBatchApplyChange && reverseChanges.length > 1) {
        await onBatchApplyChange(reverseChanges);
      } else if (onApplyChange) {
        for (const change of reverseChanges) {
          await onApplyChange(change);
        }
      }

      // Move entry from history to redo stack
      setHistory((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [lastEntry, ...prev]);

      onUndo?.(lastEntry);

      return { success: true, entry: lastEntry };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Undo failed";
      return { success: false, entry: null, error: message };
    } finally {
      isProcessingRef.current = false;
    }
  }, [enabled, canUndo, history, onApplyChange, onBatchApplyChange, onUndo]);

  // ─── REDO ─────────────────────────────────────────────────────────────────

  const redo = useCallback(async (): Promise<UndoRedoResult<T>> => {
    if (!enabled || !canRedo || isProcessingRef.current) {
      return {
        success: false,
        entry: null,
        error: !enabled ? "History disabled" : !canRedo ? "Nothing to redo" : "Already processing",
      };
    }

    isProcessingRef.current = true;

    try {
      // Get the first entry from redo stack
      const redoEntry = redoStack[0];
      if (!redoEntry) {
        return { success: false, entry: null, error: "No entry to redo" };
      }

      // Apply the original changes
      if (onBatchApplyChange && redoEntry.changes.length > 1) {
        await onBatchApplyChange(redoEntry.changes);
      } else if (onApplyChange) {
        for (const change of redoEntry.changes) {
          await onApplyChange(change);
        }
      }

      // Move entry from redo stack back to history
      setRedoStack((prev) => prev.slice(1));
      setHistory((prev) => [...prev, redoEntry]);

      onRedo?.(redoEntry);

      return { success: true, entry: redoEntry };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Redo failed";
      return { success: false, entry: null, error: message };
    } finally {
      isProcessingRef.current = false;
    }
  }, [enabled, canRedo, redoStack, onApplyChange, onBatchApplyChange, onRedo]);

  // ─── UTILITIES ────────────────────────────────────────────────────────────

  const clearHistory = useCallback(() => {
    setHistory([]);
    setRedoStack([]);
  }, []);

  const getLastEdit = useCallback((): EditHistoryEntry<T> | null => {
    return history[history.length - 1] ?? null;
  }, [history]);

  const getUndoDescription = useCallback((): string | null => {
    const lastEntry = history[history.length - 1];
    if (!lastEntry) return null;
    return lastEntry.description ?? `Undo ${lastEntry.type} edit`;
  }, [history]);

  const getRedoDescription = useCallback((): string | null => {
    const redoEntry = redoStack[0];
    if (!redoEntry) return null;
    return redoEntry.description ?? `Redo ${redoEntry.type} edit`;
  }, [redoStack]);

  // ─── KEYBOARD HANDLER ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled) return;

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (isCtrlOrMeta && event.key.toLowerCase() === "z") {
        if (event.shiftKey) {
          // Ctrl+Shift+Z = Redo
          event.preventDefault();
          redo();
        } else {
          // Ctrl+Z = Undo
          event.preventDefault();
          undo();
        }
      } else if (isCtrlOrMeta && event.key.toLowerCase() === "y") {
        // Ctrl+Y = Redo
        event.preventDefault();
        redo();
      }
    },
    [enabled, undo, redo]
  );

  // ─── RETURN ───────────────────────────────────────────────────────────────

  return {
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    history,
    redoStack,
    recordEdit,
    recordCellEdit,
    undo,
    redo,
    clearHistory,
    getLastEdit,
    getUndoDescription,
    getRedoDescription,
    handleKeyDown,
  };
}

export default useEditHistory;
