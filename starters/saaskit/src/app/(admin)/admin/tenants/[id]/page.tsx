import { notFound } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import type { AuditListItem, WebhooksListEventsItem } from "@/src/sdk/types";
import { getEnv } from "@unisane/kernel";
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

  try {
    // Fetch tenant first to get ID, then fetch tab data in parallel
    const tenant = await api.admin.tenants.readOrNull({ params: { id } });
    if (tenant === null) return notFound();

    // Fetch tab data in parallel (best-effort)
    const [activityRes, webhooksRes] = await Promise.all([
      activeTab === "activity"
        ? api.audit.list(tenant.id, { limit: 20 }).catch(() => ({ items: [] }))
        : Promise.resolve(null),
      activeTab === "webhooks"
        ? api.webhooks
            .listEvents(tenant.id, {
              limit: 10,
              direction: "out",
              status: "failed",
            })
            .catch(() => ({ items: [] }))
        : Promise.resolve(null),
    ]);

    const activity: AuditListItem[] | null = activityRes?.items ?? null;
    const webhooks: WebhooksListEventsItem[] | null = webhooksRes?.items ?? null;

    return (
      <TenantDetailClient
        tenant={tenant}
        activity={activity}
        webhooks={webhooks}
        env={env}
      />
    );
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 403) return notFound();
    throw e;
  }
}
