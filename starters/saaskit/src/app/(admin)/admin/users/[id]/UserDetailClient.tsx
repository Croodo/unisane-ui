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
import {
  User,
  Building2,
  Key,
  Activity,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
} from "lucide-react";
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
            <span className="text-muted-foreground">{user.email}</span>
            {user.role && (
              <Badge
                variant={user.role === "super-admin" ? "default" : "secondary"}
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
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="memberships" className="gap-2">
            <Building2 className="h-4 w-4" />
            Memberships
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatGrid columns={4}>
            <StatCard
              icon={Building2}
              label="Tenants"
              value={user.tenantsCount ?? 0}
            />
            <StatCard
              icon={Shield}
              label="Admin Tenants"
              value={user.adminTenantsCount ?? 0}
            />
            <StatCard
              icon={Key}
              label="API Keys Created"
              value={user.apiKeysCreatedCount ?? 0}
            />
            <StatCard
              icon={Clock}
              label="Last Activity"
              value={
                user.lastActivityAt
                  ? new Date(user.lastActivityAt).toLocaleDateString()
                  : "—"
              }
            />
          </StatGrid>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Display Name</dt>
                  <dd className="font-medium">{user.displayName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Global Role</dt>
                  <dd className="font-medium">{user.role ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Verified
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
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone Verified
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
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Sessions Revoked
                  </dt>
                  <dd className="font-medium">
                    {user.sessionsRevokedAt
                      ? new Date(user.sessionsRevokedAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memberships">
          {memberships.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No memberships"
              description="This user is not a member of any workspace."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tenant Memberships</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                        <div className="text-sm text-muted-foreground">
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keys">
          <EmptyState
            icon={Key}
            title="API Keys"
            description="API keys created by this user will be listed here. This feature is coming soon."
          />
        </TabsContent>

        <TabsContent value="activity">
          <EmptyState
            icon={Activity}
            title="User Activity"
            description="User activity (actorId audit) is planned. Current audit endpoints are tenant-scoped."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
