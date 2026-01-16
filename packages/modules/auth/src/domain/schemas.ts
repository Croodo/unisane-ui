import { z } from 'zod';
import { ZLocale, DEFAULT_LOCALE } from '@unisane/kernel/client';
import { ZEmailString, ZUsernameString, ZPhoneE164String } from '@unisane/kernel';

export const ZPasswordSignup = z.object({
  email: ZEmailString,
  // AUTH-005 FIX: Added max length (128) to prevent DoS via bcrypt on very long strings
  password: z.string().min(8).max(128, 'Password too long (max 128 characters)'),
  displayName: z.string().optional(),
  username: ZUsernameString.optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: ZPhoneE164String.optional(),
  locale: ZLocale.default(DEFAULT_LOCALE),
  timezone: z.string().trim().optional(),
});

/**
 * AUTH-005 FIX: Align signin password validation with signup (8 chars minimum).
 *
 * While some argue signin should accept any password to avoid leaking policy,
 * this approach is problematic:
 * 1. Attackers already know the policy from the signup form
 * 2. Accepting short passwords wastes server resources on bcrypt verification
 * 3. Consistent validation simplifies error handling
 *
 * Also added max length (128 chars) to prevent DoS via bcrypt on very long strings.
 */
export const ZPasswordSignin = z.object({
  email: ZEmailString,
  password: z.string().min(8, 'Invalid credentials').max(128, 'Invalid credentials'),
});

export const ZOtpStart = z.object({
  email: ZEmailString,
});

export const ZOtpVerify = z.object({
  email: ZEmailString,
  code: z.string().min(4).max(8),
});

export const ZResetStart = z.object({
  email: ZEmailString,
  redirectTo: z.string().optional(),
});

export const ZResetVerify = z.object({
  email: ZEmailString,
  token: z.string().min(16),
  // AUTH-005 FIX: Added max length (128) to prevent DoS via bcrypt on very long strings
  password: z.string().min(8).max(128, 'Password too long (max 128 characters)'),
});

export const ZTokenExchange = z.object({
  provider: z.string().min(1),
  token: z.string().min(16),
});

export const ZPhoneStart = z.object({ phone: ZPhoneE164String });
export const ZPhoneVerify = z.object({ phone: ZPhoneE164String, code: z.string().min(4).max(8) });

export type PasswordSignup = z.infer<typeof ZPasswordSignup>;
export type PasswordSignin = z.infer<typeof ZPasswordSignin>;
export type OtpStart = z.infer<typeof ZOtpStart>;
export type OtpVerify = z.infer<typeof ZOtpVerify>;
export type ResetStart = z.infer<typeof ZResetStart>;
export type ResetVerify = z.infer<typeof ZResetVerify>;
export type TokenExchange = z.infer<typeof ZTokenExchange>;
export type PhoneStart = z.infer<typeof ZPhoneStart>;
export type PhoneVerify = z.infer<typeof ZPhoneVerify>;
