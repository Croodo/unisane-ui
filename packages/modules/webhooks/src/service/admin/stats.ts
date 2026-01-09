import { countOutboundFailuresSince } from "../../data/webhooks.repository";

export async function getTenantFailureCounts(tenantIds: string[], since: Date) {
  return countOutboundFailuresSince(tenantIds, since);
}
