import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const statVariants = cva("p-6u rounded-lg bg-surface-container");

const trendVariants = cva("flex items-center gap-1u text-label-medium", {
  variants: {
    trend: {
      up: "text-success",
      down: "text-error",
      neutral: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    trend: "neutral",
  },
});

const trendIconMap = {
  up: "trending_up",
  down: "trending_down",
  neutral: "trending_flat",
} as const;

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  description?: string;
}

export const Stat = forwardRef<HTMLDivElement, StatProps>(
  ({ label, value, change, icon, description, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statVariants(), className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2u">
          <span className="text-body-medium text-on-surface-variant">
            {label}
          </span>
          {icon && (
            <div className="w-10u h-10u rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-display-small font-normal text-on-surface mb-1u">
          {value}
        </div>

        {/* Change indicator */}
        {change && (
          <div className={cn(trendVariants({ trend: change.trend }))}>
            <span className="material-symbols-outlined w-4.5u h-4.5u">
              {trendIconMap[change.trend]}
            </span>
            <span>
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
            {description && (
              <span className="text-on-surface-variant ml-1u">
                {description}
              </span>
            )}
          </div>
        )}

        {/* Description without change */}
        {!change && description && (
          <div className="text-body-small text-on-surface-variant">
            {description}
          </div>
        )}
      </div>
    );
  }
);

Stat.displayName = "Stat";

// Stat Group
export const StatGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4u", className)}>
    {children}
  </div>
);