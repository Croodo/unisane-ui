import { kv } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { phoneVerifyKey } from "../domain/keys";
import { normalizePhoneE164, usersRepository, membershipsRepository } from "@unisane/identity";

export async function phoneVerify(args: {
  userId: string;
  phone: string;
  code: string;
}): Promise<{ ok: true }> {
  const { userId } = args;
  if (!userId) throw ERR.loginRequired();
  const phone = normalizePhoneE164(args.phone);
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
  const other = await usersRepository.findByPhone(phone);
  if (other && other.id !== userId)
    throw ERR.versionMismatch();
  await usersRepository.updateById(userId, {
    phone,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial update type flexibility
    phoneVerified: true as any,
  });
  await kv.del(key);
  return { ok: true } as const;
}
