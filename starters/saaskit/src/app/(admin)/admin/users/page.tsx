import { notFound, redirect } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import UsersClient from "./UsersClient";

const DEFAULT_SORT = "-updatedAt";
const DEFAULT_LIMIT = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    sort?: string;
    q?: string;
    limit?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  // Build query from URL params
  const currentSort = params.sort || DEFAULT_SORT;
  const currentLimit = Math.min(Math.max(Number(params.limit) || DEFAULT_LIMIT, 1), 100);
  const currentSearch = params.q || "";
  // Page is tracked in URL for display purposes (cursor is source of truth for data)
  const currentPage = Math.max(1, Number(params.page) || 1);

  const query = {
    sort: currentSort,
    limit: currentLimit,
    ...(params.cursor && { cursor: params.cursor }),
    ...(currentSearch && { filters: { q: currentSearch } }),
  };

  const api = await createApi();

  try {
    // Fetch data and stats in parallel
    // Stats API now supports filters for accurate filtered count
    const statsFilters = currentSearch ? { filters: { q: currentSearch } } : undefined;
    const [data, stats] = await Promise.all([
      api.admin.users.list({ query }),
      api.admin.users.stats(statsFilters).catch(() => undefined),
    ]);

    return (
      <section className="py-6">
        <UsersClient
          data={data.items}
          nextCursor={data.nextCursor}
          prevCursor={data.prevCursor}
          stats={stats}
          currentSort={currentSort}
          currentSearch={currentSearch}
          currentLimit={currentLimit}
          currentPage={currentPage}
        />
      </section>
    );
  } catch (e) {
    const err = e as Error & { status?: number; requestId?: string };

    if (err.status === 401) {
      return redirect(`/login?next=${encodeURIComponent("/admin/users")}`);
    }
    if (err.status === 403) {
      return notFound();
    }
    if (err.status === 500) {
      return (
        <section className="py-6 space-y-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <div className="rounded border bg-muted/30 p-4 text-sm">
            <div className="font-medium">Cannot load admin users.</div>
            <div className="mt-1 text-muted-foreground">
              Server error. Ensure MongoDB is running and MONGODB_URI is set.
            </div>
            {err.requestId && (
              <div className="mt-2 text-muted-foreground">
                Reference: <span className="font-mono">{err.requestId}</span>
              </div>
            )}
          </div>
        </section>
      );
    }
    throw e;
  }
}
