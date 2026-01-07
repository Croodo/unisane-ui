import { redirect } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import { requireUser } from "@/src/app/_server/requireAuth";

// Item type inferred from API; explicit alias removed to avoid unused var

export default async function WorkspacesPage() {
  const api = await createApi();
  const { me } = await requireUser("/workspaces", api);
  const page = await api.me.memberships({ query: { limit: 50 } });
  const items = page.items ?? [];
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-xl font-semibold">Your workspaces</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick a workspace to continue.
      </p>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          You don’t belong to any workspaces yet.{" "}
          <a className="underline" href="/welcome">
            Create one
          </a>
          .
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((it) => (
            <li key={`${it.tenantId}`}>
              <a
                className="flex w-full items-center justify-between rounded border px-4 py-3 text-left hover:bg-muted"
                href={
                  it.tenantSlug ? `/w/${it.tenantSlug}` : `/w/${it.tenantId}`
                }
              >
                <div>
                  <div className="font-medium">
                    {it.tenantName ?? it.tenantSlug ?? it.tenantId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Roles: {it.roles.join(", ") || "member"}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Open</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
