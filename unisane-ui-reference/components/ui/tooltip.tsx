"use client";

import React, { createContext, useContext, useState, useRef, useEffect, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { animations } from "../../utils/animations";

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface TooltipProps {
  children?: React.ReactNode;
  delayDuration?: number;
}

export const Tooltip = ({ children, delayDuration = 700 }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
};

// Tooltip Trigger
export const TooltipTrigger = forwardRef<HTMLElement, { asChild?: boolean; children: React.ReactElement }>(
  ({ asChild, children }, ref) => {
    const context = useContext(TooltipContext);
    if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => context.setOpen(true), 700);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      context.setOpen(false);
    };

    const handleFocus = () => context.setOpen(true);
    const handleBlur = () => context.setOpen(false);

    if (asChild) {
      const child = children as React.ReactElement<any>;
      return (
        React.cloneElement(child, {
          ref: (node: HTMLElement) => {
            (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
            
            // Handle existing ref
            const { ref: existingRef } = child as any;
            if (typeof existingRef === "function") existingRef(node);
            else if (existingRef) existingRef.current = node;
          },
          onMouseEnter: (e: React.MouseEvent) => {
            child.props.onMouseEnter?.(e);
            handleMouseEnter();
          },
          onMouseLeave: (e: React.MouseEvent) => {
            child.props.onMouseLeave?.(e);
            handleMouseLeave();
          },
          onFocus: (e: React.FocusEvent) => {
            child.props.onFocus?.(e);
            handleFocus();
          },
          onBlur: (e: React.FocusEvent) => {
            child.props.onBlur?.(e);
            handleBlur();
          }
        })
      );
    }

    return (
      <span
        ref={(node) => {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </span>
    );
  }
);

TooltipTrigger.displayName = "TooltipTrigger";

// Tooltip Content
const tooltipContentVariants = cva(
  "bg-inverse-surface text-inverse-on-surface px-2u py-1u rounded-sm text-body-small shadow-2 max-w-50u",
  {
    variants: {
      side: {
        top: "",
        bottom: "",
        left: "",
        right: "",
      },
    },
    defaultVariants: {
      side: "top",
    },
  }
);

interface TooltipContentProps extends VariantProps<typeof tooltipContentVariants> {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, side = "top", align = "center", className = "" }, ref) => {
    const context = useContext(TooltipContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    if (!context) throw new Error("TooltipContent must be used within Tooltip");

    useEffect(() => {
      if (!context.open || !context.triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current!.getBoundingClientRect();
        const content = contentRef.current!.getBoundingClientRect();
        const offset = 8;

        let top = 0;
        let left = 0;

        // Calculate position based on side
        if (side === "top") {
          top = trigger.top - content.height - offset;
        } else if (side === "bottom") {
          top = trigger.bottom + offset;
        } else if (side === "left") {
          left = trigger.left - content.width - offset;
          top = trigger.top;
        } else if (side === "right") {
          left = trigger.right + offset;
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
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }, [context.open, side, align]);

    if (!context.open) return null;

    return (
      <Portal>
        <div
          ref={(node) => {
            (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          role="tooltip"
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: "var(--z-popover)",
          }}
          className={cn(
            tooltipContentVariants({ side }),
            animations.zoomIn,
            className
          )}
        >
          {children}
        </div>
      </Portal>
    );
  }
);

TooltipContent.displayName = "TooltipContent";