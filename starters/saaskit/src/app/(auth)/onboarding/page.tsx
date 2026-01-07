import { redirect } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import { requireUser } from "@/src/app/_server/requireAuth";

export const dynamic = "force-dynamic";

export default async function OnboardingRedirect() {
  const api = await createApi();
  const { me } = await requireUser("/onboarding", api);
  const destination = me.tenantSlug
    ? `/w/${me.tenantSlug}/dashboard`
    : me.tenantId
      ? "/workspaces"
      : "/welcome";
  redirect(destination);
}
