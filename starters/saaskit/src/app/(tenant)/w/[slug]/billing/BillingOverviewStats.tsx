"use client";

import { hooks } from "@/src/sdk/hooks";
import { StatsCards, type StatItem } from "@/src/components/dashboard/StatsCards";
import { PLAN_META } from "@unisane/kernel/client";
import type { PlanId } from "@unisane/kernel/client";

interface BillingOverviewStatsProps {
  tenantId: string | undefined;
  isSubscriptionMode: boolean;
  isTopupMode: boolean;
  subscription?: {
    planId?: string;
    status?: string;
    currentPeriodEnd?: string | null;
  };
  isSubLoading?: boolean;
}

export function BillingOverviewStats({
  tenantId,
  isSubscriptionMode,
  isTopupMode,
  subscription,
  isSubLoading,
}: BillingOverviewStatsProps) {
  const creditsQuery = hooks.credits.balance(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled: Boolean(tenantId) && isTopupMode }
  );

  const creditsAmount = (creditsQuery.data?.amount as number | undefined) ?? 0;

  const planMeta = subscription?.planId
    ? PLAN_META[subscription.planId as PlanId]
    : null;
  const planLabel = planMeta?.label ?? subscription?.planId ?? "No plan";
  const monthlyAmount = planMeta?.defaultPrice?.amount ?? 0;

  const nextRenewal = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

  const isLoading = isSubLoading || creditsQuery.isLoading;

  const items: StatItem[] = [];

  if (isSubscriptionMode) {
    items.push({
      label: "Current Plan",
      value: planLabel,
      icon: "credit_card",
    });

    if (monthlyAmount > 0) {
      items.push({
        label: "Monthly Cost",
        value: `$${monthlyAmount}`,
        icon: "payments",
      });
    }

    items.push({
      label: "Next Renewal",
      value: nextRenewal,
      icon: "event",
    });
  }

  if (isTopupMode) {
    items.push({
      label: "Credits Available",
      value: creditsAmount,
      icon: "monetization_on",
    });
  }

  // If only topup mode (no subscription), add some context
  if (!isSubscriptionMode && isTopupMode) {
    items.unshift({
      label: "Billing Mode",
      value: "Pay as you go",
      icon: "account_balance_wallet",
    });
  }

  if (items.length === 0) return null;

  return (
    <StatsCards
      items={items}
      columns={items.length as 2 | 3 | 4}
      isLoading={isLoading}
      className="mb-0"
    />
  );
}
