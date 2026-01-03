"use client";

import { useState, useCallback, useRef } from "react";
import { dequal } from "dequal";
import type { UseInlineEditingOptions, InlineEditingController, EditingCell } from "../../types";
import { getCellSelector } from "../../constants";

/**
 * Hook for managing inline cell editing in DataTable
 *
 * @example
 * ```tsx
 * const inlineEditing = useInlineEditing({
 *   data: rows,
 *   onCellChange: async (rowId, columnKey, value) => {
 *     await api.updateCell(rowId, columnKey, value);
 *   },
 *   validateCell: (rowId, columnKey, value) => {
 *     if (columnKey === "email" && !value?.toString().includes("@")) {
 *       return "Invalid email";
 *     }
 *     return null;
 *   },
 * });
 *
 * <DataTable inlineEditing={inlineEditing} ... />
 * ```
 */
export function useInlineEditing<T extends { id: string }>({
  data,
  onCellChange,
  onCancelEdit,
  onStartEdit,
  validateCell,
  enabled = true,
}: UseInlineEditingOptions<T>): InlineEditingController<T> {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [pendingValue, setPendingValue] = useState<unknown>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track original value for cancel
  const originalValueRef = useRef<unknown>(null);

  // Start editing a cell
  const startEdit = useCallback(
    (rowId: string, columnKey: string, initialValue: unknown) => {
      if (!enabled) return;

      setEditingCell({ rowId, columnKey });
      setPendingValue(initialValue);
      setValidationError(null);
      originalValueRef.current = initialValue;
      onStartEdit?.(rowId, columnKey);
    },
    [enabled, onStartEdit]
  );

  // Cancel editing and restore focus to the cell
  const cancelEdit = useCallback(() => {
    const cellToFocus = editingCell;
    if (cellToFocus) {
      onCancelEdit?.(cellToFocus.rowId, cellToFocus.columnKey);
    }
    setEditingCell(null);
    setPendingValue(null);
    setValidationError(null);
    originalValueRef.current = null;

    // Restore focus to the cell after a tick
    if (cellToFocus) {
      requestAnimationFrame(() => {
        const cellElement = document.querySelector(
          getCellSelector(cellToFocus.rowId, cellToFocus.columnKey)
        ) as HTMLElement;
        cellElement?.focus();
      });
    }
  }, [editingCell, onCancelEdit]);

  // Clear validation error without canceling edit
  // Useful for allowing retry after a failed save
  const clearError = useCallback(() => {
    setValidationError(null);
  }, []);

  // Update pending value (while typing)
  const updateValue = useCallback(
    (value: unknown) => {
      setPendingValue(value);

      // Validate on change
      if (editingCell && validateCell) {
        const error = validateCell(editingCell.rowId, editingCell.columnKey, value);
        setValidationError(error ?? null);
      } else {
        setValidationError(null);
      }
    },
    [editingCell, validateCell]
  );

  // Commit the edit
  const commitEdit = useCallback(async (): Promise<boolean> => {
    if (!editingCell) return false;

    // Run validation
    if (validateCell) {
      const error = validateCell(editingCell.rowId, editingCell.columnKey, pendingValue);
      if (error) {
        setValidationError(error);
        return false;
      }
    }

    // Find the row - handle undefined/null data gracefully
    if (!data || !Array.isArray(data)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("useInlineEditing: data is not available or not an array");
      }
      cancelEdit();
      return false;
    }

    const row = data.find((r) => r.id === editingCell.rowId);
    if (!row) {
      cancelEdit();
      return false;
    }

    // If value hasn't changed, just close and restore focus
    // Using dequal for fast deep equality comparison
    if (dequal(pendingValue, originalValueRef.current)) {
      const cellToFocus = editingCell;
      setEditingCell(null);
      setPendingValue(null);
      setValidationError(null);
      originalValueRef.current = null;

      // Restore focus to the cell after state update
      // Note: Using DOM query for focus is acceptable here because:
      // 1. It only runs once per edit commit (not in render loop)
      // 2. The query is fast (single attribute selector)
      // 3. Alternative (cell registry with refs) adds significant complexity
      requestAnimationFrame(() => {
        const cellElement = document.querySelector(
          getCellSelector(cellToFocus.rowId, cellToFocus.columnKey)
        ) as HTMLElement;
        cellElement?.focus();
      });
      return true;
    }

    // Trigger save
    const cellToFocus = editingCell;
    setIsSaving(true);
    try {
      await onCellChange?.(editingCell.rowId, editingCell.columnKey, pendingValue, row);
      setEditingCell(null);
      setPendingValue(null);
      setValidationError(null);
      originalValueRef.current = null;

      // Restore focus to the cell after successful save
      requestAnimationFrame(() => {
        const cellElement = document.querySelector(
          getCellSelector(cellToFocus.rowId, cellToFocus.columnKey)
        ) as HTMLElement;
        cellElement?.focus();
      });
      return true;
    } catch (error) {
      // If save fails, set error
      const message = error instanceof Error ? error.message : "Failed to save";
      setValidationError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editingCell, pendingValue, data, onCellChange, cancelEdit, validateCell]);

  // Retry the last failed save operation
  // Clears the error and tries to commit again
  const retryEdit = useCallback(async (): Promise<boolean> => {
    setValidationError(null);
    return commitEdit();
  }, [commitEdit]);

  // Check if a specific cell is being edited
  const isCellEditing = useCallback(
    (rowId: string, columnKey: string) => {
      return editingCell?.rowId === rowId && editingCell?.columnKey === columnKey;
    },
    [editingCell]
  );

  // Get props for a cell container
  const getCellEditProps = useCallback(
    (rowId: string, columnKey: string, value: unknown) => {
      const isEditing = isCellEditing(rowId, columnKey);

      return {
        isEditing,
        onDoubleClick: () => {
          if (!isEditing && enabled) {
            startEdit(rowId, columnKey, value);
          }
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (!isEditing && enabled) {
            // Start editing on Enter, F2, or Cmd/Ctrl+E
            // Note: F2 may not work on Mac if system intercepts it for brightness
            // Cmd/Ctrl+E provides a reliable alternative
            const isEditShortcut =
              e.key === "Enter" ||
              e.key === "F2" ||
              ((e.metaKey || e.ctrlKey) && e.key === "e");

            if (isEditShortcut) {
              e.preventDefault();
              startEdit(rowId, columnKey, value);
            } else if (e.key === "Delete") {
              // Delete key: clear cell content (Excel standard)
              e.preventDefault();
              startEdit(rowId, columnKey, "");
            } else if (e.key === "Backspace") {
              // Backspace: start editing with empty value (Excel standard)
              e.preventDefault();
              startEdit(rowId, columnKey, "");
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
              // Single character typed - start editing with the typed character as initial value
              e.preventDefault();
              startEdit(rowId, columnKey, e.key);
            }
          }
        },
      };
    },
    [isCellEditing, enabled, startEdit]
  );

  // Generate error message ID for aria-describedby linking
  const getErrorMessageId = useCallback(() => {
    if (!editingCell) return undefined;
    return `cell-error-${editingCell.rowId}-${editingCell.columnKey}`;
  }, [editingCell]);

  // Get props for the input element
  const getInputProps = useCallback(() => {
    const valueAsInput = (() => {
      if (pendingValue === null || pendingValue === undefined) return "";
      if (typeof pendingValue === "string") return pendingValue;
      if (typeof pendingValue === "number") return pendingValue;
      return String(pendingValue);
    })();

    const errorId = getErrorMessageId();

    return {
      value: valueAsInput,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        updateValue(e.target.value);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitEdit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelEdit();
        } else if (e.key === "Tab") {
          // Prevent default to control focus manually after commit
          // This fixes the race condition where focus moves before async save completes
          e.preventDefault();
          commitEdit();
          // Focus will be restored by commitEdit's requestAnimationFrame
          // Cell selection hook will handle Tab navigation after focus is restored
        }
      },
      onBlur: () => {
        // Commit on blur (clicking away)
        if (editingCell) {
          commitEdit();
        }
      },
      autoFocus: true,
      disabled: isSaving,
      "aria-invalid": !!validationError,
      "aria-describedby": validationError ? errorId : undefined,
    };
  }, [pendingValue, updateValue, commitEdit, cancelEdit, editingCell, isSaving, validationError, getErrorMessageId]);

  return {
    editingCell,
    pendingValue,
    validationError,
    isSaving,
    startEdit,
    cancelEdit,
    updateValue,
    commitEdit,
    clearError,
    retryEdit,
    isCellEditing,
    getCellEditProps,
    getInputProps,
    getErrorMessageId,
  };
}

export default useInlineEditing;
