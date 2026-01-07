import { z } from 'zod';
import { ZLocale, DEFAULT_LOCALE } from '@unisane/kernel';
import { ZPhoneE164 } from '@unisane/identity';

export const ZPasswordSignup = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
  username: z.string().trim().regex(/^[a-z0-9_.]{3,30}$/i).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().regex(/^\+[1-9][0-9]{7,14}$/).optional(),
  locale: ZLocale.default(DEFAULT_LOCALE),
  timezone: z.string().trim().optional(),
});

export const ZPasswordSignin = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ZOtpStart = z.object({
  email: z.string().email(),
});

export const ZOtpVerify = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

export const ZResetStart = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional(),
});

export const ZResetVerify = z.object({
  email: z.string().email(),
  token: z.string().min(16),
  password: z.string().min(8),
});

export const ZTokenExchange = z.object({
  provider: z.string().min(1),
  token: z.string().min(16),
});

export const ZPhoneStart = z.object({ phone: ZPhoneE164 });
export const ZPhoneVerify = z.object({ phone: ZPhoneE164, code: z.string().min(4).max(8) });

export type PasswordSignup = z.infer<typeof ZPasswordSignup>;
export type PasswordSignin = z.infer<typeof ZPasswordSignin>;
export type OtpStart = z.infer<typeof ZOtpStart>;
export type OtpVerify = z.infer<typeof ZOtpVerify>;
export type ResetStart = z.infer<typeof ZResetStart>;
export type ResetVerify = z.infer<typeof ZResetVerify>;
export type TokenExchange = z.infer<typeof ZTokenExchange>;
export type PhoneStart = z.infer<typeof ZPhoneStart>;
export type PhoneVerify = z.infer<typeof ZPhoneVerify>;
