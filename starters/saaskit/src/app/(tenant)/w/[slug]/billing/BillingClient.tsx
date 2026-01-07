"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { ArrowUpRight, CreditCard, Receipt, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/src/hooks/useSession";
import { hooks } from "@/src/sdk/hooks";
import { normalizeError } from "@/src/sdk/errors";
import { PageHeader } from "@/src/context/usePageHeader";
import {
  TOPUP_OPTIONS,
  creditsForPurchase,
} from "@/src/shared/constants/credits";
import type { TopupOptionId } from "@/src/shared/constants/credits";
import { SubscriptionSection } from "./SubscriptionSection";
import { TopupSection } from "./TopupSection";
import { CreditsSummary } from "./CreditsSummary";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { InvoicesTab, PaymentsTab, CreditsTab } from "./components";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = searchParams.get("tab") ?? "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  };

  const {
    data: billingConfig,
    isLoading: cfgLoading,
    isError: cfgError,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const subscribe = hooks.billing.subscribe();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const changeQty = hooks.billing.changeQuantity();

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

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Manage your plan, credits, and billing history."
        actions={
          <Button asChild size="sm" variant="link" className="gap-1 px-0">
            <Link href="/pricing">
              View plans
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <Coins className="h-4 w-4" />
            Credits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isSubscriptionMode && (
            <SubscriptionSection
              cfgLoading={cfgLoading}
              cfgError={cfgError}
              isSubscriptionMode={isSubscriptionMode}
              isSubLoading={sub.isLoading}
              status={status}
              plan={plan}
              tenantId={tenantId}
              hasSubscription={hasSubscription}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
              currentPeriodEnd={currentPeriodEnd}
              onOpenPortal={() => {
                if (!tenantId) return;
                portal.mutate({ params: { tenantId }, body: {} });
              }}
              onCancelAtPeriodEnd={() => {
                if (!tenantId) return;
                cancel.mutate({
                  params: { tenantId },
                  body: { atPeriodEnd: true },
                });
              }}
              portalPending={portal.isPending}
              cancelPending={cancel.isPending}
            />
          )}
          {isTopupMode && (
            <div className="grid gap-4 md:grid-cols-2 items-start">
              {tenantId && (
                <CreditsSummary billingMode={billingMode} tenantId={tenantId} />
              )}
              <TopupSection
                isTopupMode={isTopupMode}
                options={topupOptions}
                selectedId={topupOptionId}
                onSelect={(id) => setTopupOptionId(id as TopupOptionId)}
                canCreateTopup={Boolean(tenantId) && !topup.isPending}
                onCreateTopup={() => {
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
              />
            </div>
          )}
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
