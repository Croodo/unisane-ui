"use client";

import { useState, useCallback, useRef } from "react";
import type { UseInlineEditingOptions, InlineEditingController, EditingCell } from "../../types";

/**
 * Deep equality check for comparing cell values
 * Handles primitives, Dates, arrays, and plain objects
 */
function isEqual(a: unknown, b: unknown): boolean {
  // Strict equality for primitives
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;

  // Handle Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle different types
  if (typeof a !== typeof b) return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  // Handle plain objects
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

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

  // Cancel editing
  const cancelEdit = useCallback(() => {
    if (editingCell) {
      onCancelEdit?.(editingCell.rowId, editingCell.columnKey);
    }
    setEditingCell(null);
    setPendingValue(null);
    setValidationError(null);
    originalValueRef.current = null;
  }, [editingCell, onCancelEdit]);

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

    // Find the row
    const row = data.find((r) => r.id === editingCell.rowId);
    if (!row) {
      cancelEdit();
      return false;
    }

    // If value hasn't changed, just close
    if (isEqual(pendingValue, originalValueRef.current)) {
      setEditingCell(null);
      setPendingValue(null);
      setValidationError(null);
      originalValueRef.current = null;
      return true;
    }

    // Trigger save
    setIsSaving(true);
    try {
      await onCellChange?.(editingCell.rowId, editingCell.columnKey, pendingValue, row);
      setEditingCell(null);
      setPendingValue(null);
      setValidationError(null);
      originalValueRef.current = null;
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
            // Start editing on Enter or typing
            if (e.key === "Enter" || e.key === "F2") {
              e.preventDefault();
              startEdit(rowId, columnKey, value);
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

  // Get props for the input element
  const getInputProps = useCallback(() => {
    const valueAsInput = (() => {
      if (pendingValue === null || pendingValue === undefined) return "";
      if (typeof pendingValue === "string") return pendingValue;
      if (typeof pendingValue === "number") return pendingValue;
      return String(pendingValue);
    })();

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
          // Commit on tab and let focus move
          commitEdit();
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
    };
  }, [pendingValue, updateValue, commitEdit, cancelEdit, editingCell, isSaving, validationError]);

  return {
    editingCell,
    pendingValue,
    validationError,
    isSaving,
    startEdit,
    cancelEdit,
    updateValue,
    commitEdit,
    isCellEditing,
    getCellEditProps,
    getInputProps,
  };
}

export default useInlineEditing;
