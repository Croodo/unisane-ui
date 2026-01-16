import { kv, randomDigits, logger, PhoneE164, getAuthIdentityProvider, sendSms } from "@unisane/kernel";
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

  // Send SMS via configured provider (logs in dev if no provider set)
  const result = await sendSms({
    to: phone,
    message: `Your verification code is: ${code}`,
    metadata: { userId, type: "phone_verify" },
  });

  if (!result.success) {
    logger.warn("phoneStart: SMS send failed", {
      userId,
      phoneMasked: phone.slice(0, 6) + "***",
      error: result.error,
    });
  }

  return { sent: result.success };
}
