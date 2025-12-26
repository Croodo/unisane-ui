"use client";

import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "../../lib/utils";
import { VisuallyHidden } from "./visually-hidden";
import { focusRing } from "../../utils/focus-ring";
import { stateLayers } from "../../utils/state-layers";

const iconButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full transition-all duration-short ease-standard disabled:opacity-38 disabled:cursor-not-allowed overflow-hidden group select-none",
  {
    variants: {
      variant: {
        standard: `text-on-surface-variant ${stateLayers.hover} ${stateLayers.pressed}`,
        filled: "bg-primary text-on-primary hover:brightness-110 active:brightness-95",
        tonal: "bg-secondary-container text-on-secondary-container hover:brightness-95 active:brightness-90",
        outlined: `border border-outline text-on-surface-variant ${stateLayers.hover} ${stateLayers.pressed}`,
      },
      size: {
        sm: "w-8u h-8u text-[18px]",
        md: "w-10u h-10u text-[20px]",
        lg: "w-12u h-12u text-[24px]",
      },
    },
    defaultVariants: {
      variant: "standard",
      size: "md",
    },
  }
);

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  ariaLabel: string; // Required for accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "standard",
      size = "md",
      ariaLabel,
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
          iconButtonVariants({ variant, size }),
          focusRing.default,
          className
        )}
        {...props}
      >
        {/* State layer - ONLY for filled/tonal which don't use the simple util classes in variant */}
        {(variant === 'filled' || variant === 'tonal') && (
             <span className="absolute inset-0 pointer-events-none bg-current opacity-0 transition-opacity duration-short group-hover:opacity-hover group-focus-visible:opacity-focus group-active:opacity-pressed" />
        )}

        {/* Ripple effect */}
        <Ripple disabled={disabled} center />

        {/* SR Only Label */}
        <VisuallyHidden>{ariaLabel}</VisuallyHidden>

        {/* Icon content */}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";