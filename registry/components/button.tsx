"use client";

import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "@ui/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-xs font-black transition-all duration-snappy ease-emphasized overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-38 disabled:cursor-not-allowed group active:scale-[0.98] whitespace-nowrap uppercase tracking-[0.15em] text-label-small leading-none select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary shadow-1 hover:shadow-3 active:shadow-1",
        tonal: "bg-surface-container-high text-on-surface shadow-0 hover:bg-surface-container-highest active:shadow-0 border border-outline-variant/30",
        outlined: "border border-outline text-primary hover:bg-surface-variant active:bg-surface-container",
        text: "text-primary hover:bg-primary/5 active:bg-primary/10",
        elevated: "bg-surface text-primary shadow-2 hover:shadow-4 active:shadow-1 border border-outline-variant/10",
      },
      size: {
        sm: "h-8u px-4u text-label-small",
        md: "h-10u px-8u text-label-small",
        lg: "h-12u px-10u text-body-small",
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
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
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
      ...props
    },
    ref
  ) => {
    const iconSizeClass = "w-4.5u h-4.5u";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size }),
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
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
            "relative z-10 pointer-events-none pt-0.5u",
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

