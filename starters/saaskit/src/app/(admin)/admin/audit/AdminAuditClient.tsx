"use client";

import { useMemo } from "react";
import {
  Clock,
  User,
  Database,
  FileText,
  Hash,
  ArrowRight,
  Globe,
} from "lucide-react";
import {
  DataTable,
  RowDetailSection,
  KeyValueRow,
  type Column,
} from "@/src/components/datatable";
import { Badge } from "@/src/components/ui/badge";
import { hooks } from "@/src/sdk/hooks/generated/hooks";
import { type AuditAdminListItem } from "@/src/sdk/types";
import {
  useDetailPanelNavigation,
  type DetailPanelContent,
} from "@/src/context/useDetailPanel";
import { formatDistanceToNow, format } from "date-fns";

function formatChangeValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

const columns: Column<AuditAdminListItem>[] = [
  {
    key: "createdAt",
    header: "Time",
    width: 150,
    render: (row) => (
      <span title={format(new Date(row.createdAt), "PPpp")}>
        {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "action",
    header: "Action",
    width: 180,
    render: (row) => (
      <Badge variant="outline" className="font-mono text-xs">
        {row.action}
      </Badge>
    ),
  },
  {
    key: "resourceType",
    header: "Resource",
    width: 140,
    render: (row) => (
      <span className="text-muted-foreground">{row.resourceType}</span>
    ),
  },
  {
    key: "actorName",
    header: "Actor",
    width: 180,
    render: (row) =>
      row.actorName ?? <span className="text-muted-foreground">System</span>,
  },
  {
    key: "tenantId",
    header: "Tenant",
    width: 200,
    render: (row) =>
      row.tenantId ? (
        <span className="font-mono text-xs truncate">{row.tenantId}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

/**
 * Render the detail content for an audit item
 */
function AuditDetailContent({ audit }: { audit: AuditAdminListItem }) {
  return (
    <div className="space-y-4">
      <RowDetailSection icon={<Clock className="h-4 w-4" />} title="Event">
        <KeyValueRow label="Action" value={audit.action} />
        <KeyValueRow
          label="Timestamp"
          value={format(new Date(audit.createdAt), "PPpp")}
        />
        <KeyValueRow
          label="Request ID"
          value={audit.requestId}
          copyable
          mono
          truncate
        />
      </RowDetailSection>

      <RowDetailSection icon={<User className="h-4 w-4" />} title="Actor">
        <KeyValueRow label="Name" value={audit.actorName ?? "System"} />
        <KeyValueRow label="Email" value={audit.actorEmail} />
        <KeyValueRow
          label="User ID"
          value={audit.actorId}
          copyable
          mono
          truncate
        />
      </RowDetailSection>

      <RowDetailSection
        icon={<Database className="h-4 w-4" />}
        title="Resource"
      >
        <KeyValueRow label="Type" value={audit.resourceType} />
        <KeyValueRow
          label="ID"
          value={audit.resourceId}
          copyable
          mono
          truncate
        />
      </RowDetailSection>

      <RowDetailSection icon={<Hash className="h-4 w-4" />} title="Tenant">
        <KeyValueRow
          label="Tenant ID"
          value={audit.tenantId}
          copyable
          mono
          truncate
        />
      </RowDetailSection>

      {(audit.before !== undefined || audit.after !== undefined) && (
        <RowDetailSection
          icon={<ArrowRight className="h-4 w-4" />}
          title="Changes"
          badge={
            audit.before !== undefined && audit.after !== undefined
              ? "Modified"
              : audit.after !== undefined
                ? "Created"
                : "Deleted"
          }
          badgeVariant={
            audit.after !== undefined && audit.before === undefined
              ? "default"
              : audit.before !== undefined && audit.after === undefined
                ? "destructive"
                : "secondary"
          }
        >
          {audit.before !== undefined && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Before
              </p>
              <pre className="text-xs bg-destructive/10 text-destructive rounded p-2 overflow-auto max-h-40">
                {formatChangeValue(audit.before)}
              </pre>
            </div>
          )}
          {audit.after !== undefined && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                After
              </p>
              <pre className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 rounded p-2 overflow-auto max-h-40">
                {formatChangeValue(audit.after)}
              </pre>
            </div>
          )}
        </RowDetailSection>
      )}

      {(audit.ip || audit.ua) && (
        <RowDetailSection
          icon={<Globe className="h-4 w-4" />}
          title="Client Info"
          collapsible
          defaultCollapsed
        >
          <KeyValueRow label="IP Address" value={audit.ip} mono />
          <KeyValueRow label="User Agent" value={audit.ua} truncate />
        </RowDetailSection>
      )}

      <RowDetailSection
        icon={<FileText className="h-4 w-4" />}
        title="IDs"
        collapsible
        defaultCollapsed
      >
        <KeyValueRow label="Audit ID" value={audit.id} copyable mono truncate />
      </RowDetailSection>
    </div>
  );
}

/**
 * Create detail panel content for an audit item
 */
function createAuditPanelContent(
  audit: AuditAdminListItem
): DetailPanelContent {
  return {
    key: `audit-${audit.id}`,
    title: audit.action,
    subtitle: `${audit.resourceType} • ${formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })}`,
    width: "md",
    content: <AuditDetailContent audit={audit} />,
  };
}

export function AdminAuditClient() {
  const { data, isLoading, refetch } = hooks.audit.admin.list({ limit: 100 });
  const items = useMemo(() => (data ?? []) as AuditAdminListItem[], [data]);

  // Use the Zustand-powered panel navigation
  const { openItem, activeItemId } = useDetailPanelNavigation(
    items,
    createAuditPanelContent
  );

  return (
    <DataTable<AuditAdminListItem>
      data={items}
      columns={columns}
      title="Audit Logs"
      isLoading={isLoading}
      onRefresh={() => refetch()}
      tableId="admin-audit"
      variant="log"
      searchable
      onRowClick={openItem}
      activeRowId={activeItemId}
    />
  );
}
