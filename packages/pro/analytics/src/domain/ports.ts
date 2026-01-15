/**
 * Analytics Repository Port
 * Defines the contract for analytics data access.
 */

export type MetricWithHistory = {
  value: number;
  trend: number;
  history: Array<{ date: string; value: number }>;
};

export type PlanDistribution = {
  id: string;
  value: number;
};

export type RecentSignup = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export interface AnalyticsRepo {
  findRevenueMetrics(): Promise<MetricWithHistory>;
  findTenantMetrics(): Promise<MetricWithHistory>;
  findChurnMetrics(): Promise<MetricWithHistory>;
  findPlanDistribution(): Promise<PlanDistribution[]>;
  findRecentSignups(): Promise<RecentSignup[]>;
}
