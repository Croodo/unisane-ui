"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Card } from "@/src/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
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
  icon: Icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-on-surface-variant" />}
        <span className="text-label-small text-on-surface-variant uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-headline-medium font-semibold">{value}</div>
      {description && (
        <p className="text-body-small text-on-surface-variant mt-1">
          {description}
        </p>
      )}
      {trend && (
        <div
          className={cn(
            "text-label-small mt-1 flex items-center gap-1",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-error",
            trend.direction === "neutral" && "text-on-surface-variant"
          )}
        >
          {trend.direction === "up" && "↑"}
          {trend.direction === "down" && "↓"}
          {trend.value}%
        </div>
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
