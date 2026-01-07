/**
 * Auth Domain Constants
 *
 * Centralized constants for the auth module.
 */

export const AUTH_EVENTS = {
  SIGNUP_COMPLETED: 'auth.signup.completed',
  SIGNIN_COMPLETED: 'auth.signin.completed',
  SIGNIN_FAILED: 'auth.signin.failed',
  SIGNOUT_COMPLETED: 'auth.signout.completed',
  OTP_REQUESTED: 'auth.otp.requested',
  OTP_VERIFIED: 'auth.otp.verified',
  RESET_REQUESTED: 'auth.reset.requested',
  RESET_COMPLETED: 'auth.reset.completed',
  PHONE_VERIFICATION_STARTED: 'auth.phone.started',
  PHONE_VERIFIED: 'auth.phone.verified',
  ACCOUNT_LOCKED: 'auth.account.locked',
} as const;

export const AUTH_DEFAULTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_SEC: 300,
  RESET_TOKEN_LENGTH: 32,
  RESET_TOKEN_EXPIRY_SEC: 3600,
  PHONE_CODE_LENGTH: 6,
  PHONE_CODE_EXPIRY_SEC: 300,
  MAX_FAILED_LOGINS: 5,
  LOCKOUT_DURATION_SEC: 900,
  SESSION_EXPIRY_SEC: 86400 * 7,
  CSRF_TOKEN_LENGTH: 32,
} as const;

export const AUTH_COLLECTIONS = {
  CREDENTIALS: 'auth_credentials',
} as const;
