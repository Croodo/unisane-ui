import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import {
  StatsCards,
  type StatItem,
} from "@/src/components/dashboard/StatsCards";
import UsersTable from "./UsersTable";
import { UsersTableLoading } from "./UsersTableLoading";

const DEFAULT_SORT = "-updatedAt";
const DEFAULT_LIMIT = 25;

interface SearchParams {
  cursor?: string;
  sort?: string;
  q?: string;
  limit?: string;
  page?: string;
}

// Stats section - streams independently
async function UsersStats({ searchParams }: { searchParams: SearchParams }) {
  const api = await createApi();
  const currentSearch = searchParams.q || "";
  const statsFilters = currentSearch
    ? { filters: { q: currentSearch } }
    : undefined;

  const stats = await api.admin.users.stats(statsFilters).catch(() => undefined);

  const statsItems: StatItem[] = [
    { label: "Total Users", value: stats?.total ?? 0, icon: "group" },
    {
      label: "Super Admins",
      value: stats?.facets?.globalRole?.["super-admin"] ?? 0,
      icon: "shield",
    },
    {
      label: "Standard Users",
      value: stats?.facets?.globalRole?.["user"] ?? 0,
      icon: "verified_user",
    },
  ];

  return <StatsCards items={statsItems} columns={3} />;
}

// Table section - streams independently
async function UsersTableSection({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentSort = searchParams.sort || DEFAULT_SORT;
  const currentLimit = Math.min(
    Math.max(Number(searchParams.limit) || DEFAULT_LIMIT, 1),
    100
  );
  const currentSearch = searchParams.q || "";
  const currentPage = Math.max(1, Number(searchParams.page) || 1);

  const query = {
    sort: currentSort,
    limit: currentLimit,
    ...(searchParams.cursor && { cursor: searchParams.cursor }),
    ...(currentSearch && { filters: { q: currentSearch } }),
  };

  const api = await createApi();

  try {
    // Fetch both data and stats for table (stats needed for totalCount)
    const statsFilters = currentSearch
      ? { filters: { q: currentSearch } }
      : undefined;
    const [data, stats] = await Promise.all([
      api.admin.users.list({ query }),
      api.admin.users.stats(statsFilters).catch(() => undefined),
    ]);

    return (
      <UsersTable
        data={data.items}
        nextCursor={data.nextCursor}
        prevCursor={data.prevCursor}
        stats={stats}
        currentSort={currentSort}
        currentSearch={currentSearch}
        currentLimit={currentLimit}
        currentPage={currentPage}
      />
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
        <div className="rounded-sm border border-outline-variant bg-surface-container-low p-4 text-body-medium">
          <div className="font-medium">Cannot load admin users.</div>
          <div className="mt-1 text-on-surface-variant">
            Server error. Ensure MongoDB is running and MONGODB_URI is set.
          </div>
          {err.requestId && (
            <div className="mt-2 text-on-surface-variant">
              Reference: <span className="font-mono">{err.requestId}</span>
            </div>
          )}
        </div>
      );
    }
    throw e;
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <section className="">
      <div className="mt-4">
        <Suspense fallback={<StatsCards items={[]} columns={3} isLoading />}>
          <UsersStats searchParams={params} />
        </Suspense>
        <Suspense fallback={<UsersTableLoading />}>
          <UsersTableSection searchParams={params} />
        </Suspense>
      </div>
    </section>
  );
}
