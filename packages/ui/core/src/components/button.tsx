"use client";

import { type ReactNode, type ButtonHTMLAttributes, forwardRef, isValidElement, cloneElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn, Slot } from "@ui/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-short ease-standard overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed group whitespace-nowrap leading-none select-none",
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
        sm: "h-8 px-4 text-label-medium",
        md: "h-10 px-6 text-label-large",
        lg: "h-12 px-8 text-label-large",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  variant?: "filled" | "tonal" | "outlined" | "text" | "elevated";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  asChild?: boolean;
}

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
      asChild = false,
      ...props
    },
    ref
  ) => {
    const iconSizeClass = "size-icon-sm";
    const buttonClasses = cn(buttonVariants({ variant, size }), className);

    const innerContent = (
      <>
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
            className={`${iconSizeClass} flex items-center justify-center shrink-0 relative z-10 pointer-events-none`}
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
          {asChild ? null : children}
        </span>

        {!loading && trailingIcon && (
          <span
            className={`${iconSizeClass} flex items-center justify-center shrink-0 relative z-10 pointer-events-none`}
          >
            {trailingIcon}
          </span>
        )}
      </>
    );

    // asChild pattern: render user's element (e.g., Next.js Link) with button styles
    if (asChild && isValidElement(children)) {
      // Get the text content from the Link's children
      const childElement = children as React.ReactElement<{ children?: ReactNode }>;
      const linkChildren = childElement.props.children;
      const contentWithText = (
        <>
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
              className={`${iconSizeClass} flex items-center justify-center shrink-0 relative z-10 pointer-events-none`}
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
            {linkChildren}
          </span>
          {!loading && trailingIcon && (
            <span
              className={`${iconSizeClass} flex items-center justify-center shrink-0 relative z-10 pointer-events-none`}
            >
              {trailingIcon}
            </span>
          )}
        </>
      );
      return (
        <Slot className={buttonClasses}>
          {cloneElement(children as React.ReactElement, {}, contentWithText)}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {innerContent}
      </button>
    );
  }
);

Button.displayName = "Button";
