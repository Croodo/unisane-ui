import { randomBytes } from "node:crypto";
import { buildCsrfCookie } from "@unisane/gateway";
import type { AuthCtx } from "@unisane/gateway";

export async function csrfFactory(args: {
  req: Request;
  params?: Record<string, unknown>;
  body?: unknown;
  ctx: AuthCtx;
  requestId: string;
}): Promise<Response> {
  void args;
  const token = randomBytes(32).toString("base64url");
  const cookie = buildCsrfCookie(token, { maxAgeSec: 7200 });
  return new Response(JSON.stringify({ ok: true, token }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": cookie },
  });
}
