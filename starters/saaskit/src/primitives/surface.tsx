import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const surfaceVariants = cva("relative transition-colors", {
  variants: {
    tone: {
      surface: "bg-surface text-on-surface",
      surfaceVariant: "bg-surface-variant text-on-surface-variant",
      surfaceContainerLowest: "bg-surface-container-lowest text-on-surface",
      surfaceContainerLow: "bg-surface-container-low text-on-surface",
      surfaceContainer: "bg-surface-container text-on-surface",
      surfaceContainerHigh: "bg-surface-container-high text-on-surface",
      surfaceContainerHighest: "bg-surface-container-highest text-on-surface",
      primary: "bg-primary text-on-primary",
      primaryContainer: "bg-primary-container text-on-primary-container",
      secondary: "bg-secondary text-on-secondary",
      secondaryContainer: "bg-secondary-container text-on-secondary-container",
      tertiary: "bg-tertiary text-on-tertiary",
      tertiaryContainer: "bg-tertiary-container text-on-tertiary-container",
      error: "bg-error text-on-error",
      errorContainer: "bg-error-container text-on-error-container",
    },
    elevation: {
      0: "shadow-0",
      1: "shadow-1",
      2: "shadow-2",
      3: "shadow-3",
      4: "shadow-4",
      5: "shadow-5",
    },
    rounded: {
      none: "rounded-none",
      xs: "rounded-xs",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      xxl: "rounded-2xl",
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
