"use client";

import React, { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { animations } from "../../utils/animations";

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

// Popover Trigger
export const PopoverTrigger = forwardRef<HTMLButtonElement, { asChild?: boolean; children: React.ReactElement }>(
  ({ asChild, children }, ref) => {
    const context = useContext(PopoverContext);
    if (!context) throw new Error("PopoverTrigger must be used within Popover");

    if (asChild) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement) => {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node as HTMLButtonElement);
          else if (ref) ref.current = node as HTMLButtonElement;

          // Attempt to preserve original ref from child
          const { ref: originalRef } = (children as any);
          if (typeof originalRef === "function") originalRef(node);
          else if (originalRef) originalRef.current = node;
        },
        onClick: (e: React.MouseEvent) => {
          (children as React.ReactElement<any>).props.onClick?.(e);
          context.setOpen(!context.open);
        }
      });
    }

    return (
      <button
        ref={(node) => {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onClick={() => context.setOpen(!context.open)}
      >
        {children}
      </button>
    );
  }
);

PopoverTrigger.displayName = "PopoverTrigger";

// Popover Content
const popoverContentVariants = cva(
  "bg-surface-container shadow-2 rounded-lg p-3u",
  {
    variants: {
      size: {
        sm: "min-w-40u",
        md: "min-w-50u",
        lg: "min-w-60u",
        auto: "min-w-min",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof popoverContentVariants> {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ align = "center", side = "bottom", sideOffset = 8, size, children, className, ...props }, ref) => {
    const context = useContext(PopoverContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    if (!context) throw new Error("PopoverContent must be used within Popover");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        const content = contentRef.current!.getBoundingClientRect();

        let top = 0;
        let left = 0;

        // Calculate position based on side
        if (side === "bottom") {
          top = trigger.bottom + sideOffset;
        } else if (side === "top") {
          top = trigger.top - content.height - sideOffset;
        } else if (side === "left") {
          left = trigger.left - content.width - sideOffset;
          top = trigger.top;
        } else if (side === "right") {
          left = trigger.right + sideOffset;
          top = trigger.top;
        }

        // Calculate alignment
        if (side === "top" || side === "bottom") {
          if (align === "start") {
            left = trigger.left;
          } else if (align === "center") {
            left = trigger.left + trigger.width / 2 - content.width / 2;
          } else {
            left = trigger.right - content.width;
          }
        } else {
          if (align === "start") {
            top = trigger.top;
          } else if (align === "center") {
            top = trigger.top + trigger.height / 2 - content.height / 2;
          } else {
            top = trigger.bottom - content.height;
          }
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }, [context.open, side, align, sideOffset]);

    useEffect(() => {
      if (!context.open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          !context.triggerRef.current?.contains(e.target as Node)
        ) {
          context.setOpen(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") context.setOpen(false);
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [context]);

    if (!context.open) return null;

    return (
      <Portal>
        <div
          ref={(node) => {
            (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: "var(--z-popover)",
          }}
          className={cn(
            popoverContentVariants({ size }),
            animations.zoomIn,
            className
          )}
          {...props}
        >
          {children}
        </div>
      </Portal>
    );
  }
);

PopoverContent.displayName = "PopoverContent";