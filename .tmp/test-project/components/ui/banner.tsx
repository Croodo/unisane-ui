import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Icon } from '@/components/ui/icon';

const bannerVariants = cva(
  "relative w-full flex items-start gap-4u p-4u border-b border-outline-variant/30 transition-all",
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

  return (
    <Surface
      tone="surface"
      className={cn(bannerVariants({ variant, className }))}
      role="banner"
    >
      {/* Icon */}
      {icon && (
        <div className="w-6u h-6u flex items-center justify-center text-primary mt-0.5u shrink-0">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <Text variant="titleSmall" className="text-on-surface mb-1u">
            {title}
          </Text>
        )}
        <div className="text-body-small text-on-surface-variant leading-relaxed">
          {message}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex gap-2u mt-4u">
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

      {/* Close Button */}
      <IconButton
        icon={<Icon symbol="close" size="sm" />}
        onClick={onClose}
        className="text-on-surface-variant hover:bg-on-surface/10 ml-2u shrink-0"
        ariaLabel="Close banner"
      />
    </Surface>
  );
};
