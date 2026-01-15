import { TenantsRepo } from "../../data/tenants.repository";
import type { TenantAdminView } from "../../domain/types";
import { reverseMapPlanIdFromProvider } from "@unisane/kernel";
import { getEnv } from "@unisane/kernel";
import { ZPlanId } from "@unisane/kernel";

/**
 * Enrichment providers for admin scope list.
 * These are optional and injected at runtime to avoid circular dependencies.
 */
export interface ScopeEnrichmentProviders {
  getScopeMembershipCounts?: (scopeIds: string[]) => Promise<Map<string, { membersCount: number; adminsCount: number }>>;
  getScopeApiKeyCounts?: (scopeIds: string[]) => Promise<Map<string, number>>;
  getScopeOverrideCounts?: (scopeIds: string[]) => Promise<Map<string, number>>;
  getScopeOpenInvoiceCounts?: (scopeIds: string[]) => Promise<Map<string, number>>;
  getScopeLatestSubscriptions?: (scopeIds: string[]) => Promise<Map<string, { status?: string | null; quantity?: number | null; currentPeriodEnd?: Date | string | null; planId?: string | null }>>;
  getScopeLastActivity?: (scopeIds: string[]) => Promise<Map<string, Date | null>>;
  getScopeFailureCounts?: (scopeIds: string[], since: Date) => Promise<Map<string, number>>;
  getScopeCreditBalances?: (scopeIds: string[]) => Promise<Map<string, number>>;
}

// Use global object to share provider state across module instances in Next.js
const globalForScopeEnrichment = global as unknown as {
  __scopeEnrichmentProviders?: ScopeEnrichmentProviders;
};

/**
 * Configure enrichment providers for admin functions.
 * Called once at application bootstrap to inject dependencies.
 */
export function configureScopeEnrichment(providers: ScopeEnrichmentProviders): void {
  globalForScopeEnrichment.__scopeEnrichmentProviders = providers;
}

/**
 * Get enrichment providers (for internal use by read.ts)
 */
export function getEnrichmentProviders(): ScopeEnrichmentProviders {
  return globalForScopeEnrichment.__scopeEnrichmentProviders ?? {};
}

const { BILLING_PROVIDER } = getEnv();

function normalizePlanId(raw: string | null | undefined): string {
  const fallback = "free";
  if (!raw) return fallback;
  const parsed = ZPlanId.safeParse(raw);
  if (parsed.success) return parsed.data;
  const provider = BILLING_PROVIDER ?? undefined;
  if (provider) {
    const friendly = reverseMapPlanIdFromProvider(provider, raw);
    if (friendly) {
      const p2 = ZPlanId.safeParse(friendly);
      if (p2.success) return p2.data;
    }
  }
  return fallback;
}

// Service returns domain view shape; UI/HTTP contract adapts as needed
// Returns contract DTO shape expected by tenantsContract.adminList
export async function listAdminTenants(args: {
  limit: number;
  cursor?: string | null;
  sort?: string;
  filters?: {
    q?: string;
    slug?: { eq?: string; contains?: string };
    name?: { eq?: string; contains?: string };
    planId?: { eq?: string; in?: string[] };
  };
}): Promise<{
  items: Array<{
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
    subscription?: {
      status: string | null;
      quantity: number | null;
      currentPeriodEnd: string | null;
    } | null;
  }>;
  nextCursor?: string;
  prevCursor?: string;
}> {
  const baseInput: {
    limit: number;
    cursor?: string | null;
    sort?: string;
    filters?: {
      q?: string;
      slug?: { eq?: string; contains?: string };
      name?: { eq?: string; contains?: string };
      planId?: { eq?: string; in?: string[] };
    };
  } = {
    limit: args.limit,
  };
  if (typeof args.cursor !== "undefined")
    baseInput.cursor = args.cursor ?? null;
  if (typeof args.sort !== "undefined") baseInput.sort = args.sort as string;
  if (typeof args.filters !== "undefined") baseInput.filters = args.filters;
  const base = await TenantsRepo.listPaged(baseInput);
  const items = Array.isArray(base.items) ? base.items : [];
  const scopeIds = items.map((t) => t.id).filter(Boolean);
  if (scopeIds.length === 0)
    return {
      items: [],
      ...(base.nextCursor ? { nextCursor: base.nextCursor } : {}),
      ...(base.prevCursor ? { prevCursor: base.prevCursor } : {}),
    } as const;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Use injected providers or default to empty maps
  const providers = getEnrichmentProviders();
  const [mMap, apiMap, ovMap, invMap, latestSubMap, actMap, whMap, crMap] =
    await Promise.all([
      providers.getScopeMembershipCounts?.(scopeIds) ?? Promise.resolve(new Map()),
      providers.getScopeApiKeyCounts?.(scopeIds) ?? Promise.resolve(new Map()),
      providers.getScopeOverrideCounts?.(scopeIds) ?? Promise.resolve(new Map()),
      providers.getScopeOpenInvoiceCounts?.(scopeIds) ?? Promise.resolve(new Map()),
      providers.getScopeLatestSubscriptions?.(scopeIds) ?? Promise.resolve(new Map()),
      providers.getScopeLastActivity?.(scopeIds) ?? Promise.resolve(new Map()),
      providers.getScopeFailureCounts?.(scopeIds, since24h) ?? Promise.resolve(new Map()),
      providers.getScopeCreditBalances?.(scopeIds) ?? Promise.resolve(new Map()),
    ]);

  const enriched: TenantAdminView[] = items.map((t) => {
    const id = t.id;
    const sub = latestSubMap.get(id) ?? null;
    const rawPlan =
      (t.planId as string | null | undefined) ||
      (sub?.planId as string | null | undefined) ||
      "free";
    const planId = normalizePlanId(rawPlan);
    return {
      id,
      slug: String((t as { slug?: string }).slug ?? ""),
      name: String((t as { name?: string }).name ?? ""),
      planId,
      membersCount: mMap.get(id)?.membersCount ?? 0,
      adminsCount: mMap.get(id)?.adminsCount ?? 0,
      apiKeysCount: apiMap.get(id) ?? 0,
      flagOverridesCount: ovMap.get(id) ?? 0,
      invoicesOpenCount: invMap.get(id) ?? 0,
      webhooksFailed24h: whMap.get(id) ?? 0,
      creditsAvailable: crMap.get(id) ?? 0,
      lastActivityAt: actMap.get(id) ?? null,
      subscription: sub
        ? {
            status: sub.status ?? null,
            quantity: sub.quantity ?? null,
            currentPeriodEnd: sub.currentPeriodEnd ?? null,
          }
        : null,
    };
  });

  const itemsDto = enriched.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    planId: t.planId,
    membersCount: t.membersCount,
    adminsCount: t.adminsCount,
    apiKeysCount: t.apiKeysCount,
    flagOverridesCount: t.flagOverridesCount,
    invoicesOpenCount: t.invoicesOpenCount,
    webhooksFailed24h: t.webhooksFailed24h,
    creditsAvailable: t.creditsAvailable,
    lastActivityAt: t.lastActivityAt ? new Date(t.lastActivityAt).toISOString() : null,
    subscription: t.subscription
      ? {
          status: t.subscription.status ?? null,
          quantity: t.subscription.quantity ?? null,
          currentPeriodEnd: t.subscription.currentPeriodEnd ? new Date(t.subscription.currentPeriodEnd).toISOString() : null,
        }
      : null,
  }));

  return {
    items: itemsDto,
    ...(base.nextCursor ? { nextCursor: base.nextCursor } : {}),
    ...(base.prevCursor ? { prevCursor: base.prevCursor } : {}),
  } as const;
}
