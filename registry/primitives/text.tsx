import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("font-sans text-on-surface", {
  variants: {
    variant: {
      displayLarge: "text-display-large",
      displayMedium: "text-display-medium",
      displaySmall: "text-display-small",
      headlineLarge: "text-headline-large",
      headlineMedium: "text-headline-medium",
      headlineSmall: "text-headline-small",
      titleLarge: "text-title-large",
      titleMedium: "text-title-medium",
      titleSmall: "text-title-small",
      bodyLarge: "text-body-large",
      bodyMedium: "text-body-medium",
      bodySmall: "text-body-small",
      labelLarge: "text-label-large",
      labelMedium: "text-label-medium",
      labelSmall: "text-label-small",
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
