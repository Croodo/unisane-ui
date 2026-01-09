"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { cn } from "@/src/lib/utils";

export interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

// ─── SHADCN-COMPATIBLE POPOVER WITH CONTEXT ────────────────────────────────────

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentId: string;
} | null>(null);

/** shadcn-compatible Popover props */
interface ShadcnPopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export const ShadcnPopover: React.FC<ShadcnPopoverProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentId }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}> = ({ children, asChild, className }) => {
  const ctx = React.useContext(PopoverContext);

  const handleClick = () => ctx?.setOpen(!ctx.open);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ctx?.setOpen(!ctx.open);
    } else if (e.key === "ArrowDown" && !ctx?.open) {
      e.preventDefault();
      ctx?.setOpen(true);
    }
  };

  // If asChild, clone the child element with trigger props
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      "aria-expanded": ctx?.open,
      "aria-haspopup": "dialog",
      "aria-controls": ctx?.contentId,
      ref: ctx?.triggerRef,
    });
  }

  return (
    <button
      ref={ctx?.triggerRef}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={ctx?.open}
      aria-haspopup="dialog"
      aria-controls={ctx?.contentId}
      className={cn("inline-flex", className)}
    >
      {children}
    </button>
  );
};

export const PopoverContent: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    side?: "top" | "bottom" | "left" | "right";
    sideOffset?: number;
  }
> = ({ children, className, align = "center", side = "bottom", sideOffset = 8, ...props }) => {
  const ctx = React.useContext(PopoverContext);

  if (!ctx?.open) return null;

  return (
    <div
      id={ctx.contentId}
      role="dialog"
      aria-modal="true"
      className={cn(
        "absolute z-modal min-w-40 bg-surface rounded-sm shadow-2 py-1 animate-in fade-in zoom-in-95 duration-short ease-standard border border-outline-variant",
        // Vertical positioning (top/bottom)
        side === "bottom" && `top-[calc(100%+${sideOffset}px)]`,
        side === "top" && `bottom-[calc(100%+${sideOffset}px)]`,
        // Horizontal positioning (left/right)
        side === "left" && `right-[calc(100%+${sideOffset}px)]`,
        side === "right" && `left-[calc(100%+${sideOffset}px)]`,
        // Alignment for vertical sides (top/bottom)
        (side === "top" || side === "bottom") && align === "center" && "left-1/2 -translate-x-1/2",
        (side === "top" || side === "bottom") && align === "start" && "left-0",
        (side === "top" || side === "bottom") && align === "end" && "right-0",
        // Alignment for horizontal sides (left/right)
        (side === "left" || side === "right") && align === "center" && "top-1/2 -translate-y-1/2",
        (side === "left" || side === "right") && align === "start" && "top-0",
        (side === "left" || side === "right") && align === "end" && "bottom-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ─── ORIGINAL PROPS-BASED POPOVER ────────────────────────────────────────────

export const ControlledPopover: React.FC<PopoverProps> = ({
  trigger,
  content,
  open: controlledOpen,
  onOpenChange,
  align = "center",
  side = "bottom",
  className,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenChange(!isOpen);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      handleOpenChange(true);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => handleOpenChange(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        className="inline-flex"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={popoverId}
          role="dialog"
          aria-modal="true"
          className={cn(
            "absolute z-modal min-w-40 bg-surface rounded-sm shadow-2 py-1 animate-in fade-in zoom-in-95 duration-short ease-standard border border-outline-variant",
            // Vertical positioning (top/bottom)
            side === "bottom" && "top-[calc(100%+8px)]",
            side === "top" && "bottom-[calc(100%+8px)]",
            // Horizontal positioning (left/right) - only set the horizontal offset, not vertical
            side === "left" && "right-[calc(100%+8px)]",
            side === "right" && "left-[calc(100%+8px)]",
            // Alignment for vertical sides (top/bottom)
            (side === "top" || side === "bottom") && align === "center" && "left-1/2 -translate-x-1/2",
            (side === "top" || side === "bottom") && align === "start" && "left-0",
            (side === "top" || side === "bottom") && align === "end" && "right-0",
            // Alignment for horizontal sides (left/right)
            (side === "left" || side === "right") && align === "center" && "top-1/2 -translate-y-1/2",
            (side === "left" || side === "right") && align === "start" && "top-0",
            (side === "left" || side === "right") && align === "end" && "bottom-0",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// ─── SMART POPOVER THAT DETECTS API PATTERN ─────────────────────────────────

type SmartPopoverProps = PopoverProps | ShadcnPopoverProps;

function isShadcnProps(props: SmartPopoverProps): props is ShadcnPopoverProps {
  return "children" in props && props.children !== undefined && !("trigger" in props);
}

export const Popover: React.FC<SmartPopoverProps> = (props) => {
  if (isShadcnProps(props)) {
    return <ShadcnPopover {...props} />;
  }
  return <ControlledPopover {...props} />;
};
