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
import { Icon } from "@unisane/ui/primitives/icon";
import type {
  UsersAdminReadResponse,
  UsersAdminMembershipsByUserItem,
} from "@/src/sdk/types";

interface UserDetailClientProps {
  user: NonNullable<UsersAdminReadResponse>;
  memberships: UsersAdminMembershipsByUserItem[];
}

export function UserDetailClient({ user, memberships }: UserDetailClientProps) {
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
        title={user.displayName || user.email}
        subtitle={
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">{user.email}</span>
            {user.role && (
              <Badge
                variant={user.role === "super-admin" ? "filled" : "tonal"}
              >
                {user.role}
              </Badge>
            )}
          </div>
        }
      />

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Icon symbol="person" size="sm" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="memberships" className="gap-2">
            <Icon symbol="apartment" size="sm" />
            Memberships
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-2">
            <Icon symbol="key" size="sm" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Icon symbol="monitoring" size="sm" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatGrid columns={4}>
            <StatCard
              icon="apartment"
              label="Tenants"
              value={user.tenantsCount ?? 0}
            />
            <StatCard
              icon="shield"
              label="Admin Tenants"
              value={user.adminTenantsCount ?? 0}
            />
            <StatCard
              icon="key"
              label="API Keys Created"
              value={user.apiKeysCreatedCount ?? 0}
            />
            <StatCard
              icon="schedule"
              label="Last Activity"
              value={
                user.lastActivityAt
                  ? new Date(user.lastActivityAt).toLocaleDateString()
                  : "—"
              }
            />
          </StatGrid>

          <Card>
            <Card.Header>
              <Card.Title className="text-base">User Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-on-surface-variant">Display Name</dt>
                  <dd className="font-medium">{user.displayName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Global Role</dt>
                  <dd className="font-medium">{user.role ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant flex items-center gap-1">
                    <Icon symbol="mail" size="sm" /> Email Verified
                  </dt>
                  <dd className="font-medium">
                    {user.emailVerified == null
                      ? "—"
                      : user.emailVerified
                        ? "Yes"
                        : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant flex items-center gap-1">
                    <Icon symbol="phone" size="sm" /> Phone Verified
                  </dt>
                  <dd className="font-medium">
                    {user.phoneVerified == null
                      ? "—"
                      : user.phoneVerified
                        ? "Yes"
                        : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant flex items-center gap-1">
                    <Icon symbol="calendar_today" size="sm" /> Sessions Revoked
                  </dt>
                  <dd className="font-medium">
                    {user.sessionsRevokedAt
                      ? new Date(user.sessionsRevokedAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>
            </Card.Content>
          </Card>
        </TabsContent>

        <TabsContent value="memberships">
          {memberships.length === 0 ? (
            <EmptyState
              icon="apartment"
              title="No memberships"
              description="This user is not a member of any workspace."
            />
          ) : (
            <Card>
              <Card.Header>
                <Card.Title className="text-base">Tenant Memberships</Card.Title>
              </Card.Header>
              <Card.Content className="p-0">
                <div className="divide-y">
                  {memberships.map((m) => (
                    <div
                      key={m.tenantId}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {m.tenantName ?? m.tenantSlug ?? m.tenantId}
                        </div>
                        <div className="text-sm text-on-surface-variant">
                          Roles: {(m.roles ?? []).join(", ") || "member"}
                        </div>
                      </div>
                      <Link
                        href={`/admin/tenants/${m.tenantId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View tenant
                      </Link>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keys">
          <EmptyState
            icon="key"
            title="API Keys"
            description="API keys created by this user will be listed here. This feature is coming soon."
          />
        </TabsContent>

        <TabsContent value="activity">
          <EmptyState
            icon="monitoring"
            title="User Activity"
            description="User activity (actorId audit) is planned. Current audit endpoints are tenant-scoped."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
