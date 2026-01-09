import { TenantsRepo } from "../../data/tenants.repository";
import type { TenantFilter } from "../../domain/ports";

export async function getAdminTenantsStats(args: { filters?: TenantFilter }) {
  return await TenantsRepo.stats(args.filters ? { filters: args.filters } : {});
}
