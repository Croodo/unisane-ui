"use client";

import Link from "next/link";
import { PageLayout } from "@/src/context/usePageLayout";
import { useTabNavigation } from "@/src/context/useTabNavigation";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import { Tabs, TabsContent } from "@unisane/ui/components/tabs";
import { Card } from "@unisane/ui/components/card";
import { Badge } from "@unisane/ui/components/badge";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import { Alert } from "@unisane/ui/components/alert";
import type {
  AuditListItem,
  WebhooksListEventsItem,
  TenantsAdminReadResponse,
} from "@/src/sdk/types";
import { TenantsFlagsClient } from "./TenantsFlagsClient";
import { TenantsSettingsAdminClient } from "./TenantsSettingsAdminClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TenantDetailClientProps {
  tenant: NonNullable<TenantsAdminReadResponse>;
  activity: AuditListItem[] | null;
  webhooks: WebhooksListEventsItem[] | null;
  env: "dev" | "stage" | "prod" | "test";
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface StatItemProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  variant?: "default" | "warning" | "success";
}

function StatItem({ icon, label, value, variant = "default" }: StatItemProps) {
  return (
    <Card variant="low" className="p-4">
      <div className="flex items-center gap-4">
        <div
          className={`size-12 rounded-full flex items-center justify-center shrink-0 ${
            variant === "warning"
              ? "bg-error-container"
              : variant === "success"
                ? "bg-tertiary-container"
                : "bg-surface-container-high"
          }`}
        >
          <Icon
            symbol={icon}
            className={
              variant === "warning"
                ? "text-error"
                : variant === "success"
                  ? "text-tertiary"
                  : "text-on-surface-variant"
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <Typography
            variant="labelLarge"
            className="text-on-surface-variant uppercase tracking-wide"
          >
            {label}
          </Typography>
          <Typography variant="headlineMedium">
            {value}
          </Typography>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Info Row Component
// ─────────────────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/50 last:border-b-0">
      <Typography variant="bodyLarge" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="bodyLarge">{value}</Typography>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Item Component
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityItemProps {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  timestamp: string;
}

function ActivityItem({
  action,
  resourceType,
  resourceId,
  timestamp,
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-outline-variant/50 last:border-b-0">
      <div className="p-2 rounded-full bg-surface-container-high shrink-0">
        <Icon symbol="history" size="sm" className="text-on-surface-variant" />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="titleMedium">{action}</Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          {resourceType}
          {resourceId && (
            <span className="font-mono text-primary ml-1">{resourceId}</span>
          )}
        </Typography>
      </div>
      <Typography
        variant="labelMedium"
        component="time"
        className="text-on-surface-variant shrink-0 tabular-nums"
      >
        {new Date(timestamp).toLocaleString()}
      </Typography>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Item Component
// ─────────────────────────────────────────────────────────────────────────────

interface WebhookItemProps {
  provider?: string | null;
  target?: string | null;
  httpStatus?: number | null;
  timestamp: string;
  replayAction: string;
}

function WebhookItem({
  provider,
  target,
  httpStatus,
  timestamp,
  replayAction,
}: WebhookItemProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-outline-variant/50 last:border-b-0">
      <div className="p-2 rounded-full bg-error-container shrink-0">
        <Icon symbol="error" size="sm" className="text-error" />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="titleMedium">
          {provider ?? "custom"} → {target ?? "—"}
        </Typography>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outlined" className="text-error border-error">
            HTTP {httpStatus ?? "—"}
          </Badge>
          <Typography
            variant="labelMedium"
            component="span"
            className="text-on-surface-variant tabular-nums"
          >
            {new Date(timestamp).toLocaleString()}
          </Typography>
        </div>
      </div>
      <form action={replayAction} method="post" className="shrink-0">
        <Button type="submit" variant="tonal" icon={<Icon symbol="replay" />}>
          Replay
        </Button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function TenantDetailClient({
  tenant,
  activity,
  webhooks,
  env,
}: TenantDetailClientProps) {
  // URL-synchronized tab navigation
  const { currentTab, navigate: handleTabChange } = useTabNavigation({
    defaultTab: "overview",
  });

  // Build tabs with badge for webhooks if there are failures
  const webhooksLabel = (tenant.webhooksFailed24h ?? 0) > 0
    ? `Webhooks (${tenant.webhooksFailed24h})`
    : "Webhooks";

  return (
    <>
      <PageLayout
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            <Typography
              variant="bodyLarge"
              component="span"
              className="text-on-surface-variant font-mono"
            >
              {tenant.slug}
            </Typography>
            <Badge variant="tonal">{tenant.planId}</Badge>
            {tenant.subscription?.status && (
              <Badge
                variant={
                  tenant.subscription.status === "active" ? "filled" : "tonal"
                }
              >
                {tenant.subscription.status}
              </Badge>
            )}
          </div>
        }
        tabs={[
          { id: "overview", label: "Overview", icon: "dashboard" },
          { id: "activity", label: "Activity", icon: "history" },
          { id: "flags", label: "Flags", icon: "flag" },
          { id: "settings", label: "Settings", icon: "settings" },
          { id: "webhooks", label: webhooksLabel, icon: "webhook" },
        ]}
        onTabChange={handleTabChange}
        actions={
          <Button
            asChild
            variant="filled"
            icon={<Icon symbol="open_in_new" />}
          >
            <Link href={`/w/${tenant.slug}/dashboard`}>Open Workspace</Link>
          </Button>
        }
      />

      <Tabs value={currentTab} onValueChange={handleTabChange}>

        {/* ─── Overview Tab ───────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatItem
              icon="group"
              label="Members"
              value={tenant.membersCount ?? 0}
            />
            <StatItem
              icon="admin_panel_settings"
              label="Admins"
              value={tenant.adminsCount ?? 0}
            />
            <StatItem
              icon="key"
              label="API Keys"
              value={tenant.apiKeysCount ?? 0}
            />
            <StatItem
              icon="toll"
              label="Credits"
              value={
                typeof tenant.creditsAvailable === "number"
                  ? tenant.creditsAvailable.toLocaleString()
                  : "—"
              }
              variant={
                typeof tenant.creditsAvailable === "number" &&
                tenant.creditsAvailable > 0
                  ? "success"
                  : "default"
              }
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subscription Info */}
            <Card variant="low">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Icon
                    symbol="credit_card"
                    className="text-on-surface-variant"
                  />
                  <Card.Title>Subscription</Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                {tenant.subscription ? (
                  <div>
                    <InfoRow
                      label="Status"
                      value={
                        <Badge
                          variant={
                            tenant.subscription.status === "active"
                              ? "filled"
                              : "tonal"
                          }
                        >
                          {tenant.subscription.status ?? "—"}
                        </Badge>
                      }
                    />
                    <InfoRow
                      label="Quantity"
                      value={tenant.subscription.quantity ?? "—"}
                    />
                    <InfoRow
                      label="Period End"
                      value={
                        tenant.subscription.currentPeriodEnd
                          ? new Date(
                              tenant.subscription.currentPeriodEnd
                            ).toLocaleDateString()
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Open Invoices"
                      value={tenant.invoicesOpenCount ?? 0}
                    />
                  </div>
                ) : (
                  <Typography
                    variant="bodyLarge"
                    className="text-on-surface-variant"
                  >
                    No active subscription
                  </Typography>
                )}
              </Card.Content>
            </Card>

            {/* Quick Stats */}
            <Card variant="low">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Icon
                    symbol="monitoring"
                    className="text-on-surface-variant"
                  />
                  <Card.Title>System Status</Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                <InfoRow
                  label="Flag Overrides"
                  value={tenant.flagOverridesCount ?? 0}
                />
                <InfoRow
                  label="Webhook Failures (24h)"
                  value={
                    (tenant.webhooksFailed24h ?? 0) > 0 ? (
                      <span className="text-error">{tenant.webhooksFailed24h}</span>
                    ) : (
                      <span className="text-tertiary">0</span>
                    )
                  }
                />
                <InfoRow
                  label="Last Activity"
                  value={
                    tenant.lastActivityAt
                      ? new Date(tenant.lastActivityAt).toLocaleDateString()
                      : "—"
                  }
                />
                <InfoRow
                  label="Tenant ID"
                  value={
                    <Typography
                      variant="labelMedium"
                      component="span"
                      className="font-mono"
                    >
                      {tenant.id}
                    </Typography>
                  }
                />
              </Card.Content>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Activity Tab ───────────────────────────────────────────────── */}
        <TabsContent value="activity" className="mt-6">
          {!activity || activity.length === 0 ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <EmptyState
                icon="history"
                title="No recent activity"
                description="Activity logs will appear here when actions are performed."
              />
            </div>
          ) : (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      symbol="history"
                      size="sm"
                      className="text-on-surface-variant"
                    />
                    <Card.Title>Recent Activity</Card.Title>
                  </div>
                  <Badge variant="tonal">{activity.length} events</Badge>
                </div>
              </Card.Header>
              <Card.Content>
                {activity.map((a) => (
                  <ActivityItem
                    key={a.id}
                    action={a.action}
                    resourceType={a.resourceType}
                    resourceId={a.resourceId}
                    timestamp={a.createdAt}
                  />
                ))}
              </Card.Content>
            </Card>
          )}
        </TabsContent>

        {/* ─── Flags Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="flags" className="mt-6 space-y-6">
          <Alert variant="info" title="Per-Tenant Flag Overrides">
            Edit per-tenant flag overrides below. Default values are from
            environment <Badge variant="outlined">{env}</Badge>.{" "}
            <Link
              href={`/w/${tenant.slug}/settings`}
              className="text-primary hover:underline"
            >
              Open workspace settings →
            </Link>
          </Alert>
          <TenantsFlagsClient env={env} tenantId={tenant.id} />
        </TabsContent>

        {/* ─── Settings Tab ───────────────────────────────────────────────── */}
        <TabsContent value="settings" className="mt-6">
          <TenantsSettingsAdminClient tenantId={tenant.id} />
        </TabsContent>

        {/* ─── Webhooks Tab ───────────────────────────────────────────────── */}
        <TabsContent value="webhooks" className="mt-6">
          {!webhooks || webhooks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <EmptyState
                icon="check_circle"
                title="All webhooks healthy"
                description="No failed outbound events in the last 24 hours."
              />
            </div>
          ) : (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon symbol="webhook" size="sm" className="text-error" />
                    <Card.Title>Failed Outbound Events</Card.Title>
                  </div>
                  <Badge variant="filled" className="bg-error">
                    {webhooks.length} failed
                  </Badge>
                </div>
                <Card.Description>
                  Review and replay failed webhook deliveries from the last 24
                  hours.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                {webhooks.map((w) => (
                  <WebhookItem
                    key={w.id}
                    provider={w.provider}
                    target={w.target}
                    httpStatus={w.httpStatus}
                    timestamp={w.createdAt}
                    replayAction={`/api/rest/v1/tenants/${tenant.id}/webhooks/events/${w.id}/replay`}
                  />
                ))}
              </Card.Content>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
