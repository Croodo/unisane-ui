import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("rounded-full", {
  variants: {
    variant: {
      default: "bg-surface-container-high text-on-surface",
      primary: "bg-primary text-on-primary",
      secondary: "bg-secondary-container text-on-secondary-container",
      success: "bg-success text-on-success",
      error: "bg-error text-on-error",
      warning: "bg-warning text-on-warning",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
    dot: {
      true: "inline-block",
      false: "inline-flex items-center justify-center font-medium",
    },
  },
  compoundVariants: [
    // Dot sizes
    { dot: true, size: "sm", className: "w-1.5u h-1.5u" },
    { dot: true, size: "md", className: "w-2u h-2u" },
    { dot: true, size: "lg", className: "w-2.5u h-2.5u" },
    // Badge sizes
    { dot: false, size: "sm", className: "h-4u px-1.5u text-label-small min-w-4u" },
    { dot: false, size: "md", className: "h-5u px-2u text-label-medium min-w-5u" },
    { dot: false, size: "lg", className: "h-6u px-2.5u text-label-large min-w-6u" },
  ],
  defaultVariants: {
    variant: "default",
    size: "md",
    dot: false,
  },
});

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, size, dot, children, className, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size, dot }), className)} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// BadgeWrapper - for positioning badge on elements
const badgeWrapperVariants = cva("absolute", {
  variants: {
    position: {
      "top-right": "top-0 right-0",
      "top-left": "top-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "bottom-left": "bottom-0 left-0",
    },
    overlap: {
      circular: "",
      rectangular: "",
    },
  },
  compoundVariants: [
    { position: "top-right", overlap: "circular", className: "translate-x-1/3 -translate-y-1/3" },
    { position: "top-right", overlap: "rectangular", className: "translate-x-1/4 -translate-y-1/4" },
    { position: "top-left", overlap: "circular", className: "-translate-x-1/3 -translate-y-1/3" },
    { position: "top-left", overlap: "rectangular", className: "-translate-x-1/4 -translate-y-1/4" },
    { position: "bottom-right", overlap: "circular", className: "translate-x-1/3 translate-y-1/3" },
    { position: "bottom-right", overlap: "rectangular", className: "translate-x-1/4 translate-y-1/4" },
    { position: "bottom-left", overlap: "circular", className: "-translate-x-1/3 translate-y-1/3" },
    { position: "bottom-left", overlap: "rectangular", className: "-translate-x-1/4 translate-y-1/4" },
  ],
  defaultVariants: {
    position: "top-right",
    overlap: "rectangular",
  },
});

interface BadgeWrapperProps extends VariantProps<typeof badgeWrapperVariants> {
  children: React.ReactNode;
  badge: React.ReactNode;
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  overlap?: "circular" | "rectangular";
}

export const BadgeWrapper = ({
  children,
  badge,
  position,
  overlap,
  className,
}: BadgeWrapperProps) => {
  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      <span className={cn(badgeWrapperVariants({ position, overlap }))}>{badge}</span>
    </div>
  );
};