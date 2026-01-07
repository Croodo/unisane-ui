"use client";

import { useMemo } from "react";
import { DataTable } from "@/src/components/datatable/DataTable";
import type { Column } from "@/src/components/datatable/types";
import { hooks } from "@/src/sdk/hooks";
import type { CreditsLedgerItem } from "@/src/sdk/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total credits</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">From subscription</CardTitle>
          <CardDescription>
            Credits granted with your plan each billing period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="text-2xl font-semibold tabular-nums">
              {subAvailable.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">From top‑ups</CardTitle>
          <CardDescription>
            Additional credits you&apos;ve purchased.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="text-2xl font-semibold tabular-nums">
              {topupAvailable.toLocaleString()}
            </div>
          )}
        </CardContent>
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
        align: "right",
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
        isLoading={ledgerQuery.isLoading && !ledgerQuery.data}
        onRefresh={() => ledgerQuery.refetch?.()}
        tableId="tenant-credits-ledger"
      />
    </div>
  );
}
