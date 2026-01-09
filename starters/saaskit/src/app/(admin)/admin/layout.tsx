import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/app/_server/requireAuth";
import { AdminShell } from "@/src/components/layout/AdminShell";

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

  return <AdminShell>{children}</AdminShell>;
}
