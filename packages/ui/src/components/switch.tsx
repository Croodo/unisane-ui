"use client";

import { type InputHTMLAttributes, useId, forwardRef } from "react";
import { cn } from "@ui/lib/utils";
import { Icon } from "@ui/primitives/icon";

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
          "inline-flex items-center gap-3u cursor-pointer select-none group relative min-h-8u",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <div className="relative w-13u h-8u shrink-0 group/switch">
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
              "left-1u bg-outline group-hover:bg-on-surface-variant w-4u h-4u",
              "peer-checked:translate-x-5u peer-checked:bg-on-primary peer-checked:w-6u peer-checked:h-6u"
            )}
          />

          {/* Icons (rendered separately to use peer selectors) */}
          {icons && (
            <>
              <Icon
                symbol="check"
                size={16}
                className="absolute top-1/2 -translate-y-1/2 left-[calc(var(--unit)*7)] w-4u h-4u text-primary z-20 transition-opacity duration-snappy ease-standard opacity-0 peer-checked:opacity-100"
              />
              <Icon
                symbol="close"
                size={12}
                className="absolute top-1/2 -translate-y-1/2 left-[calc(var(--unit)*1.5)] w-3u h-3u text-surface-container z-20 transition-opacity duration-snappy ease-standard opacity-100 peer-checked:opacity-0"
              />
            </>
          )}
        </div>
        {label && (
          <span className="text-body-small font-medium text-on-surface leading-none pt-0.5u">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
