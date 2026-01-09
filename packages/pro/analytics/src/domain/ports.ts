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
  getRevenueMetrics(): Promise<MetricWithHistory>;
  getTenantMetrics(): Promise<MetricWithHistory>;
  getChurnMetrics(): Promise<MetricWithHistory>;
  getPlanDistribution(): Promise<PlanDistribution[]>;
  getRecentSignups(): Promise<RecentSignup[]>;
}
