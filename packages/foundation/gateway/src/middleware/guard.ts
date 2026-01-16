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
 * GW-011 FIX: Maximum length for route parameter values.
 * Prevents DoS via excessively long parameter strings.
 *
 * M-002 FIX: Increased from 256 to 512 to support base64-encoded IDs
 * which can be longer (e.g., MongoDB ObjectId base64 is ~24 chars,
 * but UUIDs and compound IDs can be longer).
 */
const MAX_PARAM_LENGTH = 512;

/**
 * GW-011 FIX: Pattern for safe route parameter values.
 * Allows alphanumeric, hyphens, underscores, and periods.
 * Rejects any characters that could be used for injection.
 */
const SAFE_PARAM_PATTERN = /^[a-zA-Z0-9_.-]+$/;

/**
 * GW-011 FIX: Validate and sanitize a single route parameter value.
 * Returns the sanitized value or throws if invalid.
 */
function validateParamValue(key: string, value: unknown): string {
  // Must be a string
  if (typeof value !== 'string') {
    throw ERR.validation(`Invalid path parameter "${key}": expected string, got ${typeof value}`);
  }

  // Check length
  if (value.length === 0) {
    throw ERR.validation(`Invalid path parameter "${key}": cannot be empty`);
  }
  if (value.length > MAX_PARAM_LENGTH) {
    throw ERR.validation(`Invalid path parameter "${key}": exceeds maximum length of ${MAX_PARAM_LENGTH}`);
  }

  // Check for unsafe characters
  if (!SAFE_PARAM_PATTERN.test(value)) {
    throw ERR.validation(`Invalid path parameter "${key}": contains invalid characters`);
  }

  return value;
}

/**
 * GW-011 FIX: Apply basic validation to all route parameters.
 * This provides a safety net even when zodParams is not provided.
 */
function sanitizeRouteParams<Params extends Record<string, unknown>>(params: Params): Params {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    // Only validate string values (which is what route params should be)
    if (typeof value === 'string') {
      sanitized[key] = validateParamValue(key, value);
    } else if (value === undefined || value === null) {
      // Allow undefined/null to pass through
      sanitized[key] = value;
    } else {
      // Non-string, non-null values are suspicious
      throw ERR.validation(`Invalid path parameter "${key}": unexpected type ${typeof value}`);
    }
  }
  return sanitized as Params;
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
  // GW-011 FIX: Always sanitize route params first for basic safety
  // This catches obvious injection attempts even without explicit zodParams
  const sanitizedParams = sanitizeRouteParams(routeParams);

  // Validate path parameters first (before auth, as this is a request format issue)
  // If zodParams is provided, use it for additional validation
  const validatedParams = opts.zodParams
    ? validateParams(sanitizedParams, opts.zodParams)
    : sanitizedParams;

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
