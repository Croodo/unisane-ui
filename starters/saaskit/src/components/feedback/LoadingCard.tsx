"use client";

import { forwardRef } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Skeleton } from "@unisane/ui/components/skeleton";

export type LoadingCardProps = React.HTMLAttributes<HTMLDivElement> & {
  lines?: number;
  showHeader?: boolean;
};

const LoadingCard = forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ className, lines = 3, showHeader = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card shadow-sm p-6", className)}
        {...props}
      >
        {showHeader && (
          <div className="space-y-2 mb-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${85 - i * 10}%` }}
            />
          ))}
        </div>
      </div>
    );
  }
);
LoadingCard.displayName = "LoadingCard";

export { LoadingCard };
