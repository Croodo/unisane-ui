"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "@ui/lib/utils";

export interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
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
            // Horizontal positioning (left/right)
            side === "left" && "right-[calc(100%+8px)] top-0",
            side === "right" && "left-[calc(100%+8px)] top-0",
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
