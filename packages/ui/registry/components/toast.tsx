"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Icon } from "@/primitives/icon";
import { Button } from "./button";
import { Ripple } from "./ripple";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";
export type ToastPosition = "bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left" | "top-center";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  description?: string;
  variant?: ToastVariant;
  icon?: React.ReactNode;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
}

export interface ToastOptions {
  message: string;
  description?: string;
  variant?: ToastVariant;
  icon?: React.ReactNode;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
}

// ─── STYLING ─────────────────────────────────────────────────────────────────

const toastVariants = cva(
  "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md shadow-4 min-w-72 max-w-100 border transition-all duration-medium ease-emphasized",
  {
    variants: {
      variant: {
        default: "bg-inverse-surface text-inverse-on-surface border-transparent",
        success: "bg-surface text-on-surface border-outline-variant/30 [&_.toast-icon]:text-primary",
        error: "bg-error-container text-on-error-container border-error/20 [&_.toast-icon]:text-on-error-container",
        warning: "bg-surface text-on-surface border-outline-variant/30 [&_.toast-icon]:text-tertiary",
        info: "bg-surface text-on-surface border-outline-variant/30 [&_.toast-icon]:text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const positionClasses: Record<ToastPosition, string> = {
  "bottom-right": "bottom-6 right-6 items-end",
  "bottom-left": "bottom-6 left-6 items-start",
  "bottom-center": "bottom-6 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-6 right-6 items-end",
  "top-left": "top-6 left-6 items-start",
  "top-center": "top-6 left-1/2 -translate-x-1/2 items-center",
};

// ─── DEFAULT ICONS ───────────────────────────────────────────────────────────

const defaultIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <Icon symbol="check_circle" size="sm" />,
  error: <Icon symbol="error" size="sm" />,
  warning: <Icon symbol="warning" size="sm" />,
  info: <Icon symbol="info" size="sm" />,
};

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ─── TOAST ITEM ──────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const {
    id,
    message,
    description,
    variant = "default",
    icon,
    action,
    duration = 5000,
    dismissible = true,
  } = toast;

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const displayIcon = icon ?? defaultIcons[variant];
  const isInverse = variant === "default";

  return (
    <div
      className={cn(
        toastVariants({ variant }),
        "animate-in slide-in-from-right-full fade-in duration-medium"
      )}
      role="status"
      aria-live="polite"
    >
      {displayIcon && (
        <div className="toast-icon w-5 h-5 flex items-center justify-center shrink-0">
          {displayIcon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={cn("text-body-medium font-medium leading-tight", isInverse ? "text-inverse-on-surface" : "text-on-surface")}>
          {message}
        </p>
        {description && (
          <p className={cn("text-body-small mt-1 leading-snug", isInverse ? "text-inverse-on-surface/70" : "text-on-surface-variant")}>
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
            className={cn(
              "h-8 px-3 font-medium",
              isInverse ? "text-inverse-primary hover:bg-inverse-primary/10" : ""
            )}
          >
            {action.label}
          </Button>
        )}

        {dismissible && (
          <button
            onClick={() => onDismiss(id)}
            className={cn(
              "group p-1 rounded-full transition-colors relative overflow-hidden",
              isInverse
                ? "text-inverse-on-surface/50 hover:text-inverse-on-surface"
                : "text-on-surface-variant hover:text-on-surface"
            )}
            aria-label="Dismiss"
          >
            <Ripple />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="relative z-10"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TOASTER ─────────────────────────────────────────────────────────────────

export interface ToasterProps {
  position?: ToastPosition;
  maxToasts?: number;
}

function ToasterPortal({ position = "bottom-right", maxToasts = 5 }: ToasterProps) {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const visibleToasts = toasts.slice(-maxToasts);
  const isTop = position.startsWith("top");

  return createPortal(
    <div
      className={cn(
        "fixed z-[5000] flex flex-col gap-2 pointer-events-none",
        positionClasses[position]
      )}
    >
      {(isTop ? visibleToasts.reverse() : visibleToasts).map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  );
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = "bottom-right",
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      ...options,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <ToasterPortal position={position} maxToasts={maxToasts} />
    </ToastContext.Provider>
  );
}

// ─── CONVENIENCE METHODS ─────────────────────────────────────────────────────

// These are created as a standalone toast API for cases where context isn't available
// They require the ToastProvider to be mounted somewhere in the app

let toastFn: ((options: ToastOptions) => string) | null = null;
let dismissFn: ((id: string) => void) | null = null;
let dismissAllFn: (() => void) | null = null;

export function setToastFunctions(
  toastFunc: (options: ToastOptions) => string,
  dismissFunc: (id: string) => void,
  dismissAllFunc: () => void
) {
  toastFn = toastFunc;
  dismissFn = dismissFunc;
  dismissAllFn = dismissAllFunc;
}

export const toast = {
  show: (options: ToastOptions) => {
    if (!toastFn) {
      console.warn("Toast: ToastProvider not mounted. Wrap your app with <ToastProvider>");
      return "";
    }
    return toastFn(options);
  },
  success: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => {
    return toast.show({ message, variant: "success", ...options });
  },
  error: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => {
    return toast.show({ message, variant: "error", ...options });
  },
  warning: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => {
    return toast.show({ message, variant: "warning", ...options });
  },
  info: (message: string, options?: Omit<ToastOptions, "message" | "variant">) => {
    return toast.show({ message, variant: "info", ...options });
  },
  dismiss: (id: string) => {
    dismissFn?.(id);
  },
  dismissAll: () => {
    dismissAllFn?.();
  },
};

// ─── TOASTER STANDALONE (with auto-registration) ─────────────────────────────

export function Toaster({ position = "bottom-right", maxToasts = 5 }: ToasterProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastFnInternal = useCallback((options: ToastOptions): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, ...options };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismissInternal = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAllInternal = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    setToastFunctions(toastFnInternal, dismissInternal, dismissAllInternal);
    return () => {
      toastFn = null;
      dismissFn = null;
      dismissAllFn = null;
    };
  }, [toastFnInternal, dismissInternal, dismissAllInternal]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const visibleToasts = toasts.slice(-maxToasts);
  const isTop = position.startsWith("top");

  return createPortal(
    <div
      className={cn(
        "fixed z-[5000] flex flex-col gap-2 pointer-events-none",
        positionClasses[position]
      )}
    >
      {(isTop ? visibleToasts.reverse() : visibleToasts).map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissInternal} />
      ))}
    </div>,
    document.body
  );
}
