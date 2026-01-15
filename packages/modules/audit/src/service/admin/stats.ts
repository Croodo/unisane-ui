import { getScopeLastActivity as getScopeLastActivityRepo } from "../../data/audit.repository";

export async function getScopeLastActivity(scopeIds: string[]) {
  return getScopeLastActivityRepo(scopeIds);
}
