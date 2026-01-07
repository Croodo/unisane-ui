/**
 * Error Catalog — Single source of truth for all error messages
 *
 * Pattern:
 * - code: Machine-readable identifier (used for programmatic handling)
 * - status: HTTP status code
 * - message: User-friendly message (shown in UI)
 * - action: Suggested user action (optional)
 * - retryable: Whether the user can retry the action
 */

export type ErrorCode =
  // Auth
  | "AUTH_UNAUTHENTICATED"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_FORBIDDEN"
  | "AUTH_FORBIDDEN_ADMIN_ONLY"
  | "AUTH_FORBIDDEN_OWNER_ONLY"
  | "AUTH_FORBIDDEN_PLATFORM_ONLY"
  // Validation
  | "VALIDATION_FAILED"
  | "VALIDATION_EMAIL_INVALID"
  | "VALIDATION_PHONE_INVALID"
  | "VALIDATION_PASSWORD_WEAK"
  | "VALIDATION_FIELD_REQUIRED"
  | "VALIDATION_OTP_EXPIRED"
  | "VALIDATION_OTP_INVALID"
  // Resources
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_USER_NOT_FOUND"
  | "RESOURCE_TENANT_NOT_FOUND"
  | "RESOURCE_SETTING_NOT_FOUND"
  // Conflicts
  | "CONFLICT_ALREADY_EXISTS"
  | "CONFLICT_VERSION_MISMATCH"
  | "CONFLICT_PHONE_REGISTERED"
  | "CONFLICT_EMAIL_REGISTERED"
  | "CONFLICT_USERNAME_TAKEN"
  // Billing
  | "BILLING_INSUFFICIENT_CREDITS"
  | "BILLING_SEAT_LIMIT_REACHED"
  | "BILLING_PAYMENT_FAILED"
  | "BILLING_SUBSCRIPTION_REQUIRED"
  // Rate Limiting
  | "RATE_LIMITED"
  // Server
  | "SERVER_MISCONFIGURED"
  | "SERVER_INTERNAL"
  | "SERVER_UNAVAILABLE"
  | "SERVER_DATABASE_ERROR";

export interface ErrorDefinition {
  status: number;
  message: string;
  action?: string;
  retryable: boolean;
}

export const ERROR_CATALOG: Record<ErrorCode, ErrorDefinition> = {
  // Auth
  AUTH_UNAUTHENTICATED: {
    status: 401,
    message: "Please sign in to continue.",
    action: "Sign in or create an account",
    retryable: false,
  },
  AUTH_INVALID_CREDENTIALS: {
    status: 401,
    message: "Invalid email or password.",
    action: "Check your email and password",
    retryable: false,
  },
  AUTH_TOKEN_EXPIRED: {
    status: 401,
    message: "Your session has expired. Please sign in again.",
    action: "Sign in again",
    retryable: true,
  },
  AUTH_FORBIDDEN: {
    status: 403,
    message: "You do not have permission to perform this action.",
    action: "Contact your workspace admin",
    retryable: false,
  },
  AUTH_FORBIDDEN_ADMIN_ONLY: {
    status: 403,
    message: "This action requires admin privileges.",
    action: "Contact your workspace admin",
    retryable: false,
  },
  AUTH_FORBIDDEN_OWNER_ONLY: {
    status: 403,
    message: "Only the workspace owner can perform this action.",
    action: "Contact the workspace owner",
    retryable: false,
  },
  AUTH_FORBIDDEN_PLATFORM_ONLY: {
    status: 403,
    message: "This action is restricted to platform administrators.",
    retryable: false,
  },

  // Validation
  VALIDATION_FAILED: {
    status: 422,
    message: "Some of your inputs are invalid. Please check and try again.",
    retryable: false,
  },
  VALIDATION_EMAIL_INVALID: {
    status: 422,
    message: "Please enter a valid email address.",
    retryable: false,
  },
  VALIDATION_PHONE_INVALID: {
    status: 422,
    message: "Please enter a valid phone number.",
    retryable: false,
  },
  VALIDATION_PASSWORD_WEAK: {
    status: 422,
    message:
      "Your password is too weak. Include letters, numbers, and symbols.",
    retryable: false,
  },
  VALIDATION_FIELD_REQUIRED: {
    status: 422,
    message: "This field is required.",
    retryable: false,
  },
  VALIDATION_OTP_EXPIRED: {
    status: 422,
    message: "Your verification code has expired. Please request a new one.",
    action: "Request a new code",
    retryable: true,
  },
  VALIDATION_OTP_INVALID: {
    status: 422,
    message: "Invalid verification code. Please check and try again.",
    retryable: false,
  },

  // Resources
  RESOURCE_NOT_FOUND: {
    status: 404,
    message: "The requested item was not found.",
    retryable: false,
  },
  RESOURCE_USER_NOT_FOUND: {
    status: 404,
    message: "User not found.",
    retryable: false,
  },
  RESOURCE_TENANT_NOT_FOUND: {
    status: 404,
    message: "Workspace not found.",
    retryable: false,
  },
  RESOURCE_SETTING_NOT_FOUND: {
    status: 404,
    message: "Setting not found.",
    retryable: false,
  },

  // Conflicts
  CONFLICT_ALREADY_EXISTS: {
    status: 409,
    message: "This item already exists.",
    retryable: false,
  },
  CONFLICT_VERSION_MISMATCH: {
    status: 409,
    message:
      "This item was modified by someone else. Please refresh and try again.",
    action: "Refresh the page",
    retryable: true,
  },
  CONFLICT_PHONE_REGISTERED: {
    status: 409,
    message: "This phone number is already registered to another account.",
    action: "Use a different phone number or sign in",
    retryable: false,
  },
  CONFLICT_EMAIL_REGISTERED: {
    status: 409,
    message: "This email is already registered.",
    action: "Sign in or use a different email",
    retryable: false,
  },
  CONFLICT_USERNAME_TAKEN: {
    status: 409,
    message: "This username is already taken.",
    action: "Choose a different username",
    retryable: false,
  },

  // Billing
  BILLING_INSUFFICIENT_CREDITS: {
    status: 402,
    message: "You don't have enough credits for this action.",
    action: "Top up your credits",
    retryable: true,
  },
  BILLING_SEAT_LIMIT_REACHED: {
    status: 402,
    message: "Your workspace has reached its member limit.",
    action: "Upgrade your plan to add more members",
    retryable: false,
  },
  BILLING_PAYMENT_FAILED: {
    status: 402,
    message: "Payment failed. Please check your payment method.",
    action: "Update your payment method",
    retryable: true,
  },
  BILLING_SUBSCRIPTION_REQUIRED: {
    status: 402,
    message: "A subscription is required for this feature.",
    action: "Upgrade your plan",
    retryable: false,
  },

  // Rate Limiting
  RATE_LIMITED: {
    status: 429,
    message: "You're sending too many requests. Please wait a moment.",
    action: "Wait and try again",
    retryable: true,
  },

  // Server
  SERVER_MISCONFIGURED: {
    status: 500,
    message: "Server configuration error. Please contact support.",
    retryable: false,
  },
  SERVER_INTERNAL: {
    status: 500,
    message: "Something went wrong. Please try again.",
    retryable: true,
  },
  SERVER_UNAVAILABLE: {
    status: 503,
    message: "Service temporarily unavailable. Please try again later.",
    retryable: true,
  },
  SERVER_DATABASE_ERROR: {
    status: 500,
    message: "Database connection failed. Please try again.",
    retryable: true,
  },
};

// Helper to get definition with fallback
export function getErrorDef(code: ErrorCode): ErrorDefinition {
  return ERROR_CATALOG[code] ?? ERROR_CATALOG.SERVER_INTERNAL;
}
