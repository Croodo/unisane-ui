import { countActiveScopeOverrides } from "../../data/overrides.repository";

export async function getScopeOverrideCounts(scopeIds: string[]) {
  return countActiveScopeOverrides(scopeIds);
}
