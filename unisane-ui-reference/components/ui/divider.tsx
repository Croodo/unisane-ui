import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const dividerVariants = cva("border-outline-variant/30", {
  variants: {
    orientation: {
      horizontal: "border-t w-full",
      vertical: "border-l h-full",
    },
    variant: {
      solid: "",
      dashed: "border-dashed",
      dotted: "border-dotted",
    },
    spacing: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  compoundVariants: [
    // Horizontal spacing
    { orientation: "horizontal", spacing: "sm", className: "my-2u" },
    { orientation: "horizontal", spacing: "md", className: "my-4u" },
    { orientation: "horizontal", spacing: "lg", className: "my-6u" },
    // Vertical spacing
    { orientation: "vertical", spacing: "sm", className: "mx-2u" },
    { orientation: "vertical", spacing: "md", className: "mx-4u" },
    { orientation: "vertical", spacing: "lg", className: "mx-6u" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    variant: "solid",
    spacing: "md",
  },
});

interface DividerProps
  extends React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerVariants> {
  withText?: boolean;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      orientation = "horizontal",
      variant = "solid",
      spacing = "md",
      withText = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Divider with text (only for horizontal)
    if (withText && children) {
      return (
        <div
          className={cn(
            "flex items-center",
            spacing === "sm" && "my-2u",
            spacing === "md" && "my-4u",
            spacing === "lg" && "my-6u",
            className
          )}
        >
          <hr
            ref={ref}
            className={cn(
              "flex-1 border-outline-variant/30",
              variant === "dashed" && "border-dashed",
              variant === "dotted" && "border-dotted"
            )}
            {...props}
          />
          <span className="px-3u text-label-medium text-on-surface-variant">
            {children}
          </span>
          <hr
            className={cn(
              "flex-1 border-outline-variant/30",
              variant === "dashed" && "border-dashed",
              variant === "dotted" && "border-dotted"
            )}
          />
        </div>
      );
    }

    // Standard divider
    return (
      <hr
        ref={ref}
        className={cn(dividerVariants({ orientation, variant, spacing }), className)}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";