"use client";

import Link from "next/link";
import { PageLayout } from "@/src/context/usePageLayout";
import { useTabNavigation } from "@/src/context/useTabNavigation";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import { Tabs, TabsContent } from "@unisane/ui/components/tabs";
import { Badge } from "@unisane/ui/components/badge";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import { Alert } from "@unisane/ui/components/alert";
import type {
  UsersAdminReadResponse,
  UsersAdminMembershipsByUserItem,
} from "@/src/sdk/types";

interface UserDetailClientProps {
  user: NonNullable<UsersAdminReadResponse>;
  memberships: UsersAdminMembershipsByUserItem[];
}

export function UserDetailClient({ user, memberships }: UserDetailClientProps) {
  // URL-synchronized tab navigation
  const { currentTab, navigate: handleTabChange } = useTabNavigation({
    defaultTab: "overview",
  });

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
              {user.email}
            </Typography>
            {user.role && (
              <Badge
                variant={user.role === "super-admin" ? "filled" : "tonal"}
              >
                {user.role}
              </Badge>
            )}
          </div>
        }
        tabs={[
          { id: "overview", label: "Overview", icon: "person" },
          { id: "keys", label: "API Keys", icon: "key" },
          { id: "activity", label: "Activity", icon: "monitoring" },
        ]}
        onTabChange={handleTabChange}
      />

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsContent value="overview" className="space-y-8">
          <StatsCards
            items={[
              { label: "Tenants", value: user.tenantsCount ?? 0, icon: "apartment" },
              { label: "Admin Tenants", value: user.adminTenantsCount ?? 0, icon: "shield" },
              { label: "API Keys Created", value: user.apiKeysCreatedCount ?? 0, icon: "key" },
              {
                label: "Last Activity",
                value: user.lastActivityAt
                  ? new Date(user.lastActivityAt).toLocaleDateString()
                  : "—",
                icon: "schedule",
              },
            ] satisfies StatItem[]}
            columns={4}
          />

          {/* User Details Section */}
          <section>
            <div className="mb-6">
              <Typography variant="titleLarge">User Details</Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                Account information and verification status
              </Typography>
            </div>

            <div className="divide-y divide-outline-variant">
              {/* Display Name */}
              <div className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <Typography variant="titleMedium">Display Name</Typography>
                <Typography variant="bodyLarge">
                  {user.displayName ?? "—"}
                </Typography>
              </div>

              {/* Global Role */}
              <div className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <Typography variant="titleMedium">Global Role</Typography>
                <div>
                  {user.role ? (
                    <Badge variant={user.role === "super-admin" ? "filled" : "tonal"}>
                      {user.role}
                    </Badge>
                  ) : (
                    <Typography variant="bodyLarge">—</Typography>
                  )}
                </div>
              </div>

              {/* Email Verified */}
              <div className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <div className="flex items-center gap-2">
                  <Icon symbol="mail" size="sm" className="text-on-surface-variant" />
                  <Typography variant="titleMedium">Email Verified</Typography>
                </div>
                <div className="flex items-center gap-2">
                  {user.emailVerified == null ? (
                    <Typography variant="bodyLarge">—</Typography>
                  ) : user.emailVerified ? (
                    <>
                      <Icon symbol="check_circle" size="sm" className="text-primary" />
                      <Typography variant="bodyLarge">Yes</Typography>
                    </>
                  ) : (
                    <>
                      <Icon symbol="cancel" size="sm" className="text-error" />
                      <Typography variant="bodyLarge">No</Typography>
                    </>
                  )}
                </div>
              </div>

              {/* Phone Verified */}
              <div className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <div className="flex items-center gap-2">
                  <Icon symbol="phone" size="sm" className="text-on-surface-variant" />
                  <Typography variant="titleMedium">Phone Verified</Typography>
                </div>
                <div className="flex items-center gap-2">
                  {user.phoneVerified == null ? (
                    <Typography variant="bodyLarge">—</Typography>
                  ) : user.phoneVerified ? (
                    <>
                      <Icon symbol="check_circle" size="sm" className="text-primary" />
                      <Typography variant="bodyLarge">Yes</Typography>
                    </>
                  ) : (
                    <>
                      <Icon symbol="cancel" size="sm" className="text-error" />
                      <Typography variant="bodyLarge">No</Typography>
                    </>
                  )}
                </div>
              </div>

              {/* Sessions Revoked */}
              <div className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <div className="flex items-center gap-2">
                  <Icon symbol="logout" size="sm" className="text-on-surface-variant" />
                  <Typography variant="titleMedium">Sessions Revoked</Typography>
                </div>
                <Typography variant="bodyLarge" className="font-mono">
                  {user.sessionsRevokedAt
                    ? new Date(user.sessionsRevokedAt).toLocaleString()
                    : "—"}
                </Typography>
              </div>

              {/* User ID */}
              <div className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <Typography variant="titleMedium">User ID</Typography>
                <Typography variant="labelMedium" className="font-mono text-on-surface-variant">
                  {user.id}
                </Typography>
              </div>
            </div>
          </section>

          {/* Tenant Memberships Section */}
          <section>
            <div className="flex items-start justify-between mb-6">
              <div>
                <Typography variant="titleLarge">Tenant Memberships</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                  Workspaces this user belongs to and their roles
                </Typography>
              </div>
              <Badge variant="tonal">
                {memberships.length} workspace{memberships.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {memberships.length === 0 ? (
              <div className="rounded-lg border border-outline-variant p-8 text-center">
                <Icon symbol="apartment" className="text-on-surface-variant mx-auto mb-2" />
                <Typography variant="titleMedium" className="text-on-surface-variant">
                  No memberships
                </Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                  This user is not a member of any workspace.
                </Typography>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant rounded-lg border border-outline-variant overflow-hidden">
                {memberships.map((m) => (
                  <div
                    key={m.tenantId}
                    className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <Icon symbol="apartment" className="text-on-surface-variant" />
                      </div>
                      <div className="min-w-0">
                        <Typography variant="titleMedium" className="truncate">
                          {m.tenantName ?? m.tenantSlug ?? m.tenantId}
                        </Typography>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(m.roles ?? ["member"]).map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "filled" : "outlined"}
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                          {m.tenantSlug && (
                            <Typography
                              variant="labelSmall"
                              className="text-on-surface-variant font-mono"
                            >
                              /{m.tenantSlug}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/tenants/${m.tenantId}`}
                      className="text-primary hover:underline shrink-0"
                    >
                      <Typography variant="labelLarge">View tenant →</Typography>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="keys" className="space-y-6">
          <Alert variant="info" title="API Keys - Coming Soon">
            API keys created by this user will be listed here. This feature is
            currently in development and will allow you to view and manage all
            API keys associated with this user across tenants.
          </Alert>
          <div className="flex items-center justify-center min-h-[40vh]">
            <EmptyState
              icon="key"
              title="No API keys yet"
              description="API keys created by this user will appear here once this feature is available."
              size="sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Alert variant="info" title="User Activity - Coming Soon">
            User activity tracking (actorId-based audit) is planned. Currently,
            audit logs are tenant-scoped. This feature will aggregate all
            actions performed by this user across the platform.
          </Alert>
          <div className="flex items-center justify-center min-h-[40vh]">
            <EmptyState
              icon="monitoring"
              title="No activity data"
              description="User activity logs will appear here once cross-tenant audit is implemented."
              size="sm"
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
