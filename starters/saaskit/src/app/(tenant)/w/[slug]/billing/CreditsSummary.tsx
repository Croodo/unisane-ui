import { hooks } from "@/src/sdk/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Coins } from "lucide-react";

interface CreditsSummaryProps {
  billingMode: string;
  tenantId: string;
}

export function CreditsSummary({ billingMode, tenantId }: CreditsSummaryProps) {
  const { data, isLoading, isError } = hooks.credits.balance({
    params: { tenantId },
  });
  const amount = (data?.amount as number | undefined) ?? 0;
  const formatted = amount.toLocaleString();

  const modeCopy =
    billingMode === "topup_only"
      ? "Add more credits whenever you need them. You only pay when you top up."
      : "Your plan includes credits each period. You can add extra credits if you need more.";

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1.5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="size-5 text-primary" />
          <span>Credits</span>
        </CardTitle>
        <CardDescription>{modeCopy}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading credits…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your credits right now. Please refresh the
            page or try again later.
          </p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              {formatted}
            </span>
            <span className="text-sm text-muted-foreground">credits available</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <p className="text-xs text-muted-foreground">
          Need more credits? Use the top-up options below.
        </p>
      </CardFooter>
    </Card>
  );
}
