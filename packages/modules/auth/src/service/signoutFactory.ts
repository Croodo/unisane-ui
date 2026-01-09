import { buildAccessTokenCookie } from '@unisane/gateway';
import { makeAuthStartHandler } from './make-auth-handler';

const baseSignoutHandler = makeAuthStartHandler({
  handler: async () => {
    // No-op handler, just need to set the cookie
    return {};
  },
  buildResponse: () => ({ ok: true }),
});

export const signoutFactory = async (args: Parameters<typeof baseSignoutHandler>[0]) => {
  const res = await baseSignoutHandler(args);
  const cookie = buildAccessTokenCookie('', { maxAgeSec: 0 });
  res.headers.append('set-cookie', cookie);
  return res;
};

