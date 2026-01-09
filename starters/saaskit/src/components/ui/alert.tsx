import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/primitives/icon";
import { Typography } from "./typography";

const alertVariants = cva(
  "relative w-full rounded-sm p-4 flex items-start gap-3 border-l-4",
  {
    variants: {
      variant: {
        info: "bg-secondary-container border-secondary text-on-secondary-container",
        error: "bg-error-container border-error text-on-error-container",
        warning: "bg-tertiary-container border-tertiary text-on-tertiary-container",
        success: "bg-primary-container border-primary text-on-primary-container",
        // shadcn compatibility aliases
        destructive: "bg-error-container border-error text-on-error-container",
        default: "bg-secondary-container border-secondary text-on-secondary-container",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    icon?: React.ReactNode | string;
    title?: string;
  };

export const Alert: React.FC<AlertProps> = ({
  variant,
  icon,
  title,
  children,
  className,
  ...props
}) => {
  const defaultIcons = {
    info: "info",
    error: "error",
    warning: "warning",
    success: "check_circle",
    destructive: "error",
    default: "info",
  } as const;

  type VariantKey = keyof typeof defaultIcons;
  const variantKey = (variant || "info") as VariantKey;
  const iconSymbol = typeof icon === "string" ? icon : defaultIcons[variantKey];
  const iconNode =
    typeof icon === "string" || !icon ? (
      <Icon symbol={iconSymbol} size="sm" className="opacity-80" />
    ) : (
      icon
    );

  return (
    <div className={cn(alertVariants({ variant, className }))} role="alert" {...props}>
      <div className="shrink-0 size-icon-sm flex items-center justify-center">{iconNode}</div>
      <div className="flex-1 flex flex-col gap-1">
        {title && (
          <Typography
            variant="labelMedium"
            className="text-inherit"
          >
            {title}
          </Typography>
        )}
        <div className="text-body-small opacity-90 leading-snug">
          {children}
        </div>
      </div>
    </div>
  );
};

// Compatibility exports for shadcn-style Alert API
export type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export const AlertTitle: React.FC<AlertTitleProps> = ({
  children,
  className,
  ...props
}) => (
  <Typography
    variant="labelMedium"
    as="h5"
    className={cn("text-inherit", className)}
    {...props}
  >
    {children}
  </Typography>
);

export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("text-body-small opacity-90 leading-snug", className)} {...props}>
    {children}
  </div>
);
