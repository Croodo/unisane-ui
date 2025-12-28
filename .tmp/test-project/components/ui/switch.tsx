"use client";

import { type InputHTMLAttributes, useId, forwardRef } from "react";
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

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
        {/* Use a wrapper with group/switch to scope the has-[:checked] selector */}
        <div className="relative w-13 h-8 shrink-0 group/switch">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            role="switch"
            className="peer sr-only"
            disabled={disabled}
            {...props}
          />

          {/* Track */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors duration-medium ease-standard border-2",
              "border-outline bg-surface-container-highest",
              "peer-checked:bg-primary peer-checked:border-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"
            )}
          />

          {/* Thumb - uses group-has-[:checked] to detect checked state from parent */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-emphasized flex items-center justify-center z-10",
              "w-4 h-4", // Initial unchecked size
              "left-1 bg-outline group-hover:bg-on-surface-variant", // Unchecked colors

              // Checked State Transformations (using peer-checked since thumb is sibling)
              "peer-checked:translate-x-5 peer-checked:bg-on-primary peer-checked:w-6 peer-checked:h-6",

              // Active Press State
              "group-active:w-7 group-active:translate-x-0 peer-checked:group-active:translate-x-4"
            )}
          >
            {icons && (
              <>
                {/* Check icon - visible when checked */}
                <Icon
                  symbol="check"
                  size={16}
                  className={cn(
                    "w-4 h-4 text-primary absolute transition-opacity duration-snappy",
                    "opacity-0 group-has-checked/switch:opacity-100"
                  )}
                />
                {/* Close icon - hidden when checked */}
                <Icon
                  symbol="close"
                  size={12}
                  className={cn(
                    "w-3 h-3 text-surface-container absolute transition-opacity duration-snappy",
                    "opacity-100 group-has-checked/switch:opacity-0"
                  )}
                />
              </>
            )}
          </div>
        </div>
        {label && (
          <span className="text-body-small font-medium text-on-surface leading-none pt-0_5">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
