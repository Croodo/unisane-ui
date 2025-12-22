"use client";

import { type InputHTMLAttributes, useId, forwardRef } from "react";
import { Ripple } from "./ripple";
import { cn } from "@ui/lib/utils";

interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    { label, disabled = false, error = false, className = "", id: providedId, ...props },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center gap-3u cursor-pointer group select-none relative",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <div className="relative flex items-center justify-center w-10u h-10u">
          {/* Ripple Container */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors z-0 overflow-hidden",
              "group-hover:bg-on-surface/5",
              error && "group-hover:bg-error/5"
            )}
          >
            <Ripple
              center
              disabled={disabled}
              className={cn(error ? "text-error" : "text-primary")}
            />
          </div>

          <input
            ref={ref}
            type="radio"
            id={id}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Radio outer circle */}
          <div
            className={cn(
              "relative z-10 w-5u h-5u rounded-full border-2 bg-surface",
              "transition-colors duration-snappy ease-emphasized flex items-center justify-center",
              !error &&
                "border-outline group-hover:border-on-surface peer-checked:border-primary",
              error && "border-error peer-checked:border-error"
            )}
          >
            {/* Radio inner dot */}
            <div
              className={cn(
                "w-2.5u h-2.5u rounded-full transition-transform duration-snappy ease-emphasized scale-0 peer-checked:scale-100",
                !error && "bg-primary",
                error && "bg-error"
              )}
            />
          </div>
        </div>

        {label && (
          <span className="text-body-small font-bold tracking-tight text-on-surface leading-none pt-0.5u">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = "Radio";
