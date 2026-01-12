/**
 * User enrichments - Cross-collection aggregations for admin views
 * These queries fetch data from related collections (memberships, apikeys, audit_logs)
 * to enrich user data for admin dashboards and detail views.
 */

import { col, COLLECTIONS, softDeleteFilter } from "@unisane/kernel";

/**
 * Get membership counts for a single user.
 * Returns total tenants count and admin tenants count.
 */
export async function getMembershipsCount(
  userId: string
): Promise<{ tenantsCount: number; adminTenantsCount: number }> {
  const rows = (await col(COLLECTIONS.MEMBERSHIPS)
    .aggregate([
      {
        $match: {
          userId,
          ...softDeleteFilter(),
        },
      },
      {
        $project: {
          tenantId: 1,
          isAdmin: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$roles",
                    as: "r",
                    cond: { $in: ["$$r.roleId", ["owner", "admin"]] },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          tenantsCount: { $sum: 1 },
          adminTenantsCount: { $sum: { $cond: ["$isAdmin", 1, 0] } },
        },
      },
    ])
    .toArray()) as Array<{ tenantsCount: number; adminTenantsCount: number }>;

  const first = rows[0];
  return {
    tenantsCount: first?.tenantsCount ?? 0,
    adminTenantsCount: first?.adminTenantsCount ?? 0,
  };
}

/**
 * Get count of active API keys created by a user.
 */
export async function getApiKeysCreatedCount(userId: string): Promise<number> {
  const rows = (await col(COLLECTIONS.API_KEYS)
    .aggregate([
      {
        $match: {
          createdBy: userId,
          $or: [{ revokedAt: null }, { revokedAt: { $exists: false } }],
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ])
    .toArray()) as Array<{ count: number }>;

  return rows[0]?.count ?? 0;
}

/**
 * Get the last activity timestamp for a user from audit logs.
 */
export async function getLastActivity(userId: string): Promise<Date | null> {
  const row = (await col(COLLECTIONS.AUDIT_LOGS)
    .aggregate([
      { $match: { actorId: userId } },
      { $group: { _id: null, lastActivityAt: { $max: "$createdAt" } } },
    ])
    .toArray()) as Array<{ lastActivityAt: Date | null }>;

  return row[0]?.lastActivityAt ?? null;
}

/**
 * Get membership counts for multiple tenants in a single query.
 * Used for admin tenant list enrichment.
 */
export async function getTenantMembershipCounts(
  tenantIds: string[]
): Promise<Map<string, { membersCount: number; adminsCount: number }>> {
  const rows = (await col(COLLECTIONS.MEMBERSHIPS)
    .aggregate([
      {
        $match: {
          tenantId: { $in: tenantIds },
          ...softDeleteFilter(),
        },
      },
      {
        $project: {
          tenantId: 1,
          isAdmin: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$roles",
                    as: "r",
                    cond: { $in: ["$$r.roleId", ["owner", "admin"]] },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$tenantId",
          membersCount: { $sum: 1 },
          adminsCount: { $sum: { $cond: ["$isAdmin", 1, 0] } },
        },
      },
    ])
    .toArray()) as Array<{
    _id: string;
    membersCount: number;
    adminsCount: number;
  }>;

  const m = new Map<string, { membersCount: number; adminsCount: number }>();
  for (const r of rows) {
    m.set(String(r._id), {
      membersCount: r.membersCount ?? 0,
      adminsCount: r.adminsCount ?? 0,
    });
  }
  return m;
}

/**
 * Get API key counts for multiple tenants in a single query.
 * Used for admin tenant list enrichment.
 */
export async function getTenantApiKeyCounts(
  tenantIds: string[]
): Promise<Map<string, number>> {
  const rows = (await col(COLLECTIONS.API_KEYS)
    .aggregate([
      {
        $match: {
          tenantId: { $in: tenantIds },
          $or: [{ revokedAt: null }, { revokedAt: { $exists: false } }],
        },
      },
      { $group: { _id: "$tenantId", apiKeysCount: { $sum: 1 } } },
    ])
    .toArray()) as Array<{ _id: string; apiKeysCount: number }>;

  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(String(r._id), r.apiKeysCount ?? 0);
  }
  return m;
}

/**
 * Aggregated enrichment functions for UsersApi interface.
 * Import this object and spread into the main repository.
 */
export const usersEnrichmentsMongo = {
  getMembershipsCount,
  getApiKeysCreatedCount,
  getLastActivity,
  getTenantMembershipCounts,
  getTenantApiKeyCounts,
};
