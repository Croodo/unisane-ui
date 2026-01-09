import { getTenantLastActivity as getTenantLastActivityRepo } from "../../data/audit.repository";

export async function getTenantLastActivity(tenantIds: string[]) {
  return getTenantLastActivityRepo(tenantIds);
}
