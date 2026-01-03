"use client";

import React from "react";
import type { Column, RowContextMenuItemOrSeparator } from "@unisane/data-table";
import { ActionsCell } from "@unisane/data-table";
import { Badge, Tooltip, Icon } from "@unisane/ui";
import type { Transaction, TransactionCategory, TransactionStatus } from "./types";

// ─── STATUS BADGE COLORS ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<TransactionStatus, "success" | "tertiary" | "error" | "secondary"> = {
  completed: "success",
  pending: "tertiary",
  failed: "error",
  refunded: "secondary",
};

// ─── AMOUNT FORMATTER ────────────────────────────────────────────────────────

const formatAmount = (amount: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(amount);
  return formatted;
};

// ─── COLUMNS ─────────────────────────────────────────────────────────────────

export const transactionColumns: Column<Transaction>[] = [
  {
    key: "date",
    header: "Date",
    width: 110,
    sortable: true,
    filterable: true,
    filterType: "date",
    editable: true,
    inputType: "date",
    render: (row) => (
      <span className="text-on-surface-variant tabular-nums">
        {new Date(row.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    key: "reference",
    header: "Reference",
    width: 120,
    sortable: true,
    filterable: true,
    render: (row) => (
      <code className="text-label-small bg-surface-container-low px-1.5 py-0.5 rounded">
        {row.reference}
      </code>
    ),
  },
  {
    key: "description",
    header: "Description",
    width: 220,
    sortable: true,
    filterable: true,
    editable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="truncate">{row.description}</span>
        {row.notes && (
          <Tooltip label={row.notes} side="bottom">
            <Icon symbol="flag" className="w-4 h-4 text-tertiary" />
          </Tooltip>
        )}
      </div>
    ),
  },
  {
    key: "category",
    header: "Category",
    width: 130,
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "Revenue", label: "Revenue" },
      { value: "Operations", label: "Operations" },
      { value: "Technology", label: "Technology" },
      { value: "Services", label: "Services" },
      { value: "Marketing", label: "Marketing" },
      { value: "Travel", label: "Travel" },
      { value: "Insurance", label: "Insurance" },
      { value: "Assets", label: "Assets" },
      { value: "Payroll", label: "Payroll" },
      { value: "Utilities", label: "Utilities" },
    ],
    editable: true,
    render: (row) => {
      const isRevenue = row.category === "Revenue";
      return (
        <Badge variant="tonal" color={isRevenue ? "success" : "secondary"}>
          {row.category}
        </Badge>
      );
    },
  },
  {
    key: "amount",
    header: "Amount",
    width: 130,
    align: "end",
    sortable: true,
    filterable: true,
    filterType: "number",
    editable: true,
    inputType: "number",
    summary: "sum",
    render: (row) => {
      const isPositive = row.amount >= 0;
      return (
        <span
          className={`font-medium tabular-nums ${
            isPositive ? "text-success" : "text-error"
          }`}
        >
          {formatAmount(row.amount)}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    width: 110,
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "completed", label: "Completed" },
      { value: "pending", label: "Pending" },
      { value: "failed", label: "Failed" },
      { value: "refunded", label: "Refunded" },
    ],
    render: (row) => (
      <Badge variant="tonal" color={STATUS_COLORS[row.status]}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  {
    key: "account",
    header: "Account",
    width: 150,
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "Business Checking", label: "Business Checking" },
      { value: "Business Credit", label: "Business Credit" },
      { value: "Savings Account", label: "Savings Account" },
      { value: "Petty Cash", label: "Petty Cash" },
      { value: "PayPal Business", label: "PayPal Business" },
    ],
    editable: true,
  },
];

// ─── ACTIONS COLUMN ──────────────────────────────────────────────────────────

export function createTransactionActionsColumn(
  onEdit: (txn: Transaction) => void,
  onDuplicate: (txn: Transaction) => void,
  onRefund: (txn: Transaction) => void,
  onDelete: (txn: Transaction) => void
): Column<Transaction> {
  return {
    key: "__actions",
    header: "",
    width: 48,
    align: "center",
    pinnable: false,
    sortable: false,
    filterable: false,
    render: (row) => (
      <ActionsCell
        row={row}
        items={[
          {
            key: "edit",
            label: "Edit Transaction",
            icon: "edit",
            onClick: () => onEdit(row),
          },
          {
            key: "duplicate",
            label: "Duplicate",
            icon: "content_copy",
            onClick: () => onDuplicate(row),
          },
          { type: "separator" },
          {
            key: "refund",
            label: "Mark as Refunded",
            icon: "undo",
            onClick: () => onRefund(row),
            disabled: row.status === "refunded",
          },
          { type: "separator" },
          {
            key: "delete",
            label: "Delete",
            icon: "delete",
            variant: "danger",
            onClick: () => onDelete(row),
          },
        ]}
      />
    ),
  };
}

// ─── CONTEXT MENU ITEMS ──────────────────────────────────────────────────────

export function createTransactionActionItems(
  onEdit: (txn: Transaction) => void,
  onDuplicate: (txn: Transaction) => void,
  onRefund: (txn: Transaction) => void,
  onDelete: (txn: Transaction) => void
): RowContextMenuItemOrSeparator<Transaction>[] {
  return [
    {
      key: "view",
      label: "View Details",
      icon: "visibility",
      onClick: (row) => onEdit(row),
    },
    {
      key: "edit",
      label: "Edit Transaction",
      icon: "edit",
      onClick: (row) => onEdit(row),
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: "content_copy",
      onClick: (row) => onDuplicate(row),
    },
    { type: "separator" },
    {
      key: "refund",
      label: "Mark as Refunded",
      icon: "undo",
      onClick: (row) => onRefund(row),
      disabled: (row) => row.status === "refunded",
    },
    { type: "separator" },
    {
      key: "delete",
      label: "Delete",
      icon: "delete",
      variant: "danger",
      onClick: (row) => onDelete(row),
    },
  ];
}
