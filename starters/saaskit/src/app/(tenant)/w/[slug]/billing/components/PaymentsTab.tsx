"use client";

import { useMemo, useState, useCallback } from "react";
import { hooks } from "@/src/sdk/hooks";
import type { BillingListPaymentsItem } from "@/src/sdk/types";
import { DataTable } from "@/src/components/datatable/DataTable";
import type { Column } from "@/src/components/datatable/types";
import { normalizeError } from "@/src/sdk/errors";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/src/shared/currency";
import { StatusBadge } from "@/src/components/ui/status-badge";

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
      { key: "id", header: "Payment", render: (row) => row.id },
      {
        key: "amount",
        header: "Amount",
        render: (row) =>
          typeof row.amount === "number" ? formatCurrency(row.amount) : "—",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => (
          <Button
            size="sm"
            variant="outline"
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
    <>
      <DataTable<BillingListPaymentsItem>
        data={items}
        columns={columns}
        title="Payments"
        isLoading={list.isLoading && !list.data}
        onRefresh={() => void list.refetch()}
        tableId="tenant-payments"
      />

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
