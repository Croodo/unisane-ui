import * as nodeCrypto from 'node:crypto';
import { HEADER_NAMES } from '../headers';
import { buildRateKey, rateLimit } from '../middleware/rateLimit';
import { getRatePolicy } from '@unisane/kernel';
import type { OpKey } from '@unisane/kernel';
import { toHttp } from '../errors/errors';
import { readRawBody } from '../middleware/rawBody';
import { withRequest } from '../logger';

type WebhookHandlerResult = {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
};

export function makeWebhookHandler<Params extends Record<string, unknown>>(
  opts: { getOp: (args: { params: Params }) => OpKey },
  fn: (args: { req: Request; params: Params; raw: string; requestId: string }) => Promise<WebhookHandlerResult>
) {
  return async (req: Request, route: { params: Params | Promise<Params> }) => {
    const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? nodeCrypto.randomUUID();
    const startedAt = Date.now();
    let path = '';
    try { path = new URL(req.url).pathname; } catch {}
    try {
      const { text } = await readRawBody(req);
      const params = (await (route.params as unknown as Promise<Params>)) ?? (route.params as Params);
      const op = opts.getOp({ params });
      const policy = getRatePolicy(op);
      const rateKey = buildRateKey({ tenantId: '-', name: op });
      const rl = await rateLimit(rateKey, policy.max, policy.windowSec, 1);
      if (!rl.allowed) {
        const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
        try {
          const log = withRequest({ requestId, method: req.method, path, op });
          log.warn('webhook rate limited', { retryAfterSec });
        } catch {}
        return new Response(JSON.stringify({ error: 'rate_limited' }), {
          status: 429,
          headers: {
            'content-type': 'application/json',
            [HEADER_NAMES.REQUEST_ID]: requestId,
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Remaining': String(Math.max(0, Math.floor(rl.remaining))),
            'X-RateLimit-Reset': String(Math.floor(rl.resetAt)),
          },
        });
      }
      const log = withRequest({ requestId, method: req.method, path, op });
      try { log.debug('webhook rate limit checked', { rlRemaining: Math.floor(rl.remaining), rlResetAt: rl.resetAt }); } catch {}
      const out = await fn({ req, params, raw: text, requestId });
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        [HEADER_NAMES.REQUEST_ID]: requestId,
        'X-RateLimit-Remaining': String(Math.max(0, Math.floor(rl.remaining))),
        'X-RateLimit-Reset': String(Math.floor(rl.resetAt)),
        ...(out.headers || {}),
      };
      try {
        const ms = Date.now() - startedAt;
        log.info('webhook handled', { status: out.status ?? 200, ms });
      } catch {}
      return new Response(JSON.stringify(out.body), { status: out.status ?? 200, headers });
    } catch (e) {
      try {
        const ms = Date.now() - startedAt;
        const log = withRequest({ requestId, method: req.method, path });
        log.info('webhook errored', { status: 'error', ms });
      } catch {}
      return toHttp(e, requestId);
    }
  };
}
