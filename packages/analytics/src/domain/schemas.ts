import { z } from "zod";

export const ZSparklinePoint = z.object({
  date: z.string(), // YYYY-MM-DD
  value: z.number(),
});

export const ZMetric = z.object({
  value: z.number(),
  trend: z.number().nullable(), // Percentage change vs previous period
  history: z.array(ZSparklinePoint),
});

export const ZAnalyticsDashboard = z.object({
  revenue: ZMetric,
  activeUsers: ZMetric,
  churnRate: ZMetric,
  planDistribution: z.array(z.object({ id: z.string(), value: z.number() })),
  recentSignups: z.array(z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    createdAt: z.string(),
  })),
});

export type AnalyticsDashboard = z.infer<typeof ZAnalyticsDashboard>;
