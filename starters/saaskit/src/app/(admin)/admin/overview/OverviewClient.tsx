"use client";

import { useMemo } from "react";
import { hooks } from "@/src/sdk/hooks";
import { PageLayout } from "@/src/context/usePageLayout";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";

export default function OverviewClient() {
  // Analytics query for dashboard metrics
  const analyticsQuery = hooks.analytics?.dashboard?.(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  }) || { data: null, isLoading: false, isError: false, error: null };

  // Transform analytics data for display
  const statsItems: StatItem[] = useMemo(() => {
    const data = analyticsQuery.data;
    if (!data) return [];

    // Calculate total tenants from plan distribution
    const totalTenants = data.planDistribution.reduce(
      (sum: number, p: { value: number }) => sum + p.value,
      0
    );

    return [
      {
        label: "Total Revenue",
        value: `$${data.revenue.value.toLocaleString()}`,
        icon: "credit_card",
        trend: {
          value: Math.abs(data.revenue.trend ?? 0),
          direction:
            (data.revenue.trend ?? 0) > 0
              ? "up"
              : (data.revenue.trend ?? 0) < 0
                ? "down"
                : "neutral",
        },
        history: data.revenue.history,
      },
      {
        label: "Active Users",
        value: data.activeUsers.value,
        icon: "group",
        trend: {
          value: Math.abs(data.activeUsers.trend ?? 0),
          direction:
            (data.activeUsers.trend ?? 0) > 0
              ? "up"
              : (data.activeUsers.trend ?? 0) < 0
                ? "down"
                : "neutral",
        },
        history: data.activeUsers.history,
      },
      {
        label: "Churn Rate",
        value: `${data.churnRate.value}%`,
        icon: "trending_down",
        trend: {
          value: Math.abs(data.churnRate.trend ?? 0),
          direction: (data.churnRate.trend ?? 0) < 0 ? "up" : "down", // Lower churn rate is better (green if down)
        },
        history: data.churnRate.history,
      },
      {
        label: "Total Tenants",
        value: totalTenants,
        icon: "apartment",
      },
    ];
  }, [analyticsQuery.data]);

  return (
    <>
      <PageLayout subtitle="Platform-wide performance metrics" />
      <div className="mt-4">
        <StatsCards items={statsItems} isLoading={analyticsQuery.isLoading} />
      </div>
    </>
  );
}
