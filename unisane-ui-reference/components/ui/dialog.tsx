"use client";

import React, { createContext, useContext, useState, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { FocusTrap } from "./focus-trap";
import { animations } from "../../utils/animations";

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open: controlledOpen, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

// Dialog Trigger
interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}

export const DialogTrigger = ({ asChild, children }: DialogTriggerProps) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within Dialog");

  if (asChild) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        context.setOpen(true);
      }
    });
  }

  return (
    <button onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
};

// Dialog Content
const dialogContentVariants = cva(
  "relative w-full bg-surface-container-high rounded-xl shadow-3 overflow-hidden flex flex-col",
  {
    variants: {
      size: {
        sm: "max-w-screen-sm max-h-[70vh]",
        md: "max-w-140u max-h-[80vh]",
        lg: "max-w-screen-lg max-h-[85vh]",
        full: "max-w-screen-xl max-h-[90vh]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogContentVariants> {
  children: React.ReactNode;
  onClose?: () => void;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, onClose, size, className, ...props }, ref) => {
    const context = useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    useEffect(() => {
      if (!context.open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          context.setOpen(false);
          onClose?.();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [context, onClose]);

    if (!context.open) return null;

    return (
      <Portal>
        <FocusTrap active={context.open}>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-scrim z-modal",
              animations.fadeIn
            )}
            onClick={() => {
              context.setOpen(false);
              onClose?.();
            }}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4u pointer-events-none">
            {/* The actual content needs pointer-events-auto */}
            <div
              ref={ref}
              role="dialog"
              aria-modal="true"
              className={cn(
                dialogContentVariants({ size }),
                animations.zoomIn,
                "pointer-events-auto",
                className
              )}
              onClick={(e) => e.stopPropagation()}
              {...props}
            >
              {children}
            </div>
          </div>
        </FocusTrap>
      </Portal>
    );
  }
);

DialogContent.displayName = "DialogContent";

// Dialog Header
export const DialogHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-6u pt-6u pb-4u", className)}>{children}</div>;

// Dialog Title
export const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={cn("text-headline-small font-normal text-on-surface", className)}>
    {children}
  </h2>
);

// Dialog Description
export const DialogDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-2u", className)}>
    {children}
  </p>
);

// Dialog Body
export const DialogBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-6u py-4u overflow-y-auto flex-1", className)}>{children}</div>;

// Dialog Actions
export const DialogActions = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-center justify-end gap-2u px-6u py-4u", className)}>
    {children}
  </div>
);