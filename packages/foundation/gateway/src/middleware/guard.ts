import type { ZodTypeAny, ZodError } from "zod";
import { parseJson } from "./validate";
import { getAuthCtx } from "../auth/auth";
import { hasPerm } from './rbac';
import type { AuthCtx, Permission } from './rbac';
import { HEADER_NAMES } from "../headers";
import { ERR } from "../errors/errors";
import { buildRateKey, rateLimit, ipFrom } from './rateLimit';
import type { RateResult } from './rateLimit';
import { getRatePolicy } from '../rate-limits';
import type { OpKey } from '../rate-limits';
import { incRateLimited } from "../telemetry";
import { assertCsrfForCookieAuth } from "./csrf";

export type GuardOpts<Body, Params> = {
  op?: OpKey;
  zod?: ZodTypeAny;
  zodParams?: ZodTypeAny;
  perm?: Permission;
  idempotent?: boolean;
  requireTenantMatch?: boolean;
  requireSuperAdmin?: boolean;
  requireUser?: boolean;
  allowUnauthed?: boolean;
  rateKey?: (args: { req: Request; ctx: AuthCtx; body: Body; params: Params }) => string;
  rateCost?: number;
};

/**
 * Format Zod validation errors into a user-friendly message.
 */
function formatZodErrors(error: ZodError): string {
  return error.errors
    .map((e) => {
      const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
      return `${path}${e.message}`;
    })
    .join('; ');
}

/**
 * Validate path parameters against a Zod schema.
 * Throws validation error if validation fails.
 */
function validateParams<Params>(params: Params, schema: ZodTypeAny): Params {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw ERR.validation(`Invalid path parameters: ${formatZodErrors(result.error)}`);
  }
  return result.data as Params;
}

export async function guard<Body = unknown, Params extends Record<string, unknown> = Record<string, unknown>>(
  req: Request,
  routeParams: Params,
  opts: GuardOpts<Body, Params>
): Promise<{ ctx: AuthCtx; body: Body; params: Params; rl: RateResult | null }> {
  // Validate path parameters first (before auth, as this is a request format issue)
  const validatedParams = opts.zodParams
    ? validateParams(routeParams, opts.zodParams)
    : routeParams;

  const ctx = await getAuthCtx(req);
  if (!ctx.isAuthed && !opts.allowUnauthed) throw ERR.loginRequired();

  if (opts.requireTenantMatch && ctx.isAuthed) {
    const paramTenant = (validatedParams as { tenantId?: string } | undefined)?.tenantId;
    if (!ctx.isSuperAdmin && paramTenant && ctx.tenantId !== paramTenant) throw ERR.forbidden();
  }
  if (ctx.isAuthed) {
    if (opts.requireSuperAdmin && !ctx.isSuperAdmin) throw ERR.forbidden();
    if (opts.perm && !hasPerm(ctx, opts.perm)) throw ERR.forbidden();
    if (opts.requireUser && !ctx.userId) throw ERR.forbidden();
  }

  await assertCsrfForCookieAuth(req, ctx);

  const body = opts.zod ? ((await parseJson(req, opts.zod as ZodTypeAny)) as Body) : ((undefined as unknown) as Body);

  // Rate limit (per op). Fallback to per-IP when unauth.
  let rl: RateResult | null = null;
  if (opts.op) {
    const policy = getRatePolicy(opts.op);
    const key =
      opts.rateKey?.({ req, ctx, body, params: validatedParams }) ??
      buildRateKey({ tenantId: ctx.tenantId ?? ipFrom(req), ...(ctx.userId ? { userId: ctx.userId } : {}), name: opts.op });
    rl = await rateLimit(key, policy.max, policy.windowSec, opts.rateCost ?? 1);
    if (!rl.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      try { incRateLimited(opts.op); } catch {}
      throw ERR.RATE("Too many requests", { retryAfterSec, remaining: rl.remaining, resetAt: rl.resetAt });
    }
  }

  return { ctx, body, params: validatedParams, rl };
}
