"use client";
import { useMemo } from "react";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { hooks } from "@/src/sdk/hooks";
import type { WebhooksListEventsItem } from "@/src/sdk/types";
import { PageLayout } from "@/src/context/usePageLayout";
import { useSession } from "@/src/hooks/useSession";
import { Card } from "@unisane/ui/components/card";
import {
  StatusBadge,
  DirectionBadge,
  HttpStatusBadge,
} from "@/src/components/ui/status-badge";
import { Icon } from "@unisane/ui/primitives/icon";

export default function WebhooksClient() {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;

  const query = hooks.webhooks.listEvents(
    tenantId ? { params: { tenantId }, query: { limit: 100 } } : undefined,
    {
      enabled: Boolean(tenantId),
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    }
  );

  const dataset = useMemo(
    () => (query.data ?? []) as WebhooksListEventsItem[],
    [query.data]
  );

  const columns = useMemo<Column<WebhooksListEventsItem>[]>(
    () => [
      {
        key: "id",
        header: "Event",
        width: 200,
        render: (row) => (
          <span className="font-mono text-xs text-on-surface-variant">
            {row.id.length > 20
              ? `${row.id.slice(0, 8)}…${row.id.slice(-6)}`
              : row.id}
          </span>
        ),
      },
      {
        key: "direction",
        header: "Direction",
        width: 120,
        render: (row) => <DirectionBadge direction={row.direction} />,
      },
      {
        key: "status",
        header: "Status",
        width: 130,
        render: (row) => <StatusBadge status={row.status} showIcon />,
      },
      {
        key: "httpStatus",
        header: "HTTP",
        width: 80,
        align: "center",
        render: (row) => <HttpStatusBadge code={row.httpStatus} />,
      },
      {
        key: "provider",
        header: "Provider",
        width: 120,
        render: (row) =>
          row.provider ? (
            <span className="capitalize">{row.provider}</span>
          ) : (
            <span className="text-on-surface-variant">—</span>
          ),
      },
      {
        key: "target",
        header: "Target",
        render: (row) =>
          row.target ? (
            <span
              className="font-mono text-xs truncate max-w-[300px] block"
              title={row.target}
            >
              {row.target}
            </span>
          ) : (
            <span className="text-on-surface-variant">—</span>
          ),
      },
      {
        key: "createdAt",
        header: "Created",
        width: 180,
        render: (row) => (
          <span className="text-on-surface-variant text-sm">
            {new Date(row.createdAt).toLocaleString()}
          </span>
        ),
      },
    ],
    []
  );

  const isLoading = query.isLoading && !query.data;

  return (
    <>
      <PageLayout subtitle="Inbound and outbound events for this workspace." />

      {dataset.length === 0 && !isLoading ? (
        <Card>
          <Card.Content className="py-10 text-center">
            <Icon symbol="webhook" size="lg" className="mx-auto text-on-surface-variant mb-4" />
            <h3 className="text-lg font-medium mb-2">No webhook events yet</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Webhook events will appear here when your workspace sends or
              receives webhooks from external services.
            </p>
          </Card.Content>
        </Card>
      ) : (
        <DataTable<WebhooksListEventsItem>
          data={dataset}
          columns={columns}
          title="Webhook events"
          loading={isLoading}
          tableId="tenant-webhooks-events"
        />
      )}
    </>
  );
}
