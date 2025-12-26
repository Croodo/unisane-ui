import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "../../lib/utils";
import { focusRing } from "../../utils/focus-ring";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2u rounded-full font-medium transition-all duration-short ease-standard disabled:opacity-38 disabled:cursor-not-allowed overflow-hidden group select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary shadow-1 hover:shadow-2 active:shadow-none",
        outlined: "border border-outline text-primary",
        tonal: "bg-secondary-container text-on-secondary-container hover:shadow-1",
        text: "text-primary px-3u",
        elevated: "bg-surface-container-low text-primary shadow-1 hover:shadow-2 hover:bg-surface-container",
      },
      size: {
        sm: "h-8u px-3u text-label-medium",
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

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "filled",
      size = "md",
      fullWidth = false,
      className = "",
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size }),
          focusRing.default,
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {/* State layer */}
        <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-short group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />

        {/* Ripple effect */}
        <Ripple disabled={disabled} />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2u">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";