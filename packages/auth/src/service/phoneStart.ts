import { kv } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { phoneVerifyKey } from "../domain/keys";
import { normalizePhoneE164, usersRepository, membershipsRepository } from "@unisane/identity";

export async function phoneStart(args: {
  userId: string;
  phone: string;
}): Promise<{ sent: boolean }> {
  const userId = args.userId;
  if (!userId) throw ERR.loginRequired();
  const phone = normalizePhoneE164(args.phone);
  // Ensure phone uniqueness if different user already has it
  const existing = await usersRepository.findByPhone(phone);
  if (existing && existing.id !== userId)
    throw ERR.versionMismatch();
  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const payload = JSON.stringify({ phone, code });
  // Save to KV with TTL 10 minutes
  await kv.set(phoneVerifyKey(userId), payload, { PX: 10 * 60 * 1000 });
  // TODO: integrate SMS provider
  // In dev, log the code for testing; in prod this should send via SMS provider
  const { APP_ENV } = await import("@unisane/kernel").then((m) => m.getEnv());
  if (APP_ENV !== "prod") {
    console.log(
      `[auth:dev] phoneStart user=${userId} phone=${phone.slice(0, 6)}*** code=${code}`
    );
  }
  return { sent: true };
}
