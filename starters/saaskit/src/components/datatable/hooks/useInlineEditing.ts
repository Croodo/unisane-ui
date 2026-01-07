"use client";

import { useCallback, useState, useMemo } from "react";

export interface EditingCell {
  rowId: string;
  columnKey: string;
}

export interface UseInlineEditingOptions<T extends { id: string }> {
  /** Data rows */
  data: T[];
  /** Callback when a cell value changes */
  onCellChange?: (
    rowId: string,
    columnKey: string,
    value: unknown,
    row: T
  ) => void | Promise<void>;
  /** Callback when editing is cancelled */
  onCancelEdit?: (rowId: string, columnKey: string) => void;
  /** Callback when editing starts */
  onStartEdit?: (rowId: string, columnKey: string) => void;
  /** Validate cell value before committing */
  validateCell?: (
    rowId: string,
    columnKey: string,
    value: unknown
  ) => string | null | undefined;
  /** Whether editing is enabled */
  enabled?: boolean | undefined;
}

export interface UseInlineEditingReturn<T extends { id: string }> {
  /** Currently editing cell */
  editingCell: EditingCell | null;
  /** Pending value being edited */
  pendingValue: unknown;
  /** Validation error for current edit */
  validationError: string | null;
  /** Whether currently saving */
  isSaving: boolean;
  /** The full row being edited (if any) */
  editingRow: T | null;
  /** Start editing a cell */
  startEdit: (rowId: string, columnKey: string, initialValue: unknown) => void;
  /** Cancel editing */
  cancelEdit: () => void;
  /** Update pending value */
  updateValue: (value: unknown) => void;
  /** Commit the edit */
  commitEdit: () => Promise<boolean>;
  /** Check if a cell is being edited */
  isCellEditing: (rowId: string, columnKey: string) => boolean;
  /** Get editing props for a cell */
  getCellEditProps: (
    rowId: string,
    columnKey: string,
    value: unknown
  ) => {
    isEditing: boolean;
    onDoubleClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
  /** Get input props for the editing input */
  getInputProps: () => {
    value: string | number | readonly string[] | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onBlur: () => void;
    autoFocus: boolean;
    disabled: boolean;
    "aria-invalid": boolean;
  };
}

/**
 * Hook to manage inline cell editing in DataTable
 *
 * @example
 * ```tsx
 * const editing = useInlineEditing({
 *   data: items,
 *   onCellChange: async (rowId, columnKey, value) => {
 *     await updateItem(rowId, { [columnKey]: value });
 *   },
 *   validateCell: (rowId, columnKey, value) => {
 *     if (columnKey === 'email' && !value?.includes('@')) {
 *       return 'Invalid email';
 *     }
 *     return null;
 *   },
 * });
 *
 * // In column render:
 * {editing.isCellEditing(row.id, 'name') ? (
 *   <input {...editing.getInputProps()} />
 * ) : (
 *   <span {...editing.getCellEditProps(row.id, 'name', row.name)}>
 *     {row.name}
 *   </span>
 * )}
 * ```
 */
export function useInlineEditing<T extends { id: string }>({
  data,
  onCellChange,
  onCancelEdit,
  onStartEdit,
  validateCell,
  enabled = true,
}: UseInlineEditingOptions<T>): UseInlineEditingReturn<T> {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [pendingValue, setPendingValue] = useState<unknown>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Find the row being edited
  const editingRow = useMemo<T | null>(() => {
    if (!editingCell) return null;
    const row = data.find((item) => item.id === editingCell.rowId);
    return row ?? null;
  }, [editingCell, data]);

  const startEdit = useCallback(
    (rowId: string, columnKey: string, initialValue: unknown) => {
      if (!enabled) return;

      setEditingCell({ rowId, columnKey });
      setPendingValue(initialValue);
      setValidationError(null);
      onStartEdit?.(rowId, columnKey);
    },
    [enabled, onStartEdit]
  );

  const cancelEdit = useCallback(() => {
    if (editingCell) {
      onCancelEdit?.(editingCell.rowId, editingCell.columnKey);
    }
    setEditingCell(null);
    setPendingValue(null);
    setValidationError(null);
  }, [editingCell, onCancelEdit]);

  const updateValue = useCallback(
    (value: unknown) => {
      setPendingValue(value);

      // Validate on change
      if (editingCell && validateCell) {
        const error = validateCell(
          editingCell.rowId,
          editingCell.columnKey,
          value
        );
        setValidationError(error ?? null);
      } else {
        setValidationError(null);
      }
    },
    [editingCell, validateCell]
  );

  const commitEdit = useCallback(async (): Promise<boolean> => {
    if (!editingCell || !editingRow) return false;

    // Validate before commit
    if (validateCell) {
      const error = validateCell(
        editingCell.rowId,
        editingCell.columnKey,
        pendingValue
      );
      if (error) {
        setValidationError(error);
        return false;
      }
    }

    // Commit the change
    if (onCellChange) {
      setIsSaving(true);
      try {
        await onCellChange(
          editingCell.rowId,
          editingCell.columnKey,
          pendingValue,
          editingRow
        );
        setEditingCell(null);
        setPendingValue(null);
        setValidationError(null);
        return true;
      } catch (error) {
        console.error("Error saving cell:", error);
        setValidationError(
          error instanceof Error ? error.message : "Failed to save"
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    }

    // No handler, just close
    setEditingCell(null);
    setPendingValue(null);
    return true;
  }, [editingCell, editingRow, pendingValue, validateCell, onCellChange]);

  const isCellEditing = useCallback(
    (rowId: string, columnKey: string): boolean => {
      return (
        editingCell?.rowId === rowId && editingCell?.columnKey === columnKey
      );
    },
    [editingCell]
  );

  const getCellEditProps = useCallback(
    (rowId: string, columnKey: string, value: unknown) => ({
      isEditing: isCellEditing(rowId, columnKey),
      onDoubleClick: () => startEdit(rowId, columnKey, value),
      onKeyDown: (e: React.KeyboardEvent) => {
        // F2 to start editing
        if (e.key === "F2" && enabled) {
          e.preventDefault();
          startEdit(rowId, columnKey, value);
        }
      },
    }),
    [isCellEditing, startEdit, enabled]
  );

  const getInputProps = useCallback(
    () => ({
      value: pendingValue as string | number | readonly string[] | undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        updateValue(e.target.value);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          void commitEdit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelEdit();
        } else if (e.key === "Tab") {
          // Optionally move to next editable cell
          void commitEdit();
        }
      },
      onBlur: () => {
        // Auto-commit on blur if no validation error
        if (!validationError) {
          void commitEdit();
        }
      },
      autoFocus: true,
      disabled: isSaving,
      "aria-invalid": !!validationError,
    }),
    [
      pendingValue,
      updateValue,
      commitEdit,
      cancelEdit,
      validationError,
      isSaving,
    ]
  );

  return {
    editingCell,
    pendingValue,
    validationError,
    isSaving,
    editingRow,
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
