import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium",
  {
    variants: {
      variant: {
        filled: "",
        tonal: "",
        outlined: "border border-outline-variant/30",
        outline: "border border-outline-variant/30", // alias for "outlined"
        // shadcn compatibility aliases
        default: "", // maps to filled
        secondary: "", // maps to tonal
        destructive: "", // maps to filled+error
      },
      color: {
        primary: "",
        secondary: "",
        tertiary: "",
        error: "",
        success: "",
      },
      size: {
        sm: "text-label-small px-1.5 py-0.5",
        md: "text-label-small px-2 py-0.5",
        lg: "text-body-small px-3 py-1",
      },
    },
    compoundVariants: [
      { variant: "filled", color: "primary", className: "bg-primary text-on-primary" },
      { variant: "filled", color: "secondary", className: "bg-secondary text-on-secondary" },
      { variant: "filled", color: "tertiary", className: "bg-tertiary text-on-tertiary" },
      { variant: "filled", color: "error", className: "bg-error text-on-error" },
      { variant: "filled", color: "success", className: "bg-success text-on-success" },
      { variant: "tonal", color: "primary", className: "bg-primary-container text-on-primary-container" },
      { variant: "tonal", color: "secondary", className: "bg-secondary-container text-on-secondary-container" },
      { variant: "tonal", color: "tertiary", className: "bg-tertiary-container text-on-tertiary-container" },
      { variant: "tonal", color: "error", className: "bg-error-container text-on-error-container" },
      { variant: "tonal", color: "success", className: "bg-success-container text-on-success-container" },
      { variant: "outlined", color: "primary", className: "text-primary border-primary/30" },
      { variant: "outlined", color: "secondary", className: "text-secondary border-secondary/30" },
      { variant: "outlined", color: "tertiary", className: "text-tertiary border-tertiary/30" },
      { variant: "outlined", color: "error", className: "text-error border-error/30" },
      { variant: "outlined", color: "success", className: "text-success border-success/30" },
      // shadcn compatibility compound variants
      { variant: "default", color: "primary", className: "bg-primary text-on-primary" },
      { variant: "secondary", color: "primary", className: "bg-secondary-container text-on-secondary-container" },
      { variant: "secondary", color: "secondary", className: "bg-secondary-container text-on-secondary-container" },
      { variant: "destructive", color: "primary", className: "bg-error text-on-error" },
      { variant: "destructive", color: "error", className: "bg-error text-on-error" },
    ],
    defaultVariants: {
      variant: "filled",
      color: "primary",
      size: "md",
    },
  }
);

export type BadgeProps = VariantProps<typeof badgeVariants> &
  React.HTMLAttributes<HTMLSpanElement> & {
    children: React.ReactNode;
  };

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant, color, size, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        role="status"
        className={cn(badgeVariants({ variant, color, size, className }))}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
