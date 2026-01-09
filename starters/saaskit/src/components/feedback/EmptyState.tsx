"use client";

import { forwardRef } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Surface } from "@unisane/ui/primitives/surface";
import { Text } from "@unisane/ui/primitives/text";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";

export type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Material Symbol icon name (defaults to "inbox") */
  icon?: string;
  /** Main title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    icon?: string;
  };
  /** Secondary link */
  link?: {
    label: string;
    href: string;
  };
  /** Size variant */
  size?: "sm" | "default" | "lg";
};

/**
 * EmptyState - Consistent empty state display using Material 3 design.
 *
 * @example
 * <EmptyState
 *   icon="group"
 *   title="No team members"
 *   description="Invite your first team member to get started."
 *   action={{ label: "Invite member", onClick: handleInvite, icon: "person_add" }}
 * />
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon = "inbox",
      title,
      description,
      action,
      link,
      size = "default",
      ...props
    },
    ref
  ) => {
    const sizeConfig = {
      sm: {
        wrapper: "py-6",
        iconContainer: "size-14",
        iconSize: "md" as const,
        titleVariant: "titleSmall" as const,
        descVariant: "bodySmall" as const,
      },
      default: {
        wrapper: "py-12",
        iconContainer: "size-20",
        iconSize: "lg" as const,
        titleVariant: "titleMedium" as const,
        descVariant: "bodyMedium" as const,
      },
      lg: {
        wrapper: "py-16",
        iconContainer: "size-24",
        iconSize: "xl" as const,
        titleVariant: "titleLarge" as const,
        descVariant: "bodyLarge" as const,
      },
    };

    const s = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          s.wrapper,
          className
        )}
        {...props}
      >
        <Surface
          tone="surfaceContainerHigh"
          rounded="full"
          className={cn("flex items-center justify-center mb-4", s.iconContainer)}
        >
          <Icon
            symbol={icon}
            size={s.iconSize}
            className="text-on-surface-variant"
          />
        </Surface>

        <Text variant={s.titleVariant} weight="semibold" className="text-on-surface">
          {title}
        </Text>

        {description && (
          <Text
            variant={s.descVariant}
            color="onSurfaceVariant"
            className="mt-1 max-w-sm"
          >
            {description}
          </Text>
        )}

        {(action || link) && (
          <div className="mt-4 flex items-center gap-3">
            {action && (
              <Button
                size="sm"
                variant="filled"
                onClick={action.onClick}
                disabled={action.disabled}
                icon={action.icon ? <Icon symbol={action.icon} size="sm" /> : undefined}
              >
                {action.label}
              </Button>
            )}
            {link && (
              <Text
                as="span"
                variant="labelMedium"
                color="primary"
                className="cursor-pointer hover:underline underline-offset-4"
              >
                <a href={link.href}>{link.label}</a>
              </Text>
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
