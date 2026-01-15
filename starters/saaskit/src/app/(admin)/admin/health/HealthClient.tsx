"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@unisane/ui/components/button";
import { Card } from "@unisane/ui/components/card";
import { Switch } from "@unisane/ui/components/switch";
import { Typography } from "@unisane/ui/components/typography";
import { Icon } from "@unisane/ui/primitives/icon";
import { Badge } from "@unisane/ui/components/badge";

interface CheckResult {
  status: "up" | "down" | "degraded";
  latencyMs: number;
  message?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, CheckResult>;
  version: string;
  uptime: number;
  timestamp: string;
}

interface HealthClientProps {
  initialHealth: HealthResponse;
}

export function HealthClient({ initialHealth }: HealthClientProps) {
  const [health, setHealth] = useState<HealthResponse>(initialHealth);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const refreshHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error("Failed to refresh health:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      void refreshHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshHealth]);

  // Calculate stats from current health
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

  return (
    <Card variant="outlined" padding="md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="tonal"
            size="sm"
            onClick={() => void refreshHealth()}
            disabled={isRefreshing}
          >
            <Icon symbol={isRefreshing ? "sync" : "refresh"} size="sm" className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </Button>

          <Switch
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            label="Auto-refresh (30s)"
          />
        </div>

        {/* Status info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status={health.status} />
            <Typography variant="labelMedium" className="text-on-surface-variant">
              {health.status.toUpperCase()}
            </Typography>
          </div>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </Typography>
        </div>
      </div>

      {/* Live Stats */}
      <div className="mt-4 pt-4 border-t border-outline-variant/30">
        <div className="flex flex-wrap items-center gap-4 text-body-small">
          <StatItem
            icon="monitoring"
            label="Checks"
            value={checksCount.toString()}
          />
          <StatItem
            icon="check_circle"
            label="Healthy"
            value={healthyCount.toString()}
            valueClass="text-success"
          />
          {healthyCount < checksCount && (
            <StatItem
              icon="warning"
              label="Unhealthy"
              value={(checksCount - healthyCount).toString()}
              valueClass="text-error"
            />
          )}
          <StatItem
            icon="speed"
            label="Avg Latency"
            value={`${avgLatency}ms`}
            mono
          />
          {autoRefresh && (
            <Badge variant="outlined" color="primary" size="sm">
              <Icon symbol="autorenew" size="xs" className="mr-1" />
              Auto-refresh ON
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const colorClass = {
    healthy: "bg-success",
    degraded: "bg-tertiary",
    unhealthy: "bg-error",
  }[status] ?? "bg-error";

  return (
    <div className={`size-2.5 rounded-full ${colorClass} animate-pulse`} />
  );
}

function StatItem({
  icon,
  label,
  value,
  valueClass,
  mono,
}: {
  icon: string;
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon symbol={icon} size="sm" className="text-on-surface-variant" />
      <span className="text-on-surface-variant">{label}:</span>
      <span className={`font-medium ${mono ? "font-mono" : ""} ${valueClass ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
