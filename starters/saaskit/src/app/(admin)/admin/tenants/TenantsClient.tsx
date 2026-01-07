"use client";
import { useMemo } from "react";
import Link from "next/link";
import { DataTable, useRemoteDataTable } from "@/src/components/datatable";
import type { Column, BulkAction } from "@/src/components/datatable/types";
import type {
  TenantsAdminListResponse as TenantsAdminList,
  TenantsAdminListItem,
} from "@/src/sdk/types";
import { hooks } from "@/src/sdk/hooks";
import { PageHeader } from "@/src/context/usePageHeader";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";
import { Building2, Users, CheckCircle } from "lucide-react";
import {
  StatusBadge,
  PlanBadge,
  CountBadge,
} from "@/src/components/ui/status-badge";

export default function TenantsClient({
  initial,
  sort,
  limit = 50,
  initialFilters = {},
}: {
  initial: TenantsAdminList;
  sort?: string;
  limit?: number;
  initialFilters?: Record<string, unknown>;
}) {
  // SDK hooks
  const params = hooks.tenants.admin.useListParams({
    defaults: { sort: sort ?? "-createdAt", limit },
    initialFilters,
  });

  const query = hooks.tenants.admin.list(params.queryArgs, {
    placeholderData: initial as TenantsAdminList,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    keepPreviousData: true,
  } as Record<string, unknown>);

  const statsQuery = hooks.tenants.admin.stats(
    { filters: params.queryArgs.filters },
    { refetchOnWindowFocus: false, staleTime: 60_000 }
  );

  // Remote DataTable props
  const remoteProps = useRemoteDataTable<TenantsAdminListItem>({
    params,
    query: query as {
      data?: {
        items?: TenantsAdminListItem[];
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

  // Filter options from data
  const planOptions = useMemo(
    () =>
      Array.from(new Set(remoteProps.data.map((d) => d.plan ?? "free"))).map(
        (p) => ({
          label: String(p).charAt(0).toUpperCase() + String(p).slice(1),
          value: p ?? "free",
        })
      ),
    [remoteProps.data]
  );

  const statusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        remoteProps.data
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
  }, [remoteProps.data]);

  // Column definitions
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
          <span className="font-bold text-google-text">Total</span>
        ),
        render: (row) => (
          <div className="flex flex-col">
            <Link
              className="font-medium text-google-blue hover:underline"
              href={`/w/${row.slug as string}/dashboard`}
            >
              {row.name}
            </Link>
            <span className="text-xs text-gray-500 font-mono">/{row.slug}</span>
          </div>
        ),
      },
      {
        key: "plan",
        header: "Plan",
        width: 120,
        sortable: true,
        filterable: true,
        type: "select",
        filterOptions: planOptions,
        render: (row) => <PlanBadge plan={row.plan ?? "free"} />,
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
        align: "right",
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
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  Min
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-google-blue focus:border-google-blue"
                  placeholder="0"
                  value={val.min ?? ""}
                  onChange={(e) => onChange({ ...val, min: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  Max
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-google-blue focus:border-google-blue"
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
        align: "right",
        render: (row) => row.adminsCount ?? 0,
      },
      {
        key: "apiKeysCount",
        header: "API Keys",
        width: 110,
        sortable: true,
        align: "right",
        render: (row) => row.apiKeysCount ?? 0,
      },
      {
        key: "flagOverridesCount",
        header: "Overrides",
        width: 110,
        sortable: true,
        align: "right",
        render: (row) => row.flagOverridesCount ?? 0,
      },
      {
        key: "invoicesOpenCount",
        header: "Open Invoices",
        width: 120,
        sortable: true,
        align: "right",
        render: (row) => row.invoicesOpenCount ?? 0,
      },
      {
        key: "subscription.quantity",
        header: "Qty",
        width: 80,
        sortable: true,
        align: "right",
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
        align: "right",
        render: (row) => row.creditsAvailable?.toLocaleString() ?? "—",
        summary: (data) => {
          const total = data.reduce(
            (acc, row) => acc + (row.creditsAvailable ?? 0),
            0
          );
          return (
            <span className="font-bold text-google-text">
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
        align: "right",
        render: (row) => (
          <CountBadge count={row.webhooksFailed24h ?? 0} warnIfPositive />
        ),
        summary: (data) => {
          const total = data.reduce(
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
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  Start
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-google-blue focus:border-google-blue"
                  value={val.start ?? ""}
                  onChange={(e) => onChange({ ...val, start: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  End
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-google-blue focus:border-google-blue"
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
          <div className="flex gap-3 justify-end text-sm">
            <Link
              className="text-google-blue hover:underline"
              href={`/admin/tenants/${row.id}`}
            >
              Details
            </Link>
            <Link
              className="text-google-blue hover:underline"
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
        onClick: () =>
          window.open("/api/rest/v1/admin/tenants/export", "_blank"),
        icon: <span className="text-google-blue text-xs font-medium">CSV</span>,
      },
    ],
    []
  );

  // Stats display
  const statsItems: StatItem[] = useMemo(() => {
    const stats = statsQuery.data as
      | { total?: number; facets?: { planId?: Record<string, number> } }
      | undefined;
    if (!stats) return [];

    const freePlan = stats.facets?.planId?.free ?? 0;
    const proPlan = stats.facets?.planId?.pro ?? 0;
    const enterprisePlan = stats.facets?.planId?.enterprise ?? 0;

    return [
      { label: "Total Tenants", value: stats.total ?? 0, icon: Building2 },
      { label: "Free Plan", value: freePlan, icon: Users },
      { label: "Pro Plan", value: proPlan, icon: CheckCircle },
      { label: "Enterprise Plan", value: enterprisePlan, icon: CheckCircle },
    ];
  }, [statsQuery.data]);

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="Latest workspaces across the platform"
      />
      <div className="mt-4 space-y-4">
        <StatsCards items={statsItems} isLoading={statsQuery.isLoading} />
        {/* 
          Before: 23 props
          After: spread + 5 props
        */}
        <DataTable<TenantsAdminListItem>
          {...remoteProps}
          columns={columns}
          title="Tenants"
          tableId="admin-tenants-ga"
          searchable
          bulkActions={bulkActions}
        />
      </div>
    </>
  );
}
