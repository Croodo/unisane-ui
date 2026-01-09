"use client";

import { useState, useCallback, useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ActionDialogType = string;

export interface ActionDialogState<T> {
  /** The type/key of the currently open dialog */
  type: ActionDialogType | null;
  /** The row data for the action */
  row: T | null;
  /** Whether any dialog is open */
  isOpen: boolean;
}

export interface UseActionDialogOptions {
  /** Callback when any dialog closes */
  onClose?: () => void;
}

export interface UseActionDialogReturn<T> {
  /** Current dialog state */
  state: ActionDialogState<T>;
  /** Open a dialog for a specific action type with row data */
  openDialog: (type: ActionDialogType, row: T) => void;
  /** Close the currently open dialog */
  closeDialog: () => void;
  /** Check if a specific dialog type is open */
  isDialogOpen: (type: ActionDialogType) => boolean;
  /** Get props for a specific dialog type */
  getDialogProps: (type: ActionDialogType) => {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
  /** The currently selected row (convenience accessor) */
  selectedRow: T | null;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Hook to manage action dialog state for row-level actions.
 * Reduces boilerplate when handling edit, delete, view, and other dialogs.
 *
 * @example
 * ```tsx
 * function UsersTable({ data }: { data: User[] }) {
 *   const { openDialog, getDialogProps, selectedRow, closeDialog } = useActionDialog<User>();
 *
 *   const actionItems = [
 *     { key: "edit", label: "Edit", onClick: (row) => openDialog("edit", row) },
 *     { key: "delete", label: "Delete", onClick: (row) => openDialog("delete", row) },
 *   ];
 *
 *   return (
 *     <>
 *       <DataTable ... />
 *
 *       <EditUserSheet {...getDialogProps("edit")} user={selectedRow} />
 *
 *       <ConfirmDialog
 *         {...getDialogProps("delete")}
 *         title="Delete user?"
 *         description={`This will permanently delete ${selectedRow?.name}.`}
 *         onConfirm={() => {
 *           deleteUser(selectedRow.id);
 *           closeDialog();
 *         }}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useActionDialog<T>(
  options: UseActionDialogOptions = {}
): UseActionDialogReturn<T> {
  const { onClose } = options;

  const [state, setState] = useState<ActionDialogState<T>>({
    type: null,
    row: null,
    isOpen: false,
  });

  const openDialog = useCallback((type: ActionDialogType, row: T) => {
    setState({ type, row, isOpen: true });
  }, []);

  const closeDialog = useCallback(() => {
    setState({ type: null, row: null, isOpen: false });
    onClose?.();
  }, [onClose]);

  const isDialogOpen = useCallback(
    (type: ActionDialogType) => state.isOpen && state.type === type,
    [state.isOpen, state.type]
  );

  const getDialogProps = useCallback(
    (type: ActionDialogType) => ({
      open: state.isOpen && state.type === type,
      onOpenChange: (open: boolean) => {
        if (!open) closeDialog();
      },
    }),
    [state.isOpen, state.type, closeDialog]
  );

  return useMemo(
    () => ({
      state,
      openDialog,
      closeDialog,
      isDialogOpen,
      getDialogProps,
      selectedRow: state.row,
    }),
    [state, openDialog, closeDialog, isDialogOpen, getDialogProps]
  );
}

// ─── CONFIRM DIALOG HELPER ────────────────────────────────────────────────────

export interface ConfirmActionOptions<T> {
  /** The row to perform the action on */
  row: T;
  /** Async action to perform on confirm */
  action: (row: T) => Promise<void> | void;
  /** Callback after successful action */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseConfirmActionReturn {
  /** Whether the action is currently executing */
  isLoading: boolean;
  /** Execute the confirm action */
  execute: () => Promise<void>;
}

/**
 * Hook to handle confirm dialog actions with loading state.
 *
 * @example
 * ```tsx
 * const { isLoading, execute } = useConfirmAction({
 *   row: selectedUser,
 *   action: async (user) => await deleteUser(user.id),
 *   onSuccess: () => {
 *     closeDialog();
 *     toast.success("User deleted");
 *   },
 * });
 *
 * <ConfirmDialog
 *   onConfirm={execute}
 *   loading={isLoading}
 * />
 * ```
 */
export function useConfirmAction<T>({
  row,
  action,
  onSuccess,
  onError,
}: ConfirmActionOptions<T>): UseConfirmActionReturn {
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    if (!row) return;

    setIsLoading(true);
    try {
      await action(row);
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [row, action, onSuccess, onError]);

  return { isLoading, execute };
}

export default useActionDialog;
