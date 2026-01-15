import { TenantsRepo } from "../../data/tenants.repository";
import { getEnrichmentProviders } from "./list";

export type ReadAdminTenantArgs = {
  scopeId: string;
};

// Returns contract DTO shape expected by tenantsContract.adminRead
export async function readAdminTenant(args: ReadAdminTenantArgs): Promise<{
  id: string;
  slug: string;
  name: string;
  planId: string;
  membersCount?: number;
  adminsCount?: number;
  apiKeysCount?: number;
  flagOverridesCount?: number;
  invoicesOpenCount?: number;
  webhooksFailed24h?: number;
  creditsAvailable?: number;
  lastActivityAt?: string | null;
  subscription?: { status: string | null; quantity: number | null; currentPeriodEnd: string | null } | null;
} | null> {
  const t = await TenantsRepo.findById(args.scopeId);
  if (!t) return null;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Use injected providers or default to empty maps
  const providers = getEnrichmentProviders();
  const [mMap, apiMap, ovMap, invMap, latestSubMap, actMap, whMap, crMap] =
    await Promise.all([
      providers.getScopeMembershipCounts?.([args.scopeId]) ?? Promise.resolve(new Map()),
      providers.getScopeApiKeyCounts?.([args.scopeId]) ?? Promise.resolve(new Map()),
      providers.getScopeOverrideCounts?.([args.scopeId]) ?? Promise.resolve(new Map()),
      providers.getScopeOpenInvoiceCounts?.([args.scopeId]) ?? Promise.resolve(new Map()),
      providers.getScopeLatestSubscriptions?.([args.scopeId]) ?? Promise.resolve(new Map()),
      providers.getScopeLastActivity?.([args.scopeId]) ?? Promise.resolve(new Map()),
      providers.getScopeFailureCounts?.([args.scopeId], since24h) ?? Promise.resolve(new Map()),
      providers.getScopeCreditBalances?.([args.scopeId]) ?? Promise.resolve(new Map()),
    ]);

  const sub = latestSubMap.get(args.scopeId) ?? null;
  const planId = (sub?.planId as string | null | undefined) || (t.planId as string | null | undefined) || "free";

  return {
    id: t.id,
    slug: String((t as { slug?: string }).slug ?? ""),
    name: String((t as { name?: string }).name ?? ""),
    planId: planId,
    membersCount: mMap.get(args.scopeId)?.membersCount ?? 0,
    adminsCount: mMap.get(args.scopeId)?.adminsCount ?? 0,
    apiKeysCount: apiMap.get(args.scopeId) ?? 0,
    flagOverridesCount: ovMap.get(args.scopeId) ?? 0,
    invoicesOpenCount: invMap.get(args.scopeId) ?? 0,
    webhooksFailed24h: whMap.get(args.scopeId) ?? 0,
    creditsAvailable: crMap.get(args.scopeId) ?? 0,
    lastActivityAt: (actMap.get(args.scopeId) ?? null)
      ? new Date(actMap.get(args.scopeId) as Date).toISOString()
      : null,
    subscription: sub
      ? {
          status: sub.status ?? null,
          quantity: sub.quantity ?? null,
          currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd as Date).toISOString() : null,
        }
      : null,
  };
}
