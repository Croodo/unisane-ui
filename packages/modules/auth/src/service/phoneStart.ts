import { kv, randomDigits, logger, PhoneE164, getAuthIdentityProvider } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { phoneVerifyKey } from "../domain/keys";

export async function phoneStart(args: {
  userId: string;
  phone: string;
}): Promise<{ sent: boolean }> {
  const userId = args.userId;
  if (!userId) throw ERR.loginRequired();
  const identity = getAuthIdentityProvider();
  const phone = PhoneE164.create(args.phone).toString();
  // Ensure phone uniqueness if different user already has it
  const existing = await identity.findUserByPhoneNorm(phone);
  if (existing && existing.id !== userId)
    throw ERR.versionMismatch();
  // Generate 6-digit code
  const code = randomDigits(6);
  const payload = JSON.stringify({ phone, code });
  // Save to KV with TTL 10 minutes
  await kv.set(phoneVerifyKey(userId), payload, { PX: 10 * 60 * 1000 });
  // TODO: integrate SMS provider
  // In dev, log the code for testing; in prod this should send via SMS provider
  const { APP_ENV } = await import("@unisane/kernel").then((m) => m.getEnv());
  if (APP_ENV !== "prod") {
    logger.info("phoneStart: dev-mode verification code", {
      userId,
      phoneMasked: phone.slice(0, 6) + "***",
      code,
    });
  }
  return { sent: true };
}
