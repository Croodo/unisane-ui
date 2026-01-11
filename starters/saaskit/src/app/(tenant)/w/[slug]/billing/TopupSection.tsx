import { Button } from "@unisane/ui/components/button";
import { Card } from "@unisane/ui/components/card";
import { cn } from "@unisane/ui/lib/utils";
import { Icon } from "@unisane/ui/primitives/icon";

export type TopupSectionProps = {
  isTopupMode: boolean;
  options: { id: string; label: string; amount: number; credits: number }[];
  selectedId: string;
  onSelect: (id: string) => void;
  canCreateTopup: boolean;
  onCreateTopup: () => void;
};

export function TopupSection({
  isTopupMode,
  options,
  selectedId,
  onSelect,
  canCreateTopup,
  onCreateTopup,
}: TopupSectionProps) {
  if (!isTopupMode) return null;

  const selectedOption = options.find((o) => o.id === selectedId);

  return (
    <Card className="h-full flex flex-col">
      <Card.Header>
        <Card.Title>Purchase Credits</Card.Title>
        <Card.Description>
          Select a credit package to top up your balance
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex-1">
        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = opt.id === selectedId;
            const creditsLabel = opt.credits.toLocaleString();
            const pricePerCredit = (opt.amount / opt.credits).toFixed(3);

            return (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  "relative flex w-full cursor-pointer items-center gap-4 rounded-lg border px-4 py-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary-container/30 ring-2 ring-primary"
                    : "border-outline-variant hover:border-primary/60 hover:bg-surface-container-low"
                )}
                onClick={() => onSelect(opt.id)}
              >
                {/* Radio indicator */}
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-outline"
                  )}
                >
                  {isSelected && (
                    <span className="size-2 rounded-full bg-on-primary" />
                  )}
                </span>

                {/* Credits info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-title-medium font-semibold tabular-nums">
                      {creditsLabel}
                    </span>
                    <span className="text-body-small text-on-surface-variant">
                      credits
                    </span>
                  </div>
                  <span className="text-label-small text-on-surface-variant">
                    ${pricePerCredit} per credit
                  </span>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <span className="text-title-medium font-semibold">
                    {opt.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card.Content>

      <Card.Footer className="flex items-center justify-between gap-4">
        <div className="text-body-small text-on-surface-variant">
          {selectedOption && (
            <span>
              You&apos;ll receive{" "}
              <span className="font-medium text-on-surface">
                {selectedOption.credits.toLocaleString()} credits
              </span>{" "}
              for{" "}
              <span className="font-medium text-on-surface">
                {selectedOption.label}
              </span>
            </span>
          )}
        </div>
        <Button
          className="gap-2 shrink-0"
          disabled={!canCreateTopup}
          onClick={onCreateTopup}
        >
          <Icon symbol="shopping_cart" size="sm" />
          Purchase
        </Button>
      </Card.Footer>
    </Card>
  );
}
