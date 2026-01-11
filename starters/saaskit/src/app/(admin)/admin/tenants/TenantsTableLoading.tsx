"use client";

import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";

// Minimal placeholder columns that match the structure of TenantsTable
const columns: Column<{ id: string }>[] = [
  { key: "name", header: "Workspace", width: 240 },
  { key: "planId", header: "Plan", width: 120 },
  { key: "subscription.status", header: "Sub Status", width: 130 },
  { key: "membersCount", header: "Members", width: 110 },
  { key: "creditsAvailable", header: "Credits", width: 110 },
  { key: "lastActivityAt", header: "Last Activity", width: 150 },
  { key: "links", header: "Links", width: 140 },
];

export function TenantsTableLoading() {
  return (
    <DataTable
      data={[]}
      columns={columns}
      loading
      loadingVariant="skeleton"
      skeletonRowCount={10}
      title="Tenants"
      features={{ search: true }}
      styling={{ columnDividers: true }}
    />
  );
}
