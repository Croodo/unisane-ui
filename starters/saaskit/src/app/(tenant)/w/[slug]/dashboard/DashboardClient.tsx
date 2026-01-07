"use client";

import Link from "next/link";
import { useSession } from "@/src/hooks/useSession";
import { hooks } from "@/src/sdk/hooks";
import { PageHeader } from "@/src/context/usePageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Users,
  KeyRound,
  CreditCard,
  Coins,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  href?: string;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  loading,
}: StatCardProps) {
  const content = (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
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
  const Icon = done ? CheckCircle2 : Circle;
  const content = (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-md ${
        done ? "text-muted-foreground" : "hover:bg-muted/50"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${done ? "text-green-500" : "text-muted-foreground"}`}
      />
      <span className={done ? "line-through" : ""}>{title}</span>
      {!done && href && <ArrowRight className="h-3 w-3 ml-auto" />}
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
  const hasMoreMembers = Boolean(membersData?.nextCursor);

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
            icon={Users}
            href={`${base}/team`}
            loading={membersQuery.isLoading}
          />
          <StatCard
            title="API Keys"
            value={apiKeysCount}
            icon={KeyRound}
            href={`${base}/apikeys`}
            loading={apiKeysQuery.isLoading}
          />
          <StatCard
            title="Credits"
            value={creditsBalance.toLocaleString()}
            icon={Coins}
            href={`${base}/billing?tab=credits`}
            loading={creditsQuery.isLoading}
          />
          <StatCard
            title="Billing"
            value="Active"
            icon={CreditCard}
            href={`${base}/billing`}
          />
        </div>

        {/* Getting Started + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Getting Started</CardTitle>
              <CardDescription>
                Complete these steps to set up your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
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
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you can do right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" asChild className="justify-start gap-2">
                <Link href={`${base}/apikeys`}>
                  <KeyRound className="h-4 w-4" />
                  Create API Key
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start gap-2">
                <Link href={`${base}/team`}>
                  <Users className="h-4 w-4" />
                  Manage Team
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start gap-2">
                <Link href={`${base}/billing`}>
                  <CreditCard className="h-4 w-4" />
                  View Billing
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start gap-2">
                <Link href={`${base}/settings`}>
                  <Coins className="h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default DashboardClient;
