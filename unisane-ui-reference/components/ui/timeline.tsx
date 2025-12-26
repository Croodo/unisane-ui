import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const timelineIconVariants = cva(
  "w-10u h-10u rounded-full flex items-center justify-center",
  {
    variants: {
      iconColor: {
        primary: "bg-primary text-on-primary",
        secondary: "bg-secondary text-on-secondary",
        success: "bg-success text-on-success",
        error: "bg-error text-on-error",
        warning: "bg-warning text-on-warning",
      },
    },
    defaultVariants: {
      iconColor: "primary",
    },
  }
);

interface TimelineItemProps extends VariantProps<typeof timelineIconVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  time?: string;
  isLast?: boolean;
  className?: string;
}

export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ children, icon, iconColor, time, isLast = false, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex gap-4u", className)}>
        {/* Icon column */}
        <div className="flex flex-col items-center">
          <div className={cn(timelineIconVariants({ iconColor }))}>
            {icon || <span className="material-symbols-outlined w-5u h-5u">circle</span>}
          </div>
          {!isLast && (
            <div className="w-px flex-1 bg-outline-variant mt-2u" />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 pb-8u">
          {time && (
            <div className="text-label-small text-on-surface-variant mb-1u">
              {time}
            </div>
          )}
          <div className="text-body-medium text-on-surface">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = "TimelineItem";

// Timeline container
interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
);

Timeline.displayName = "Timeline";