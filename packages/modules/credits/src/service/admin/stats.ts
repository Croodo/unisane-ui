import { getBalancesByScopeIds } from "../../data/credits.repository";

export async function getScopeCreditBalances(scopeIds: string[]) {
  return getBalancesByScopeIds(scopeIds);
}
