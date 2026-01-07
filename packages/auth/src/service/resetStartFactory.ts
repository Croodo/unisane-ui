import { getTypedSetting } from "@unisane/settings";
import { resetStart } from "./resetStart";
import { makeAuthStartHandler } from "./make-auth-handler";

export const resetStartFactory = makeAuthStartHandler({
  handler: async (body: { email: string; redirectTo?: string }) => {
    const { value: ttlSec } = await getTypedSetting<number>({
      tenantId: null,
      ns: "auth",
      key: "resetTokenTtlSeconds",
    });
    await resetStart({
      email: body.email,
      ttlSec,
      ...(body.redirectTo ? { redirectTo: body.redirectTo } : {}),
    });
    return { sent: true };
  },
  buildResponse: (result) => ({ ok: true, data: result }),
});
