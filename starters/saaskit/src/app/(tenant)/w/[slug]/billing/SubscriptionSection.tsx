import { useState, useTransition } from "react";
import { Button } from "@unisane/ui/components/button";
import { Badge } from "@unisane/ui/components/badge";
import { Alert } from "@unisane/ui/components/alert";
import { Card } from "@unisane/ui/components/card";
import { PLAN_META } from "@unisane/kernel/client";
import type { PlanId } from "@unisane/kernel/client";
import { ConfirmDialog } from "@unisane/ui/components/confirm-dialog";
import { Icon } from "@unisane/ui/primitives/icon";

export type SubscriptionSectionProps = {
  cfgLoading: boolean;
  cfgError: boolean;
  isSubscriptionMode: boolean;
  isSubLoading: boolean;
  status: string;
  plan: string;
  tenantId: string | undefined;
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  onOpenPortal: () => void;
  onCancelAtPeriodEnd: () => void;
  portalPending: boolean;
  cancelPending: boolean;
};

export function SubscriptionSection({
  cfgLoading,
  cfgError,
  isSubscriptionMode,
  isSubLoading,
  status,
  plan,
  tenantId,
  hasSubscription,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  onOpenPortal,
  onCancelAtPeriodEnd,
  portalPending,
  cancelPending,
}: SubscriptionSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rawStatus = (status ?? "").toLowerCase();
  const isCanceled =
    rawStatus === "canceled" || rawStatus === "incomplete_expired";
  const isIncomplete = rawStatus === "incomplete";
  const hasScheduledCancel = cancelAtPeriodEnd && !isCanceled;
  const meta = PLAN_META[plan as PlanId] as
    | (typeof PLAN_META)[PlanId]
    | undefined;
  const tier: "free" | "pro" | "business" | "other" = (() => {
    const amount = meta?.defaultPrice?.amount ?? 0;
    if (amount === 0) return "free";
    if (amount < 50) return "pro";
    if (amount >= 50) return "business";
    return "other";
  })();
  const basePlanLabel =
    PLAN_META[plan as PlanId]?.label ?? plan ?? "Current plan";
  const planLabel = (isSubLoading ? "Loading…" : basePlanLabel)
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  const statusLabel = (isSubLoading ? "Loading…" : status || "Unknown")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  const billingInterval =
    meta?.defaultPrice?.interval === "year"
      ? "yearly"
      : meta?.defaultPrice?.interval === "month"
        ? "monthly"
        : "per period";

  const handleCancel = () => {
    startTransition(() => {
      onCancelAtPeriodEnd();
      setDialogOpen(false);
    });
  };

  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between">
        <div>
          <Card.Title>Subscription</Card.Title>
          <Card.Description>
            Manage your plan and billing preferences
          </Card.Description>
        </div>
        {isSubscriptionMode && hasSubscription && !cfgLoading && !cfgError && (
          <Badge variant="tonal" className="text-xs px-3 py-1">
            {statusLabel}
          </Badge>
        )}
      </Card.Header>

      <Card.Content>
        {cfgLoading ? (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon symbol="progress_activity" size="sm" className="animate-spin" />
            <span className="text-body-medium">Loading billing details…</span>
          </div>
        ) : cfgError ? (
          <Alert variant="error" title="Error Loading Billing">
            We couldn&apos;t load your billing details. Please refresh the page
            or contact support if this keeps happening.
          </Alert>
        ) : !isSubscriptionMode ? (
          <Alert variant="info" title="Subscriptions Not Enabled">
            Subscriptions aren&apos;t enabled for this workspace. If you think
            this is a mistake, please contact support.
          </Alert>
        ) : !hasSubscription ? (
          <Alert variant="info" title="No Active Subscription">
            You don&apos;t have an active subscription yet. Use the pricing page
            to start a plan.
          </Alert>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-container">
              {tier === "free" ? (
                <Icon symbol="inventory_2" size="md" className="text-on-secondary-container" />
              ) : tier === "pro" ? (
                <Icon symbol="verified" size="md" className="text-primary" />
              ) : (
                <Icon symbol="auto_awesome" size="md" className="text-tertiary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={tier === "free" ? "tonal" : "filled"}
                  className="px-3 py-1 text-sm font-semibold"
                >
                  {planLabel}
                </Badge>
              </div>
              <p className="text-body-small text-on-surface-variant">
                {(() => {
                  if (isIncomplete) {
                    return "Setup is incomplete. Complete payment in the billing portal to activate your subscription.";
                  }
                  const date =
                    currentPeriodEnd &&
                    !Number.isNaN(Date.parse(currentPeriodEnd))
                      ? new Date(currentPeriodEnd)
                      : null;
                  if (!date) {
                    return hasScheduledCancel
                      ? `Billed ${billingInterval}. Cancellation is scheduled; you can manage this in the billing portal.`
                      : `Billed ${billingInterval}. Your subscription is managed in the billing portal.`;
                  }
                  const formatted = date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return hasScheduledCancel
                    ? `Billed ${billingInterval}. Cancels on ${formatted}; you can manage this in the billing portal.`
                    : `Billed ${billingInterval}. Renews on ${formatted}; you can manage this in the billing portal.`;
                })()}
              </p>
            </div>
          </div>
        )}
      </Card.Content>

      {isSubscriptionMode && hasSubscription && !cfgLoading && !cfgError && (
        <Card.Footer className="flex items-center justify-end gap-3">
          {isCanceled ? (
            <Button
              size="sm"
              variant="outlined"
              disabled={!tenantId || portalPending}
              onClick={onOpenPortal}
              className="gap-2"
            >
              <Icon symbol="open_in_new" size="sm" />
              Open billing portal
            </Button>
          ) : isIncomplete ? (
            <Button
              size="sm"
              variant="filled"
              disabled={!tenantId || portalPending}
              onClick={onOpenPortal}
              className="gap-2"
            >
              <Icon symbol="credit_card" size="sm" />
              Complete payment
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="text"
                className="text-error hover:text-error"
                disabled={!tenantId || cancelPending}
                onClick={() => setDialogOpen(true)}
              >
                Cancel subscription
              </Button>
              <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title="Cancel subscription at period end?"
                description="This will schedule the subscription to cancel at the end of the current billing period. You can usually resume from the billing portal before that date."
                variant="danger"
                confirmLabel="Confirm cancel"
                cancelLabel="Keep subscription"
                onConfirm={handleCancel}
                loading={isPending}
              />
              <Button
                size="sm"
                variant="outlined"
                disabled={!tenantId || portalPending}
                onClick={onOpenPortal}
                className="gap-2"
              >
                <Icon symbol="open_in_new" size="sm" />
                Manage subscription
              </Button>
            </>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
