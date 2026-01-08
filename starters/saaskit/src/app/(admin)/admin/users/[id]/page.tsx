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

  let user;
  let memberships: UsersAdminMembershipsByUserItem[] = [];

  try {
    user = await api.admin.users.readOrNull({ params: { id } });
    if (user === null) return notFound();

    // Admin: fetch memberships for this user
    const m = await api.admin.users.membershipsByUser({
      params: { id },
      query: { limit: 50 },
    });
    memberships = m.items ?? [];
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 403) return notFound();
    throw e;
  }

  return <UserDetailClient user={user} memberships={memberships} />;
}
