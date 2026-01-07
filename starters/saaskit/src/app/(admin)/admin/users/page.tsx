import { notFound, redirect } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import type { UsersAdminListResponse as AdminUsersList } from "@/src/sdk/types";
import UsersClient from "./UsersClient";
import { deriveAdminUserListQuery } from "@/src/sdk/registries/admin.users.grid";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; sort?: string; q?: string; filters?: string; limit?: string }>;
}) {
  const { cursor, sort, q, filters, limit } = await searchParams;
  const { query, uiFilters } = deriveAdminUserListQuery({
    cursor: cursor ?? null,
    sort: sort ?? null,
    q: q ?? null,
    filters: filters ?? null,
    ...(limit ? { limit: Number(limit) } : {}),
    defaults: { sort: "-updatedAt", limit: 25 },
  });
  const api = await createApi();

  let seed: AdminUsersList;
  try {
    seed = await api.admin.users.list({ query });
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    const requestId = (e as Error & { requestId?: string }).requestId;
    if (status === 401) return redirect(`/login?next=${encodeURIComponent("/admin")}`);
    if (status === 403) return notFound();
    if (status === 500) {
      return (
        <section className="py-6 space-y-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <div className="rounded border bg-muted/30 p-4 text-sm">
            <div className="font-medium">Cannot load admin users.</div>
            <div className="mt-1 text-muted-foreground">
              The server returned a 500 error. In local/dev, this usually means
              the database isn’t reachable. Ensure MongoDB is running and
              MONGODB_URI is set correctly.
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
      <UsersClient
        initial={seed}
        sort={query.sort as string}
        limit={query.limit}
        initialFilters={uiFilters}
      />
    </section>
  );
}
