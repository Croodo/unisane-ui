"use client";

import { useMemo, useState } from "react";
import { Button } from "@unisane/ui/components/button";
import { useSession } from "@/src/hooks/use-session";
import { hooks } from "@/src/sdk/hooks";
import { toast } from "@unisane/ui/components/toast";
import { normalizeError } from "@/src/sdk/errors";
import { Icon } from "@unisane/ui/primitives/icon";
import type { BillingConfigResponse } from "@/src/sdk/types";

export function PricingClient() {
  const { me, loading } = useSession();
  const tenantId = me?.scopeId ?? null;
  const tenantSlug = me?.tenantSlug ?? null;
  const currentPlanId = (me as { plan?: string | null } | null)?.plan ?? null;

  const hasWorkspace = Boolean(tenantId && tenantSlug);

  const {
    data: billingConfig,
    isLoading: cfgLoading,
    isError: cfgError,
  } = hooks.billing.config();
  const billingMode = billingConfig?.mode ?? "disabled";
  const plans = billingConfig?.plans;

  const isSubscriptionMode =
    billingMode === "subscription" ||
    billingMode === "subscription_with_credits";
  const isTopupOnly = billingMode === "topup_only";
  const isBillingDisabled = billingMode === "disabled";

  const subscribe = hooks.billing.subscribe({
    onSuccess: (response: { url?: string } | null | undefined) => {
      const url = response?.url;
      if (url) {
        window.location.assign(url);
      } else {
        toast.success("Checkout created");
      }
    },
    onError: (error: unknown) => {
      const normalized = normalizeError(error);
      toast.error("Checkout failed", {
        description: normalized.rawMessage ?? normalized.message,
      });
    },
  });

  const baseWorkspaceBillingUrl = useMemo(() => {
    if (!tenantSlug) return null;
    if (typeof window === "undefined") return `/w/${tenantSlug}/billing`;
    return `${window.location.origin}/w/${tenantSlug}/billing`;
  }, [tenantSlug]);

  const [cadence, setCadence] = useState<"month" | "year">("month");

  type TieredPlan = {
    tierId: string;
    monthly?: BillingConfigResponse["plans"][number];
    yearly?: BillingConfigResponse["plans"][number];
  };

  const tieredPlans = useMemo(() => {
    const map = new Map<string, TieredPlan>();
    const sourcePlans = plans ?? [];
    for (const p of sourcePlans) {
      const isYearly =
        p.defaultPrice?.interval === "year" || p.id.endsWith("_yearly");
      const baseId = p.id.endsWith("_yearly")
        ? p.id.replace(/_yearly$/, "")
        : p.id;
      const existing = map.get(baseId);
      const current: TieredPlan = existing ?? { tierId: baseId };
      if (isYearly) current.yearly = p;
      else current.monthly = p;
      map.set(baseId, current);
    }
    const order = ["free", "pro", "business"];
    return Array.from(map.values()).sort((a, b) => {
      const ai = order.indexOf(a.tierId);
      const bi = order.indexOf(b.tierId);
      if (ai === -1 && bi === -1) return a.tierId.localeCompare(b.tierId);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [plans]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <div className="mb-16 text-center">
        <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide">
          Transparent Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-on-surface mb-4 tracking-tight">
          Choose your plan
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
          {cfgLoading
            ? "Loading plans…"
            : cfgError
              ? "Billing information temporarily unavailable"
              : "Start free and scale as you grow. Choose the plan that works best for you."}
        </p>
      </div>

      {isSubscriptionMode && (plans?.length ?? 0) > 0 && (
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center rounded-lg border border-outline-variant bg-surface-container/30 p-1">
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                cadence === "month"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setCadence("month")}
              aria-pressed={cadence === "month"}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                cadence === "year"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setCadence("year")}
              aria-pressed={cadence === "year"}
            >
              Yearly
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
        {cfgLoading && (plans?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-outline-variant bg-surface p-8">
            <p className="text-sm text-on-surface-variant">Loading plans…</p>
          </div>
        )}
        {!cfgLoading && !cfgError && (plans?.length ?? 0) === 0 && (
          <div className="rounded-2xl border border-outline-variant bg-surface p-8">
            <p className="text-sm text-on-surface-variant">
              No plans configured yet.
            </p>
          </div>
        )}
        {tieredPlans.map((tier) => {
          const activePlan =
            (cadence === "year" ? tier.yearly : tier.monthly) ??
            tier.monthly ??
            tier.yearly;
          if (!activePlan) return null;
          const planId = activePlan.id;
          const meta = activePlan;
          const isFreeTier = tier.tierId === "free";
          const monthlyPrice = tier.monthly?.defaultPrice?.amount;
          const yearlyPrice = tier.yearly?.defaultPrice?.amount;
          let savingsLabel: string | undefined;
          if (
            typeof monthlyPrice === "number" &&
            monthlyPrice > 0 &&
            typeof yearlyPrice === "number" &&
            yearlyPrice > 0
          ) {
            const fullYear = monthlyPrice * 12;
            const savings = fullYear - yearlyPrice;
            if (savings > 0) {
              const pct = Math.round((savings / fullYear) * 100);
              savingsLabel = `Save ${pct}%`;
            }
          }
          const priceLabel =
            meta.defaultPrice && meta.defaultPrice.amount >= 0
              ? meta.defaultPrice.amount === 0
                ? "Free"
                : `$${meta.defaultPrice.amount}`
              : "Contact sales";

          const defaultHighlights: string[] =
            tier.tierId === "free"
              ? ["Single workspace", "Limited usage & credits", "Email auth"]
              : tier.tierId === "pro"
                ? [
                    "Up to 5 seats included",
                    "Higher quotas & credits",
                    "Email + webhooks",
                  ]
                : [
                    "More seats & storage",
                    "Advanced features",
                    "Priority support",
                  ];
          const highlights =
            meta.features && meta.features.length > 0
              ? meta.features
              : defaultHighlights;

          const isCurrentFree = isFreeTier && currentPlanId === "free";

          const primaryDisabled = isFreeTier
            ? loading || subscribe.isPending
            : !hasWorkspace ||
              !baseWorkspaceBillingUrl ||
              subscribe.isPending ||
              isBillingDisabled;

          const primaryLabel = isFreeTier
            ? isCurrentFree && hasWorkspace
              ? "Current plan"
              : !me
                ? "Get started free"
                : hasWorkspace
                  ? "Go to workspace"
                  : "Create free workspace"
            : subscribe.isPending
              ? "Starting checkout…"
              : !hasWorkspace
                ? "Create workspace first"
                : isSubscriptionMode
                  ? "Get started"
                  : isTopupOnly
                    ? "Add credits"
                    : "Get started";

          const isRecommendedTier = meta.recommended || tier.tierId === "pro";

          return (
            <div
              key={planId}
              className={`flex flex-col rounded-2xl border transition-all duration-300 ${
                isRecommendedTier
                  ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20 scale-105"
                  : "border-outline-variant bg-surface hover:border-primary/40 hover:shadow-md"
              }`}
            >
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-on-surface">
                      {meta.label}
                    </h2>
                    {isRecommendedTier && (
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {meta.tagline}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-on-surface">
                      {priceLabel}
                    </span>
                    {priceLabel !== "Free" &&
                      priceLabel !== "Contact sales" && (
                        <span className="text-on-surface-variant">
                          /{cadence === "year" ? "year" : "month"}
                        </span>
                      )}
                  </div>
                  {cadence === "year" && savingsLabel && (
                    <p className="text-sm text-primary font-medium mt-2">
                      {savingsLabel} yearly
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {highlights.map((item: string) => (
                    <li key={item} className="flex items-start gap-3">
                      <Icon symbol="check" size="sm" className="text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-on-surface">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={primaryDisabled}
                  variant={isRecommendedTier ? "filled" : "outlined"}
                  onClick={() => {
                    if (isFreeTier) {
                      if (loading) return;
                      if (!me) {
                        window.location.assign("/signup");
                        return;
                      }
                      if (!hasWorkspace) {
                        window.location.assign("/welcome");
                        return;
                      }
                      if (tenantSlug) {
                        window.location.assign(`/w/${tenantSlug}`);
                        return;
                      }
                      if (tenantId) {
                        window.location.assign("/workspaces");
                        return;
                      }
                      return;
                    }
                    if (!tenantId || !baseWorkspaceBillingUrl) return;
                    if (isSubscriptionMode) {
                      subscribe.mutate({
                        params: { tenantId },
                        body: {
                          planId,
                          quantity: 1,
                          successUrl: baseWorkspaceBillingUrl,
                          cancelUrl: baseWorkspaceBillingUrl,
                        },
                      });
                      return;
                    }
                    if (isTopupOnly) {
                      window.location.assign(baseWorkspaceBillingUrl);
                    }
                  }}
                >
                  {primaryLabel}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !hasWorkspace && (
        <div className="text-center mt-16 pt-8 border-t border-outline-variant">
          <p className="text-sm text-on-surface-variant">
            Need a workspace?{" "}
            <a
              href="/welcome"
              className="font-medium text-primary hover:underline"
            >
              Create one here
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
