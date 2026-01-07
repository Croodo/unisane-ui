import { getBalancesByTenantIds } from "../../data/credits.repository";

export async function getTenantCreditBalances(tenantIds: string[]) {
  return getBalancesByTenantIds(tenantIds);
}
