import React, { forwardRef, InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const textFieldVariants = cva(
  "w-full bg-surface-container rounded-sm border-2 text-on-surface transition-colors duration-short focus:outline-none placeholder:text-on-surface-variant disabled:opacity-38 disabled:cursor-not-allowed focus:border-primary",
  {
    variants: {
      size: {
        sm: "h-10u text-body-small",
        md: "h-14u text-body-large",
        lg: "h-16u text-body-large",
      },
      error: {
        true: "border-error focus:border-error",
        false: "border-outline",
      },
      hasLeadingIcon: {
        true: "pl-12u",
        false: "pl-4u",
      },
      hasTrailingIcon: {
        true: "pr-12u",
        false: "pr-4u",
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
      hasLeadingIcon: false,
      hasTrailingIcon: false,
    },
  }
);

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    Omit<VariantProps<typeof textFieldVariants>, "hasLeadingIcon" | "hasTrailingIcon"> {
  label?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      helperText,
      error = false,
      size = "md",
      leadingIcon,
      trailingIcon,
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
          {leadingIcon && (
            <div className="absolute left-4u top-1/2 -translate-y-1/2 text-on-surface-variant">
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              textFieldVariants({
                size,
                error,
                hasLeadingIcon: !!leadingIcon,
                hasTrailingIcon: !!trailingIcon,
              }),
              className
            )}
            {...props}
          />

          {trailingIcon && (
            <div className="absolute right-4u top-1/2 -translate-y-1/2 text-on-surface-variant">
              {trailingIcon}
            </div>
          )}
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

TextField.displayName = "TextField";