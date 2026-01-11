"use client";
import { useMemo } from "react";
import Link from "next/link";
import { DataTable } from "@unisane/data-table";
import type { Column, BulkAction } from "@unisane/data-table";
import type { TenantsAdminListItem } from "@/src/sdk/types";
import { PageLayout } from "@/src/context/usePageLayout";
import {
  StatusBadge,
  PlanBadge,
  CountBadge,
} from "@/src/components/ui/status-badge";
import { useServerTable } from "@/src/hooks/useServerTable";

interface TenantsTableProps {
  data: TenantsAdminListItem[];
  nextCursor?: string | undefined;
  prevCursor?: string | undefined;
  stats?:
    | {
        total?: number;
        facets?: { planId?: Record<string, number> };
      }
    | undefined;
  // Current state from URL
  currentSort: string;
  currentSearch: string;
  currentLimit: number;
  currentPage: number;
}

export default function TenantsTable({
  data,
  nextCursor,
  prevCursor,
  stats,
  currentSort,
  currentSearch,
  currentLimit,
  currentPage,
}: TenantsTableProps) {
  // ─── TABLE STATE (URL-based) ──────────────────────────────────────────────
  const { dataTableProps } = useServerTable({
    currentSort,
    currentSearch,
    currentLimit,
    currentPage,
    nextCursor,
    prevCursor,
  });

  // Filter options from data
  const planOptions = useMemo(
    () =>
      Array.from(new Set(data.map((d) => d.planId ?? "free"))).map((p) => ({
        label: String(p).charAt(0).toUpperCase() + String(p).slice(1),
        value: p ?? "free",
      })),
    [data]
  );

  const statusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        data
          .map((d) => d.subscription?.status)
          .filter(
            (
              x
            ): x is NonNullable<
              TenantsAdminListItem["subscription"]
            >["status"] => Boolean(x)
          )
      )
    );
    return statuses.map((s) => ({ label: s ?? "", value: s ?? "" }));
  }, [data]);

  // ─── COLUMN DEFINITIONS ────────────────────────────────────────────────────
  const columns = useMemo<Column<TenantsAdminListItem>[]>(
    () => [
      {
        key: "name",
        header: "Workspace",
        width: 240,
        sortable: true,
        filterable: true,
        pinned: "left",
        type: "text",
        summary: () => (
          <span className="font-semibold text-on-surface">Total</span>
        ),
        render: (row) => (
          <div className="flex flex-col">
            <Link
              className="font-medium text-primary hover:underline"
              href={`/w/${row.slug as string}/dashboard`}
            >
              {row.name}
            </Link>
            <span className="text-label-small text-on-surface-variant font-mono">
              /{row.slug}
            </span>
          </div>
        ),
      },
      {
        key: "planId",
        header: "Plan",
        width: 120,
        sortable: true,
        filterable: true,
        type: "select",
        filterOptions: planOptions,
        render: (row) => <PlanBadge plan={row.planId ?? "free"} />,
      },
      {
        key: "subscription.status",
        header: "Sub Status",
        width: 130,
        sortable: true,
        filterable: true,
        type: "select",
        filterOptions: statusOptions,
        render: (row) => (
          <StatusBadge status={row.subscription?.status ?? "unknown"} dotOnly />
        ),
      },
      {
        key: "membersCount",
        header: "Members",
        width: 110,
        sortable: true,
        align: "end",
        filterable: true,
        summary: "sum",
        filterRenderer: ({ value, onChange }) => {
          const val = (value as { min?: string; max?: string } | null) || {
            min: "",
            max: "",
          };
          return (
            <div className="flex flex-col gap-3 p-1">
              <div>
                <label className="text-label-small text-on-surface-variant font-medium mb-1 block">
                  Min
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-outline-variant rounded-sm text-body-medium bg-surface text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="0"
                  value={val.min ?? ""}
                  onChange={(e) => onChange({ ...val, min: e.target.value })}
                />
              </div>
              <div>
                <label className="text-label-small text-on-surface-variant font-medium mb-1 block">
                  Max
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-outline-variant rounded-sm text-body-medium bg-surface text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="∞"
                  value={val.max ?? ""}
                  onChange={(e) => onChange({ ...val, max: e.target.value })}
                />
              </div>
            </div>
          );
        },
        filterFn: (row, value) => {
          if (!value) return true;
          const v = value as { min?: string; max?: string };
          const { min, max } = v;
          const count = row.membersCount ?? 0;
          const minVal =
            min !== "" && min !== undefined && min !== null
              ? Number(min)
              : -Infinity;
          const maxVal =
            max !== "" && max !== undefined && max !== null
              ? Number(max)
              : Infinity;
          return count >= minVal && count <= maxVal;
        },
        render: (row) => row.membersCount ?? 0,
      },
      {
        key: "adminsCount",
        header: "Admins",
        width: 100,
        sortable: true,
        align: "end",
        render: (row) => row.adminsCount ?? 0,
      },
      {
        key: "apiKeysCount",
        header: "API Keys",
        width: 110,
        sortable: true,
        align: "end",
        render: (row) => row.apiKeysCount ?? 0,
      },
      {
        key: "flagOverridesCount",
        header: "Overrides",
        width: 110,
        sortable: true,
        align: "end",
        render: (row) => row.flagOverridesCount ?? 0,
      },
      {
        key: "invoicesOpenCount",
        header: "Open Invoices",
        width: 120,
        sortable: true,
        align: "end",
        render: (row) => row.invoicesOpenCount ?? 0,
      },
      {
        key: "subscription.quantity",
        header: "Qty",
        width: 80,
        sortable: true,
        align: "end",
        render: (row) =>
          typeof row.subscription?.quantity === "number"
            ? row.subscription.quantity
            : "—",
      },
      {
        key: "subscription.currentPeriodEnd",
        header: "Renews",
        width: 120,
        sortable: true,
        render: (row) => {
          const d = row.subscription?.currentPeriodEnd
            ? new Date(row.subscription.currentPeriodEnd)
            : null;
          return d
            ? d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—";
        },
      },
      {
        key: "creditsAvailable",
        header: "Credits",
        width: 110,
        sortable: true,
        align: "end",
        render: (row) => row.creditsAvailable?.toLocaleString() ?? "—",
        summary: (rows) => {
          const total = rows.reduce(
            (acc, row) => acc + (row.creditsAvailable ?? 0),
            0
          );
          return (
            <span className="font-semibold text-on-surface">
              {total.toLocaleString()}
            </span>
          );
        },
      },
      {
        key: "webhooksFailed24h",
        header: "Failed Hooks",
        width: 120,
        sortable: true,
        align: "end",
        render: (row) => (
          <CountBadge count={row.webhooksFailed24h ?? 0} warnIfPositive />
        ),
        summary: (rows) => {
          const total = rows.reduce(
            (acc, row) => acc + (row.webhooksFailed24h ?? 0),
            0
          );
          return <CountBadge count={total} warnIfPositive />;
        },
      },
      {
        key: "lastActivityAt",
        header: "Last Activity",
        width: 150,
        sortable: true,
        filterable: true,
        render: (row) =>
          row.lastActivityAt
            ? new Date(row.lastActivityAt as string).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )
            : "—",
        filterRenderer: ({ value, onChange }) => {
          const val = (value as { start?: string; end?: string } | null) || {
            start: "",
            end: "",
          };
          return (
            <div className="flex flex-col gap-3 p-1">
              <div>
                <label className="text-label-small text-on-surface-variant font-medium mb-1 block">
                  Start
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-outline-variant rounded-sm text-body-medium bg-surface text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                  value={val.start ?? ""}
                  onChange={(e) => onChange({ ...val, start: e.target.value })}
                />
              </div>
              <div>
                <label className="text-label-small text-on-surface-variant font-medium mb-1 block">
                  End
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-outline-variant rounded-sm text-body-medium bg-surface text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                  value={val.end ?? ""}
                  onChange={(e) => onChange({ ...val, end: e.target.value })}
                />
              </div>
            </div>
          );
        },
        filterFn: (row, value) => {
          const v = value as { start?: string; end?: string } | null;
          if (!v || (!v.start && !v.end)) return true;
          if (!row.lastActivityAt) return false;
          const rowTime = new Date(row.lastActivityAt).getTime();
          const getLocalMidnight = (d: string) => {
            const parts = d?.split("-") ?? [];
            const [year, month, day] = parts.map(Number);
            if (!year || !month || !day) return NaN;
            return new Date(year, month - 1, day).getTime();
          };
          const start = v.start ? getLocalMidnight(v.start) : -Infinity;
          let end = Infinity;
          if (v.end) {
            const endMs = getLocalMidnight(v.end);
            const oneDay = 24 * 60 * 60 * 1000;
            end = endMs + oneDay - 1;
          }
          return rowTime >= start && rowTime <= end;
        },
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
              href={`/admin/tenants/${row.id}`}
            >
              Details
            </Link>
            <Link
              className="text-primary hover:underline"
              href={`/admin/tenants/${row.id}?tab=flags`}
            >
              Flags
            </Link>
          </div>
        ),
      },
    ],
    [planOptions, statusOptions]
  );

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: "Export view",
        onClick: () => {
          window.open("/api/rest/v1/admin/tenants/export", "_blank");
        },
        icon: <span className="text-primary text-xs font-medium">CSV</span>,
      },
    ],
    []
  );

  return (
    <>
      <PageLayout subtitle="Latest workspaces across the platform" />
      <DataTable<TenantsAdminListItem>
        data={data}
        columns={columns}
        title="Tenants"
        tableId="admin-tenants-ga"
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
        // Stats API returns filtered count when filtering is applied
        {...(stats?.total !== undefined ? { totalCount: stats.total } : {})}
      />
    </>
  );
}
