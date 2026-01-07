import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { PLAN_META } from "@/src/shared/constants/plan";
import type { PlanId } from "@/src/shared/constants/plan";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  BadgeCheck,
  Box,
  CreditCard,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";

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

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="size-5 text-primary" />
            <span>Subscription</span>
          </CardTitle>
          <CardDescription>
            Your current plan and subscription status.
          </CardDescription>
        </div>
        {isSubscriptionMode && hasSubscription && !cfgLoading && !cfgError && (
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {statusLabel}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {cfgLoading ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading billing details…</span>
          </div>
        ) : cfgError ? (
          <div className="flex items-start gap-2 rounded-md border bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <Info className="mt-0.5 size-4" />
            <span>
              We couldn&apos;t load your billing details. Please refresh the
              page or contact support if this keeps happening.
            </span>
          </div>
        ) : !isSubscriptionMode ? (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4" />
            <span>
              Subscriptions aren&apos;t enabled for this workspace. If you think
              this is a mistake, please contact support.
            </span>
          </div>
        ) : !hasSubscription ? (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4" />
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
                  <Box className="h-5 w-5 text-muted-foreground" />
                ) : tier === "pro" ? (
                  <BadgeCheck className="h-5 w-5 text-sky-600" />
                ) : (
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div>
                <div className="mb-1">
                  <Badge
                    variant={tier === "free" ? "secondary" : "default"}
                    className={
                      tier === "business"
                        ? "px-3 py-1 text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "px-3 py-1 text-sm font-semibold"
                    }
                  >
                    {planLabel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
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
      </CardContent>
      {isSubscriptionMode && hasSubscription && !cfgLoading && !cfgError && (
        <CardFooter className="border-t bg-muted/40 px-6 py-4 flex items-center justify-between">
          {isCanceled ? (
            <>
              <span className="text-sm text-muted-foreground">
                This subscription has been canceled. To resume or change your
                plan, use the billing portal.
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!tenantId || portalPending}
                onClick={onOpenPortal}
              >
                Open portal
              </Button>
            </>
          ) : isIncomplete ? (
            <>
              <span className="text-sm text-muted-foreground">
                The initial payment is incomplete. Complete or retry payment in
                the billing portal to activate your subscription.
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!tenantId || portalPending}
                onClick={onOpenPortal}
              >
                Open portal
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                This subscription renews automatically each billing period. You
                can cancel at the end of the current period.
              </span>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={!tenantId || cancelPending}
                    >
                      Cancel at period end
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Cancel subscription at period end?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will schedule the subscription to cancel at the end
                        of the current billing period. You can usually resume
                        from the billing portal before that date.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onCancelAtPeriodEnd}
                      >
                        Confirm cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!tenantId || portalPending}
                  onClick={onOpenPortal}
                >
                  Open portal
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
