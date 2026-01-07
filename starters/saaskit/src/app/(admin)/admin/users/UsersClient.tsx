"use client";
import { useMemo } from "react";
import Link from "next/link";
import type {
  UsersAdminListResponse as AdminUsersList,
  AdminUsersListItem,
} from "@/src/sdk/types";
import { hooks } from "@/src/sdk/hooks";
import { DataTable, useRemoteDataTable } from "@/src/components/datatable";
import type { Column, BulkAction } from "@/src/components/datatable/types";
import { PageHeader } from "@/src/context/usePageHeader";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";
import { Users, ShieldAlert, UserCheck } from "lucide-react";

export default function UsersClient({
  initial,
  sort,
  limit = 25,
  initialFilters = {},
}: {
  initial: AdminUsersList;
  sort?: string;
  limit?: number;
  initialFilters?: Record<string, unknown>;
}) {
  // SDK hooks
  const params = hooks.users.admin.useListParams({
    defaults: { sort: sort ?? "-updatedAt", limit },
    initialFilters,
  });

  const query = hooks.users.admin.list(params.queryArgs, {
    placeholderData: initial as AdminUsersList,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    keepPreviousData: true,
  } as Record<string, unknown>);

  const statsQuery = hooks.users.admin.stats(
    { filters: params.queryArgs.filters },
    { refetchOnWindowFocus: false, staleTime: 60_000 }
  );

  // Remote DataTable props - converts params + query to DataTable props
  const remoteProps = useRemoteDataTable<AdminUsersListItem>({
    params,
    query: query as {
      data?: {
        items?: AdminUsersListItem[];
        nextCursor?: string;
        prevCursor?: string;
      };
      isLoading: boolean;
      isFetching: boolean;
      refetch?: () => Promise<unknown>;
    },
    statsQuery: statsQuery as { data?: { total?: number }; isLoading: boolean },
    initialData: initial,
  });

  // Column definitions
  const columns = useMemo<Column<AdminUsersListItem>[]>(
    () => [
      {
        key: "email",
        header: "Email",
        width: 260,
        sortable: true,
        filterable: true,
        pinned: "left",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-primary hover:underline break-all">
              {row.email}
            </span>
            <span className="text-xs text-muted-foreground">{row.id}</span>
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
          <div className="flex gap-3 justify-end text-sm">
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
        onClick: () => window.open("/api/rest/v1/admin/users/export", "_blank"),
        icon: <span className="text-primary text-xs font-medium">CSV</span>,
      },
    ],
    []
  );

  // Stats display
  const statsItems: StatItem[] = useMemo(() => {
    const data = statsQuery.data as
      | { total?: number; facets?: { globalRole?: Record<string, number> } }
      | undefined;
    const total = data?.total ?? 0;
    const superAdmins = data?.facets?.globalRole?.["super-admin"] ?? 0;
    const standardUsers = data?.facets?.globalRole?.["user"] ?? 0;

    return [
      { label: "Total Users", value: total, icon: Users },
      { label: "Super Admins", value: superAdmins, icon: ShieldAlert },
      { label: "Standard Users", value: standardUsers, icon: UserCheck },
    ];
  }, [statsQuery.data]);

  return (
    <>
      <PageHeader title="Users" subtitle="Latest users across the platform" />
      <div className="mt-4">
        <StatsCards
          items={statsItems}
          isLoading={statsQuery.isLoading}
          columns={3}
        />
        {/* 
          Before: 23 props
          After: spread + 5 props (columns, title, tableId, searchable, bulkActions)
        */}
        <DataTable<AdminUsersListItem>
          {...remoteProps}
          columns={columns}
          title="Users"
          tableId="admin-users-ga"
          searchable
          bulkActions={bulkActions}
        />
      </div>
    </>
  );
}
