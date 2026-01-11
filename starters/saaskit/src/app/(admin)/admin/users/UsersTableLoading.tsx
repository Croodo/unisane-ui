"use client";

import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";

// Minimal placeholder columns that match the structure of UsersTable
const columns: Column<{ id: string }>[] = [
  { key: "email", header: "Email", width: 260 },
  { key: "displayName", header: "Name", width: 200 },
  { key: "role", header: "Role", width: 120 },
  { key: "links", header: "Links", width: 140 },
];

export function UsersTableLoading() {
  return (
    <DataTable
      data={[]}
      columns={columns}
      loading
      loadingVariant="skeleton"
      skeletonRowCount={10}
      title="Users"
      features={{ search: true }}
      styling={{ columnDividers: true }}
    />
  );
}
