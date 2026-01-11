"use client";
import { useMemo } from "react";
import Link from "next/link";
import type { AdminUsersListItem } from "@/src/sdk/types";
import { DataTable } from "@unisane/data-table";
import type { Column, BulkAction } from "@unisane/data-table";
import { PageLayout } from "@/src/context/usePageLayout";
import { useServerTable } from "@/src/hooks/useServerTable";

interface UsersTableProps {
  data: AdminUsersListItem[];
  nextCursor?: string | undefined;
  prevCursor?: string | undefined;
  stats?:
    | {
        total: number;
        facets?: { globalRole?: Record<string, number> };
      }
    | undefined;
  // Current state from URL
  currentSort: string;
  currentSearch: string;
  currentLimit: number;
  currentPage: number;
}

export default function UsersTable({
  data,
  nextCursor,
  prevCursor,
  stats,
  currentSort,
  currentSearch,
  currentLimit,
  currentPage,
}: UsersTableProps) {
  // ─── TABLE STATE (URL-based) ──────────────────────────────────────────────
  const { dataTableProps } = useServerTable({
    currentSort,
    currentSearch,
    currentLimit,
    currentPage,
    nextCursor,
    prevCursor,
  });

  // ─── COLUMN DEFINITIONS ────────────────────────────────────────────────────
  const columns = useMemo<Column<AdminUsersListItem>[]>(
    () => [
      {
        key: "email",
        header: "Email",
        width: 260,
        sortable: true,
        filterable: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium break-all">{row.email}</span>
            <span className="text-label-small text-on-surface-variant">{row.id}</span>
          </div>
        ),
      },
      {
        key: "displayName",
        header: "Name",
        width: 200,
        sortable: true,
        filterable: true,
        render: (row) => row.displayName ?? "—",
      },
      {
        key: "role",
        header: "Role",
        width: 120,
        sortable: true,
        render: (row) => row.role ?? "—",
      },
      {
        key: "links",
        header: "Links",
        width: 140,
        pinned: "right",
        render: (row) => (
          <div className="flex gap-3 justify-end text-body-medium">
            <Link
              className="text-primary hover:underline"
              href={`/admin/users/${row.id}`}
            >
              Details
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: "Export view",
        onClick: () => {
          window.open("/api/rest/v1/admin/users/export", "_blank");
        },
        icon: <span className="text-primary text-xs font-medium">CSV</span>,
      },
    ],
    []
  );

  return (
    <>
      <PageLayout subtitle="Latest users across the platform" />
      <DataTable<AdminUsersListItem>
        data={data}
        columns={columns}
        title="Users"
        tableId="admin-users-ga"
        features={{ search: true }}
        styling={{ columnDividers: true }}
        bulkActions={bulkActions}
        // Server-side table state from URL
        mode={dataTableProps.mode}
        paginationMode={dataTableProps.paginationMode}
        disableLocalProcessing={dataTableProps.disableLocalProcessing}
        searchValue={dataTableProps.searchValue}
        onSearchChange={dataTableProps.onSearchChange}
        sortKey={dataTableProps.sortKey}
        sortDirection={dataTableProps.sortDirection}
        onSortChange={dataTableProps.onSortChange}
        cursorPagination={dataTableProps.cursorPagination}
        refreshing={dataTableProps.refreshing}
        // Stats API now returns filtered count when filtering is applied
        {...(stats?.total !== undefined ? { totalCount: stats.total } : {})}
      />
    </>
  );
}
