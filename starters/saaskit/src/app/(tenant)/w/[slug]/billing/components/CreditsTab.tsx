"use client";

import { useMemo } from "react";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { hooks } from "@/src/sdk/hooks";
import type { CreditsLedgerItem } from "@/src/sdk/types";
import { Card } from "@unisane/ui/components/card";

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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <Card.Header className="pb-2">
          <Card.Title className="text-base">Total credits</Card.Title>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">Could not load</p>
          ) : (
            <div className="text-2xl font-semibold tabular-nums">
              {totalAvailable.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                available
              </span>
            </div>
          )}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header className="pb-2">
          <Card.Title className="text-base">From subscription</Card.Title>
          <Card.Description>
            Credits granted with your plan each billing period.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="text-2xl font-semibold tabular-nums">
              {subAvailable.toLocaleString()}
            </div>
          )}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header className="pb-2">
          <Card.Title className="text-base">From top‑ups</Card.Title>
          <Card.Description>
            Additional credits you&apos;ve purchased.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="text-2xl font-semibold tabular-nums">
              {topupAvailable.toLocaleString()}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
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
      { key: "kind", header: "Kind", width: 120, render: (row) => row.kind },
      {
        key: "amount",
        header: "Amount",
        render: (row) => row.amount.toLocaleString(),
        align: "end",
        width: 120,
      },
      { key: "reason", header: "Reason", render: (row) => row.reason },
      {
        key: "feature",
        header: "Feature",
        render: (row) => row.feature ?? "—",
        width: 140,
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) => new Date(row.createdAt).toLocaleString(),
        width: 200,
      },
      {
        key: "expiresAt",
        header: "Expires",
        render: (row) =>
          row.expiresAt ? new Date(row.expiresAt).toLocaleString() : "—",
        width: 200,
      },
    ],
    []
  );

  const ledgerData =
    (ledgerQuery.data as { items?: CreditsLedgerItem[] } | undefined)?.items ??
    [];

  return (
    <div className="space-y-6">
      <CreditsSummaryCards tenantId={tenantId} />
      <DataTable<CreditsLedgerItem>
        data={ledgerData}
        columns={cols}
        title="Credits ledger"
        loading={ledgerQuery.isLoading && !ledgerQuery.data}
        tableId="tenant-credits-ledger"
      />
    </div>
  );
}
