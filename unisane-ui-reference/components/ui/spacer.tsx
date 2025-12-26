import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const spacerVariants = cva("", {
  variants: {
    size: {
      xs: "h-1u",
      sm: "h-2u",
      md: "h-4u",
      lg: "h-6u",
      xl: "h-8u",
      "2xl": "h-12u",
    },
    grow: {
      true: "flex-1",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    grow: false,
  },
});

export interface SpacerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacerVariants> {}

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, grow, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spacerVariants({ size: grow ? undefined : size, grow }), className)}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Spacer.displayName = "Spacer";