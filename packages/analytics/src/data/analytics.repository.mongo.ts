import { col, connectDb } from "@unisane/kernel";
import { subDays, format } from "date-fns";
import type { AnalyticsRepo } from "../domain/ports";

export const AnalyticsRepoMongo: AnalyticsRepo = {
  async getRevenueMetrics() {
    await connectDb();
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // 1. Get daily revenue for the last 30 days
    const dailyRevenue = await col("invoices")
      .aggregate([
        {
          $match: {
            status: "paid",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // 2. Calculate total for current period (last 30 days)
    const currentTotal = dailyRevenue.reduce(
      (acc, curr) => acc + (curr.total || 0),
      0
    );

    // 3. Calculate total for previous period (30-60 days ago) for trend
    const [prevPeriod] = await col("invoices")
      .aggregate([
        {
          $match: {
            status: "paid",
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    const prevTotal = prevPeriod?.total || 0;
    const trend =
      prevTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : ((currentTotal - prevTotal) / prevTotal) * 100;

    // 4. Fill in missing dates for sparkline
    const history = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const found = dailyRevenue.find((r) => r._id === dateStr);
      history.push({ date: dateStr, value: found?.total || 0 });
    }

    return {
      value: currentTotal,
      trend: Number(trend.toFixed(1)),
      history,
    };
  },

  async getTenantMetrics() {
    await connectDb();
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // 1. Get total active tenants
    const activeTenantsCount = await col("tenants").countDocuments({
      deletedAt: null,
    });

    // 2. Calculate trend (new tenants in last 30 days vs previous 30 days)
    const newTenantsLast30 = await col("tenants").countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const newTenantsPrev30 = await col("tenants").countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const trend =
      newTenantsPrev30 === 0
        ? newTenantsLast30 > 0
          ? 100
          : 0
        : ((newTenantsLast30 - newTenantsPrev30) / newTenantsPrev30) * 100;

    // 3. Get daily new tenants for sparkline
    const dailyNewTenants = await col("tenants")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // 4. Fill in missing dates
    const history = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const found = dailyNewTenants.find((r) => r._id === dateStr);
      history.push({ date: dateStr, value: found?.count || 0 });
    }

    return {
      value: activeTenantsCount,
      trend: Number(trend.toFixed(1)),
      history,
    };
  },

  async getChurnMetrics() {
    await connectDb();
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // 1. Get total active subscriptions (for denominator)
    const activeSubs = await col("subscriptions").countDocuments({
      status: { $in: ["active", "trialing"] },
    });

    // 2. Get churned in last 30 days (canceled with update date in range)
    // Note: This is an approximation. Ideally we'd track 'canceledAt' explicitly.
    // Using updatedAt for 'canceled' status is a reasonable proxy.
    const churnedLast30 = await col("subscriptions").countDocuments({
      status: "canceled",
      updatedAt: { $gte: thirtyDaysAgo },
    });

    // 3. Get churned in previous 30 days
    const churnedPrev30 = await col("subscriptions").countDocuments({
      status: "canceled",
      updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // Calculate churn rate (churned / (active + churned)) * 100
    // This gives % of total pool that left.
    const totalPool = activeSubs + churnedLast30;
    const currentRate = totalPool > 0 ? (churnedLast30 / totalPool) * 100 : 0;

    // Previous rate approximation
    // We don't know exact active count 30 days ago easily without snapshots,
    // so we assume pool was roughly similar or use current active as baseline.
    // For trend, we'll just compare absolute churn counts as a proxy for "is churn increasing".
    const trend =
      churnedPrev30 === 0
        ? churnedLast30 > 0
          ? 100
          : 0
        : ((churnedLast30 - churnedPrev30) / churnedPrev30) * 100;

    // 4. Daily churn for sparkline
    const dailyChurn = await col("subscriptions")
      .aggregate([
        {
          $match: {
            status: "canceled",
            updatedAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const history = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const found = dailyChurn.find((r) => r._id === dateStr);
      history.push({ date: dateStr, value: found?.count || 0 });
    }

    return {
      value: Number(currentRate.toFixed(2)),
      trend: Number(trend.toFixed(1)),
      history,
    };
  },

  async getPlanDistribution() {
    await connectDb();
    const distribution = await col("tenants")
      .aggregate([
        {
          $group: {
            _id: "$planId",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    return distribution.map((d) => ({
      id: (d._id as string) || "free", // Default to free if null
      value: d.count as number,
    }));
  },

  async getRecentSignups() {
    await connectDb();
    const users = await col("users")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ _id: 1, email: 1, displayName: 1, createdAt: 1 })
      .toArray();

    return users.map((u) => ({
      id: String(u._id),
      email: u.email as string,
      name: (u.displayName as string) || null,
      createdAt: (u.createdAt as Date).toISOString(),
    }));
  },
};
