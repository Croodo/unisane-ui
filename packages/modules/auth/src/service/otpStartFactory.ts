import { getEnv, getTypedSetting } from '@unisane/kernel';
import { otpStart } from './otpStart';
import { makeAuthStartHandler } from './make-auth-handler';

export const otpStartFactory = makeAuthStartHandler({
  checkEnabled: () => getEnv().AUTH_OTP_ENABLED ?? false,
  disabledMessage: 'OTP login disabled',
  handler: async (body: { email: string }) => {
    const { value: ttlSec } = await getTypedSetting<number>({ scopeId: null, ns: 'auth', key: 'otpTtlSeconds' });
    const { value: codeLen } = await getTypedSetting<number>({ scopeId: null, ns: 'auth', key: 'otpLength' });
    return otpStart({ email: body.email, codeLen, ttlSec });
  },
  buildResponse: (result) => ({ ok: true, data: result }),
});
