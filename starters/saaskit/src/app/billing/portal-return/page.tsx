import { redirect } from "next/navigation";
import { requireUser } from "@/src/app/_server/requireAuth";

export const runtime = "nodejs";

export default async function BillingPortalReturnPage() {
  const nextPath = "/billing/portal-return";
  const { me } = await requireUser(nextPath);

  const slug =
    (me as { tenantSlug?: string | null }).tenantSlug ??
    (me as { tenantId?: string | null }).tenantId ??
    null;

  if (slug) {
    redirect(`/w/${slug}/billing`);
  }

  redirect("/workspaces");
}

