import { countOutboundFailuresSince } from "../../data/webhooks.repository";

export async function getScopeFailureCounts(scopeIds: string[], since: Date) {
  return countOutboundFailuresSince(scopeIds, since);
}
