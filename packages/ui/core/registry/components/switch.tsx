"use client";

import { type InputHTMLAttributes, useId, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/primitives/icon";

interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  disabled?: boolean;
  icons?: boolean;
  className?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      disabled = false,
      icons = false,
      className = "",
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center gap-3 cursor-pointer select-none group relative min-h-8",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {/* Track container - uses calc with --unit for density scaling */}
        {/* Base: 52x32px at standard density (13 units x 8 units) */}
        <div
          className="relative shrink-0 group/switch h-[calc(var(--unit)*8)] w-[calc(var(--unit)*13)]"
        >
          <input
            ref={ref}
            type="checkbox"
            id={id}
            role="switch"
            className="peer sr-only"
            disabled={disabled}
            {...props}
          />

          {/* Track background */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors duration-medium ease-standard border-2",
              "border-outline bg-surface-container-highest",
              "peer-checked:bg-primary peer-checked:border-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"
            )}
          />

          {/* Thumb - uses size-icon for density scaling */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-emphasized ease-emphasized flex items-center justify-center z-10",
              // Background colors
              "bg-outline group-hover:bg-on-surface-variant peer-checked:bg-on-primary",
              // Size: with icons always size-icon-md (24px), without icons size-icon-xs (16px) → size-icon-md (24px)
              icons
                ? "size-icon-md left-[var(--unit)] peer-checked:left-[calc(var(--unit)*13-var(--icon-md)-var(--unit))]"
                : "size-icon-xs left-[calc(var(--unit)*2)] peer-checked:size-icon-md peer-checked:left-[calc(var(--unit)*13-var(--icon-md)-var(--unit))]"
            )}
          />

          {/* Icons (rendered separately to use peer selectors) */}
          {icons && (
            <>
              {/* Close icon - shown when unchecked */}
              <Icon
                symbol="close"
                size="xs"
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-[calc(var(--unit)+var(--icon-md)/2)] text-surface-container-highest z-20 transition-opacity duration-snappy ease-standard opacity-100 peer-checked:opacity-0"
              />
              {/* Check icon - shown when checked */}
              <Icon
                symbol="check"
                size="xs"
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-[calc(var(--unit)*13-var(--icon-md)/2-var(--unit))] text-primary z-20 transition-opacity duration-snappy ease-standard opacity-0 peer-checked:opacity-100"
              />
            </>
          )}
        </div>
        {label && (
          <span className="text-body-medium font-medium text-on-surface leading-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
