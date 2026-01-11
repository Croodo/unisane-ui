import { hooks } from "@/src/sdk/hooks";
import { Card } from "@unisane/ui/components/card";
import { Icon } from "@unisane/ui/primitives/icon";
import { cn } from "@unisane/ui/lib/utils";

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

  // Determine credit status for visual feedback
  const isLow = amount > 0 && amount < 100;
  const isEmpty = amount === 0;

  return (
    <Card className="h-full flex flex-col">
      <Card.Header>
        <Card.Title>Credit Balance</Card.Title>
        <Card.Description>
          Your available credits for platform features
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon symbol="progress_activity" size="sm" className="animate-spin" />
            <span className="text-body-medium">Loading credits…</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 text-on-surface-variant">
            <Icon symbol="error" size="md" className="text-error" />
            <span className="text-body-medium">
              Could not load credits. Please try again later.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-full",
                  isEmpty
                    ? "bg-error-container"
                    : isLow
                      ? "bg-warning-container"
                      : "bg-primary-container"
                )}
              >
                <Icon
                  symbol="monetization_on"
                  size="lg"
                  className={cn(
                    isEmpty
                      ? "text-on-error-container"
                      : isLow
                        ? "text-on-warning-container"
                        : "text-on-primary-container"
                  )}
                />
              </div>
              <div>
                <div className="text-display-small font-semibold tabular-nums">
                  {formatted}
                </div>
                <p className="text-body-medium text-on-surface-variant">
                  credits available
                </p>
              </div>
            </div>
            {isEmpty && (
              <p className="text-body-small text-error">
                Your credit balance is empty. Top up to continue using features.
              </p>
            )}
            {isLow && !isEmpty && (
              <p className="text-body-small text-warning">
                Running low on credits. Consider topping up soon.
              </p>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
