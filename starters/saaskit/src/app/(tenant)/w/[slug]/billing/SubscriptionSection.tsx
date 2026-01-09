import { useState, useTransition } from "react";
import { Button } from "@unisane/ui/components/button";
import { Card } from "@unisane/ui/components/card";
import { Badge } from "@unisane/ui/components/badge";
import { PLAN_META } from "@/src/shared/constants/plan";
import type { PlanId } from "@/src/shared/constants/plan";
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
    <Card className="h-full">
      <Card.Header className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <Card.Title className="flex items-center gap-2 text-lg">
            <Icon symbol="credit_card" size="sm" className="text-primary" />
            <span>Subscription</span>
          </Card.Title>
          <Card.Description>
            Your current plan and subscription status.
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
          <div className="flex items-center gap-2 rounded-md border bg-surface-container/40 px-3 py-2 text-sm text-on-surface-variant">
            <Icon symbol="progress_activity" size="sm" className="animate-spin" />
            <span>Loading billing details…</span>
          </div>
        ) : cfgError ? (
          <div className="flex items-start gap-2 rounded-md border bg-error/5 px-3 py-2 text-sm text-error">
            <Icon symbol="info" size="sm" className="mt-0.5" />
            <span>
              We couldn&apos;t load your billing details. Please refresh the
              page or contact support if this keeps happening.
            </span>
          </div>
        ) : !isSubscriptionMode ? (
          <div className="flex items-start gap-2 rounded-md border bg-surface-container/40 px-3 py-2 text-sm text-on-surface-variant">
            <Icon symbol="info" size="sm" className="mt-0.5" />
            <span>
              Subscriptions aren&apos;t enabled for this workspace. If you think
              this is a mistake, please contact support.
            </span>
          </div>
        ) : !hasSubscription ? (
          <div className="flex items-start gap-2 rounded-md border bg-surface-container/40 px-3 py-2 text-sm text-on-surface-variant">
            <Icon symbol="info" size="sm" className="mt-0.5" />
            <span>
              You don&apos;t have an active subscription yet. Use the pricing
              page to start a plan.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                {tier === "free" ? (
                  <Icon symbol="inventory_2" size="sm" className="text-on-surface-variant" />
                ) : tier === "pro" ? (
                  <Icon symbol="verified" size="sm" className="text-sky-600" />
                ) : (
                  <Icon symbol="auto_awesome" size="sm" className="text-emerald-600" />
                )}
              </div>
              <div>
                <div className="mb-1">
                  <Badge
                    variant={tier === "free" ? "tonal" : "filled"}
                    className={
                      tier === "business"
                        ? "px-3 py-1 text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "px-3 py-1 text-sm font-semibold"
                    }
                  >
                    {planLabel}
                  </Badge>
                </div>
                <p className="text-sm text-on-surface-variant">
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
          </div>
        )}
      </Card.Content>
      {isSubscriptionMode && hasSubscription && !cfgLoading && !cfgError && (
        <Card.Footer className="border-t bg-surface-container/40 px-6 py-4 flex items-center justify-between">
          {isCanceled ? (
            <>
              <span className="text-sm text-on-surface-variant">
                This subscription has been canceled. To resume or change your
                plan, use the billing portal.
              </span>
              <Button
                size="sm"
                variant="outlined"
                disabled={!tenantId || portalPending}
                onClick={onOpenPortal}
              >
                Open portal
              </Button>
            </>
          ) : isIncomplete ? (
            <>
              <span className="text-sm text-on-surface-variant">
                The initial payment is incomplete. Complete or retry payment in
                the billing portal to activate your subscription.
              </span>
              <Button
                size="sm"
                variant="outlined"
                disabled={!tenantId || portalPending}
                onClick={onOpenPortal}
              >
                Open portal
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-on-surface-variant">
                This subscription renews automatically each billing period. You
                can cancel at the end of the current period.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="text"
                  className="text-error hover:text-error"
                  disabled={!tenantId || cancelPending}
                  onClick={() => setDialogOpen(true)}
                >
                  Cancel at period end
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
                >
                  Open portal
                </Button>
              </div>
            </>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
