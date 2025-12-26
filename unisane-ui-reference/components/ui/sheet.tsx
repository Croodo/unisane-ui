"use client";

import React, { createContext, useContext, useState, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { FocusTrap } from "./focus-trap";
import { animations } from "../../utils/animations";

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet = ({ open: controlledOpen, onOpenChange, children }: SheetProps) => {
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
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

// Sheet Trigger
export const SheetTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) => {
  const context = useContext(SheetContext);
  if (!context) throw new Error("SheetTrigger must be used within Sheet");

  if (asChild) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        context.setOpen(true);
      }
    });
  }

  return <button onClick={() => context.setOpen(true)}>{children}</button>;
};

// Sheet Content
const sheetContentVariants = cva(
  "fixed z-modal bg-surface-container-low shadow-4 p-6u overflow-y-auto",
  {
    variants: {
      side: {
        bottom: `inset-x-0 bottom-0 rounded-t-xl ${animations.slideInFromBottom} max-h-[90vh]`,
        top: `inset-x-0 top-0 rounded-b-xl ${animations.slideInFromTop} max-h-[90vh]`,
        left: `inset-y-0 left-0 rounded-r-xl ${animations.slideInFromLeft} w-80u max-h-screen`,
        right: `inset-y-0 right-0 rounded-l-xl ${animations.slideInFromRight} w-80u max-h-screen`,
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  }
);

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetContentVariants> {
  children: React.ReactNode;
}

export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side, children, className, ...props }, ref) => {
    const context = useContext(SheetContext);
    if (!context) throw new Error("SheetContent must be used within Sheet");

    useEffect(() => {
      if (!context.open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") context.setOpen(false);
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [context]);

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
            onClick={() => context.setOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div ref={ref} className={cn(sheetContentVariants({ side }), className)} {...props}>
            {/* Drag Handle (for bottom sheets) */}
            {side === "bottom" && (
              <div className="flex justify-center mb-4u">
                <div className="w-8u h-1u bg-on-surface-variant/40 rounded-full" />
              </div>
            )}

            {children}
          </div>
        </FocusTrap>
      </Portal>
    );
  }
);

SheetContent.displayName = "SheetContent";

// Sheet Header
export const SheetHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mb-4u", className)}>{children}</div>
);

// Sheet Title
export const SheetTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-headline-small font-normal text-on-surface", className)}>{children}</h2>
);

// Sheet Description
export const SheetDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-body-medium text-on-surface-variant mt-2u", className)}>{children}</p>
);