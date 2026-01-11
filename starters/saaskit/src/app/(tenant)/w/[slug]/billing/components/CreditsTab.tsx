"use client";

import { useMemo } from "react";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { hooks } from "@/src/sdk/hooks";
import type { CreditsLedgerItem } from "@/src/sdk/types";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";
import { Typography } from "@unisane/ui/components/typography";
import { Icon } from "@unisane/ui/primitives/icon";

interface CreditsTabProps {
  tenantId?: string | undefined;
}

function CreditsSummaryCards({ tenantId }: { tenantId?: string | undefined }) {
  const enabled = Boolean(tenantId);
  const { data, isLoading, isError } = hooks.credits.breakdown(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled, refetchOnWindowFocus: false }
  );

  const totalAvailable =
    (data as { total?: { available?: number } } | undefined)?.total
      ?.available ?? 0;
  const subAvailable =
    (data as { subscription?: { available?: number } } | undefined)
      ?.subscription?.available ?? 0;
  const topupAvailable =
    (data as { topup?: { available?: number } } | undefined)?.topup
      ?.available ?? 0;

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant rounded-lg border border-outline-variant p-4">
        <Icon symbol="error" size="sm" className="text-error" />
        <Typography variant="bodyMedium">
          Could not load credits breakdown. Please try again later.
        </Typography>
      </div>
    );
  }

  const statsItems: StatItem[] = [
    {
      label: "Total Credits",
      value: totalAvailable,
      icon: "account_balance_wallet",
    },
    {
      label: "From Subscription",
      value: subAvailable,
      icon: "credit_card",
    },
    {
      label: "From Top-ups",
      value: topupAvailable,
      icon: "add_circle",
    },
  ];

  return <StatsCards items={statsItems} columns={3} isLoading={isLoading} />;
}

export function CreditsTab({ tenantId }: CreditsTabProps) {
  const enabled = Boolean(tenantId);

  const ledgerQuery = hooks.credits.ledger(
    tenantId ? { params: { tenantId } } : undefined,
    {
      enabled,
      placeholderData: { items: [] },
      refetchOnWindowFocus: false,
    } as unknown as {
      enabled: boolean;
      placeholderData: { items: CreditsLedgerItem[] };
      refetchOnWindowFocus: boolean;
    }
  );

  const cols = useMemo<Column<CreditsLedgerItem>[]>(
    () => [
      {
        key: "kind",
        header: "Type",
        width: 130,
        render: (row) => {
          // CreditKind is 'grant' | 'burn'
          const icon = row.kind === "grant" ? "add_circle" : "remove_circle";
          return (
            <div className="flex items-center gap-2">
              <Icon
                symbol={icon}
                size="sm"
                className={row.amount >= 0 ? "text-primary" : "text-error"}
              />
              <span className="capitalize">{row.kind}</span>
            </div>
          );
        },
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => (
          <span
            className={`font-medium tabular-nums ${
              row.amount >= 0 ? "text-primary" : "text-error"
            }`}
          >
            {row.amount >= 0 ? "+" : ""}
            {row.amount.toLocaleString()}
          </span>
        ),
        align: "end",
        width: 100,
      },
      {
        key: "reason",
        header: "Description",
        render: (row) => (
          <span className="text-on-surface-variant">{row.reason || "—"}</span>
        ),
      },
      {
        key: "feature",
        header: "Feature",
        render: (row) =>
          row.feature ? (
            <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium">
              {row.feature}
            </span>
          ) : (
            "—"
          ),
        width: 120,
      },
      {
        key: "createdAt",
        header: "Date",
        render: (row) =>
          new Date(row.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        width: 120,
      },
      {
        key: "expiresAt",
        header: "Expires",
        render: (row) =>
          row.expiresAt ? (
            <span className="text-on-surface-variant">
              {new Date(row.expiresAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          ) : (
            <span className="text-on-surface-variant">Never</span>
          ),
        width: 100,
      },
    ],
    []
  );

  const ledgerData =
    (ledgerQuery.data as { items?: CreditsLedgerItem[] } | undefined)?.items ??
    [];

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <Typography variant="titleLarge">Credits</Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          Track your credit balance, usage, and transaction history
        </Typography>
      </div>

      {/* Summary Cards */}
      <CreditsSummaryCards tenantId={tenantId} />

      {/* Ledger Table */}
      <div>
        <Typography variant="titleMedium" className="mb-4">
          Transaction History
        </Typography>
        <DataTable<CreditsLedgerItem>
          data={ledgerData}
          columns={cols}
          loading={ledgerQuery.isLoading && !ledgerQuery.data}
          tableId="tenant-credits-ledger"
        />
      </div>
    </section>
  );
}
