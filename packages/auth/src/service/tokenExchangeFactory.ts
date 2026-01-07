import { getEnv } from '@unisane/kernel';
import { ERR } from '@unisane/gateway';
import { exchange } from './exchange';
import type { ZodTypeAny } from 'zod';
import { ZTokenExchange } from '../domain/schemas';
import { getAuthConfig } from '@unisane/kernel';
import { makeAuthHandler } from './make-auth-handler';

type TokenExchangeBody = typeof ZTokenExchange extends ZodTypeAny
  ? import('zod').infer<typeof ZTokenExchange>
  : never;

export const tokenExchangeFactory = makeAuthHandler<TokenExchangeBody, { userId: string }>({
  handler: async (body) => {
    const { JWT_PRIVATE_KEY } = getEnv();
    if (!JWT_PRIVATE_KEY) throw ERR.misconfigured('JWT_PRIVATE_KEY not configured');
    return exchange({ provider: body.provider, token: body.token });
  },
  // Use dynamic config for TTLs
  tokenExpSec: getAuthConfig().accessTokenTtlSec,
  cookieMaxAgeSec: getAuthConfig().cookieAccessTtlSec,
});
