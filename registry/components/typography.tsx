import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-on-surface", {
  variants: {
    variant: {
      displayLarge:
        "text-display-large leading-display-large font-[var(--type-display-large-weight)] tracking-[var(--type-display-large-tracking)]",
      displayMedium:
        "text-display-medium leading-display-medium font-[var(--type-display-medium-weight)] tracking-[var(--type-display-medium-tracking)]",
      displaySmall:
        "text-display-small leading-display-small font-[var(--type-display-small-weight)] tracking-[var(--type-display-small-tracking)]",
      headlineLarge:
        "text-headline-large leading-headline-large font-[var(--type-headline-large-weight)] tracking-[var(--type-headline-large-tracking)]",
      headlineMedium:
        "text-headline-medium leading-headline-medium font-[var(--type-headline-medium-weight)] tracking-[var(--type-headline-medium-tracking)]",
      headlineSmall:
        "text-headline-small leading-headline-small font-[var(--type-headline-small-weight)] tracking-[var(--type-headline-small-tracking)]",
      titleLarge:
        "text-title-large leading-title-large font-[var(--type-title-large-weight)] tracking-[var(--type-title-large-tracking)]",
      titleMedium:
        "text-title-medium leading-title-medium font-[var(--type-title-medium-weight)] tracking-[var(--type-title-medium-tracking)]",
      titleSmall:
        "text-title-small leading-title-small font-[var(--type-title-small-weight)] tracking-[var(--type-title-small-tracking)]",
      bodyLarge:
        "text-body-large leading-body-large font-[var(--type-body-large-weight)] tracking-[var(--type-body-large-tracking)]",
      bodyMedium:
        "text-body-medium leading-body-medium font-[var(--type-body-medium-weight)] tracking-[var(--type-body-medium-tracking)]",
      bodySmall:
        "text-body-small leading-body-small font-[var(--type-body-small-weight)] tracking-[var(--type-body-small-tracking)]",
      labelLarge:
        "text-label-large leading-label-large font-[var(--type-label-large-weight)] tracking-[var(--type-label-large-tracking)]",
      labelMedium:
        "text-label-medium leading-label-medium font-[var(--type-label-medium-weight)] tracking-[var(--type-label-medium-tracking)]",
      labelSmall:
        "text-label-small leading-label-small font-[var(--type-label-small-weight)] tracking-[var(--type-label-small-tracking)]",
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
