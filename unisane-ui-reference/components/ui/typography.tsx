import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

type TypographyVariant =
  | "display-large"
  | "display-medium"
  | "display-small"
  | "headline-large"
  | "headline-medium"
  | "headline-small"
  | "title-large"
  | "title-medium"
  | "title-small"
  | "body-large"
  | "body-medium"
  | "body-small"
  | "label-large"
  | "label-medium"
  | "label-small";

const typographyVariants = cva("", {
  variants: {
    variant: {
      "display-large": "text-display-large font-normal",
      "display-medium": "text-display-medium font-normal",
      "display-small": "text-display-small font-normal",
      "headline-large": "text-headline-large font-normal",
      "headline-medium": "text-headline-medium font-normal",
      "headline-small": "text-headline-small font-normal",
      "title-large": "text-title-large font-normal",
      "title-medium": "text-title-medium font-medium",
      "title-small": "text-title-small font-medium",
      "body-large": "text-body-large font-normal",
      "body-medium": "text-body-medium font-normal",
      "body-small": "text-body-small font-normal",
      "label-large": "text-label-large font-medium",
      "label-medium": "text-label-medium font-medium",
      "label-small": "text-label-small font-medium",
    },
    color: {
      default: "text-on-surface",
      primary: "text-primary",
      secondary: "text-secondary",
      tertiary: "text-tertiary",
      error: "text-error",
      muted: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    variant: "body-medium",
    color: "default",
  },
});

interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

const defaultTags: Record<TypographyVariant, React.ElementType> = {
  "display-large": "h1",
  "display-medium": "h1",
  "display-small": "h1",
  "headline-large": "h2",
  "headline-medium": "h2",
  "headline-small": "h3",
  "title-large": "h3",
  "title-medium": "h4",
  "title-small": "h5",
  "body-large": "p",
  "body-medium": "p",
  "body-small": "p",
  "label-large": "span",
  "label-medium": "span",
  "label-small": "span",
};

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ variant = "body-medium", as, color = "default", className, children, ...props }, ref) => {
    const Component = as || defaultTags[variant || "body-medium"];

    return (
      <Component
        ref={ref as any}
        className={cn(typographyVariants({ variant, color }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";