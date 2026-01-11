import { createApi } from "@/src/sdk/server";
import { requireUser } from "@/src/app/_server/requireAuth";
import { Card } from "@unisane/ui/components/card";
import { Typography } from "@unisane/ui/components/typography";
import { Icon } from "@unisane/ui/primitives/icon";
import Link from "next/link";

type MembershipItem = {
  tenantId: string;
  tenantSlug?: string;
  tenantName?: string;
  roles: string[];
};

export default async function WorkspacesPage() {
  const api = await createApi();
  await requireUser("/workspaces", api);
  const page = await api.me.memberships({ query: { limit: 50 } });
  const items = (page.items ?? []) as MembershipItem[];
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Typography variant="headlineSmall" className="mb-2">Your workspaces</Typography>
      <Typography variant="bodyMedium" className="mb-6 text-on-surface-variant">
        Pick a workspace to continue.
      </Typography>
      {items.length === 0 ? (
        <Card variant="outlined" className="p-6 text-center">
          <Typography variant="bodyMedium" className="text-on-surface-variant">
            You don't belong to any workspaces yet.{" "}
            <Link className="text-primary underline" href="/welcome">
              Create one
            </Link>
            .
          </Typography>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {items.map((it) => (
            <li key={`${it.tenantId}`}>
              <Link
                className="block"
                href={
                  it.tenantSlug ? `/w/${it.tenantSlug}` : `/w/${it.tenantId}`
                }
              >
                <Card variant="outlined" className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-container-low transition-colors">
                  <div>
                    <Typography variant="titleMedium">
                      {it.tenantName ?? it.tenantSlug ?? it.tenantId}
                    </Typography>
                    <Typography variant="labelSmall" className="text-on-surface-variant">
                      Roles: {it.roles.join(", ") || "member"}
                    </Typography>
                  </div>
                  <Icon symbol="arrow_forward" className="text-on-surface-variant" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
