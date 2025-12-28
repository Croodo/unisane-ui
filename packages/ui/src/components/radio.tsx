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
          "inline-flex items-center gap-3 cursor-pointer group select-none relative",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <div className="relative flex items-center justify-center w-10 h-10">
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors z-0 overflow-hidden",
              "group-hover:bg-on-surface/8",
              error && "group-hover:bg-error/8"
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

          <div
            className={cn(
              "relative z-10 w-5 h-5 rounded-full border-2 bg-surface",
              "transition-colors duration-snappy ease-emphasized flex items-center justify-center",
              !error && "border-outline group-hover:border-on-surface",
              !error && props.checked && "border-primary",
              error && "border-error"
            )}
          >
            <div
              className={cn(
                "w-2_5 h-2_5 rounded-full transition-transform duration-snappy ease-emphasized",
                props.checked ? "scale-100" : "scale-0",
                !error && "bg-primary",
                error && "bg-error"
              )}
            />
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

Radio.displayName = "Radio";
