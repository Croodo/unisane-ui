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

          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors duration-medium ease-standard border-2",
              "border-outline bg-surface-container-highest",
              "peer-checked:bg-primary peer-checked:border-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"
            )}
          />

          {/* Thumb */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-emphasized ease-emphasized flex items-center justify-center z-10",
              "left-1 bg-outline group-hover:bg-on-surface-variant w-4 h-4",
              "peer-checked:translate-x-5 peer-checked:bg-on-primary peer-checked:w-6 peer-checked:h-6"
            )}
          />

          {/* Icons (rendered separately to use peer selectors) */}
          {icons && (
            <>
              <Icon
                symbol="check"
                size="xs"
                className="absolute top-1/2 -translate-y-1/2 left-7 text-primary z-20 transition-opacity duration-snappy ease-standard opacity-0 peer-checked:opacity-100"
              />
              <Icon
                symbol="close"
                size="xs"
                className="absolute top-1/2 -translate-y-1/2 left-1.5 text-surface-container z-20 transition-opacity duration-snappy ease-standard opacity-100 peer-checked:opacity-0"
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
