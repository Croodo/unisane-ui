"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/src/lib/utils";
import type { NavigationVariant } from "@/src/types/navigation";

export interface NavGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  showDivider?: boolean;
  variant?: NavigationVariant;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export const NavGroup = forwardRef<HTMLDivElement, NavGroupProps>(
  (
    {
      label,
      children,
      collapsible = false,
      defaultOpen = true,
      showDivider = false,
      variant = "default",
      className,
      onOpenChange,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleToggle = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      onOpenChange?.(newState);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          showDivider && "pb-3 mb-3 border-b border-outline-variant/30",
          className
        )}
        {...props}
      >
        {label && (
          <div
            className={cn(
              "flex items-center justify-between",
              "text-label-small font-semibold uppercase tracking-wide",
              "text-on-surface-variant/60",
              variant === "compact" && "px-3 py-2",
              variant === "default" && "px-4 py-2.5",
              variant === "comfortable" && "px-5 py-3",

              collapsible && "cursor-pointer select-none hover:text-on-surface-variant transition-colors"
            )}
            onClick={collapsible ? handleToggle : undefined}
            role={collapsible ? "button" : undefined}
            aria-expanded={collapsible ? isOpen : undefined}
            tabIndex={collapsible ? 0 : undefined}
            onKeyDown={
              collapsible
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggle();
                    }
                  }
                : undefined
            }
          >
            <span>{label}</span>

            {collapsible && (
              <svg
                className={cn(
                  "size-icon-xs transition-transform duration-short",
                  isOpen && "rotate-180"
                )}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex flex-col",
            variant === "compact" && "gap-0.5",
            variant === "default" && "gap-1",
            variant === "comfortable" && "gap-1.5",
            collapsible && [
              "transition-all duration-medium ease-emphasized overflow-hidden",
              isOpen ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0",
            ]
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

NavGroup.displayName = "NavGroup";
