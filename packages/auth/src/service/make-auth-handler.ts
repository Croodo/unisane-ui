import type { AuthCtx } from "@unisane/gateway";
import { getEnv } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { signJwtRS256 } from "@unisane/gateway";
import { buildAccessTokenCookie } from "@unisane/gateway";

type AuthHandlerOpts<TBody, TResult extends { userId: string }> = {
  /** Check if this auth method is enabled (e.g. AUTH_PASSWORD_ENABLED) */
  checkEnabled?: () => boolean;
  /** Error message if disabled */
  disabledMessage?: string;
  /** Core auth logic that returns userId */
  handler: (body: TBody) => Promise<TResult>;
  /** JWT expiration in seconds (default: 3600) */
  tokenExpSec?: number;
  /** Cookie max age in seconds (default: 3600) */
  cookieMaxAgeSec?: number;
  /** HTTP status code on success (default: 200) */
  successStatus?: number;
  /** Additional response body fields beyond { ok: true } */
  extraResponse?: (result: TResult) => Record<string, unknown>;
};

type AuthHandlerArgs<TBody> = {
  req: Request;
  body: TBody;
  ctx: AuthCtx;
  requestId: string;
};

/**
 * Generic auth handler factory that wraps core auth logic with:
 * - JWT signing
 * - Cookie setting
 * - Standard response format
 * - Optional token return in body (when ?return=token)
 */
export function makeAuthHandler<TBody, TResult extends { userId: string }>(
  opts: AuthHandlerOpts<TBody, TResult>
) {
  return async function authHandler(args: AuthHandlerArgs<TBody>): Promise<Response> {
    void args.ctx;
    void args.requestId;

    const { JWT_PRIVATE_KEY } = getEnv();
    if (!JWT_PRIVATE_KEY) throw ERR.misconfigured("JWT_PRIVATE_KEY not configured");

    // Check if auth method is enabled
    if (opts.checkEnabled && !opts.checkEnabled()) {
      throw ERR.forbidden(opts.disabledMessage ?? "Auth method disabled");
    }

    // Execute core auth logic
    const result = await opts.handler(args.body);

    // Sign JWT and build cookie
    const expSec = opts.tokenExpSec ?? getEnv().JWT_ACCESS_TTL_SEC;
    const token = signJwtRS256({ sub: result.userId }, JWT_PRIVATE_KEY, { expSec });
    const cookie = buildAccessTokenCookie(token, { maxAgeSec: opts.cookieMaxAgeSec ?? expSec });

    // Build response body
    const includeToken = new URL(args.req.url).searchParams.get("return") === "token";
    const bodyJson: Record<string, unknown> = { ok: true };
    if (includeToken) bodyJson.token = token;
    if (opts.extraResponse) Object.assign(bodyJson, opts.extraResponse(result));

    return new Response(JSON.stringify(bodyJson), {
      status: opts.successStatus ?? 200,
      headers: { "content-type": "application/json", "set-cookie": cookie },
    });
  };
}

/**
 * Variant for auth flows that don't issue tokens (e.g. OTP start, reset start)
 */
export function makeAuthStartHandler<TBody, TResult>(opts: {
  checkEnabled?: () => boolean;
  disabledMessage?: string;
  handler: (body: TBody) => Promise<TResult>;
  successStatus?: number;
  buildResponse?: (result: TResult) => Record<string, unknown>;
}) {
  return async function authStartHandler(args: AuthHandlerArgs<TBody>): Promise<Response> {
    void args.ctx;
    void args.requestId;

    if (opts.checkEnabled && !opts.checkEnabled()) {
      throw ERR.forbidden(opts.disabledMessage ?? "Auth method disabled");
    }

    const result = await opts.handler(args.body);
    const bodyJson = opts.buildResponse ? opts.buildResponse(result) : { ok: true };

    return new Response(JSON.stringify(bodyJson), {
      status: opts.successStatus ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
}
