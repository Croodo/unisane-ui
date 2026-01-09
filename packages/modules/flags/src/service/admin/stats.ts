import { countActiveTenantOverrides } from "../../data/overrides.repository";

export async function getTenantOverrideCounts(tenantIds: string[]) {
  return countActiveTenantOverrides(tenantIds);
}
