import { createApi } from "@/src/sdk/server";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import TenantsClient from "./TenantsClient";
import type { TenantsAdminListResponse as TenantsAdminList } from "@/src/sdk/types";
import { deriveAdminTenantListQuery } from "@/src/sdk/registries/admin.tenants.grid";

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; sort?: string; q?: string; filters?: string }>;
}) {
  const { cursor, sort, q, filters } = await searchParams;
  const { query, uiFilters } = deriveAdminTenantListQuery({
    cursor: cursor ?? null,
    sort: sort ?? null,
    q: q ?? null,
    filters: filters ?? null,
    limit: 50,
    defaults: { sort: "-createdAt", limit: 50 },
  });
  const api = await createApi();
  let initial: TenantsAdminList;
  try {
    const res = await api.admin.tenants.list({ query });
    initial = res as unknown as TenantsAdminList;
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    const requestId = (e as Error & { requestId?: string }).requestId;
    if (status === 401) {
      return redirect(`/login?next=${encodeURIComponent("/admin")}`);
    }
    if (status === 403) notFound();
    if (status === 500) {
      return (
        <section className="py-6 space-y-3">
          <h2 className="text-lg font-semibold">Tenants</h2>
          <div className="rounded border bg-muted/30 p-4 text-sm">
            <div className="font-medium">Cannot load admin tenants.</div>
            <div className="mt-1 text-muted-foreground">
              The server returned a 500 error. In local/dev, this is commonly
              due to the database not being reachable. Ensure your MongoDB is
              running and that MONGODB_URI is set correctly, or point to a local
              instance.
            </div>
            {requestId ? (
              <div className="mt-2 text-muted-foreground">
                Reference ID: <span className="font-mono">{requestId}</span>
              </div>
            ) : null}
          </div>
        </section>
      );
    }
    throw e;
  }
  return (
    <section className="py-6">
      <TenantsClient
        initial={initial}
        initialFilters={uiFilters}
        limit={query.limit}
        sort={query.sort as string}
      />
    </section>
  );
}
