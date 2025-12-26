import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

// Text variants - using utility classes for font-size, line-height,
// font-weight, and letter-spacing from the design tokens
const textVariants = cva("font-sans text-on-surface", {
  variants: {
    variant: {
      displayLarge:
        "text-display-large font-[var(--type-display-large-weight)] tracking-[var(--type-display-large-tracking)]",
      displayMedium:
        "text-display-medium font-[var(--type-display-medium-weight)] tracking-[var(--type-display-medium-tracking)]",
      displaySmall:
        "text-display-small font-[var(--type-display-small-weight)] tracking-[var(--type-display-small-tracking)]",
      headlineLarge:
        "text-headline-large font-[var(--type-headline-large-weight)] tracking-[var(--type-headline-large-tracking)]",
      headlineMedium:
        "text-headline-medium font-[var(--type-headline-medium-weight)] tracking-[var(--type-headline-medium-tracking)]",
      headlineSmall:
        "text-headline-small font-[var(--type-headline-small-weight)] tracking-[var(--type-headline-small-tracking)]",
      titleLarge:
        "text-title-large font-[var(--type-title-large-weight)] tracking-[var(--type-title-large-tracking)]",
      titleMedium:
        "text-title-medium font-[var(--type-title-medium-weight)] tracking-[var(--type-title-medium-tracking)]",
      titleSmall:
        "text-title-small font-[var(--type-title-small-weight)] tracking-[var(--type-title-small-tracking)]",
      bodyLarge:
        "text-body-large font-[var(--type-body-large-weight)] tracking-[var(--type-body-large-tracking)]",
      bodyMedium:
        "text-body-medium font-[var(--type-body-medium-weight)] tracking-[var(--type-body-medium-tracking)]",
      bodySmall:
        "text-body-small font-[var(--type-body-small-weight)] tracking-[var(--type-body-small-tracking)]",
      labelLarge:
        "text-label-large font-[var(--type-label-large-weight)] tracking-[var(--type-label-large-tracking)]",
      labelMedium:
        "text-label-medium font-[var(--type-label-medium-weight)] tracking-[var(--type-label-medium-tracking)]",
      labelSmall:
        "text-label-small font-[var(--type-label-small-weight)] tracking-[var(--type-label-small-tracking)]",
    },
    color: {
      primary: "text-primary",
      onPrimary: "text-on-primary",
      surface: "text-surface",
      onSurface: "text-on-surface",
      surfaceVariant: "text-surface-variant",
      onSurfaceVariant: "text-on-surface-variant",
      outline: "text-outline",
      outlineVariant: "text-outline-variant",
      error: "text-error",
      onError: "text-on-error",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    weight: {
      thin: "font-thin",
      extralight: "font-extralight",
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
      black: "font-black",
    },
  },
  defaultVariants: {
    variant: "bodyMedium",
    color: "onSurface",
    align: "left",
    weight: "normal",
  },
});

export type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  };

export const Text: React.FC<TextProps> = ({
  variant,
  color,
  align,
  weight,
  className,
  children,
  as: Component = "p",
  ...props
}) => {
  return (
    <Component
      className={cn(textVariants({ variant, color, align, weight, className }))}
      {...props}
    >
      {children}
    </Component>
  );
};
