import { Button } from "@unisane/ui/components/button";
import { Typography } from "@unisane/ui/components/typography";
import { Input } from "@unisane/ui/primitives/input";
import { Label } from "@unisane/ui/primitives/label";
import { Icon } from "@unisane/ui/primitives/icon";
import type { PlanId } from "@unisane/kernel/client";

export type PlanActionsSectionProps = {
  isSubscriptionMode: boolean;
  hasActiveSubscription: boolean;
  plansConfig: { id: string; label: string }[];
  planId: PlanId | undefined;
  quantity: number;
  onPlanIdChange: (planId: PlanId) => void;
  onQuantityChange: (quantity: number) => void;
  canStartOrUpdate: boolean;
  canChangeSeats: boolean;
  onStartOrUpdate: () => void;
  onChangeSeats: () => void;
};

export function PlanActionsSection({
  isSubscriptionMode,
  hasActiveSubscription,
  plansConfig,
  planId,
  quantity,
  onPlanIdChange,
  onQuantityChange,
  canStartOrUpdate,
  canChangeSeats,
  onStartOrUpdate,
  onChangeSeats,
}: PlanActionsSectionProps) {
  if (!isSubscriptionMode || plansConfig.length === 0) return null;

  return (
    <section className="rounded-lg border border-outline-variant overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-surface-container-low space-y-1">
        <div className="flex items-center gap-2">
          <Icon
            symbol={hasActiveSubscription ? "group" : "rocket_launch"}
            size="sm"
            className="text-primary"
          />
          <Typography variant="titleMedium">
            {hasActiveSubscription ? "Manage Seats" : "Start a Subscription"}
          </Typography>
        </div>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {hasActiveSubscription
            ? "Adjust how many seats are included in your subscription."
            : "Choose a plan and number of seats to get started."}
        </Typography>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {hasActiveSubscription ? (
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="seats">Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  onQuantityChange(Math.max(1, Number(e.target.value || 1)))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="w-full"
                variant="outlined"
                disabled={!canChangeSeats}
                onClick={onChangeSeats}
              >
                Update seats
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                className="flex h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 py-1 text-body-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={planId ?? ""}
                onChange={(e) => onPlanIdChange(e.target.value as PlanId)}
              >
                {plansConfig.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Seats</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  onQuantityChange(Math.max(1, Number(e.target.value || 1)))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="w-full"
                disabled={!canStartOrUpdate}
                onClick={onStartOrUpdate}
              >
                Start subscription
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint for active subscriptions */}
      {hasActiveSubscription && (
        <div className="px-6 py-3 border-t border-outline-variant bg-surface-container-lowest">
          <Typography variant="labelSmall" className="text-on-surface-variant">
            To change your plan (for example from Free to Pro), use the billing
            portal above.
          </Typography>
        </div>
      )}
    </section>
  );
}
