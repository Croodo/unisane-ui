import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type { PlanId } from "@/src/shared/constants/plan";

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
    <div className="space-y-3 rounded-md border p-4">
      {hasActiveSubscription ? (
        <>
          <div>
            <h4 className="font-medium">Seats</h4>
            <p className="text-sm text-muted-foreground">
              Adjust how many seats are included in your subscription.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:items-end">
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
                variant="outline"
                disabled={!canChangeSeats}
                onClick={onChangeSeats}
              >
                Update seats
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            To change your plan (for example from Free to Pro), use the billing
            portal above.
          </p>
        </>
      ) : (
        <>
          <div>
            <h4 className="font-medium">Start a subscription</h4>
            <p className="text-sm text-muted-foreground">
              Choose a plan and number of seats to get started.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
        </>
      )}
    </div>
  );
}
