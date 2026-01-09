import React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@unisane/ui/lib/utils";
import { Card } from "@unisane/ui/components/card";
import { Icon } from "@unisane/ui/primitives/icon";
import { Text } from "@unisane/ui/primitives/text";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

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

export const StatsCards = ({
  items,
  isLoading,
  columns,
  className,
  cardClassName,
  variant,
}: StatsCardsProps) => {
  if (isLoading) {
    return (
      <div className={cn(statsCardsVariants({ columns }), className)}>
        {[...Array(columns || 4)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-surface-container" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(statsCardsVariants({ columns }), className)}>
      {items.map((item) => (
        <Card
          key={item.label}
          className={cn(cardVariants({ variant }), cardClassName)}
        >
          <div className="flex flex-col z-10 relative">
            <div className="flex items-center justify-between mb-2">
              <Text variant="labelMedium" color="onSurfaceVariant">
                {item.label}
              </Text>
              {item.icon && (
                <Icon symbol={item.icon} size="sm" className="text-on-surface-variant" />
              )}
            </div>
            <div className="flex items-end gap-2">
              <Text variant="headlineMedium" weight="semibold">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </Text>
              {item.trend && (
                <Text
                  variant="labelSmall"
                  weight="medium"
                  className={cn(
                    "mb-1",
                    item.trend.direction === "up" && "text-primary",
                    item.trend.direction === "down" && "text-error",
                    item.trend.direction === "neutral" && "text-on-surface-variant"
                  )}
                >
                  {item.trend.direction === "up" ? "+" : ""}
                  {item.trend.value}%
                </Text>
              )}
            </div>
          </div>

          {/* Sparkline Background */}
          {item.history && item.history.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={item.history}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
