"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Button } from "./button";
import { Ripple } from "./ripple";

const snackbarVariants = cva(
  "fixed bottom-6u left-6u right-6u expanded:left-auto expanded:right-8u expanded:min-w-[calc(var(--uni-sys-u)*86)] z-[5000] flex justify-center pointer-events-none transition-all duration-medium ease-emphasized",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type SnackbarProps = VariantProps<typeof snackbarVariants> & {
  open: boolean;
  onClose: () => void;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
  autoHideDuration?: number; // milliseconds
  withCloseIcon?: boolean;
};

export const Snackbar: React.FC<SnackbarProps> = ({
  open,
  onClose,
  message,
  actionLabel,
  onAction,
  action,
  icon,
  className,
  autoHideDuration = 5000,
  withCloseIcon = false,
}) => {
  const resolvedAction =
    action || (actionLabel ? { label: actionLabel, onClick: onAction } : null);

  // Auto-hide functionality
  React.useEffect(() => {
    if (!open || autoHideDuration <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(snackbarVariants({ className }))}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
        "pointer-events-auto flex items-center gap-4u px-4u py-3u bg-inverse-surface text-inverse-on-surface rounded-sm shadow-4 min-h-12u border border-outline-variant/10",
        "animate-in slide-in-from-bottom-5 fade-in duration-medium ease-emphasized",
        className
      )}
      >
        {/* Icon */}
        {icon && (
          <div className="w-6u h-6u flex items-center justify-center text-inverse-on-surface shrink-0 opacity-90">
            {icon}
          </div>
        )}

        {/* Message */}
        <div className="flex-1 text-body-small font-medium py-1 relative z-10">
          {message}
        </div>

        {/* Action Button */}
        {resolvedAction && (
          <Button
            variant="text"
            size="sm"
            onClick={resolvedAction.onClick}
            className="text-inverse-primary hover:bg-inverse-primary/10 h-8u px-3u font-medium"
          >
            {resolvedAction.label}
          </Button>
        )}

        {/* Close Button */}
        {withCloseIcon && (
          <button
            onClick={onClose}
            className="group p-1u rounded-sm transition-colors text-inverse-on-surface opacity-50 hover:opacity-100 relative overflow-hidden"
            aria-label="Close"
          >
            <span className="absolute inset-0 bg-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-hover pointer-events-none" />
            <Ripple />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="relative z-10">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Snackbar Container for managing multiple snacks
export const SnackbarContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute bottom-6u left-1/2 -translate-x-1/2 flex flex-col gap-2u pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
