"use client";

import { useMemo, useState, useCallback } from "react";
import { hooks } from "@/src/sdk/hooks";
import type { BillingListPaymentsItem } from "@/src/sdk/types";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { normalizeError } from "@/src/sdk/errors";
import { Button } from "@unisane/ui/components/button";
import { Dialog } from "@unisane/ui/components/dialog";
import { Input } from "@unisane/ui/primitives/input";
import { Label } from "@unisane/ui/primitives/label";
import { toast } from "@unisane/ui/components/toast";
import { formatCurrency } from "@unisane/kernel/client";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { Typography } from "@unisane/ui/components/typography";

interface PaymentsTabProps {
  tenantId?: string | undefined;
}

export function PaymentsTab({ tenantId }: PaymentsTabProps) {
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const list = hooks.billing.listPayments(
    tenantId ? { params: { tenantId }, query: { limit: 50 } } : undefined,
    { enabled: Boolean(tenantId) }
  );

  const refund = hooks.billing.refund({
    onSuccess: () => {
      toast.success("Refund queued");
      void list.refetch();
      setRefundOpen(false);
      setRefundAmount("");
      setRefundPaymentId("");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Refund failed", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const items = (list.data ?? []) as BillingListPaymentsItem[];

  const handleRefundClick = useCallback((rowId: string) => {
    setRefundPaymentId(rowId);
    setRefundAmount("");
    setRefundOpen(true);
  }, []);

  const columns = useMemo<Column<BillingListPaymentsItem>[]>(
    () => [
      {
        key: "id",
        header: "Payment",
        width: 200,
        render: (row) => (
          <span className="font-mono text-sm">{row.id}</span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        width: 140,
        align: "end",
        render: (row) =>
          typeof row.amount === "number" ? (
            <span className="font-medium tabular-nums">
              {formatCurrency(row.amount)}
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
        header: "Date",
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
      {
        key: "actions",
        header: "",
        width: 100,
        align: "end",
        render: (row) => (
          <Button
            size="sm"
            variant="text"
            disabled={
              !tenantId || refund.isPending || row.status !== "succeeded"
            }
            onClick={() => {
              if (!tenantId) return;
              handleRefundClick(row.id);
            }}
          >
            Refund
          </Button>
        ),
      },
    ],
    [refund.isPending, tenantId, handleRefundClick]
  );

  return (
    <section className="space-y-6">
      <div>
        <Typography variant="titleLarge">Payments</Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          View all payments and request refunds if needed
        </Typography>
      </div>
      <DataTable<BillingListPaymentsItem>
        data={items}
        columns={columns}
        loading={list.isLoading && !list.data}
        tableId="tenant-payments"
      />

      <Dialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Refund payment"
        actions={
          <>
            <Button variant="text" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!tenantId || refund.isPending}
              onClick={() => {
                if (!tenantId || !refundPaymentId) return;
                const amt = refundAmount.trim().length
                  ? Number(refundAmount)
                  : undefined;
                if (amt !== undefined && Number.isNaN(amt)) {
                  toast.error("Invalid amount");
                  return;
                }
                refund.mutate({
                  params: { tenantId },
                  body: {
                    providerPaymentId: refundPaymentId,
                    ...(typeof amt === "number" ? { amount: amt } : {}),
                  },
                });
              }}
            >
              {refund.isPending ? "Submitting…" : "Submit refund"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-on-surface-variant">
            Payment ID: {refundPaymentId}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (optional)</Label>
            <Input
              id="amt"
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Leave blank for full refund"
            />
          </div>
        </div>
      </Dialog>
    </section>
  );
}
