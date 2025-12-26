import React, { forwardRef, SelectHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const selectVariants = cva(
  "w-full px-4u bg-surface-container rounded-sm border-2 text-on-surface transition-colors duration-short focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-38 disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "h-10u pr-9u text-body-small",
        md: "h-14u pr-11u text-body-large",
        lg: "h-16u pr-12u text-body-large",
      },
      error: {
        true: "border-error focus:border-error",
        false: "border-outline",
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
);

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  label?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error = false,
      size = "md",
      options,
      placeholder,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              "block mb-2u text-body-small font-medium",
              error ? "text-error" : "text-on-surface-variant"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={cn(selectVariants({ size, error }), className)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          <div className="absolute right-4u top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </div>

        {helperText && (
          <p className={cn("mt-1u text-body-small", error ? "text-error" : "text-on-surface-variant")}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";