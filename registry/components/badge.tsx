import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-black uppercase tracking-widest",
  {
    variants: {
      variant: {
        filled: "",
        tonal: "",
        outlined: "border border-outline-variant/30",
      },
      color: {
        primary: "",
        secondary: "",
        tertiary: "",
        error: "",
        success: "",
      },
      size: {
        sm: "text-label-small px-1.5u py-0.5u",
        md: "text-label-small px-2u py-0.5u",
        lg: "text-body-small px-3u py-1u",
      },
    },
    compoundVariants: [
      // Filled variants
      {
        variant: "filled",
        color: "primary",
        className: "bg-primary text-on-primary",
      },
      {
        variant: "filled",
        color: "secondary",
        className: "bg-secondary text-on-secondary",
      },
      {
        variant: "filled",
        color: "tertiary",
        className: "bg-tertiary text-on-tertiary",
      },
      {
        variant: "filled",
        color: "error",
        className: "bg-error text-on-error",
      },
      {
        variant: "filled",
        color: "success",
        className: "bg-success text-on-success",
      },
      // Tonal variants
      {
        variant: "tonal",
        color: "primary",
        className: "bg-primary-container text-on-primary-container",
      },
      {
        variant: "tonal",
        color: "secondary",
        className: "bg-secondary-container text-on-secondary-container",
      },
      {
        variant: "tonal",
        color: "tertiary",
        className: "bg-tertiary-container text-on-tertiary-container",
      },
      {
        variant: "tonal",
        color: "error",
        className: "bg-error-container text-on-error-container",
      },
      {
        variant: "tonal",
        color: "success",
        className: "bg-success-container text-on-success-container",
      },
      // Outlined variants
      {
        variant: "outlined",
        color: "primary",
        className: "text-primary",
      },
      {
        variant: "outlined",
        color: "secondary",
        className: "text-secondary",
      },
      {
        variant: "outlined",
        color: "tertiary",
        className: "text-tertiary",
      },
      {
        variant: "outlined",
        color: "error",
        className: "text-error",
      },
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
        className={cn(badgeVariants({ variant, color, size, className }))}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

