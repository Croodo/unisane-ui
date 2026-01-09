import { HEADER_NAMES } from '../headers';
import { getAuthCtx } from '../auth/auth';
import { hasPerm } from '../middleware/rbac';
import type { Permission } from '../middleware/rbac';
import { getRatePolicy } from '../rate-limits';
import type { OpKey } from '../rate-limits';
import { buildRateKey, ipFrom, rateLimit } from '../middleware/rateLimit';
import { withIdem } from '../middleware/idempotency';
import { toHttp, ERR } from '../errors/errors';
import { assertCsrfForCookieAuth } from '../middleware/csrf';

type GuardOptsBase = {
  op?: OpKey;
  perm?: Permission;
  idempotent?: boolean;
  requireTenantMatch?: boolean;
  requireUser?: boolean;
  allowUnauthed?: boolean;
};

type RateKeyArgs<P, B> = { req: Request; params: P; body: B };

export type GuardOpts<P = Record<string, unknown>, B = unknown> = GuardOptsBase & {
  // Custom RL key builder (e.g., per email/ip) for public endpoints
  rateKey?: (args: RateKeyArgs<P, B>) => string;
};

export async function withGuards<
  T,
  P extends Record<string, unknown> = Record<string, unknown>,
  B = unknown,
>(
  req: Request,
  params: P,
  body: B,
  opts: GuardOpts<P, B>,
  handler: (ctx: { auth: Awaited<ReturnType<typeof getAuthCtx>> }) => Promise<T>,
): Promise<T> {
  try {
    const auth = await getAuthCtx(req);
    if (!auth.isAuthed && !opts.allowUnauthed) throw ERR.loginRequired();

    // Tenant param match (unless super admin)
    if (opts.requireTenantMatch && auth.isAuthed) {
      const paramTenant = (params as unknown as { tenantId?: string })?.tenantId;
      if (!auth.isSuperAdmin && paramTenant && auth.tenantId !== paramTenant) throw ERR.forbidden();
    }

    // Permission checks
    if (auth.isAuthed) {
      if (opts.perm && !hasPerm(auth, opts.perm)) throw ERR.forbidden();
      if (opts.requireUser && !auth.userId) throw ERR.forbidden();
    }

    await assertCsrfForCookieAuth(req, auth);

    // Rate limiting
    if (opts.op) {
      const policy = getRatePolicy(opts.op);
      const key = opts.rateKey
        ? opts.rateKey({ req, params, body })
        : buildRateKey({
            tenantId: auth.tenantId ?? ipFrom(req),
            ...(auth.userId ? { userId: auth.userId } : {}),
            name: opts.op,
          });
      const rl = await rateLimit(key, policy.max, policy.windowSec, 1);
      if (!rl.allowed) throw ERR.RATE('Too many requests', { retryAfterSec: Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)) });
    }

    const exec = () => handler({ auth });
    if (opts.idempotent) {
      return withIdem(req.headers.get(HEADER_NAMES.IDEMPOTENCY_KEY), exec, req);
    }
    return exec();
  } catch (e) {
    // Convert to HTTP-y error; ts-rest adapter will catch/serialize
    throw toHttp(e, req.headers.get(HEADER_NAMES.REQUEST_ID) ?? '');
  }
}
