"use client";

import Link from "next/link";
import { useSession } from "@/src/hooks/use-session";
import { Card } from "@unisane/ui/components/card";
import { Typography } from "@unisane/ui/components/typography";
import { Icon } from "@unisane/ui/primitives/icon";

export default function Home() {
  const { me, loading, error } = useSession();

  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <Typography variant="bodyMedium" className="text-on-surface-variant">Loading…</Typography>
        ) : error ? (
          <div className="space-y-4">
            <Typography variant="headlineSmall">Welcome</Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant">
              You're not signed in. Please <Link href="/login" className="text-primary underline">sign in</Link> to continue.
            </Typography>
          </div>
        ) : me?.userId ? (
          <div className="space-y-6">
            <Typography variant="headlineSmall">Welcome back</Typography>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <QuickCard
                title="Open workspace"
                desc={me.tenantName ?? me.tenantSlug ?? "Go to your workspace"}
                href={me.tenantSlug ? `/w/${me.tenantSlug}/dashboard` : me.scopeId ? "/workspaces" : "/welcome"}
                cta={me.scopeId ? "Open" : "Create"}
              />
              <QuickCard title="Switch workspace" desc="Pick another workspace" href="/workspaces" cta="Choose" />
              <QuickCard title="Create workspace" desc="Start a new workspace" href="/welcome" cta="Create" />
            </div>
            <section className="space-y-2">
              <Typography variant="labelMedium" className="text-on-surface-variant">Quick links</Typography>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-sm border border-outline-variant px-3 py-1 text-body-medium hover:bg-surface-container-low transition-colors" href="/workspaces">Workspaces</Link>
                <Link className="rounded-sm border border-outline-variant px-3 py-1 text-body-medium hover:bg-surface-container-low transition-colors" href="/welcome">Create</Link>
                <Link className="rounded-sm border border-outline-variant px-3 py-1 text-body-medium hover:bg-surface-container-low transition-colors" href="/onboarding">Re-detect</Link>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <Typography variant="headlineSmall">Welcome</Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant">
              You're not signed in. Please <Link href="/login" className="text-primary underline">sign in</Link> to continue.
            </Typography>
          </div>
        )}
      </main>
    </div>
  );
}

function QuickCard(props: { title: string; desc: string; href: string; cta: string }) {
  return (
    <Link href={props.href} className="block">
      <Card variant="outlined" className="p-4 hover:bg-surface-container-low transition-colors">
        <Typography variant="titleMedium" className="mb-1">{props.title}</Typography>
        <Typography variant="bodySmall" className="mb-3 text-on-surface-variant">{props.desc}</Typography>
        <div className="flex items-center gap-1 text-primary">
          <Typography variant="labelMedium">{props.cta}</Typography>
          <Icon symbol="arrow_forward" size="xs" />
        </div>
      </Card>
    </Link>
  );
}
