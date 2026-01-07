import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, CreditCard, PlusCircle } from "lucide-react";

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlusCircle className="size-5 text-primary" />
          <span>Top up credits</span>
        </CardTitle>
        <CardDescription>
          Pay once to add more credits to this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
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
                      : "border-muted-foreground"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {creditsLabel} credits
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.label} one-time
                  </span>
                </div>
              </div>
              <span className="font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </CardContent>
      <CardFooter className="pt-2 justify-end">
        <Button
          className="inline-flex items-center gap-2"
          disabled={!canCreateTopup}
          onClick={onCreateTopup}
        >
          <CreditCard className="h-4 w-4" />
          Purchase credits
        </Button>
      </CardFooter>
    </Card>
  );
}
