"use client";

import React from "react";
import { Badge, Typography } from "@unisane/ui";
import type { Transaction } from "./types";

interface TransactionExpandedRowProps {
  row: Transaction;
}

export function TransactionExpandedRow({ row }: TransactionExpandedRowProps) {
  const isPositive = row.amount >= 0;

  return (
    <div className="p-4 bg-surface-container-lowest rounded-lg">
      <Typography variant="titleSmall" className="mb-3 text-on-surface">
        Transaction Details
      </Typography>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Reference
          </Typography>
          <code className="text-body-medium bg-surface-container-low px-2 py-1 rounded block mt-1">
            {row.reference}
          </code>
        </div>
        <div>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Amount
          </Typography>
          <Typography
            variant="bodyMedium"
            className={`font-medium mt-1 ${isPositive ? "text-success" : "text-error"}`}
          >
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              signDisplay: "always",
            }).format(row.amount)}
          </Typography>
        </div>
        <div>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Status
          </Typography>
          <div className="mt-1">
            <Badge
              variant="tonal"
              color={
                row.status === "completed"
                  ? "success"
                  : row.status === "pending"
                    ? "tertiary"
                    : row.status === "failed"
                      ? "error"
                      : "secondary"
              }
            >
              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Account
          </Typography>
          <Typography variant="bodyMedium" className="text-on-surface mt-1">
            {row.account}
          </Typography>
        </div>
      </div>

      {row.notes && (
        <div className="mt-4 p-3 bg-tertiary/10 rounded-lg border border-tertiary/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-tertiary">flag</span>
            <Typography variant="labelMedium" className="text-tertiary">
              Notes
            </Typography>
          </div>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
            {row.notes}
          </Typography>
        </div>
      )}
    </div>
  );
}
