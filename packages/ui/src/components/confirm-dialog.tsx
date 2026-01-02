"use client";

import React, { forwardRef } from "react";
import { cn } from "@ui/lib/utils";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Icon } from "./icon";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Description text explaining the action */
  description?: string;
  /** Confirm button label (defaults to "Confirm") */
  confirmLabel?: string;
  /** Cancel button label (defaults to "Cancel") */
  cancelLabel?: string;
  /** Visual variant affecting confirm button and icon */
  variant?: "default" | "danger" | "warning";
  /** Callback when confirm is clicked */
  onConfirm: () => void | Promise<void>;
  /** Callback when cancel is clicked (defaults to closing dialog) */
  onCancel?: () => void;
  /** Whether the confirm action is loading */
  loading?: boolean;
  /** Whether the confirm button is disabled */
  disabled?: boolean;
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Additional content below description */
  children?: React.ReactNode;
  /** Additional class for the dialog */
  className?: string;
}

// ─── VARIANT CONFIG ───────────────────────────────────────────────────────────

const variantConfig = {
  default: {
    icon: "help",
    iconClass: "text-primary",
    confirmClass: "",
  },
  danger: {
    icon: "warning",
    iconClass: "text-error",
    confirmClass: "bg-error text-on-error hover:bg-error/90",
  },
  warning: {
    icon: "warning",
    iconClass: "text-tertiary",
    confirmClass: "bg-tertiary text-on-tertiary hover:bg-tertiary/90",
  },
} as const;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * ConfirmDialog - A standardized confirmation dialog for destructive or important actions.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete item?"
 *   description="This action cannot be undone."
 *   variant="danger"
 *   onConfirm={handleDelete}
 * />
 *
 * // With loading state
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Save changes?"
 *   onConfirm={handleSave}
 *   loading={isSaving}
 * />
 *
 * // With useActionDialog hook
 * const { getDialogProps, selectedRow, closeDialog } = useActionDialog<User>();
 *
 * <ConfirmDialog
 *   {...getDialogProps("delete")}
 *   title="Delete user?"
 *   description={`This will permanently delete ${selectedRow?.name}.`}
 *   variant="danger"
 *   onConfirm={async () => {
 *     await deleteUser(selectedRow.id);
 *     closeDialog();
 *   }}
 * />
 * ```
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      variant = "default",
      onConfirm,
      onCancel,
      loading = false,
      disabled = false,
      icon,
      children,
      className,
    },
    ref
  ) => {
    const config = variantConfig[variant];

    const handleClose = () => {
      if (!loading) {
        onOpenChange(false);
      }
    };

    const handleCancel = () => {
      if (onCancel) {
        onCancel();
      } else {
        handleClose();
      }
    };

    const handleConfirm = async () => {
      await onConfirm();
    };

    const dialogIcon = icon ?? (
      <Icon
        symbol={config.icon}
        className={cn("text-[24px]", config.iconClass)}
      />
    );

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={handleClose}
        title={title}
        icon={dialogIcon}
        className={className}
        actions={
          <>
            <Button
              variant="text"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="filled"
              onClick={handleConfirm}
              loading={loading}
              disabled={disabled || loading}
              className={config.confirmClass}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        {description && (
          <p className="text-on-surface-variant">{description}</p>
        )}
        {children}
      </Dialog>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";

export default ConfirmDialog;
