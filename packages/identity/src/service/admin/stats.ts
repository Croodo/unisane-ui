import { usersRepository } from "../../data/users.repository";
import { ZAdminStatsQuery } from "@unisane/kernel";
import { z } from "zod";

type AdminStatsQuery = z.infer<typeof ZAdminStatsQuery> & {
  filters?: Record<string, unknown>;
};

export async function getAdminUsersStats(args: AdminStatsQuery) {
  const { total, facets } = await usersRepository.stats({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- filter type flexibility
    ...(args.filters ? { filters: args.filters as Record<string, unknown> } : {}),
  });

  return {
    total,
    facets: {
      globalRole: facets.globalRole ?? {},
    },
  };
}

export async function getTenantMembershipCounts(tenantIds: string[]) {
  return usersRepository.getTenantMembershipCounts(tenantIds);
}

export async function getTenantApiKeyCounts(tenantIds: string[]) {
  return usersRepository.getTenantApiKeyCounts(tenantIds);
}
