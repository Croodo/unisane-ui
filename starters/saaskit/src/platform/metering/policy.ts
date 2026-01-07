import { PLAN_DEFS } from "@/src/shared/constants/plan";
import type { PlanId } from "@/src/shared/constants/plan";
import type { FeatureKey } from "@/src/shared/constants/features";
import {
  DEFAULT_TOKEN_COSTS,
  ENTITLEMENTS,
  type FeaturePolicyMap,
  type TokenCost,
} from "@/src/shared/constants/metering";
import { readTenant } from "@/src/modules/tenants";
import { cacheGet, cacheSet } from "@/src/platform/config/cache";
import { KV } from "@/src/shared/constants/kv";
import { SETTINGS_NS, PLAN_SETTING_KEYS } from "@/src/shared/constants/settings";
import { subscribe } from "@/src/platform/config/bus";
import { getTypedSetting } from "@/src/modules/settings/service/readTyped";

// -------- Token cost policy (per-operation costs + daily freebies) --------
export type TokenPolicy = {
  cost: number;
  unit?: "op" | "sec" | "mb";
  dailyFree?: number;
};
export function resolveTokenPolicy(args: {
  feature: FeatureKey;
  plan: PlanId;
  tenantOverrides?: Partial<FeaturePolicyMap>;
}): TokenPolicy {
  const base: TokenCost = DEFAULT_TOKEN_COSTS[args.feature];
  const override = args.tenantOverrides?.[args.feature];
  const cost = override?.cost ?? base.cost;
  const unit = override?.unit ?? base.unit;
  const dailyFree = ENTITLEMENTS[args.plan]?.dailyFree?.[args.feature];
  const res: { cost: number } & Partial<
    Pick<TokenPolicy, "unit" | "dailyFree">
  > = { cost };
  if (unit !== undefined) res.unit = unit;
  if (dailyFree !== undefined) res.dailyFree = dailyFree;
  return res as TokenPolicy;
}

// -------- Normalized entitlements (SSOT) --------
export type Entitlements = Readonly<{
  toggles: Readonly<Record<string, boolean>>;
  capacities: Readonly<Record<string, number>>;
  quotas: Readonly<
    Record<string, { limit: number; window: "day" | "month" | "year" }>
  >;
  credits: Readonly<
    Record<string, { grant: number; period: "month" | "year" }>
  >;
}>;

type EntitlementsPatch = {
  toggles?: Record<string, boolean>;
  capacities?: Record<string, number>;
  quotas?: Record<string, { limit: number; window: "day" | "month" | "year" }>;
  credits?: Record<string, { grant: number; period: "month" | "year" }>;
};

export function deepMergeEntitlements(
  base: Entitlements,
  patch?: Partial<Entitlements> | EntitlementsPatch
): Entitlements {
  if (!patch) return base;
  return {
    toggles: { ...base.toggles, ...(patch.toggles ?? {}) },
    capacities: { ...base.capacities, ...(patch.capacities ?? {}) },
    quotas: { ...base.quotas, ...(patch.quotas ?? {}) },
    credits: { ...base.credits, ...(patch.credits ?? {}) },
  } as Entitlements;
}

function baseEntitlementsForPlan(planId: PlanId): Entitlements {
  const def = PLAN_DEFS[planId] ?? PLAN_DEFS.free;
  // Clone into a fresh object so callers can safely merge/patch
  return deepMergeEntitlements(def.entitlements as Entitlements, {});
}

export async function resolveEntitlements(
  tenantId: string
): Promise<Entitlements> {
  ensureSubscriber();
  const cacheKey = `${KV.ENTITLEMENTS}${tenantId}`;
  const cached = await cacheGet<Entitlements>(cacheKey);
  if (cached) return cached;
  let planId: PlanId | undefined;
  try {
    const tenant = await readTenant(tenantId).catch(() => null as unknown);
    planId = (tenant as { planId?: PlanId } | null)?.planId as PlanId | undefined;
  } catch {
    planId = undefined;
  }
  const resolvedPlan: PlanId = (planId ?? 'free') as PlanId;
  const base = baseEntitlementsForPlan(resolvedPlan);
  // Merge addOns and overrides from settings_kv when present
  // Namespace: SETTINGS_NS.PLAN, Keys: PLAN_SETTING_KEYS.ADDONS | OVERRIDES
  const addonsRow = await getTypedSetting<unknown>({
    tenantId,
    ns: SETTINGS_NS.PLAN,
    key: PLAN_SETTING_KEYS.ADDONS,
  }).catch(() => null);
  const overridesRow = await getTypedSetting<unknown>({
    tenantId,
    ns: SETTINGS_NS.PLAN,
    key: PLAN_SETTING_KEYS.OVERRIDES,
  }).catch(() => null);
  const addons = normalizePatch(addonsRow?.value);
  const overrides = normalizePatch(overridesRow?.value);
  const withAddons = applyAddons(base, addons);
  const merged = deepMergeEntitlements(withAddons, overrides);
  await cacheSet(cacheKey, merged, 120_000);
  return merged;
}

export async function invalidateEntitlements(tenantId: string): Promise<void> {
  const { kv } = await import("@/src/core/kv");
  await kv.del(`${KV.ENTITLEMENTS}${tenantId}`);
}

// No-DB mode helper: resolve directly from a plan id (static defaults)
export function resolveEntitlementsForPlan(planId: PlanId): Entitlements {
  return baseEntitlementsForPlan(planId);
}

// ---- Helpers ----
function normalizePatch(value: unknown): EntitlementsPatch | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const out: EntitlementsPatch = {};
  if (v.toggles && typeof v.toggles === "object")
    out.toggles = v.toggles as Record<string, boolean>;
  if (v.capacities && typeof v.capacities === "object")
    out.capacities = v.capacities as Record<string, number>;
  if (v.quotas && typeof v.quotas === "object")
    out.quotas = v.quotas as Record<
      string,
      { limit: number; window: "day" | "month" | "year" }
    >;
  if (v.credits && typeof v.credits === "object")
    out.credits = v.credits as Record<
      string,
      { grant: number; period: "month" | "year" }
    >;
  return out;
}

function applyAddons(base: Entitlements, addons?: EntitlementsPatch): Entitlements {
  if (!addons) return base;
  // Start from base; compute additive adjustments without mutating base
  const out = deepMergeEntitlements(base, {});
  // toggles: OR with base (true enables feature)
  if (addons.toggles) {
    const t: Record<string, boolean> = { ...(out.toggles as Record<string, boolean>) };
    for (const [k, v] of Object.entries(addons.toggles)) t[k] = Boolean(v) || Boolean(t[k]);
    (out as unknown as { toggles: Record<string, boolean> }).toggles = t;
  }
  // capacities: numeric addition
  if (addons.capacities) {
    const c: Record<string, number> = { ...(out.capacities as Record<string, number>) };
    for (const [k, v] of Object.entries(addons.capacities)) c[k] = Number(c[k] ?? 0) + Number(v ?? 0);
    (out as unknown as { capacities: Record<string, number> }).capacities = c;
  }
  // quotas: add to limit; keep window from base when available, otherwise use addon window
  if (addons.quotas) {
    const q: Record<string, { limit: number; window: 'day'|'month'|'year' }> = { ...(out.quotas as Record<string, { limit: number; window: 'day'|'month'|'year' }>) };
    for (const [k, v] of Object.entries(addons.quotas)) {
      const baseQ = q[k];
      q[k] = { window: baseQ?.window ?? v.window, limit: Number(baseQ?.limit ?? 0) + Number(v.limit ?? 0) };
    }
    (out as unknown as { quotas: Record<string, { limit: number; window: 'day'|'month'|'year' }> }).quotas = q;
  }
  // credits: add to grant; keep period from base or addon
  if (addons.credits) {
    const cr: Record<string, { grant: number; period: 'month'|'year' }> = { ...(out.credits as Record<string, { grant: number; period: 'month'|'year' }>) };
    for (const [k, v] of Object.entries(addons.credits)) {
      const baseC = cr[k];
      cr[k] = { period: baseC?.period ?? v.period, grant: Number(baseC?.grant ?? 0) + Number(v.grant ?? 0) };
    }
    (out as unknown as { credits: Record<string, { grant: number; period: 'month'|'year' }> }).credits = cr;
  }
  return out;
}

let wired = false;
function ensureSubscriber() {
  if (wired) return;
  wired = true;
  subscribe((evt) => {
    try {
      const e = evt as Record<string, unknown> | null | undefined;
      if (!e || typeof e !== "object") return;
      if (
        e.kind === "setting.updated" &&
        e.ns === "plan" &&
        (e.key === "overrides" || e.key === "addons")
      ) {
        const tenantId =
          typeof e.tenantId === "string" ? (e.tenantId as string) : null;
        if (tenantId) void invalidateEntitlements(tenantId);
      }
    } catch {
      /* ignore */
    }
  });
}
