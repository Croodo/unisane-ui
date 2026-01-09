"use client";
import { useMemo } from "react";
import { DataTable, type Column } from "@unisane/data-table";
import { RowDetailSection, KeyValueRow } from "@/src/components/shared";
import { hooks } from "@/src/sdk/hooks";
import type { AuditListItem } from "@/src/sdk/types";
import { PageHeader } from "@/src/context/usePageHeader";
import { useSession } from "@/src/hooks/useSession";
import { Icon } from "@unisane/ui/primitives/icon";
import { Card } from "@unisane/ui/components/card";
import {
  useDetailPanelNavigation,
  type DetailPanelContent,
} from "@/src/context/useDetailPanel";
import { formatDistanceToNow, format } from "date-fns";

function formatChangeValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/**
 * Render the detail content for an audit item
 */
function AuditDetailContent({ audit }: { audit: AuditListItem }) {
  return (
    <div className="space-y-4">
      <RowDetailSection icon="schedule" title="Event">
        <KeyValueRow label="Action" value={audit.action} />
        <KeyValueRow
          label="Timestamp"
          value={format(new Date(audit.createdAt), "PPpp")}
        />
      </RowDetailSection>

      <RowDetailSection icon="person" title="Actor">
        <KeyValueRow
          label="Name"
          value={(audit as any).actorName ?? "System"}
        />
        <KeyValueRow label="Email" value={(audit as any).actorEmail} />
        <KeyValueRow
          label="User ID"
          value={audit.actorId}
          copyable
          mono
          truncate
        />
      </RowDetailSection>

      <RowDetailSection icon="storage" title="Resource">
        <KeyValueRow label="Type" value={audit.resourceType} />
        <KeyValueRow
          label="ID"
          value={audit.resourceId}
          copyable
          mono
          truncate
        />
      </RowDetailSection>

      {((audit as any).before !== undefined ||
        (audit as any).after !== undefined) && (
        <RowDetailSection
          icon="arrow_forward"
          title="Changes"
          badge={
            (audit as any).before !== undefined &&
            (audit as any).after !== undefined
              ? "Modified"
              : (audit as any).after !== undefined
                ? "Created"
                : "Deleted"
          }
          badgeVariant={
            (audit as any).after !== undefined &&
            (audit as any).before === undefined
              ? "filled"
              : (audit as any).before !== undefined &&
                  (audit as any).after === undefined
                ? "filled"
                : "tonal"
          }
        >
          {(audit as any).before !== undefined && (
            <div className="mb-3">
              <p className="text-xs font-medium text-on-surface-variant mb-1">
                Before
              </p>
              <pre className="text-xs bg-error/10 text-error rounded p-2 overflow-auto max-h-40">
                {formatChangeValue((audit as any).before)}
              </pre>
            </div>
          )}
          {(audit as any).after !== undefined && (
            <div>
              <p className="text-xs font-medium text-on-surface-variant mb-1">
                After
              </p>
              <pre className="text-xs bg-primary/10 text-primary rounded p-2 overflow-auto max-h-40">
                {formatChangeValue((audit as any).after)}
              </pre>
            </div>
          )}
        </RowDetailSection>
      )}
    </div>
  );
}

/**
 * Create detail panel content for an audit item
 */
function createAuditPanelContent(audit: AuditListItem): DetailPanelContent {
  return {
    key: `audit-${audit.id}`,
    title: audit.action,
    subtitle: `${audit.resourceType} • ${formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })}`,
    width: "md",
    content: <AuditDetailContent audit={audit} />,
  };
}

export default function AuditClient() {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;
  const currentUserId = me?.userId;

  // Fetch audit logs
  const query = hooks.audit.list(
    tenantId ? { params: { tenantId }, query: { limit: 100 } } : undefined,
    {
      enabled: Boolean(tenantId),
      placeholderData: [],
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    } as any
  );

  const dataset = useMemo(
    () => (query.data ?? []) as AuditListItem[],
    [query.data]
  );

  const columns = useMemo<Column<AuditListItem>[]>(
    () => [
      {
        key: "createdAt",
        header: "Time",
        width: 140,
        render: (row) => (
          <span title={format(new Date(row.createdAt), "PPpp")}>
            {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        key: "action",
        header: "Action",
        width: 200,
        render: (row) => <span className="font-medium">{row.action}</span>,
      },
      {
        key: "resource",
        header: "Resource",
        width: 140,
        render: (row) => (
          <span className="text-on-surface-variant">{row.resourceType}</span>
        ),
      },
      {
        key: "actorId",
        header: "Actor",
        width: 180,
        render: (row) => {
          const isCurrentUser = row.actorId === currentUserId;
          const displayName =
            (row as any).actorName || (row as any).actorEmail || "System";

          return (
            <span className={isCurrentUser ? "font-medium" : ""}>
              {displayName}
              {isCurrentUser && (
                <span className="text-xs text-on-surface-variant ml-1">
                  (you)
                </span>
              )}
            </span>
          );
        },
      },
    ],
    [currentUserId]
  );

  const isLoading = query.isLoading && !query.data;

  // Use the Zustand-powered panel navigation
  const { openItem, activeItemId } = useDetailPanelNavigation(
    dataset,
    createAuditPanelContent
  );

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Track important actions and changes in your workspace."
      />

      {dataset.length === 0 && !isLoading ? (
        <Card>
          <Card.Content className="py-10 text-center">
            <Icon symbol="receipt_long" size="lg" className="mx-auto text-on-surface-variant mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Actions like creating API keys, changing settings, or managing
              team members will appear here.
            </p>
          </Card.Content>
        </Card>
      ) : (
        <DataTable<AuditListItem>
          data={dataset}
          columns={columns}
          title="Recent Activity"
          loading={isLoading}
          tableId="tenant-audit-ga"
          callbacks={{ onRowClick: openItem }}
          {...(activeItemId ? { activeRowId: activeItemId } : {})}
        />
      )}
    </>
  );
}
