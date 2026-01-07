import { redirect, notFound } from "next/navigation";
import { createApi } from "@/src/sdk/server";
import type { ServerApi as BaseServerApi } from "@/src/sdk/server";
import type { MeGetResponse } from "@/src/sdk/types";

export type RequireUserResult = {
  api: BaseServerApi;
  me: MeGetResponse;
};

export async function requireUser(
  nextPath: string,
  api?: BaseServerApi
): Promise<RequireUserResult> {
  const client = api ?? (await createApi());
  try {
    const res = await client.me.get();
    console.log("[requireUser] raw res:", JSON.stringify(res));
    const me = (res as { data?: MeGetResponse }).data ?? res;
    console.log("[requireUser] unwrapped me:", JSON.stringify(me));

    if (!me.userId) {
      console.log(
        "[requireUser] No userId found, redirecting to login. Next:",
        nextPath
      );
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    }
    return { api: client, me };
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 401) {
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    }
    throw e;
  }
}

export async function requireAdmin(
  nextPath = "/admin",
  api?: BaseServerApi
): Promise<RequireUserResult> {
  const { api: client, me } = await requireUser(nextPath, api);
  const isPlatformOwner = Boolean(
    (me as { isSuperAdmin?: boolean }).isSuperAdmin
  );
  const isGlobalSuper =
    String((me as { globalRole?: string | null }).globalRole ?? "") ===
    "super_admin";

  if (!isPlatformOwner && !isGlobalSuper) {
    notFound();
  }

  return { api: client, me };
}
