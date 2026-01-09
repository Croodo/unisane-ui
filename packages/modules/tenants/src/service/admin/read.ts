import { TenantsRepo } from "../../data/tenants.repository";
import { getEnrichmentProviders } from "./list";

export type ReadAdminTenantArgs = {
  tenantId: string;
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
  const t = await TenantsRepo.findById(args.tenantId);
  if (!t) return null;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Use injected providers or default to empty maps
  const providers = getEnrichmentProviders();
  const [mMap, apiMap, ovMap, invMap, latestSubMap, actMap, whMap, crMap] =
    await Promise.all([
      providers.getTenantMembershipCounts?.([args.tenantId]) ?? Promise.resolve(new Map()),
      providers.getTenantApiKeyCounts?.([args.tenantId]) ?? Promise.resolve(new Map()),
      providers.getTenantOverrideCounts?.([args.tenantId]) ?? Promise.resolve(new Map()),
      providers.getTenantOpenInvoiceCounts?.([args.tenantId]) ?? Promise.resolve(new Map()),
      providers.getTenantLatestSubscriptions?.([args.tenantId]) ?? Promise.resolve(new Map()),
      providers.getTenantLastActivity?.([args.tenantId]) ?? Promise.resolve(new Map()),
      providers.getTenantFailureCounts?.([args.tenantId], since24h) ?? Promise.resolve(new Map()),
      providers.getTenantCreditBalances?.([args.tenantId]) ?? Promise.resolve(new Map()),
    ]);

  const sub = latestSubMap.get(args.tenantId) ?? null;
  const planId = (sub?.planId as string | null | undefined) || (t.planId as string | null | undefined) || "free";

  return {
    id: t.id,
    slug: String((t as { slug?: string }).slug ?? ""),
    name: String((t as { name?: string }).name ?? ""),
    planId: planId,
    membersCount: mMap.get(args.tenantId)?.membersCount ?? 0,
    adminsCount: mMap.get(args.tenantId)?.adminsCount ?? 0,
    apiKeysCount: apiMap.get(args.tenantId) ?? 0,
    flagOverridesCount: ovMap.get(args.tenantId) ?? 0,
    invoicesOpenCount: invMap.get(args.tenantId) ?? 0,
    webhooksFailed24h: whMap.get(args.tenantId) ?? 0,
    creditsAvailable: crMap.get(args.tenantId) ?? 0,
    lastActivityAt: (actMap.get(args.tenantId) ?? null)
      ? new Date(actMap.get(args.tenantId) as Date).toISOString()
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
