"use client";

import { type InputHTMLAttributes, useId, forwardRef } from "react";
import { cn } from "@/lib/utils";

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

          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-emphasized ease-emphasized flex items-center justify-center z-10",
              props.checked
                ? "translate-x-5u bg-on-primary w-6u h-6u left-1u"
                : "left-1u bg-outline group-hover:bg-on-surface-variant w-4u h-4u"
            )}
          >
            {icons && (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={cn(
                    "w-4u h-4u text-primary absolute transition-opacity duration-snappy ease-standard",
                    props.checked ? "opacity-100" : "opacity-0"
                  )}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={cn(
                    "w-3u h-3u text-surface-container absolute transition-opacity duration-snappy ease-standard",
                    props.checked ? "opacity-0" : "opacity-100"
                  )}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </>
            )}
          </div>
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
