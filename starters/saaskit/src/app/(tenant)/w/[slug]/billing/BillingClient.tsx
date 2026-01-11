"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import { toast } from "@unisane/ui/components/toast";
import { Alert } from "@unisane/ui/components/alert";
import { Badge } from "@unisane/ui/components/badge";
import { Typography } from "@unisane/ui/components/typography";
import { useSession } from "@/src/hooks/useSession";
import { hooks } from "@/src/sdk/hooks";
import { normalizeError } from "@/src/sdk/errors";
import { PageLayout } from "@/src/context/usePageLayout";
import { useTabNavigation } from "@/src/context/useTabNavigation";
import {
  TOPUP_OPTIONS,
  creditsForPurchase,
} from "@/src/shared/constants/credits";
import type { TopupOptionId } from "@/src/shared/constants/credits";
import { Tabs, TabsContent } from "@unisane/ui/components/tabs";
import { InvoicesTab, PaymentsTab, CreditsTab } from "./components";
import { PLAN_META } from "@/src/shared/constants/plan";
import type { PlanId } from "@/src/shared/constants/plan";

/**
 * BillingClient — Consolidated billing with tabs
 *
 * Structure:
 * - Overview tab: Subscription, Credits, Top-up
 * - Invoices tab: Full invoice history
 * - Payments tab: Full payment history with refund
 */
export function BillingClient({ slug }: { slug: string }) {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;

  // URL-synchronized tab navigation
  const { currentTab, navigate: handleTabChange } = useTabNavigation({
    defaultTab: "overview",
  });

  const {
    data: billingConfig,
    isLoading: cfgLoading,
  } = hooks.billing.config();
  const billingMode = billingConfig?.mode ?? "disabled";

  const isSubscriptionMode =
    billingMode === "subscription" ||
    billingMode === "subscription_with_credits";
  const isTopupMode =
    billingMode === "topup_only" || billingMode === "subscription_with_credits";

  const sub = hooks.billing.subscription(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled: isSubscriptionMode && Boolean(tenantId) }
  );

  // Credits balance query
  const creditsBalance = hooks.credits.balance(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled: isTopupMode && Boolean(tenantId) }
  );

  const topupOptions = useMemo(
    () =>
      TOPUP_OPTIONS.map((opt) => ({
        ...opt,
        credits: creditsForPurchase(opt.amount, opt.currency),
      })),
    []
  );
  const [topupOptionId, setTopupOptionId] = useState<TopupOptionId>(
    topupOptions[0]?.id ?? "small"
  );

  const portal = hooks.billing.portal({
    onSuccess: (r: { url?: string }) => {
      const url = r?.url;
      if (url) window.location.assign(url);
      else toast.success("Portal ready");
    },
    onError: (e: unknown) =>
      toast.error("Portal error", { description: normalizeError(e).message }),
  });

  const cancel = hooks.billing.cancel({
    onSuccess: () =>
      toast.success(
        "Subscription will cancel at the end of the current billing period."
      ),
    onError: (e: unknown) =>
      toast.error("Cancel failed", { description: normalizeError(e).message }),
  });

  const topup = hooks.billing.topup({
    onSuccess: (r: { url?: string }) => {
      const url = r?.url;
      if (url) window.location.assign(url);
      else toast.success("Top-up checkout ready");
    },
    onError: (e: unknown) =>
      toast.error("Top-up failed", { description: normalizeError(e).message }),
  });

  const status =
    (sub.data as { status?: string } | undefined)?.status ?? "unknown";
  const plan = (sub.data as { planId?: string } | undefined)?.planId ?? "—";
  const cancelAtPeriodEnd =
    (sub.data as { cancelAtPeriodEnd?: boolean } | undefined)
      ?.cancelAtPeriodEnd ?? false;
  const currentPeriodEnd =
    (sub.data as { currentPeriodEnd?: string } | undefined)?.currentPeriodEnd ??
    null;
  const hasSubscription = Boolean(
    (sub.data as { id?: string; status?: string } | undefined)?.id ??
      (sub.data as { status?: string } | undefined)?.status
  );

  const successUrl = useMemo(
    () => `${window.location.origin}/w/${slug}/billing`,
    [slug]
  );
  const cancelUrl = successUrl;

  // Derived values for display
  const planLabel =
    PLAN_META[plan as PlanId]?.label ?? plan ?? "No plan";
  const statusLabel = (status || "Unknown")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  const creditsAmount = (creditsBalance.data?.amount as number | undefined) ?? 0;
  const nextRenewal = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <>
      <PageLayout
        subtitle="Manage your plan, credits, and billing history."
        tabs={[
          { id: "overview", label: "Overview", icon: "credit_card" },
          { id: "invoices", label: "Invoices", icon: "receipt" },
          { id: "payments", label: "Payments", icon: "account_balance_wallet" },
          { id: "credits", label: "Credits", icon: "monetization_on" },
        ]}
        onTabChange={handleTabChange}
        actions={
          <Button asChild size="sm" variant="text" trailingIcon={<Icon symbol="north_east" />} className="px-0">
            <Link href="/pricing">
              View plans
            </Link>
          </Button>
        }
      />
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">

        <TabsContent value="overview">
          {billingMode === "disabled" && !cfgLoading && (
            <Alert variant="info" title="Billing Not Enabled" className="mb-8">
              Billing is not enabled for this workspace. Contact your
              administrator if you believe this is a mistake.
            </Alert>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            {/* Left Column - Credits & Subscription */}
            <div className="lg:col-span-8 space-y-10">
              {/* Available Credits Card */}
              {isTopupMode && (
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <Typography variant="titleLarge">Available Credits</Typography>
                    {!creditsBalance.isLoading && creditsAmount < 100 && (
                      <Badge variant="outlined" className="text-error border-error">
                        Low Balance
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-md border border-outline-variant p-8">
                    {creditsBalance.isLoading ? (
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <Icon symbol="progress_activity" size="md" className="animate-spin" />
                        <Typography variant="bodyMedium">Loading balance...</Typography>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography variant="displayLarge" className="font-semibold tabular-nums">
                            {creditsAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="bodyLarge" className="text-on-surface-variant mt-2">
                            credits remaining for this billing cycle
                          </Typography>
                        </div>
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-container">
                          <Icon symbol="bolt" size="xl" className="text-on-primary-container" />
                        </div>
                      </div>
                    )}
                    {!creditsBalance.isLoading && creditsAmount < 100 && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant">
                        <Icon symbol="error" size="sm" className="text-error" />
                        <Typography variant="bodySmall" className="text-on-surface-variant">
                          You&apos;re running low. Auto-recharge is currently <strong>off</strong>.
                        </Typography>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Subscription Section */}
              {isSubscriptionMode && (
                <section>
                  <div className="mb-5">
                    <Typography variant="titleLarge">Subscription</Typography>
                    <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
                      Manage your plan and billing preferences
                    </Typography>
                  </div>
                  <div className="divide-y divide-outline-variant">
                    {/* Current Plan Row */}
                    <div className="py-5 flex items-center justify-between gap-4">
                      <div>
                        <Typography variant="titleMedium">Current Plan</Typography>
                        <Typography variant="bodyMedium" className="text-on-surface-variant mt-0.5">
                          Your active subscription tier
                        </Typography>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub.isLoading ? (
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <Icon symbol="progress_activity" size="sm" className="animate-spin" />
                          </div>
                        ) : hasSubscription ? (
                          <>
                            <Typography variant="titleMedium">{planLabel}</Typography>
                            <Badge variant="tonal">
                              {statusLabel}
                            </Badge>
                          </>
                        ) : (
                          <Typography variant="bodyLarge" className="text-on-surface-variant">
                            No active subscription
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Next Renewal Row */}
                    {hasSubscription && (
                      <div className="py-5 flex items-center justify-between gap-4">
                        <div>
                          <Typography variant="titleMedium">
                            {cancelAtPeriodEnd ? "Cancels On" : "Next Renewal"}
                          </Typography>
                          <Typography variant="bodyMedium" className="text-on-surface-variant mt-0.5">
                            {cancelAtPeriodEnd
                              ? "When your subscription ends"
                              : "When your subscription renews"}
                          </Typography>
                        </div>
                        <Typography variant="titleMedium">
                          {nextRenewal}
                        </Typography>
                      </div>
                    )}

                    {/* Billing Portal Row */}
                    <div className="py-5 flex items-center justify-between gap-4">
                      <div>
                        <Typography variant="titleMedium">Billing Portal</Typography>
                        <Typography variant="bodyMedium" className="text-on-surface-variant mt-0.5">
                          Update payment method and view history
                        </Typography>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSubscription && !cancelAtPeriodEnd && (
                          <Button
                            size="sm"
                            variant="text"
                            className="text-on-surface-variant"
                            disabled={!tenantId || cancel.isPending}
                            onClick={() => {
                              if (!tenantId) return;
                              cancel.mutate({
                                params: { tenantId },
                                body: { atPeriodEnd: true },
                              });
                            }}
                          >
                            Cancel plan
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outlined"
                          trailingIcon={<Icon symbol="open_in_new" size="sm" />}
                          disabled={!tenantId || portal.isPending}
                          onClick={() => {
                            if (!tenantId) return;
                            portal.mutate({ params: { tenantId }, body: {} });
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Top-up & History */}
            <div className="lg:col-span-4 space-y-10">
              {/* Top-up Section */}
              {isTopupMode && (
                <section>
                  <div className="mb-5">
                    <Typography variant="titleLarge">Top up credits</Typography>
                    <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
                      One-time purchase, never expires.
                    </Typography>
                  </div>
                  <div className="space-y-3">
                    {topupOptions.map((opt, index) => {
                      const isSelected = opt.id === topupOptionId;
                      const creditsLabel = opt.credits.toLocaleString();
                      const isPopular = index === 1; // Middle option is popular

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`relative flex w-full cursor-pointer items-center gap-4 rounded-md border px-4 py-4 text-left transition-all ${
                            isSelected
                              ? "border-primary ring-1 ring-primary bg-surface"
                              : "border-outline-variant hover:border-outline bg-surface"
                          }`}
                          onClick={() => setTopupOptionId(opt.id as TopupOptionId)}
                        >
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-outline-variant"
                            }`}
                          >
                            {isSelected && (
                              <span className="size-2 rounded-full bg-on-primary" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <Typography variant="titleMedium" className="tabular-nums">
                              {creditsLabel} credits
                            </Typography>
                            {isPopular && (
                              <Badge variant="tonal">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <Typography variant="titleMedium" className="shrink-0 tabular-nums">
                            {opt.label}
                          </Typography>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full mt-4"
                    icon={<Icon symbol="shopping_cart" />}
                    disabled={!tenantId || topup.isPending}
                    onClick={() => {
                      if (!tenantId) return;
                      const selected =
                        topupOptions.find((o) => o.id === topupOptionId) ??
                        topupOptions[0];
                      if (!selected) return;
                      topup.mutate({
                        params: { tenantId },
                        body: {
                          amount: selected.amount,
                          currency: selected.currency,
                          successUrl,
                          cancelUrl,
                        },
                      });
                    }}
                  >
                    {topup.isPending ? "Processing..." : "Confirm Purchase"}
                  </Button>
                </section>
              )}

              {/* History & Settings Section */}
              <section>
                <div className="mb-5">
                  <Typography variant="titleLarge">History & Settings</Typography>
                </div>
                <div className="rounded-md border border-outline-variant divide-y divide-outline-variant">
                  <button
                    type="button"
                    onClick={() => handleTabChange("invoices")}
                    className="flex items-center gap-4 w-full text-left px-4 py-4 hover:bg-surface-container-lowest transition-colors group first:rounded-t-md last:rounded-b-md"
                  >
                    <div className="flex size-10 items-center justify-center rounded-md bg-surface-container">
                      <Icon symbol="receipt" size="md" className="text-on-surface-variant" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="titleMedium">Invoices</Typography>
                      <Typography variant="bodyMedium" className="text-on-surface-variant">
                        Past invoices
                      </Typography>
                    </div>
                    <Icon symbol="chevron_right" size="md" className="text-on-surface-variant/50" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("payments")}
                    className="flex items-center gap-4 w-full text-left px-4 py-4 hover:bg-surface-container-lowest transition-colors group"
                  >
                    <div className="flex size-10 items-center justify-center rounded-md bg-surface-container">
                      <Icon symbol="account_balance_wallet" size="md" className="text-on-surface-variant" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="titleMedium">Payments</Typography>
                      <Typography variant="bodyMedium" className="text-on-surface-variant">
                        Payment methods
                      </Typography>
                    </div>
                    <Icon symbol="chevron_right" size="md" className="text-on-surface-variant/50" />
                  </button>

                  {isTopupMode && (
                    <button
                      type="button"
                      onClick={() => handleTabChange("credits")}
                      className="flex items-center gap-4 w-full text-left px-4 py-4 hover:bg-surface-container-lowest transition-colors group last:rounded-b-md"
                    >
                      <div className="flex size-10 items-center justify-center rounded-md bg-surface-container">
                        <Icon symbol="history" size="md" className="text-on-surface-variant" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Typography variant="titleMedium">Usage</Typography>
                        <Typography variant="bodyMedium" className="text-on-surface-variant">
                          Credit logs
                        </Typography>
                      </div>
                      <Icon symbol="chevron_right" size="md" className="text-on-surface-variant/50" />
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="credits">
          <CreditsTab tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default BillingClient;
