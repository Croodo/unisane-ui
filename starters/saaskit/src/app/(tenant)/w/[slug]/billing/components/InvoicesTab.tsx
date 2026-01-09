"use client";

import { useMemo } from "react";
import { hooks } from "@/src/sdk/hooks";
import type { BillingListInvoicesItem } from "@/src/sdk/types";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { formatCurrency } from "@/src/shared/currency";
import { StatusBadge } from "@/src/components/ui/status-badge";

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
      { key: "id", header: "Invoice", width: 160, render: (row) => row.id },
      {
        key: "amountDue",
        header: "Amount",
        width: 140,
        render: (row) =>
          typeof row.amountDue === "number"
            ? formatCurrency(row.amountDue)
            : "—",
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
        width: 180,
        render: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
    ],
    []
  );

  return (
    <DataTable<BillingListInvoicesItem>
      data={items}
      columns={columns}
      title="Invoices"
      loading={list.isLoading && !list.data}
      tableId="tenant-invoices"
    />
  );
}
