import { createApi } from "@/src/sdk/server";
import { notFound } from "next/navigation";
import { SessionProvider } from "@/src/context/SessionContext";
import { requireUser } from "@/src/app/_server/requireAuth";
import { WorkspaceShell } from "@/src/components/layout/WorkspaceShell";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const api = await createApi();

  // Resolve tenant by slug for header context and 404 enforcement
  let tenantName: string | null = null;
  try {
    const t = await api.tenants.findBySlug(slug);
    if (!t) notFound();
    tenantName = (t as { name?: string | null })?.name ?? null;
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 404) notFound();
    // otherwise ignore for header, slug fallback
  }

  // Auth check + fetch perms for SSR nav gating
  const { me } = await requireUser(`/w/${slug}/dashboard`, api);
  const perms = Array.isArray((me as { perms?: unknown }).perms)
    ? ((me as { perms?: string[] }).perms ?? [])
    : [];

  // Wrap subtree with session for instant hydration
  const initialMe = me as Parameters<typeof SessionProvider>[0]["initialMe"];

  return (
    <SessionProvider initialMe={initialMe}>
      <WorkspaceShell slug={slug} tenantName={tenantName} perms={perms}>
        {children}
      </WorkspaceShell>
    </SessionProvider>
  );
}
