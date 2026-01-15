import { analyticsRepository } from "../data/analytics.repository";
import { kv } from "@unisane/kernel";
import { KV } from "@unisane/kernel";
import type { AnalyticsDashboard } from "../domain/schemas";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getAdminAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  try {
    const cacheKey = `${KV.ANALYTICS}dashboard`;

    // 1. Try cache
    const cached = await kv.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as AnalyticsDashboard;
      } catch (e) {
        // ignore parse error
      }
    }

    // 2. Compute metrics (parallel)
    const [revenue, activeUsers, churnRate, planDistribution, recentSignups] =
      await Promise.all([
        analyticsRepository.findRevenueMetrics(),
        analyticsRepository.findTenantMetrics(),
        analyticsRepository.findChurnMetrics(),
        analyticsRepository.findPlanDistribution(),
        analyticsRepository.findRecentSignups(),
      ]);

    // 3. Construct dashboard
    const dashboard: AnalyticsDashboard = {
      revenue,
      activeUsers,
      churnRate,
      planDistribution,
      recentSignups,
    };

    // 4. Set cache
    await kv.set(cacheKey, JSON.stringify(dashboard), { PX: CACHE_TTL_MS });

    return dashboard;
  } catch (error) {
    console.error("[Analytics] Error in getAdminAnalyticsDashboard:", error);
    throw error;
  }
}
