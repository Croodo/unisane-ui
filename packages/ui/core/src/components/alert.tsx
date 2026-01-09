import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Icon } from "@ui/primitives/icon";
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
  const defaultIcons: Record<string, string> = {
    info: "info",
    error: "error",
    warning: "warning",
    success: "check_circle",
  };

  const iconNode =
    typeof icon === "string" || !icon ? (
      <Icon symbol={(icon as string) || defaultIcons[variant || "info"]} size="sm" className="opacity-80" />
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
