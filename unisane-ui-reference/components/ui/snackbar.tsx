"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { animations } from "../../utils/animations";

interface SnackbarContextType {
  show: (message: string, options?: SnackbarOptions) => void;
  hide: () => void;
}

interface SnackbarOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  variant?: "default" | "error" | "success";
}

interface SnackbarState {
  open: boolean;
  message: string;
  options?: SnackbarOptions;
}

const snackbarVariants = cva(
  "min-w-70u max-w-140u px-4u py-3u rounded-sm shadow-3 flex items-center justify-between gap-2u",
  {
    variants: {
      variant: {
        default: "bg-inverse-surface text-inverse-on-surface",
        error: "bg-error-container text-on-error-container",
        success: "bg-success-container text-on-success-container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
  });

  const show = (message: string, options?: SnackbarOptions) => {
    setState({ open: true, message, options });
  };

  const hide = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (!state.open) return;

    const duration = state.options?.duration ?? 4000;
    const timer = setTimeout(hide, duration);

    return () => clearTimeout(timer);
  }, [state.open, state.options?.duration]);

  return (
    <SnackbarContext.Provider value={{ show, hide }}>
      {children}
      {state.open && (
        <Portal>
          <div className={cn(
            "fixed bottom-4u left-1/2 -translate-x-1/2 z-modal",
            animations.slideInFromBottom
          )}>
            <div
              className={cn(
                snackbarVariants({ variant: state.options?.variant || "default" })
              )}
            >
              <span className="text-body-medium flex-1">{state.message}</span>

              {state.options?.action && (
                <button
                  onClick={() => {
                    state.options?.action?.onClick();
                    hide();
                  }}
                  className="text-label-large font-medium text-inverse-primary hover:bg-inverse-primary/8 px-2u py-1u rounded transition-colors"
                >
                  {state.options.action.label}
                </button>
              )}

              <button
                onClick={hide}
                className="w-6u h-6u flex items-center justify-center hover:bg-inverse-on-surface/8 rounded transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined w-5u h-5u">close</span>
              </button>
            </div>
          </div>
        </Portal>
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
};