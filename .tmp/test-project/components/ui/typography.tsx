import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils';

const typographyVariants = cva("text-on-surface", {
  variants: {
    variant: {
      displayLarge:
        "text-display-large font-[var(--uni-sys-type-display-large-weight)] tracking-[var(--uni-sys-type-display-large-tracking)]",
      displayMedium:
        "text-display-medium font-[var(--uni-sys-type-display-medium-weight)] tracking-[var(--uni-sys-type-display-medium-tracking)]",
      displaySmall:
        "text-display-small font-[var(--uni-sys-type-display-small-weight)] tracking-[var(--uni-sys-type-display-small-tracking)]",

      headlineLarge:
        "text-headline-large font-[var(--uni-sys-type-headline-large-weight)] tracking-[var(--uni-sys-type-headline-large-tracking)]",
      headlineMedium:
        "text-headline-medium font-[var(--uni-sys-type-headline-medium-weight)] tracking-[var(--uni-sys-type-headline-medium-tracking)]",
      headlineSmall:
        "text-headline-small font-[var(--uni-sys-type-headline-small-weight)] tracking-[var(--uni-sys-type-headline-small-tracking)]",

      titleLarge:
        "text-title-large font-[var(--uni-sys-type-title-large-weight)] tracking-[var(--uni-sys-type-title-large-tracking)]",
      titleMedium:
        "text-title-medium font-[var(--uni-sys-type-title-medium-weight)] tracking-[var(--uni-sys-type-title-medium-tracking)]",
      titleSmall:
        "text-title-small font-[var(--uni-sys-type-title-small-weight)] tracking-[var(--uni-sys-type-title-small-tracking)]",

      bodyLarge:
        "text-body-large font-[var(--uni-sys-type-body-large-weight)] tracking-[var(--uni-sys-type-body-large-tracking)]",
      bodyMedium:
        "text-body-medium font-[var(--uni-sys-type-body-medium-weight)] tracking-[var(--uni-sys-type-body-medium-tracking)]",
      bodySmall:
        "text-body-small font-[var(--uni-sys-type-body-small-weight)] tracking-[var(--uni-sys-type-body-small-tracking)]",

      labelLarge:
        "text-label-large font-[var(--uni-sys-type-label-large-weight)] tracking-[var(--uni-sys-type-label-large-tracking)]",
      labelMedium:
        "text-label-medium font-[var(--uni-sys-type-label-medium-weight)] tracking-[var(--uni-sys-type-label-medium-tracking)]",
      labelSmall:
        "text-label-small font-[var(--uni-sys-type-label-small-weight)] tracking-[var(--uni-sys-type-label-small-tracking)]",
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
