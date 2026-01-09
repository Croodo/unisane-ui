import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

// Typography variants - Tailwind v4's --text-* system automatically applies
// font-size, line-height, letter-spacing, and font-weight from the token suffixes
const typographyVariants = cva("text-on-surface", {
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
  },
  defaultVariants: {
    variant: "bodyLarge",
  },
});

export type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

export type TypographyProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    component?: React.ElementType;
    /** shadcn compatibility: alias for component prop */
    as?: React.ElementType;
  };

const defaultTags: Record<TypographyVariant, React.ElementType> = {
  displayLarge: "h1",
  displayMedium: "h2",
  displaySmall: "h3",
  headlineLarge: "h4",
  headlineMedium: "h5",
  headlineSmall: "h6",
  titleLarge: "p",
  titleMedium: "p",
  titleSmall: "p",
  bodyLarge: "p",
  bodyMedium: "p",
  bodySmall: "p",
  labelLarge: "span",
  labelMedium: "span",
  labelSmall: "span",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "bodyLarge",
  component,
  as,
  className,
  children,
  ...props
}) => {
  // Support both 'component' and 'as' prop (as is shadcn compatibility)
  const Component =
    component || as || defaultTags[variant as TypographyVariant] || "p";
  return (
    <Component
      className={cn(typographyVariants({ variant, className }))}
      {...props}
    >
      {children}
    </Component>
  );
};
