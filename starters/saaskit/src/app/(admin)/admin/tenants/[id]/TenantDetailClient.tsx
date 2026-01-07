"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/src/context/usePageHeader";
import { StatCard, StatGrid } from "@/src/components/ui/stat-card";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Building2,
  Users,
  Key,
  Activity,
  Flag,
  Settings,
  Webhook,
  CreditCard,
  Coins,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
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
            <span className="text-muted-foreground">{tenant.slug}</span>
            <Badge variant="secondary">{tenant.plan}</Badge>
            {tenant.subscription?.status && (
              <Badge
                variant={
                  tenant.subscription.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {tenant.subscription.status}
              </Badge>
            )}
          </div>
        }
        actions={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/w/${tenant.slug}/dashboard`}>
              <ExternalLink className="h-4 w-4" />
              Open Workspace
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-2">
            <Flag className="h-4 w-4" />
            Flags
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatGrid columns={4}>
            <StatCard
              icon={Users}
              label="Members"
              value={tenant.membersCount ?? 0}
            />
            <StatCard
              icon={Users}
              label="Admins"
              value={tenant.adminsCount ?? 0}
            />
            <StatCard
              icon={Key}
              label="API Keys"
              value={tenant.apiKeysCount ?? 0}
            />
            <StatCard
              icon={Coins}
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
              icon={Flag}
              label="Flag Overrides"
              value={tenant.flagOverridesCount ?? 0}
            />
            <StatCard
              icon={CreditCard}
              label="Open Invoices"
              value={tenant.invoicesOpenCount ?? 0}
            />
            <StatCard
              icon={AlertTriangle}
              label="Webhook Failures (24h)"
              value={tenant.webhooksFailed24h ?? 0}
            />
            <StatCard
              icon={Activity}
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
              <CardHeader>
                <CardTitle className="text-base">Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium">
                      {tenant.subscription.status ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Quantity</dt>
                    <dd className="font-medium">
                      {tenant.subscription.quantity ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Period End</dt>
                    <dd className="font-medium">
                      {tenant.subscription.currentPeriodEnd
                        ? new Date(
                            tenant.subscription.currentPeriodEnd
                          ).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {!activity || activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Activity logs will appear here when actions are performed."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {activity.map((a) => (
                    <div
                      key={a.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{a.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {a.resourceType} {a.resourceId ?? ""}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Edit per-tenant flag overrides below. Default values are from env{" "}
            {env}.
          </p>
          <TenantsFlagsClient env={env} tenantId={tenant.id} />
          <p className="text-xs text-muted-foreground">
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
              icon={Webhook}
              title="No failed webhooks"
              description="No failed outbound events in the last 24 hours."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Recent Failed Outbound Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                        <div className="text-sm text-muted-foreground">
                          HTTP {w.httpStatus ?? "—"} ·{" "}
                          {new Date(w.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <form
                        action={`/api/rest/v1/tenants/${tenant.id}/webhooks/events/${w.id}/replay`}
                        method="post"
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Replay
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
