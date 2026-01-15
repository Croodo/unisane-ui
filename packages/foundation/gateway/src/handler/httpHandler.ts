import type { ZodTypeAny } from "zod";
import { z } from "zod";
import type { Permission, AuthCtx } from "../middleware/rbac";
import { withIdem } from "../middleware/idempotency";
import { toHttp, ERR } from "../errors/errors";
import { HEADER_NAMES } from "../headers";
import { withRequest } from "../logger";
import { guard } from '../middleware/guard';
import type { GuardOpts as GuardOptsInternal } from '../middleware/guard';
import { observeHttp } from "../telemetry";
import type { OpKey } from "../rate-limits";
import { runWithScopeContext, type ScopeType, waitForBootstrap } from "@unisane/kernel";
import { sanitizeRequestId } from "../middleware/validate";

type HandlerOpts = {
  op?: OpKey;
  zod?: ZodTypeAny;
  zodParams?: ZodTypeAny;
  perm?: Permission;
  idempotent?: boolean;
  requireTenantMatch?: boolean;
  requireSuperAdmin?: boolean;
  requireUser?: boolean;
  allowUnauthed?: boolean;
  successStatus?: number;
  /** Scope type for this handler. Defaults to 'tenant' for backward compatibility. */
  scopeType?: ScopeType;
};

/**
 * Internal context returned from handler setup.
 * Contains all the common setup work for both makeHandler and makeHandlerRaw.
 */
interface HandlerSetupContext<Body, Params> {
  authCtx: AuthCtx;
  body: Body;
  params: Params;
  rl: { remaining: number; resetAt: number } | null;
  requestId: string;
  effectiveScopeId: string | undefined;
  startedAt: number;
  path: string;
}

/**
 * Shared setup logic for both makeHandler and makeHandlerRaw.
 * Extracts route params, runs guards, validates scope, etc.
 */
async function _setupHandler<Body, Params extends Record<string, unknown>>(
  req: Request,
  route: { params: Params },
  opts: HandlerOpts
): Promise<HandlerSetupContext<Body, Params>> {
  // Next.js 16: route.params is a Promise; unwrap once here
  const routeParams: Params =
    route?.params &&
    typeof (route.params as unknown as Promise<unknown>).then === "function"
      ? await (route.params as unknown as Promise<Params>)
      : route.params;

  const requestId = sanitizeRequestId(req.headers.get(HEADER_NAMES.REQUEST_ID));
  const startedAt = Date.now();
  let path = "";
  try {
    path = new URL(req.url).pathname;
  } catch {}

  const { ctx: authCtx, body, params, rl } = await guard<Body, Params>(
    req,
    routeParams,
    opts as unknown as GuardOptsInternal<Body, Params>
  );

  // Create scope context from auth context
  // Prefer URL path tenantId over session tenantId for routes like /tenants/[tenantId]/...
  const routeTenantId = (params as { tenantId?: string } | undefined)?.tenantId;
  const effectiveScopeId = routeTenantId || authCtx.tenantId;

  // Validate scope ID is present for protected routes
  // Super admins can access platform-wide routes without a tenant scope
  if (!effectiveScopeId && !opts.allowUnauthed && !authCtx.isSuperAdmin) {
    throw ERR.forbidden('Scope context required');
  }

  return {
    authCtx,
    body: body as Body,
    params,
    rl,
    requestId,
    effectiveScopeId,
    startedAt,
    path,
  };
}

// Overload: zod provided → infer Body from schema output
export function makeHandler<
  Z extends ZodTypeAny,
  Result = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: Omit<HandlerOpts, "zod"> & { zod: Z },
  fn: (args: {
    req: Request;
    ctx: AuthCtx;
    body: z.output<Z>;
    params: Params;
    requestId: string;
  }) => Promise<Result>
): (req: Request, route: { params: Params }) => Promise<Response>;
// Overload: no zod → Body specified by caller (default unknown)
export function makeHandler<
  Body = unknown,
  Result = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: Omit<HandlerOpts, "zod"> & { zod?: never },
  fn: (args: {
    req: Request;
    ctx: AuthCtx;
    body: Body;
    params: Params;
    requestId: string;
  }) => Promise<Result>
): (req: Request, route: { params: Params }) => Promise<Response>;
export function makeHandler<
  Body = unknown,
  Result = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: HandlerOpts,
  fn: (args: {
    req: Request;
    ctx: AuthCtx;
    body: Body;
    params: Params;
    requestId: string;
  }) => Promise<Result>
): (req: Request, route: { params: Params }) => Promise<Response> {
  return async (req: Request, route: { params: Params }) => {
    // Initialize for error handling scope
    let requestId = "";
    let startedAt = Date.now();
    let path = "";

    try {
      // Wait for bootstrap to complete (handles Next.js 16 Turbopack timing)
      await waitForBootstrap();

      const setup = await _setupHandler<Body, Params>(req, route, opts);
      requestId = setup.requestId;
      startedAt = setup.startedAt;
      path = setup.path;

      const { authCtx, body, params, rl, effectiveScopeId } = setup;

      // Run handler within scope context - all downstream code has access to getScope()
      return await runWithScopeContext({
        scope: { type: opts.scopeType ?? 'tenant', id: effectiveScopeId || '__anonymous__' },
        requestId,
        userId: authCtx.userId,
        metadata: {
          method: req.method,
          path,
          op: opts.op,
        },
      }, async () => {
        const log = withRequest({
          requestId,
          method: req.method,
          path,
          op: opts.op ?? null,
          tenantId: effectiveScopeId ?? null,
          userId: authCtx.userId ?? null,
        });
        const exec = async () =>
          fn({ req, ctx: authCtx, body, params, requestId });
        const data = opts.idempotent
          ? await withIdem(req.headers.get(HEADER_NAMES.IDEMPOTENCY_KEY), exec, req)
          : await exec();
        const headers: Record<string, string> = {
          "content-type": "application/json",
          [HEADER_NAMES.REQUEST_ID]: requestId,
        };
        if (rl) {
          headers[HEADER_NAMES.RATE_REMAINING] = String(Math.max(0, Math.floor(rl.remaining)));
          headers[HEADER_NAMES.RATE_RESET] = String(Math.floor(rl.resetAt));
        }
        const statusOk = opts.successStatus ?? 200;
        const ms = Date.now() - startedAt;
        try {
          log.info("request completed", { status: statusOk, ms, idempotent: Boolean(opts.idempotent), perm: opts.perm ?? null });
        } catch {}
        try {
          observeHttp({ op: opts.op ?? null, method: req.method, status: statusOk, ms });
        } catch {}
        return new Response(JSON.stringify({ ok: true, data }), {
          status: statusOk,
          headers,
        });
      });
    } catch (e) {
      const res = toHttp(e, requestId);
      try {
        const ms = Date.now() - startedAt;
        const log2 = withRequest({ requestId, method: req.method, path, op: opts.op ?? null });
        log2.info("request errored", { status: res.status, ms });
        observeHttp({ op: opts.op ?? null, method: req.method, status: res.status, ms });
      } catch {}
      return res;
    }
  };
}

// Raw variant: centralizes guard + zod + rate limit but lets handler return a custom Response (for Set-Cookie, streams, etc.)
// Overload: zod provided → infer Body from schema output
export function makeHandlerRaw<
  Z extends ZodTypeAny,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: Omit<HandlerOpts, "zod"> & {
    zod: Z;
    rateKey?: (args: {
      req: Request;
      ctx: AuthCtx;
      body: z.output<Z>;
      params: Params;
    }) => string;
  },
  fn: (args: {
    req: Request;
    ctx: AuthCtx;
    body: z.output<Z>;
    params: Params;
    requestId: string;
  }) => Promise<Response>
): (req: Request, route: { params: Params }) => Promise<Response>;
// Overload: no zod → Body provided by caller
export function makeHandlerRaw<
  Body = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: Omit<HandlerOpts, "zod"> & {
    zod?: never;
    rateKey?: (args: {
      req: Request;
      ctx: AuthCtx;
      body: Body;
      params: Params;
    }) => string;
  },
  fn: (args: {
    req: Request;
    ctx: AuthCtx;
    body: Body;
    params: Params;
    requestId: string;
  }) => Promise<Response>
): (req: Request, route: { params: Params }) => Promise<Response>;
export function makeHandlerRaw<
  Body = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: HandlerOpts & {
    rateKey?: (args: {
      req: Request;
      ctx: AuthCtx;
      body: Body;
      params: Params;
    }) => string;
  },
  fn: (args: {
    req: Request;
    ctx: AuthCtx;
    body: Body;
    params: Params;
    requestId: string;
  }) => Promise<Response>
): (req: Request, route: { params: Params }) => Promise<Response> {
  return async (req: Request, route: { params: Params }) => {
    // Initialize for error handling scope
    let requestId = "";
    let startedAt = Date.now();
    let path = "";

    try {
      // Wait for bootstrap to complete (handles Next.js 16 Turbopack timing)
      await waitForBootstrap();

      const setup = await _setupHandler<Body, Params>(req, route, opts);
      requestId = setup.requestId;
      startedAt = setup.startedAt;
      path = setup.path;

      const { authCtx, body, params, rl, effectiveScopeId } = setup;

      // Run handler within scope context - all downstream code has access to getScope()
      return await runWithScopeContext({
        scope: { type: opts.scopeType ?? 'tenant', id: effectiveScopeId || '__anonymous__' },
        requestId,
        userId: authCtx.userId,
        metadata: {
          method: req.method,
          path,
          op: opts.op,
        },
      }, async () => {
        const log = withRequest({
          requestId,
          method: req.method,
          path,
          op: opts.op ?? null,
          tenantId: effectiveScopeId ?? null,
          userId: authCtx.userId ?? null,
        });
        const exec = async () =>
          fn({ req, ctx: authCtx, body, params, requestId });
        const res = await (opts.idempotent
          ? withIdem(req.headers.get(HEADER_NAMES.IDEMPOTENCY_KEY), exec, req)
          : exec());
        const headers = new Headers(res.headers);
        headers.set(
          "content-type",
          headers.get("content-type") ?? "application/json"
        );
        headers.set(HEADER_NAMES.REQUEST_ID, requestId);
        if (rl) {
          headers.set(HEADER_NAMES.RATE_REMAINING, String(Math.max(0, Math.floor(rl.remaining))));
          headers.set(HEADER_NAMES.RATE_RESET, String(Math.floor(rl.resetAt)));
        }
        try {
          const ms = Date.now() - startedAt;
          log.info("request completed", { status: res.status, ms, idempotent: Boolean(opts.idempotent), perm: opts.perm ?? null });
          observeHttp({ op: opts.op ?? null, method: req.method, status: res.status, ms });
        } catch {}
        return new Response(res.body, { status: res.status, headers });
      });
    } catch (e) {
      const res = toHttp(e, requestId);
      try {
        const ms = Date.now() - startedAt;
        const log2 = withRequest({ requestId, method: req.method, path, op: opts.op ?? null });
        log2.info("request errored", { status: res.status, ms });
        observeHttp({ op: opts.op ?? null, method: req.method, status: res.status, ms });
      } catch {}
      return res;
    }
  };
}
