import { healthCheck, readinessCheck, getRegisteredChecks } from "@unisane/kernel";
import { KIT_ID, KIT_CHANNEL, KIT_VERSION } from "@/src/shared/kitVersion";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";
import { Card } from "@unisane/ui/components/card";
import { Badge } from "@unisane/ui/components/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@unisane/ui/components/table";
import { Typography } from "@unisane/ui/components/typography";
import { Icon } from "@unisane/ui/primitives/icon";
import { HealthClient } from "./HealthClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const [health, readiness] = await Promise.all([
    healthCheck(),
    readinessCheck(),
  ]);

  const registeredChecks = getRegisteredChecks();

  // Calculate stats
  const checksCount = Object.keys(health.checks).length;
  const healthyCount = Object.values(health.checks).filter(
    (c) => c.status === "up"
  ).length;
  const avgLatency = checksCount > 0
    ? Math.round(
        Object.values(health.checks).reduce((sum, c) => sum + c.latencyMs, 0) /
          checksCount
      )
    : 0;

  const statsItems: StatItem[] = [
    {
      label: "Overall Status",
      value: health.status.toUpperCase(),
      icon: health.status === "healthy" ? "check_circle" : health.status === "degraded" ? "warning" : "error",
    },
    {
      label: "Uptime",
      value: formatUptime(health.uptime),
      icon: "schedule",
    },
    {
      label: "Version",
      value: health.version,
      icon: "tag",
    },
    {
      label: "Ready",
      value: readiness.ready ? "Yes" : "No",
      icon: readiness.ready ? "verified" : "block",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography variant="titleLarge">System Health</Typography>
        <StatusBadge status={health.status} />
      </div>

      {/* Stats Cards */}
      <StatsCards items={statsItems} columns={4} />

      {/* Kit Information */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Icon symbol="info" className="text-on-surface-variant" />
          <Typography variant="titleSmall">Kit Information</Typography>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoItem label="Kit ID" value={KIT_ID} />
          <InfoItem label="Channel" value={KIT_CHANNEL} />
          <InfoItem label="Version" value={KIT_VERSION} />
        </div>
      </Card>

      {/* Health Checks Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography variant="titleSmall">
            Health Checks ({registeredChecks.length})
          </Typography>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(health.checks).map(([name, result]) => (
              <TableRow key={name}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CheckStatusIndicator status={result.status} />
                    <span className="font-medium">{name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <CheckStatusBadge status={result.status} />
                </TableCell>
                <TableCell className="text-on-surface-variant">
                  {result.message || "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {result.latencyMs}ms
                </TableCell>
              </TableRow>
            ))}
            {Object.keys(health.checks).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant">
                  No health checks registered
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Stats Summary */}
      <Card variant="low" padding="md">
        <div className="flex items-center gap-6 text-body-small">
          <div className="flex items-center gap-2">
            <Icon symbol="monitoring" size="sm" className="text-on-surface-variant" />
            <span className="text-on-surface-variant">Total Checks:</span>
            <span className="font-medium">{checksCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="check_circle" size="sm" className="text-success" />
            <span className="text-on-surface-variant">Healthy:</span>
            <span className="font-medium text-success">{healthyCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="speed" size="sm" className="text-on-surface-variant" />
            <span className="text-on-surface-variant">Avg Latency:</span>
            <span className="font-mono font-medium">{avgLatency}ms</span>
          </div>
        </div>
      </Card>

      {/* Real-time refresh controls */}
      <HealthClient initialHealth={health} />

      {/* Timestamp */}
      <div className="text-center">
        <Typography variant="labelSmall" className="text-on-surface-variant">
          Last checked: {new Date(health.timestamp).toLocaleString()}
        </Typography>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap = {
    healthy: "success" as const,
    degraded: "tertiary" as const,
    unhealthy: "error" as const,
  };

  return (
    <Badge
      variant="tonal"
      color={colorMap[status as keyof typeof colorMap] ?? "error"}
      size="lg"
    >
      {status.toUpperCase()}
    </Badge>
  );
}

function CheckStatusBadge({ status }: { status: string }) {
  if (status === "up") {
    return (
      <Badge variant="tonal" color="success" size="sm">
        UP
      </Badge>
    );
  }
  if (status === "degraded") {
    return (
      <Badge variant="tonal" color="tertiary" size="sm">
        DEGRADED
      </Badge>
    );
  }
  return (
    <Badge variant="tonal" color="error" size="sm">
      DOWN
    </Badge>
  );
}

function CheckStatusIndicator({ status }: { status: string }) {
  if (status === "up") {
    return <div className="size-2.5 rounded-full bg-success" />;
  }
  if (status === "degraded") {
    return <div className="size-2.5 rounded-full bg-tertiary" />;
  }
  return <div className="size-2.5 rounded-full bg-error" />;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Typography variant="labelSmall" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="bodyMedium" className="font-mono">
        {value}
      </Typography>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}
