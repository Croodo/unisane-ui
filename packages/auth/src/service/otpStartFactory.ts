import { getEnv } from '@unisane/kernel';
import { getTypedSetting } from '@unisane/settings';
import { otpStart } from './otpStart';
import { makeAuthStartHandler } from './make-auth-handler';

export const otpStartFactory = makeAuthStartHandler({
  checkEnabled: () => getEnv().AUTH_OTP_ENABLED ?? false,
  disabledMessage: 'OTP login disabled',
  handler: async (body: { email: string }) => {
    const { value: ttlSec } = await getTypedSetting<number>({ tenantId: null, ns: 'auth', key: 'otpTtlSeconds' });
    const { value: codeLen } = await getTypedSetting<number>({ tenantId: null, ns: 'auth', key: 'otpLength' });
    return otpStart({ email: body.email, codeLen, ttlSec });
  },
  buildResponse: (result) => ({ ok: true, data: result }),
});
