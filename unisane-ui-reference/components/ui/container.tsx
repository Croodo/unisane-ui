import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      sm: "max-w-screen-sm",   // 640px
      md: "max-w-screen-md",   // 768px
      lg: "max-w-screen-lg",   // 1024px
      xl: "max-w-screen-xl",   // 1280px
      "2xl": "max-w-screen-2xl", // 1536px
      full: "max-w-full",
    },
    padding: {
      true: "px-4u md:px-6u lg:px-8u",
      false: "px-0",
    },
  },
  defaultVariants: {
    size: "lg",
    padding: true,
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size, padding, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";