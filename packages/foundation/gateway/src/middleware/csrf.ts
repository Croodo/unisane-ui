import { HEADER_NAMES } from "../headers";
import { ERR } from "../errors/errors";
import type { AuthCtx } from "./rbac";
import { getEnv } from "@unisane/kernel";

export async function assertCsrfForCookieAuth(req: Request, ctx: AuthCtx): Promise<void> {
  // CSRF only for state-changing cookie flows (no Authorization header)
  const method = req.method.toUpperCase();
  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(method);
  const hasAuthz = Boolean(req.headers.get(HEADER_NAMES.AUTHORIZATION));
  const hasCookie = Boolean(req.headers.get("cookie"));
  if (!isStateChanging || hasAuthz || !hasCookie || !ctx.isAuthed) return;

  // In dev/test, relax CSRF to ease local iteration
  const appEnv = (getEnv().APP_ENV ?? "dev").toLowerCase();
  if (appEnv !== "prod" && appEnv !== "stage") return;

  const csrfHeader = req.headers.get(HEADER_NAMES.CSRF_TOKEN);
  const { parseCookies } = await import("./cookies");
  const cookies = parseCookies(req.headers.get("cookie"));
  const csrfCookie = cookies["csrf_token"];
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    throw ERR.forbidden("Invalid CSRF token");
  }
}

