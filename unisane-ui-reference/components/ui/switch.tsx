import React, { forwardRef, InputHTMLAttributes, useId } from "react";
import { cn } from "../../lib/utils";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  icons?: boolean;
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
        {/* Use a wrapper with group/switch to scope the has-[:checked] selector */}
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
              "w-4u h-4u left-1u bg-outline group-hover:bg-on-surface-variant",
              "peer-checked:translate-x-5u peer-checked:bg-on-primary peer-checked:w-6u peer-checked:h-6u",
              "group-active:w-7u group-active:translate-x-0 peer-checked:group-active:translate-x-4u"
            )}
          >
            {icons && (
              <>
                {/* Check icon - visible when checked */}
                <span
                  className={cn(
                    "material-symbols-outlined text-[16px] text-primary absolute transition-opacity duration-snappy",
                    "opacity-0 group-has-checked/switch:opacity-100"
                  )}
                >
                  check
                </span>
                {/* Close icon - hidden when checked */}
                <span
                  className={cn(
                    "material-symbols-outlined text-[12px] text-surface-container absolute transition-opacity duration-snappy",
                    "opacity-100 group-has-checked/switch:opacity-0"
                  )}
                >
                  close
                </span>
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