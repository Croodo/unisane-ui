/**
 * Error Catalog
 *
 * Central registry of all error codes used throughout the application.
 * Each error code maps to a default message and HTTP status.
 *
 * Error code ranges:
 * - E1xxx: Generic/common errors
 * - E2xxx: Authentication/authorization errors
 * - E3xxx: Billing/subscription errors
 * - E4xxx: Tenant/organization errors
 * - E5xxx: Identity/user errors
 * - E6xxx: Storage/media errors
 * - E7xxx: Integration/webhook errors
 * - E8xxx: AI/ML errors
 * - E9xxx: Reserved for future use
 */

/**
 * All error codes in the system.
 */
export enum ErrorCode {
  // ============================================
  // Generic Errors (E1xxx)
  // ============================================

  /** Unexpected internal error */
  INTERNAL_ERROR = 'E1000',
  /** Request validation failed */
  VALIDATION_ERROR = 'E1001',
  /** Resource not found */
  NOT_FOUND = 'E1002',
  /** Resource already exists */
  CONFLICT = 'E1003',
  /** Access forbidden */
  FORBIDDEN = 'E1004',
  /** Authentication required */
  UNAUTHORIZED = 'E1005',
  /** Rate limit exceeded */
  RATE_LIMITED = 'E1006',
  /** Request timeout */
  TIMEOUT = 'E1007',
  /** Service unavailable */
  SERVICE_UNAVAILABLE = 'E1008',
  /** Bad request */
  BAD_REQUEST = 'E1009',
  /** Precondition failed */
  PRECONDITION_FAILED = 'E1010',
  /** Unprocessable entity */
  UNPROCESSABLE = 'E1011',
  /** Resource gone (permanently deleted) */
  GONE = 'E1012',

  // ============================================
  // Authentication/Authorization Errors (E2xxx)
  // ============================================

  /** Invalid username/password */
  INVALID_CREDENTIALS = 'E2001',
  /** Session has expired */
  SESSION_EXPIRED = 'E2002',
  /** Invalid or expired token */
  INVALID_TOKEN = 'E2003',
  /** MFA verification required */
  MFA_REQUIRED = 'E2004',
  /** Invalid MFA code */
  INVALID_MFA_CODE = 'E2005',
  /** API key invalid or revoked */
  INVALID_API_KEY = 'E2006',
  /** OAuth error */
  OAUTH_ERROR = 'E2007',
  /** CSRF token invalid */
  CSRF_INVALID = 'E2008',
  /** Password too weak */
  WEAK_PASSWORD = 'E2009',
  /** Account locked */
  ACCOUNT_LOCKED = 'E2010',
  /** Email not verified */
  EMAIL_NOT_VERIFIED = 'E2011',

  // ============================================
  // Billing/Subscription Errors (E3xxx)
  // ============================================

  /** Subscription not found */
  SUBSCRIPTION_NOT_FOUND = 'E3001',
  /** Plan not found */
  PLAN_NOT_FOUND = 'E3002',
  /** Payment failed */
  PAYMENT_FAILED = 'E3003',
  /** Quota/limit exceeded */
  QUOTA_EXCEEDED = 'E3004',
  /** Feature not available in plan */
  FEATURE_NOT_AVAILABLE = 'E3005',
  /** Trial expired */
  TRIAL_EXPIRED = 'E3006',
  /** Subscription cancelled */
  SUBSCRIPTION_CANCELLED = 'E3007',
  /** Invalid coupon */
  INVALID_COUPON = 'E3008',
  /** Payment method required */
  PAYMENT_METHOD_REQUIRED = 'E3009',
  /** Insufficient credits */
  INSUFFICIENT_CREDITS = 'E3010',
  /** Invoice not found */
  INVOICE_NOT_FOUND = 'E3011',
  /** Billing customer not found */
  CUSTOMER_NOT_FOUND = 'E3012',
  /** Refund amount exceeded */
  REFUND_EXCEEDED = 'E3013',
  /** Already refunded */
  ALREADY_REFUNDED = 'E3014',

  // ============================================
  // Tenant/Organization Errors (E4xxx)
  // ============================================

  /** Tenant not found */
  TENANT_NOT_FOUND = 'E4001',
  /** Member not found */
  MEMBER_NOT_FOUND = 'E4002',
  /** Invitation expired */
  INVITATION_EXPIRED = 'E4003',
  /** Invitation not found */
  INVITATION_NOT_FOUND = 'E4004',
  /** Member already exists */
  MEMBER_EXISTS = 'E4005',
  /** Cannot remove last owner */
  LAST_OWNER = 'E4006',
  /** Role not found */
  ROLE_NOT_FOUND = 'E4007',
  /** Permission denied */
  PERMISSION_DENIED = 'E4008',
  /** Tenant limit reached */
  TENANT_LIMIT = 'E4009',
  /** Slug already taken */
  SLUG_TAKEN = 'E4010',
  /** Tenant is suspended */
  TENANT_SUSPENDED = 'E4011',

  // ============================================
  // Identity/User Errors (E5xxx)
  // ============================================

  /** User not found */
  USER_NOT_FOUND = 'E5001',
  /** Email already in use */
  EMAIL_EXISTS = 'E5002',
  /** Invalid email format */
  INVALID_EMAIL = 'E5003',
  /** Password reset expired */
  PASSWORD_RESET_EXPIRED = 'E5004',
  /** Profile incomplete */
  PROFILE_INCOMPLETE = 'E5005',
  /** Username already taken */
  USERNAME_EXISTS = 'E5006',
  /** Phone number already in use */
  PHONE_EXISTS = 'E5007',
  /** API key limit exceeded */
  API_KEY_LIMIT = 'E5008',

  // ============================================
  // Storage/Media Errors (E6xxx)
  // ============================================

  /** File not found */
  FILE_NOT_FOUND = 'E6001',
  /** File too large */
  FILE_TOO_LARGE = 'E6002',
  /** Invalid file type */
  INVALID_FILE_TYPE = 'E6003',
  /** Storage quota exceeded */
  STORAGE_QUOTA_EXCEEDED = 'E6004',
  /** Upload failed */
  UPLOAD_FAILED = 'E6005',

  // ============================================
  // Integration/Webhook Errors (E7xxx)
  // ============================================

  /** Webhook delivery failed */
  WEBHOOK_DELIVERY_FAILED = 'E7001',
  /** Invalid webhook signature */
  INVALID_WEBHOOK_SIGNATURE = 'E7002',
  /** Webhook endpoint not found */
  WEBHOOK_NOT_FOUND = 'E7003',
  /** Integration not configured */
  INTEGRATION_NOT_CONFIGURED = 'E7004',
  /** External API error */
  EXTERNAL_API_ERROR = 'E7005',
  /** Webhook limit exceeded */
  WEBHOOK_LIMIT_EXCEEDED = 'E7006',
  /** Notification delivery failed */
  NOTIFICATION_FAILED = 'E7007',
  /** Template not found */
  TEMPLATE_NOT_FOUND = 'E7008',

  // ============================================
  // AI/ML Errors (E8xxx)
  // ============================================

  /** AI quota exceeded */
  AI_QUOTA_EXCEEDED = 'E8001',
  /** Model not found */
  MODEL_NOT_FOUND = 'E8002',
  /** AI request failed */
  AI_REQUEST_FAILED = 'E8003',
  /** Content moderation failed */
  CONTENT_MODERATION_FAILED = 'E8004',
}

/**
 * Error catalog entry with default message and status.
 */
export interface ErrorCatalogEntry {
  /** Default human-readable message */
  message: string;
  /** HTTP status code */
  status: number;
}

/**
 * Catalog mapping error codes to their metadata.
 */
export const ErrorCatalog: Record<ErrorCode, ErrorCatalogEntry> = {
  // Generic (E1xxx)
  [ErrorCode.INTERNAL_ERROR]: { message: 'An unexpected error occurred', status: 500 },
  [ErrorCode.VALIDATION_ERROR]: { message: 'Validation failed', status: 400 },
  [ErrorCode.NOT_FOUND]: { message: 'Resource not found', status: 404 },
  [ErrorCode.CONFLICT]: { message: 'Resource already exists', status: 409 },
  [ErrorCode.FORBIDDEN]: { message: 'Access forbidden', status: 403 },
  [ErrorCode.UNAUTHORIZED]: { message: 'Authentication required', status: 401 },
  [ErrorCode.RATE_LIMITED]: { message: 'Too many requests', status: 429 },
  [ErrorCode.TIMEOUT]: { message: 'Request timed out', status: 408 },
  [ErrorCode.SERVICE_UNAVAILABLE]: { message: 'Service temporarily unavailable', status: 503 },
  [ErrorCode.BAD_REQUEST]: { message: 'Bad request', status: 400 },
  [ErrorCode.PRECONDITION_FAILED]: { message: 'Precondition failed', status: 412 },
  [ErrorCode.UNPROCESSABLE]: { message: 'Unable to process request', status: 422 },
  [ErrorCode.GONE]: { message: 'Resource is no longer available', status: 410 },

  // Auth (E2xxx)
  [ErrorCode.INVALID_CREDENTIALS]: { message: 'Invalid email or password', status: 401 },
  [ErrorCode.SESSION_EXPIRED]: { message: 'Session has expired', status: 401 },
  [ErrorCode.INVALID_TOKEN]: { message: 'Invalid or expired token', status: 401 },
  [ErrorCode.MFA_REQUIRED]: { message: 'Multi-factor authentication required', status: 403 },
  [ErrorCode.INVALID_MFA_CODE]: { message: 'Invalid verification code', status: 401 },
  [ErrorCode.INVALID_API_KEY]: { message: 'Invalid or revoked API key', status: 401 },
  [ErrorCode.OAUTH_ERROR]: { message: 'OAuth authentication failed', status: 401 },
  [ErrorCode.CSRF_INVALID]: { message: 'Invalid security token', status: 403 },
  [ErrorCode.WEAK_PASSWORD]: { message: 'Password does not meet requirements', status: 400 },
  [ErrorCode.ACCOUNT_LOCKED]: { message: 'Account is locked', status: 403 },
  [ErrorCode.EMAIL_NOT_VERIFIED]: { message: 'Email address not verified', status: 403 },

  // Billing (E3xxx)
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: { message: 'No active subscription found', status: 404 },
  [ErrorCode.PLAN_NOT_FOUND]: { message: 'Plan not found', status: 404 },
  [ErrorCode.PAYMENT_FAILED]: { message: 'Payment failed', status: 402 },
  [ErrorCode.QUOTA_EXCEEDED]: { message: 'Usage quota exceeded', status: 403 },
  [ErrorCode.FEATURE_NOT_AVAILABLE]: { message: 'Feature not available in your plan', status: 403 },
  [ErrorCode.TRIAL_EXPIRED]: { message: 'Trial period has expired', status: 403 },
  [ErrorCode.SUBSCRIPTION_CANCELLED]: { message: 'Subscription has been cancelled', status: 403 },
  [ErrorCode.INVALID_COUPON]: { message: 'Invalid or expired coupon', status: 400 },
  [ErrorCode.PAYMENT_METHOD_REQUIRED]: { message: 'Payment method required', status: 402 },
  [ErrorCode.INSUFFICIENT_CREDITS]: { message: 'Insufficient credits', status: 402 },
  [ErrorCode.INVOICE_NOT_FOUND]: { message: 'Invoice not found', status: 404 },
  [ErrorCode.CUSTOMER_NOT_FOUND]: { message: 'Billing customer not found', status: 404 },
  [ErrorCode.REFUND_EXCEEDED]: { message: 'Refund amount exceeds available balance', status: 400 },
  [ErrorCode.ALREADY_REFUNDED]: { message: 'Payment has already been refunded', status: 409 },

  // Tenant (E4xxx)
  [ErrorCode.TENANT_NOT_FOUND]: { message: 'Organization not found', status: 404 },
  [ErrorCode.MEMBER_NOT_FOUND]: { message: 'Team member not found', status: 404 },
  [ErrorCode.INVITATION_EXPIRED]: { message: 'Invitation has expired', status: 410 },
  [ErrorCode.INVITATION_NOT_FOUND]: { message: 'Invitation not found', status: 404 },
  [ErrorCode.MEMBER_EXISTS]: { message: 'Member already exists', status: 409 },
  [ErrorCode.LAST_OWNER]: { message: 'Cannot remove the last owner', status: 400 },
  [ErrorCode.ROLE_NOT_FOUND]: { message: 'Role not found', status: 404 },
  [ErrorCode.PERMISSION_DENIED]: { message: 'Permission denied', status: 403 },
  [ErrorCode.TENANT_LIMIT]: { message: 'Organization limit reached', status: 403 },
  [ErrorCode.SLUG_TAKEN]: { message: 'This URL is already taken', status: 409 },
  [ErrorCode.TENANT_SUSPENDED]: { message: 'This workspace has been suspended', status: 403 },

  // Identity (E5xxx)
  [ErrorCode.USER_NOT_FOUND]: { message: 'User not found', status: 404 },
  [ErrorCode.EMAIL_EXISTS]: { message: 'Email already in use', status: 409 },
  [ErrorCode.INVALID_EMAIL]: { message: 'Invalid email format', status: 400 },
  [ErrorCode.PASSWORD_RESET_EXPIRED]: { message: 'Password reset link has expired', status: 410 },
  [ErrorCode.PROFILE_INCOMPLETE]: { message: 'Profile is incomplete', status: 400 },
  [ErrorCode.USERNAME_EXISTS]: { message: 'Username already taken', status: 409 },
  [ErrorCode.PHONE_EXISTS]: { message: 'Phone number already in use', status: 409 },
  [ErrorCode.API_KEY_LIMIT]: { message: 'API key limit exceeded', status: 403 },

  // Storage (E6xxx)
  [ErrorCode.FILE_NOT_FOUND]: { message: 'File not found', status: 404 },
  [ErrorCode.FILE_TOO_LARGE]: { message: 'File exceeds size limit', status: 413 },
  [ErrorCode.INVALID_FILE_TYPE]: { message: 'File type not allowed', status: 415 },
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: { message: 'Storage quota exceeded', status: 403 },
  [ErrorCode.UPLOAD_FAILED]: { message: 'Upload failed', status: 500 },

  // Webhook (E7xxx)
  [ErrorCode.WEBHOOK_DELIVERY_FAILED]: { message: 'Webhook delivery failed', status: 502 },
  [ErrorCode.INVALID_WEBHOOK_SIGNATURE]: { message: 'Invalid webhook signature', status: 401 },
  [ErrorCode.WEBHOOK_NOT_FOUND]: { message: 'Webhook endpoint not found', status: 404 },
  [ErrorCode.INTEGRATION_NOT_CONFIGURED]: { message: 'Integration not configured', status: 400 },
  [ErrorCode.EXTERNAL_API_ERROR]: { message: 'External service error', status: 502 },
  [ErrorCode.WEBHOOK_LIMIT_EXCEEDED]: { message: 'Webhook limit exceeded', status: 403 },
  [ErrorCode.NOTIFICATION_FAILED]: { message: 'Notification delivery failed', status: 502 },
  [ErrorCode.TEMPLATE_NOT_FOUND]: { message: 'Template not found', status: 404 },

  // AI (E8xxx)
  [ErrorCode.AI_QUOTA_EXCEEDED]: { message: 'AI usage quota exceeded', status: 403 },
  [ErrorCode.MODEL_NOT_FOUND]: { message: 'AI model not found', status: 404 },
  [ErrorCode.AI_REQUEST_FAILED]: { message: 'AI request failed', status: 500 },
  [ErrorCode.CONTENT_MODERATION_FAILED]: { message: 'Content was flagged by moderation', status: 400 },
};

/**
 * Get catalog entry for an error code.
 */
export function getErrorInfo(code: ErrorCode): ErrorCatalogEntry {
  return ErrorCatalog[code];
}

/**
 * Get HTTP status for an error code.
 */
export function getErrorStatus(code: ErrorCode): number {
  return ErrorCatalog[code].status;
}

/**
 * Get default message for an error code.
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorCatalog[code].message;
}
