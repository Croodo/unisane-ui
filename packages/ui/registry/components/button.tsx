"use client";

import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

/**
 * Button variants following Material Design 3 specifications.
 * Each variant serves a specific purpose in the visual hierarchy.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-full font-medium transition-all duration-short ease-standard overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed group whitespace-nowrap leading-none select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "border border-outline text-primary bg-transparent",
        text: "text-primary bg-transparent",
        elevated: "bg-surface-container-low text-primary shadow-1",
      },
      size: {
        sm: "h-8u px-4u text-label-medium",
        md: "h-10u px-6u text-label-large",
        lg: "h-12u px-8u text-label-large",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

/**
 * Props for the Button component.
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Button content */
  children: ReactNode;
  /**
   * Visual style variant:
   * - `filled`: High emphasis, primary actions (CTAs)
   * - `tonal`: Medium emphasis, secondary actions
   * - `outlined`: Low emphasis, tertiary actions
   * - `text`: Lowest emphasis, inline actions
   * - `elevated`: Floating actions with shadow
   * @default "filled"
   */
  variant?: "filled" | "tonal" | "outlined" | "text" | "elevated";
  /**
   * Button size
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /** Shows loading spinner and disables button */
  loading?: boolean;
  /** Icon to display before the label */
  icon?: ReactNode;
  /** Icon to display after the label */
  trailingIcon?: ReactNode;
}

/**
 * Material Design 3 Button component with ripple effect and state layers.
 *
 * @example
 * ```tsx
 * // Primary action
 * <Button variant="filled">Save</Button>
 *
 * // Secondary action
 * <Button variant="tonal">Edit</Button>
 *
 * // With icon
 * <Button icon={<Icon name="add" />}>Add Item</Button>
 *
 * // Loading state
 * <Button loading>Saving...</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "filled",
      size = "md",
      disabled = false,
      loading = false,
      icon,
      trailingIcon,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const iconSizeClass = "w-4.5u h-4.5u";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-snappy group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />
        <Ripple disabled={disabled || loading} />
        {loading && (
          <svg
            className={`animate-spin ${iconSizeClass} relative z-10`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!loading && icon && (
          <span
            className={`${iconSizeClass} flex items-center justify-center flex-shrink-0 relative z-10 pointer-events-none`}
          >
            {icon}
          </span>
        )}

        <span
          className={cn(
            "relative z-10 pointer-events-none",
            loading ? "opacity-0" : "opacity-100"
          )}
        >
          {children}
        </span>

        {!loading && trailingIcon && (
          <span
            className={`${iconSizeClass} flex items-center justify-center flex-shrink-0 relative z-10 pointer-events-none`}
          >
            {trailingIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
