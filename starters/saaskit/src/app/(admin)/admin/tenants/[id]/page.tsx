import { notFound } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import type { AuditListItem, WebhooksListEventsItem } from "@/src/sdk/types";
import { getEnv } from "@/src/shared/env";
import { TenantDetailClient } from "./TenantDetailClient";

export default async function AdminTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = (await (searchParams ?? Promise.resolve({}))) as Record<
    string,
    string | string[] | undefined
  >;
  const activeTab = typeof sp?.tab === "string" ? sp.tab : "overview";
  const api = await createApi();
  const env = getEnv().APP_ENV;

  let tenant;
  let activity: AuditListItem[] | null = null;
  let webhooks: WebhooksListEventsItem[] | null = null;

  try {
    tenant = await api.admin.tenants.readOrNull({ params: { id } });
    if (tenant === null) return notFound();

    // Fetch tab data best-effort
    if (activeTab === "activity") {
      const res = await api.audit.list(tenant.id, { limit: 20 });
      activity = res.items ?? [];
    }
    if (activeTab === "webhooks") {
      const res = await api.webhooks.listEvents(tenant.id, {
        limit: 10,
        direction: "out",
        status: "failed",
      });
      webhooks = res.items ?? [];
    }
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 403) return notFound();
    throw e;
  }

  return (
    <TenantDetailClient
      tenant={tenant}
      activity={activity}
      webhooks={webhooks}
      env={env}
    />
  );
}
