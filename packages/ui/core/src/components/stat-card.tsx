"use client";

import * as React from "react";
import { cn } from "@ui/lib/utils";
import { Card } from "./card";
import { Text } from "@ui/primitives/text";
import { Icon } from "@ui/primitives/icon";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Material Symbol icon name */
  icon?: string;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <Icon symbol={icon} size="sm" className="text-on-surface-variant" />}
        <Text variant="labelSmall" color="onSurfaceVariant" className="uppercase tracking-wide">
          {label}
        </Text>
      </div>
      <Text variant="headlineMedium" weight="semibold">{value}</Text>
      {description && (
        <Text variant="bodySmall" color="onSurfaceVariant" className="mt-1">
          {description}
        </Text>
      )}
      {trend && (
        <Text
          variant="labelSmall"
          className={cn(
            "mt-1 flex items-center gap-1",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-error",
            trend.direction === "neutral" && "text-on-surface-variant"
          )}
        >
          {trend.direction === "up" && "↑"}
          {trend.direction === "down" && "↓"}
          {trend.value}%
        </Text>
      )}
    </Card>
  );
}

export interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 md:grid-cols-3",
        columns === 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
