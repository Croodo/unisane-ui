"use client";

import React from "react";
import dynamic from "next/dynamic";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@unisane/ui/lib/utils";
import { Card } from "@unisane/ui/components/card";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import { Skeleton } from "@unisane/ui/components/skeleton";

// Lazy load recharts to avoid SSR issues
const Sparkline = dynamic(() => import("./Sparkline"), { ssr: false });

export interface StatItem {
  label: string;
  value: string | number;
  /** Material Symbol icon name */
  icon?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  history?: { date: string; value: number }[];
}

const statsCardsVariants = cva("grid gap-4 mb-6", {
  variants: {
    columns: {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: {
    columns: 4,
  },
});

const cardVariants = cva(
  "flex flex-col justify-between h-full transition-colors overflow-hidden relative",
  {
    variants: {
      variant: {
        default: "p-5",
        compact: "p-3",
        ghost: "p-4 border-none bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatsCardsProps extends VariantProps<typeof statsCardsVariants> {
  items: StatItem[];
  isLoading?: boolean;
  className?: string;
  cardClassName?: string;
  variant?: VariantProps<typeof cardVariants>["variant"];
}

// Single stat card with inline loading state (MUI pattern)
function StatCard({
  item,
  loading,
  variant,
  className,
}: {
  item?: StatItem | undefined;
  loading?: boolean | undefined;
  variant?: VariantProps<typeof cardVariants>["variant"] | undefined;
  className?: string | undefined;
}) {
  return (
    <Card variant="low" className={cn(cardVariants({ variant }), className)}>
      <div className="flex flex-col z-10 relative">
        <div className="flex items-center justify-between mb-2">
          {loading ? (
            <Skeleton variant="text" className="h-4 w-20 rounded" />
          ) : (
            <Typography variant="labelMedium" className="text-on-surface-variant">
              {item?.label}
            </Typography>
          )}
          {loading ? (
            <Skeleton variant="circular" className="size-5" />
          ) : item?.icon ? (
            <Icon symbol={item.icon} className="text-on-surface-variant" />
          ) : null}
        </div>
        <div className="flex items-end gap-2">
          {loading ? (
            <Skeleton variant="text" className="h-8 w-16 rounded" />
          ) : (
            <Typography variant="headlineMedium" className="font-semibold">
              {typeof item?.value === "number"
                ? item.value.toLocaleString()
                : item?.value}
            </Typography>
          )}
          {!loading && item?.trend && (
            <Typography
              variant="labelSmall"
              className={cn(
                "mb-1 font-medium",
                item.trend.direction === "up" && "text-primary",
                item.trend.direction === "down" && "text-error",
                item.trend.direction === "neutral" && "text-on-surface-variant"
              )}
            >
              {item.trend.direction === "up" ? "+" : ""}
              {item.trend.value}%
            </Typography>
          )}
        </div>
      </div>

      {/* Sparkline Background */}
      {!loading && item?.history && item.history.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
          <Sparkline data={item.history} />
        </div>
      )}
    </Card>
  );
}

export const StatsCards = ({
  items,
  isLoading,
  columns,
  className,
  cardClassName,
  variant,
}: StatsCardsProps) => {
  const count = columns || 4;

  if (isLoading) {
    return (
      <div className={cn(statsCardsVariants({ columns }), className)}>
        {[...Array(count)].map((_, i) => (
          <StatCard key={i} loading variant={variant} className={cardClassName} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(statsCardsVariants({ columns }), className)}>
      {items.map((item) => (
        <StatCard
          key={item.label}
          item={item}
          variant={variant}
          className={cardClassName}
        />
      ))}
    </div>
  );
};
