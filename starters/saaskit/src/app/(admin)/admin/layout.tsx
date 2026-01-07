import {
  SidebarInset,
  SidebarProvider,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from "@/src/components/ui/sidebar";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import { DetailPanel } from "@/src/components/layout/DetailPanel";
import { redirect } from "next/navigation";
import Inset from "@/src/components/layout/Inset";
import HeaderBar from "@/src/components/layout/HeaderBar";
import { AdminBanner } from "@/src/components/admin";
import { requireAdmin } from "@/src/app/_server/requireAuth";
import type { CSSProperties } from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin("/admin");
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 401) redirect(`/login?next=${encodeURIComponent(`/admin`)}`);
    throw e;
  }

  // Keep admin shell aligned with tenant shell widths.
  // Updated sidebar width to 16rem.
  const sidebarStyle = {
    "--sidebar-width": SIDEBAR_WIDTH,
    "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
  } as CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <AdminSidebar />
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
          <AdminBanner />
          <HeaderBar defaultTitle="Admin" />
          <div className="py-4 md:py-6">
            <Inset>{children}</Inset>
          </div>
        </div>
        {/* Right detail panel (Zustand-controlled) */}
        <DetailPanel />
      </SidebarInset>
    </SidebarProvider>
  );
}
