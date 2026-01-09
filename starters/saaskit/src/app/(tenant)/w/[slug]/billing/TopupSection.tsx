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
  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="flex items-center gap-2 text-lg">
          <Icon symbol="add_circle" size="sm" className="text-primary" />
          <span>Top up credits</span>
        </Card.Title>
        <Card.Description>
          Pay once to add more credits to this workspace.
        </Card.Description>
      </Card.Header>
      <Card.Content className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;
          const creditsLabel = opt.credits.toLocaleString();
          return (
            <button
              key={opt.id}
              type="button"
              className={cn(
                "relative flex w-full cursor-pointer items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/60"
              )}
              onClick={() => onSelect(opt.id)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-on-surface-variant"
                  )}
                >
                  {isSelected && <Icon symbol="check" size="xs" />}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {creditsLabel} credits
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {opt.label} one-time
                  </span>
                </div>
              </div>
              <span className="font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </Card.Content>
      <Card.Footer className="pt-2 justify-end">
        <Button
          className="inline-flex items-center gap-2"
          disabled={!canCreateTopup}
          onClick={onCreateTopup}
        >
          <Icon symbol="credit_card" size="sm" />
          Purchase credits
        </Button>
      </Card.Footer>
    </Card>
  );
}
