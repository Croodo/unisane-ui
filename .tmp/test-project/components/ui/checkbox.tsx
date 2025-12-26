"use client";

import { type InputHTMLAttributes, useId, forwardRef, useEffect, useRef } from "react";
import { Ripple } from "./ripple";
import { cn } from '@/lib/utils';

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  error?: boolean;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      disabled = false,
      indeterminate = false,
      error = false,
      className = "",
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    const setInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center cursor-pointer select-none gap-3u group relative",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <div className="relative flex items-center justify-center w-10u h-10u">
          {/* Ripple Container - Centered */}
          <div
            className={cn(
              "absolute inset-0 rounded-sm overflow-hidden transition-colors z-0",
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
            ref={setInputRef}
            type="checkbox"
            id={id}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Checkbox box */}
          <div
            className={cn(
              "relative z-10 w-4.5u h-4.5u rounded-sm border-2 flex items-center justify-center overflow-hidden bg-surface",
              "transition-all duration-snappy ease-emphasized",
              // Default Border
              !error && "border-outline group-hover:border-on-surface",
              error && "border-error",

              // Checked State
              !error && "peer-checked:bg-primary peer-checked:border-primary",
              error && "peer-checked:bg-error peer-checked:border-error",

              // Indeterminate State
              !error &&
                "peer-indeterminate:bg-primary peer-indeterminate:border-primary",
              error &&
                "peer-indeterminate:bg-error peer-indeterminate:border-error",

              // Focus
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
            )}
          >
            {/* Checkmark */}
            <svg
              className={cn(
                "absolute inset-0 w-full h-full p-0.5 transition-transform duration-snappy",
                "opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100",
                error ? "text-on-error" : "text-on-primary",
                "peer-indeterminate:hidden"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>

            {/* Indeterminate mark */}
            <svg
              className={cn(
                "absolute inset-0 w-full h-full p-0.5 transition-transform duration-snappy",
                "opacity-0 scale-50 rotate-90 peer-indeterminate:opacity-100 peer-indeterminate:scale-100 peer-indeterminate:rotate-0",
                error ? "text-on-error" : "text-on-primary",
                props.checked && "hidden"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
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

Checkbox.displayName = "Checkbox";
