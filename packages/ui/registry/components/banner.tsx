import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Surface } from "@/primitives/surface";
import { Text } from "@/primitives/text";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Icon } from "@/primitives/icon";

const bannerVariants = cva(
  "relative w-full flex items-start gap-4 p-4 border-b border-outline-variant/30 transition-all duration-medium ease-standard",
  {
    variants: {
      variant: {
        default: "bg-surface text-on-surface",
        info: "bg-surface text-on-surface",
        warning: "bg-warning-container/30 text-on-warning-container",
        error: "bg-error-container/30 text-on-error-container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BannerProps = VariantProps<typeof bannerVariants> & {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title?: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  className?: string;
};

export const Banner: React.FC<BannerProps> = ({
  open,
  onClose,
  icon,
  title,
  message,
  actions,
  className,
  variant = "default",
}) => {
  if (!open) return null;

  const role = variant === "error" ? "alert" : variant === "warning" ? "alert" : "status";

  return (
    <Surface
      tone="surface"
      className={cn(bannerVariants({ variant, className }))}
      role={role}
      aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
    >
      {icon && (
        <div className="w-5 h-5 flex items-center justify-center text-primary mt-0.5 shrink-0">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <Text variant="titleSmall" className="text-on-surface mb-1">
            {title}
          </Text>
        )}
        <div className="text-body-small text-on-surface-variant leading-relaxed">
          {message}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="text"
                size="sm"
                onClick={action.onClick}
                className="text-primary font-medium"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <IconButton
        icon={<Icon symbol="close" size="sm" />}
        onClick={onClose}
        className="text-on-surface-variant hover:bg-on-surface/10 ml-2 shrink-0"
        ariaLabel="Close banner"
      />
    </Surface>
  );
};
