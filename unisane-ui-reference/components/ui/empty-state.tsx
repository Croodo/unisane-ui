import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center py-16u px-6u text-center"
);

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants(), className)}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <div className="w-16u h-16u flex items-center justify-center mb-4u text-on-surface-variant opacity-60">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="text-headline-small text-on-surface mb-2u">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-body-medium text-on-surface-variant max-w-md mb-6u">
            {description}
          </p>
        )}

        {/* Action */}
        {action && <div>{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";