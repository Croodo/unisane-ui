"use client";

import { forwardRef } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Icon to display (defaults to Inbox) */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
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
 * EmptyState - Consistent empty state display
 *
 * @example
 * <EmptyState
 *   icon={Users}
 *   title="No team members"
 *   description="Invite your first team member to get started."
 *   action={{ label: "Invite member", onClick: handleInvite }}
 * />
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon = Inbox,
      title,
      description,
      action,
      link,
      size = "default",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        wrapper: "py-6",
        icon: "h-8 w-8",
        title: "text-sm",
        description: "text-xs",
      },
      default: {
        wrapper: "py-12",
        icon: "h-12 w-12",
        title: "text-base",
        description: "text-sm",
      },
      lg: {
        wrapper: "py-16",
        icon: "h-16 w-16",
        title: "text-lg",
        description: "text-base",
      },
    };

    const s = sizeClasses[size];

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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
          <Icon className={cn("text-muted-foreground", s.icon)} />
        </div>
        <h3 className={cn("font-semibold text-foreground", s.title)}>
          {title}
        </h3>
        {description && (
          <p
            className={cn("mt-1 max-w-sm text-muted-foreground", s.description)}
          >
            {description}
          </p>
        )}
        {(action || link) && (
          <div className="mt-4 flex items-center gap-3">
            {action && (
              <Button
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            )}
            {link && (
              <a
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
