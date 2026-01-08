import { createApi } from "@/src/sdk/server";
import {
  SidebarInset,
  SidebarProvider,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from "@/src/components/ui/sidebar";
import TenantSidebar from "@/src/components/layout/TenantSidebar";
import { DetailPanel } from "@/src/components/layout/DetailPanel";
import { notFound } from "next/navigation";
import Inset from "@/src/components/layout/Inset";
import HeaderBar from "@/src/components/layout/HeaderBar";
import { SessionProvider } from "@/src/context/SessionContext";
import { requireUser } from "@/src/app/_server/requireAuth";

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
  // Updated sidebar width to 16rem.
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
  // Type assertion needed as Me type widening doesn't perfectly align with MeGetResponse
  const initialMe = me as Parameters<typeof SessionProvider>[0]["initialMe"];
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        } as React.CSSProperties
      }
    >
      <SessionProvider initialMe={initialMe}>
        <TenantSidebar slug={slug} perms={perms} />
        <SidebarInset className="flex flex-row">
          {/* Main content area */}
          <div
            className="flex-1 min-h-0 overflow-y-auto min-w-0"
            style={
              {
                "--workspace-header-h": "3rem",
                "--workspace-header-h-md": "3.5rem",
              } as React.CSSProperties
            }
          >
            <HeaderBar defaultTitle={tenantName ?? slug} />
            <div className="py-4 md:py-6">
              <Inset>{children}</Inset>
            </div>
          </div>
          {/* Right detail panel (Zustand-controlled) */}
          <DetailPanel />
        </SidebarInset>
      </SessionProvider>
    </SidebarProvider>
  );
}
