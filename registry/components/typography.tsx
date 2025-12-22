import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";

const typographyVariants = cva("text-on-surface", {
  variants: {
    variant: {
      displayLarge: "text-display-large font-black",
      displayMedium: "text-display-medium font-black",
      displaySmall: "text-display-small font-black",

      headlineLarge: "text-headline-large font-black",
      headlineMedium: "text-headline-medium font-black",
      headlineSmall: "text-headline-small font-bold",

      titleLarge: "text-title-large font-black",
      titleMedium: "text-title-medium font-bold",
      titleSmall: "text-title-small font-black",

      bodyLarge: "text-body-large font-medium",
      bodyMedium: "text-body-medium font-medium",
      bodySmall: "text-body-small font-medium",

      labelLarge: "text-label-large font-bold",
      labelMedium: "text-label-medium font-bold",
      labelSmall: "text-label-small font-bold",
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
  className,
  children,
  ...props
}) => {
  const Component =
    component || defaultTags[variant as TypographyVariant] || "p";
  return (
    <Component
      className={cn(typographyVariants({ variant, className }))}
      {...props}
    >
      {children}
    </Component>
  );
};
