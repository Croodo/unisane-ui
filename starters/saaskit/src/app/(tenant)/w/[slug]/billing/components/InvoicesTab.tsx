"use client";

import { useMemo } from "react";
import { hooks } from "@/src/sdk/hooks";
import type { BillingListInvoicesItem } from "@/src/sdk/types";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { formatCurrency } from "@unisane/kernel/client";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { Typography } from "@unisane/ui/components/typography";

interface InvoicesTabProps {
  tenantId?: string | undefined;
}

export function InvoicesTab({ tenantId }: InvoicesTabProps) {
  const list = hooks.billing.listInvoices(
    tenantId ? { params: { tenantId }, query: { limit: 50 } } : undefined,
    { enabled: Boolean(tenantId) }
  );
  const items = (list.data ?? []) as BillingListInvoicesItem[];

  const columns = useMemo<Column<BillingListInvoicesItem>[]>(
    () => [
      {
        key: "id",
        header: "Invoice",
        width: 200,
        render: (row) => (
          <span className="font-mono text-sm">{row.id}</span>
        ),
      },
      {
        key: "amountDue",
        header: "Amount",
        width: 140,
        align: "end",
        render: (row) =>
          typeof row.amountDue === "number" ? (
            <span className="font-medium tabular-nums">
              {formatCurrency(row.amountDue)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "status",
        header: "Status",
        width: 120,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "createdAt",
        header: "Issued",
        width: 140,
        render: (row) =>
          row.createdAt
            ? new Date(row.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—",
      },
    ],
    []
  );

  return (
    <section className="space-y-6">
      <div>
        <Typography variant="titleLarge">Invoices</Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          View and download invoices for your subscription and purchases
        </Typography>
      </div>
      <DataTable<BillingListInvoicesItem>
        data={items}
        columns={columns}
        loading={list.isLoading && !list.data}
        tableId="tenant-invoices"
      />
    </section>
  );
}
