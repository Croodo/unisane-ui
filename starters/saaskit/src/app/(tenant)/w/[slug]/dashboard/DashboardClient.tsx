"use client";

import Link from "next/link";
import { useSession } from "@/src/hooks/useSession";
import { hooks } from "@/src/sdk/hooks";
import { PageHeader } from "@/src/context/usePageHeader";
import { Card } from "@unisane/ui/components/card";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: string;
  href?: string;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon,
  href,
  loading,
}: StatCardProps) {
  const content = (
    <Card className="hover:bg-surface-container/50 transition-colors">
      <Card.Header className="flex flex-row items-center justify-between pb-2">
        <Card.Title className="text-sm font-medium text-on-surface-variant">
          {title}
        </Card.Title>
        <Icon symbol={icon} size="sm" className="text-on-surface-variant" />
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="h-8 w-16 bg-surface-container animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-on-surface-variant mt-1">{description}</p>
        )}
      </Card.Content>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

interface ChecklistItemProps {
  done: boolean;
  title: string;
  href?: string;
}

function ChecklistItem({ done, title, href }: ChecklistItemProps) {
  const content = (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-md ${
        done ? "text-on-surface-variant" : "hover:bg-surface-container/50"
      }`}
    >
      <Icon
        symbol={done ? "check_circle" : "circle"}
        size="sm"
        className={done ? "text-primary" : "text-on-surface-variant"}
      />
      <span className={done ? "line-through" : ""}>{title}</span>
      {!done && href && <Icon symbol="arrow_forward" size="xs" className="ml-auto" />}
    </div>
  );

  if (!done && href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

interface DashboardClientProps {
  slug: string;
}

export function DashboardClient({ slug }: DashboardClientProps) {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;
  const base = `/w/${slug}`;

  // Fetch stats
  const membersQuery = hooks.memberships.list(
    tenantId ? { params: { tenantId }, query: { limit: 100 } } : undefined,
    { enabled: Boolean(tenantId) }
  );
  const apiKeysQuery = hooks.apikeys.list(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled: Boolean(tenantId) }
  );
  const creditsQuery = hooks.credits.balance(
    tenantId ? { params: { tenantId } } : undefined,
    { enabled: Boolean(tenantId) }
  );

  // Extract counts - data is unwrapped by hooks to the 'data' object
  // For list endpoints: { items: [...], nextCursor?: string }
  // For single endpoints: { amount: number, ... }
  interface MembersResponse {
    items?: unknown[];
    nextCursor?: string;
  }
  interface ApiKeysResponse {
    items?: unknown[];
  }
  interface CreditsResponse {
    amount?: number;
  }

  // Safe extraction with fallbacks
  const membersRaw = membersQuery.data;
  const membersData =
    typeof membersRaw === "object" && membersRaw && "items" in membersRaw
      ? (membersRaw as MembersResponse)
      : Array.isArray(membersRaw)
        ? { items: membersRaw }
        : undefined;
  const membersCount = membersData?.items?.length ?? 0;
  const hasMoreMembers = Boolean((membersData as MembersResponse | undefined)?.nextCursor);

  const apiKeysRaw = apiKeysQuery.data;
  const apiKeysData =
    typeof apiKeysRaw === "object" && apiKeysRaw && "items" in apiKeysRaw
      ? (apiKeysRaw as ApiKeysResponse)
      : Array.isArray(apiKeysRaw)
        ? { items: apiKeysRaw }
        : undefined;
  const apiKeysCount = apiKeysData?.items?.length ?? 0;

  const creditsRaw = creditsQuery.data;
  const creditsBalance =
    (typeof creditsRaw === "object" && creditsRaw && "amount" in creditsRaw
      ? (creditsRaw as CreditsResponse).amount
      : 0) ?? 0;

  // Checklist completion states
  const hasApiKey = apiKeysCount > 0;
  const hasMultipleMembers = membersCount > 1;

  return (
    <>
      <PageHeader
        title="Home"
        subtitle="Welcome to your workspace dashboard."
      />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Team Members"
            value={hasMoreMembers ? `${membersCount}+` : membersCount}
            icon="group"
            href={`${base}/team`}
            loading={membersQuery.isLoading}
          />
          <StatCard
            title="API Keys"
            value={apiKeysCount}
            icon="key"
            href={`${base}/apikeys`}
            loading={apiKeysQuery.isLoading}
          />
          <StatCard
            title="Credits"
            value={creditsBalance.toLocaleString()}
            icon="monetization_on"
            href={`${base}/billing?tab=credits`}
            loading={creditsQuery.isLoading}
          />
          <StatCard
            title="Billing"
            value="Active"
            icon="credit_card"
            href={`${base}/billing`}
          />
        </div>

        {/* Getting Started + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Getting Started */}
          <Card>
            <Card.Header>
              <Card.Title className="text-base">Getting Started</Card.Title>
              <Card.Description>
                Complete these steps to set up your workspace.
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-1">
              <ChecklistItem done={true} title="Create your workspace" />
              <ChecklistItem
                done={hasApiKey}
                title="Create an API key"
                href={`${base}/apikeys`}
              />
              <ChecklistItem
                done={hasMultipleMembers}
                title="Invite a team member"
                href={`${base}/team`}
              />
              <ChecklistItem
                done={false}
                title="Configure settings"
                href={`${base}/settings`}
              />
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <Card.Title className="text-base">Quick Actions</Card.Title>
              <Card.Description>
                Common tasks you can do right now.
              </Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-2 sm:grid-cols-2">
              <Button variant="outlined" asChild className="justify-start gap-2">
                <Link href={`${base}/apikeys`}>
                  <Icon symbol="key" size="sm" />
                  Create API Key
                </Link>
              </Button>
              <Button variant="outlined" asChild className="justify-start gap-2">
                <Link href={`${base}/team`}>
                  <Icon symbol="group" size="sm" />
                  Manage Team
                </Link>
              </Button>
              <Button variant="outlined" asChild className="justify-start gap-2">
                <Link href={`${base}/billing`}>
                  <Icon symbol="credit_card" size="sm" />
                  View Billing
                </Link>
              </Button>
              <Button variant="outlined" asChild className="justify-start gap-2">
                <Link href={`${base}/settings`}>
                  <Icon symbol="settings" size="sm" />
                  Settings
                </Link>
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    </>
  );
}

export default DashboardClient;
