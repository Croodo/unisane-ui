import { hooks } from "@/src/sdk/hooks";
import { Card } from "@unisane/ui/components/card";
import { Icon } from "@unisane/ui/primitives/icon";

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
      <Card.Header className="space-y-1.5">
        <Card.Title className="flex items-center gap-2 text-lg">
          <Icon symbol="monetization_on" size="sm" className="text-primary" />
          <span>Credits</span>
        </Card.Title>
        <Card.Description>{modeCopy}</Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <p className="text-sm text-on-surface-variant">Loading credits…</p>
        ) : isError ? (
          <p className="text-sm text-on-surface-variant">
            We couldn&apos;t load your credits right now. Please refresh the
            page or try again later.
          </p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              {formatted}
            </span>
            <span className="text-sm text-on-surface-variant">credits available</span>
          </div>
        )}
      </Card.Content>
      <Card.Footer className="pt-2">
        <p className="text-xs text-on-surface-variant">
          Need more credits? Use the top-up options below.
        </p>
      </Card.Footer>
    </Card>
  );
}
