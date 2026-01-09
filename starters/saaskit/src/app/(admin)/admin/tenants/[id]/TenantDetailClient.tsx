"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/src/context/usePageHeader";
import { StatCard, StatGrid } from "@unisane/ui/components/stat-card";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@unisane/ui/components/tabs";
import { Card } from "@unisane/ui/components/card";
import { Badge } from "@unisane/ui/components/badge";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import type {
  AuditListItem,
  WebhooksListEventsItem,
  TenantsAdminReadResponse,
} from "@/src/sdk/types";
import { TenantsFlagsClient } from "./TenantsFlagsClient";
import { TenantsSettingsAdminClient } from "./TenantsSettingsAdminClient";

interface TenantDetailClientProps {
  tenant: NonNullable<TenantsAdminReadResponse>;
  activity: AuditListItem[] | null;
  webhooks: WebhooksListEventsItem[] | null;
  env: "dev" | "stage" | "prod" | "test";
}

export function TenantDetailClient({
  tenant,
  activity,
  webhooks,
  env,
}: TenantDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = searchParams.get("tab") ?? "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <>
      <PageHeader
        title={tenant.name}
        subtitle={
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">{tenant.slug}</span>
            <Badge variant="tonal">{tenant.planId}</Badge>
            {tenant.subscription?.status && (
              <Badge
                variant={
                  tenant.subscription.status === "active"
                    ? "filled"
                    : "tonal"
                }
              >
                {tenant.subscription.status}
              </Badge>
            )}
          </div>
        }
        actions={
          <Button asChild variant="outlined" size="sm" className="gap-2">
            <Link href={`/w/${tenant.slug}/dashboard`}>
              <Icon symbol="open_in_new" size="sm" />
              Open Workspace
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Icon symbol="apartment" size="sm" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Icon symbol="monitoring" size="sm" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-2">
            <Icon symbol="flag" size="sm" />
            Flags
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Icon symbol="settings" size="sm" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Icon symbol="webhook" size="sm" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatGrid columns={4}>
            <StatCard
              icon="group"
              label="Members"
              value={tenant.membersCount ?? 0}
            />
            <StatCard
              icon="group"
              label="Admins"
              value={tenant.adminsCount ?? 0}
            />
            <StatCard
              icon="key"
              label="API Keys"
              value={tenant.apiKeysCount ?? 0}
            />
            <StatCard
              icon="toll"
              label="Credits"
              value={
                typeof tenant.creditsAvailable === "number"
                  ? tenant.creditsAvailable
                  : "—"
              }
            />
          </StatGrid>

          <StatGrid columns={4}>
            <StatCard
              icon="flag"
              label="Flag Overrides"
              value={tenant.flagOverridesCount ?? 0}
            />
            <StatCard
              icon="credit_card"
              label="Open Invoices"
              value={tenant.invoicesOpenCount ?? 0}
            />
            <StatCard
              icon="warning"
              label="Webhook Failures (24h)"
              value={tenant.webhooksFailed24h ?? 0}
            />
            <StatCard
              icon="monitoring"
              label="Last Activity"
              value={
                tenant.lastActivityAt
                  ? new Date(tenant.lastActivityAt).toLocaleDateString()
                  : "—"
              }
            />
          </StatGrid>

          {tenant.subscription && (
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Subscription</Card.Title>
              </Card.Header>
              <Card.Content>
                <dl className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-on-surface-variant">Status</dt>
                    <dd className="font-medium">
                      {tenant.subscription.status ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Quantity</dt>
                    <dd className="font-medium">
                      {tenant.subscription.quantity ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Period End</dt>
                    <dd className="font-medium">
                      {tenant.subscription.currentPeriodEnd
                        ? new Date(
                            tenant.subscription.currentPeriodEnd
                          ).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {!activity || activity.length === 0 ? (
            <EmptyState
              icon="monitoring"
              title="No recent activity"
              description="Activity logs will appear here when actions are performed."
            />
          ) : (
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Recent Activity</Card.Title>
              </Card.Header>
              <Card.Content className="p-0">
                <div className="divide-y">
                  {activity.map((a) => (
                    <div
                      key={a.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{a.action}</div>
                        <div className="text-sm text-on-surface-variant">
                          {a.resourceType} {a.resourceId ?? ""}
                        </div>
                      </div>
                      <div className="text-sm text-on-surface-variant">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Edit per-tenant flag overrides below. Default values are from env{" "}
            {env}.
          </p>
          <TenantsFlagsClient env={env} tenantId={tenant.id} />
          <p className="text-xs text-on-surface-variant">
            Workspace link:{" "}
            <Link
              href={`/w/${tenant.slug}/settings`}
              className="underline hover:text-foreground"
            >
              open workspace settings
            </Link>
          </p>
        </TabsContent>

        <TabsContent value="settings">
          <TenantsSettingsAdminClient tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="webhooks">
          {!webhooks || webhooks.length === 0 ? (
            <EmptyState
              icon="webhook"
              title="No failed webhooks"
              description="No failed outbound events in the last 24 hours."
            />
          ) : (
            <Card>
              <Card.Header>
                <Card.Title className="text-base">
                  Recent Failed Outbound Events
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-0">
                <div className="divide-y">
                  {webhooks.map((w) => (
                    <div
                      key={w.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {w.provider ?? "custom"} → {w.target ?? "—"}
                        </div>
                        <div className="text-sm text-on-surface-variant">
                          HTTP {w.httpStatus ?? "—"} ·{" "}
                          {new Date(w.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <form
                        action={`/api/rest/v1/tenants/${tenant.id}/webhooks/events/${w.id}/replay`}
                        method="post"
                      >
                        <Button type="submit" variant="text" size="sm">
                          Replay
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
