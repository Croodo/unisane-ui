/**
 * @unisane/auth/client
 *
 * Client-safe exports that can be used in browser environments.
 * These exports don't depend on Node.js-only modules.
 */

// Zod schemas (browser-safe)
export {
  ZPasswordSignup,
  ZPasswordSignin,
  ZOtpStart,
  ZOtpVerify,
  ZResetStart,
  ZResetVerify,
  ZTokenExchange,
  ZPhoneStart,
  ZPhoneVerify,
} from './domain/schemas';

export type {
  PasswordSignup,
  PasswordSignin,
  OtpStart,
  OtpVerify,
  ResetStart,
  ResetVerify,
  TokenExchange,
  PhoneStart,
  PhoneVerify,
} from './domain/schemas';

// Domain types (browser-safe)
export * from './domain/types';

// Domain errors (browser-safe - just classes)
export {
  InvalidCredentialsError,
  AccountLockedError,
  OtpExpiredError,
  OtpInvalidError,
  OtpRateLimitError,
  ResetTokenExpiredError,
  ResetTokenInvalidError,
  CsrfMismatchError,
  PhoneVerificationExpiredError,
  PhoneVerificationInvalidError,
  PasswordTooWeakError,
} from './domain/errors';

// Constants (browser-safe)
export { AUTH_EVENTS, AUTH_DEFAULTS } from './domain/constants';
