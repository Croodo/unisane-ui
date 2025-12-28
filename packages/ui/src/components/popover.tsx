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
          aria-modal="false"
          className={cn(
            "absolute z-modal min-w-[calc(var(--unit)*50)] bg-surface rounded-sm shadow-4 p-4 animate-in fade-in zoom-in-95 duration-short ease-standard border border-outline-variant/30",
            side === "bottom" && "top-[calc(100%+(var(--unit)*2))]",
            side === "top" && "bottom-[calc(100%+(var(--unit)*2))]",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "start" && "left-0",
            align === "end" && "right-0",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
