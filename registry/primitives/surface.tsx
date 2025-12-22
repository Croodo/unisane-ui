import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const surfaceVariants = cva("relative transition-colors", {
  variants: {
    tone: {
      surface: "bg-surface text-on-surface",
      surfaceVariant: "bg-surface-variant text-on-surface-variant",
      primary: "bg-primary text-on-primary",
      primaryContainer: "bg-primary-container text-on-primary-container",
      error: "bg-error text-on-error",
      errorContainer: "bg-error-container text-on-error-container",
    },
    elevation: {
      0: "shadow-0",
      1: "shadow-1",
      2: "shadow-2",
      3: "shadow-3",
    },
    rounded: {
      none: "rounded-none",
      xs: "rounded-xs",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    tone: "surface",
    elevation: 0,
    rounded: "none",
  },
});

export type SurfaceProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceVariants>;

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ tone, elevation, rounded, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(surfaceVariants({ tone, elevation, rounded, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Surface.displayName = "Surface";
