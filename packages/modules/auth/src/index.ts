/**
 * @module @unisane/auth
 * @description Authentication flows: password, OTP, password reset, phone verification
 * @layer 3
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from './domain/schemas';
export * from './domain/types';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { AUTH_EVENTS, AUTH_DEFAULTS, AUTH_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { authKeys, otpCodeKey, resetTokenKey, phoneVerifyKey } from './domain/keys';
export type { AuthKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services - Signup & Signin
// ════════════════════════════════════════════════════════════════════════════

export * from './service/signup';
export * from './service/signin';
export * from './service/signupFactory';
export * from './service/signinFactory';
export * from './service/signout';
export * from './service/signoutFactory';

// ════════════════════════════════════════════════════════════════════════════
// Services - OTP
// ════════════════════════════════════════════════════════════════════════════

export * from './service/otpStart';
export * from './service/otpVerify';
export * from './service/otpStartFactory';
export * from './service/otpVerifyFactory';

// ════════════════════════════════════════════════════════════════════════════
// Services - Password Reset
// ════════════════════════════════════════════════════════════════════════════

export * from './service/resetStart';
export * from './service/resetVerify';
export * from './service/resetStartFactory';
export * from './service/resetVerifyFactory';

// ════════════════════════════════════════════════════════════════════════════
// Services - Phone Verification
// ════════════════════════════════════════════════════════════════════════════

export * from './service/phoneStart';
export * from './service/phoneVerify';

// ════════════════════════════════════════════════════════════════════════════
// Services - Token Exchange & CSRF
// ════════════════════════════════════════════════════════════════════════════

export * from './service/exchange';
export * from './service/tokenExchangeFactory';
export * from './service/csrf';
export * from './service/csrfFactory';

// ════════════════════════════════════════════════════════════════════════════
// OAuth - Provider Adapters for Token Verification
// ════════════════════════════════════════════════════════════════════════════

export * from './oauth';
