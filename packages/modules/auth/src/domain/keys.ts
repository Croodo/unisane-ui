/**
 * Auth Cache Keys
 *
 * Centralized cache key builders for consistent key naming.
 */

import { Email } from '@unisane/kernel';

export const authKeys = {
  otpCode: (email: string) => `otp:login:${Email.create(email).toString()}` as const,

  resetToken: (email: string, token: string) =>
    `reset:pw:${Email.create(email).toString()}:${token}` as const,

  phoneVerify: (userId: string) => `phone:verify:${userId}` as const,

  sessionById: (sessionId: string) => `auth:session:${sessionId}` as const,

  userSessions: (userId: string) => `auth:sessions:user:${userId}` as const,

  csrfToken: (sessionId: string) => `auth:csrf:${sessionId}` as const,

  failedLoginAttempts: (emailNorm: string) =>
    `auth:failed:${emailNorm}` as const,
} as const;

export type AuthKeyBuilder = typeof authKeys;

export function otpCodeKey(email: string): string {
  return authKeys.otpCode(email);
}

export function resetTokenKey(email: string, token: string): string {
  return authKeys.resetToken(email, token);
}

export function phoneVerifyKey(userId: string): string {
  return authKeys.phoneVerify(userId);
}
