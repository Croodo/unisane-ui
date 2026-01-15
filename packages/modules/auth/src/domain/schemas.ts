import { z } from 'zod';
import { ZLocale, DEFAULT_LOCALE } from '@unisane/kernel/client';
import { ZEmailString, ZUsernameString, ZPhoneE164String } from '@unisane/kernel';

export const ZPasswordSignup = z.object({
  email: ZEmailString,
  password: z.string().min(8),
  displayName: z.string().optional(),
  username: ZUsernameString.optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: ZPhoneE164String.optional(),
  locale: ZLocale.default(DEFAULT_LOCALE),
  timezone: z.string().trim().optional(),
});

export const ZPasswordSignin = z.object({
  email: ZEmailString,
  password: z.string().min(1),
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
  password: z.string().min(8),
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
