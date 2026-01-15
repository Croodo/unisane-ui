import { kv, PhoneE164, getAuthIdentityProvider } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { phoneVerifyKey } from "../domain/keys";

export async function phoneVerify(args: {
  userId: string;
  phone: string;
  code: string;
}): Promise<{ ok: true }> {
  const { userId } = args;
  if (!userId) throw ERR.loginRequired();
  const identity = getAuthIdentityProvider();
  const phone = PhoneE164.create(args.phone).toString();
  const key = phoneVerifyKey(userId);
  const saved = await kv.get(key);
  if (!saved) throw ERR.validation("Code expired or not found");
  let parsed: { phone: string; code: string } | null = null;
  try {
    parsed = JSON.parse(saved) as { phone: string; code: string };
  } catch {}
  if (!parsed || parsed.phone !== phone || parsed.code !== args.code)
    throw ERR.validation("Invalid code");
  // Ensure uniqueness again before persisting
  const other = await identity.findUserByPhoneNorm(phone);
  if (other && other.id !== userId)
    throw ERR.versionMismatch();
  await identity.updateUserById(userId, {
    phone,
    phoneVerified: true,
  });
  await kv.del(key);
  return { ok: true } as const;
}
