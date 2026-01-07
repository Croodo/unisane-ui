"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@/src/hooks/useSession";


export default function Home() {
  const { me, loading, error } = useSession();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Welcome</h1>
            <p className="text-sm text-muted-foreground">
              You’re not signed in. Please <Link href="/login" className="underline">sign in</Link> to continue.
            </p>
          </div>
        ) : me?.userId ? (
          <div className="space-y-6">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card
                title="Open workspace"
                desc={me.tenantName ?? me.tenantSlug ?? "Go to your workspace"}
                href={me.tenantSlug ? `/w/${me.tenantSlug}/dashboard` : me.tenantId ? "/workspaces" : "/welcome"}
                cta={me.tenantId ? "Open" : "Create"}
              />
              <Card title="Switch workspace" desc="Pick another workspace" href="/workspaces" cta="Choose" />
              <Card title="Create workspace" desc="Start a new workspace" href="/welcome" cta="Create" />
            </div>
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Quick links</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <Link className="rounded border px-3 py-1 hover:bg-muted" href="/workspaces">Workspaces</Link>
                <Link className="rounded border px-3 py-1 hover:bg-muted" href="/welcome">Create</Link>
                <Link className="rounded border px-3 py-1 hover:bg-muted" href="/onboarding">Re-detect</Link>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Welcome</h1>
            <p className="text-sm text-muted-foreground">
              You’re not signed in. Please <Link href="/login" className="underline">sign in</Link> to continue.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Card(props: { title: string; desc: string; href: string; cta: string }) {
  return (
    <Link href={props.href} className="block rounded border p-4 hover:bg-muted">
      <div className="mb-1 text-sm font-medium">{props.title}</div>
      <div className="mb-3 text-sm text-muted-foreground">{props.desc}</div>
      <div className="text-sm font-medium text-primary">{props.cta} →</div>
    </Link>
  );
}
