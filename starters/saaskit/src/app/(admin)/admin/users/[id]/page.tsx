import { notFound } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import type { UsersAdminMembershipsByUserItem } from "@/src/sdk/types";
import { UserDetailClient } from "./UserDetailClient";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const api = await createApi();

  try {
    // Fetch user and memberships in parallel for faster page load
    const [user, membershipsResponse] = await Promise.all([
      api.admin.users.readOrNull({ params: { id } }),
      api.admin.users
        .membershipsByUser({ params: { id }, query: { limit: 50 } })
        .catch(() => ({ items: [] })), // Graceful fallback if memberships fail
    ]);

    if (user === null) return notFound();

    const memberships: UsersAdminMembershipsByUserItem[] =
      membershipsResponse.items ?? [];

    return <UserDetailClient user={user} memberships={memberships} />;
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 403) return notFound();
    throw e;
  }
}
