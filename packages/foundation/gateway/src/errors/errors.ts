import {
  ERROR_CATALOG,
  getErrorDef,
  type ErrorCode,
  type ErrorDefinition,
} from "./errorCatalog";
import { isDomainError } from "@unisane/kernel";

// Re-export for convenience
export type { ErrorCode, ErrorDefinition };
export { ERROR_CATALOG, getErrorDef };

export type RateLimitDetails = {
  retryAfterSec?: number;
  remaining?: number;
  resetAt?: number;
};

export type FieldError = {
  field: string;
  message: string;
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  userMessage: string;
  action: string | undefined;
  retryable: boolean;
  details: Record<string, unknown> | null;

  constructor(
    code: ErrorCode,
    options?: {
      message?: string | undefined; // Override message from catalog
      details?: Record<string, unknown> | undefined;
      fields?: FieldError[] | undefined;
    }
  ) {
    const def = getErrorDef(code);
    const message = options?.message ?? def.message;
    super(message);

    this.code = code;
    this.status = def.status;
    this.userMessage = message;
    this.action = def.action;
    this.retryable = def.retryable;
    this.details = options?.details ?? null;

    if (options?.fields) {
      this.details = { ...(this.details ?? {}), fields: options.fields };
    }
  }
}

/**
 * Error factory helpers
 *
 * Usage:
 *   throw ERR.loginRequired()
 *   throw ERR.forbidden("Admin access required")
 *   throw ERR.validation("Invalid email format")
 *   throw ERR.validation("Validation failed", [{ field: "email", message: "Invalid format" }])
 */
export const ERR = {
  // Auth
  loginRequired: () => new AppError("AUTH_UNAUTHENTICATED"),
  invalidCredentials: () => new AppError("AUTH_INVALID_CREDENTIALS"),
  tokenExpired: () => new AppError("AUTH_TOKEN_EXPIRED"),
  forbidden: (reason?: string) =>
    new AppError("AUTH_FORBIDDEN", reason ? { message: reason } : undefined),
  adminOnly: () => new AppError("AUTH_FORBIDDEN_ADMIN_ONLY"),
  ownerOnly: () => new AppError("AUTH_FORBIDDEN_OWNER_ONLY"),
  platformOnly: () => new AppError("AUTH_FORBIDDEN_PLATFORM_ONLY"),

  // Shorthand aliases (UPPERCASE for terse usage)
  /** Shorthand for forbidden() */
  FORBID: (reason?: string) =>
    new AppError("AUTH_FORBIDDEN", reason ? { message: reason } : undefined),
  /** Shorthand for validation() */
  VALID: (message?: string, fields?: FieldError[]) =>
    new AppError("VALIDATION_FAILED", {
      ...(message ? { message } : {}),
      ...(fields ? { fields } : {}),
    }),
  /** Shorthand for rateLimited() with message override */
  RATE: (message?: string, details?: RateLimitDetails) =>
    new AppError("RATE_LIMITED", {
      ...(message ? { message } : {}),
      ...(details ? { details } : {}),
    }),

  // Validation
  validation: (message?: string, fields?: FieldError[]) =>
    new AppError("VALIDATION_FAILED", {
      ...(message ? { message } : {}),
      ...(fields ? { fields } : {}),
    }),
  emailInvalid: () => new AppError("VALIDATION_EMAIL_INVALID"),
  phoneInvalid: () => new AppError("VALIDATION_PHONE_INVALID"),
  passwordWeak: () => new AppError("VALIDATION_PASSWORD_WEAK"),
  fieldRequired: (field: string) =>
    new AppError("VALIDATION_FIELD_REQUIRED", {
      fields: [{ field, message: "This field is required" }],
    }),
  otpExpired: () => new AppError("VALIDATION_OTP_EXPIRED"),
  otpInvalid: () => new AppError("VALIDATION_OTP_INVALID"),

  // Resources
  notFound: (resource?: string) =>
    new AppError(
      "RESOURCE_NOT_FOUND",
      resource ? { message: `${resource} not found.` } : undefined
    ),
  userNotFound: () => new AppError("RESOURCE_USER_NOT_FOUND"),
  tenantNotFound: () => new AppError("RESOURCE_TENANT_NOT_FOUND"),
  settingNotFound: () => new AppError("RESOURCE_SETTING_NOT_FOUND"),

  // Conflicts
  alreadyExists: (what?: string) =>
    new AppError(
      "CONFLICT_ALREADY_EXISTS",
      what ? { message: `${what} already exists.` } : undefined
    ),
  versionMismatch: () => new AppError("CONFLICT_VERSION_MISMATCH"),
  phoneRegistered: () => new AppError("CONFLICT_PHONE_REGISTERED"),
  emailRegistered: () => new AppError("CONFLICT_EMAIL_REGISTERED"),
  usernameTaken: () => new AppError("CONFLICT_USERNAME_TAKEN"),

  // Billing
  insufficientCredits: () => new AppError("BILLING_INSUFFICIENT_CREDITS"),
  seatLimitReached: () => new AppError("BILLING_SEAT_LIMIT_REACHED"),
  paymentFailed: () => new AppError("BILLING_PAYMENT_FAILED"),
  subscriptionRequired: () => new AppError("BILLING_SUBSCRIPTION_REQUIRED"),

  // Rate Limiting
  rateLimited: (details?: RateLimitDetails) =>
    new AppError("RATE_LIMITED", details ? { details } : undefined),

  // Server
  misconfigured: (hint?: string) =>
    new AppError("SERVER_MISCONFIGURED", hint ? { message: hint } : undefined),
  internal: (hint?: string) =>
    new AppError("SERVER_INTERNAL", hint ? { message: hint } : undefined),
  unavailable: () => new AppError("SERVER_UNAVAILABLE"),
  databaseError: () => new AppError("SERVER_DATABASE_ERROR"),
};

import { HEADER_NAMES } from "../headers";
import { logger } from "../logger";
import { captureException } from "@unisane/kernel";

function serializeError(err: unknown): Record<string, unknown> {
  try {
    if (!err || typeof err !== "object")
      return { name: "UnknownError", value: String(err) };
    const anyErr = err as {
      name?: unknown;
      message?: unknown;
      stack?: unknown;
      code?: unknown;
      cause?: unknown;
      reason?: unknown;
    } & Record<string, unknown>;
    return {
      name: typeof anyErr.name === "string" ? anyErr.name : "Error",
      message: typeof anyErr.message === "string" ? anyErr.message : undefined,
      stack: typeof anyErr.stack === "string" ? anyErr.stack : undefined,
      code:
        typeof anyErr.code === "string" || typeof anyErr.code === "number"
          ? anyErr.code
          : undefined,
      reason: typeof anyErr.reason === "string" ? anyErr.reason : undefined,
      cause: typeof anyErr.cause === "string" ? anyErr.cause : undefined,
    };
  } catch {
    return { name: "UnknownError" };
  }
}

/**
 * Convert any error to an HTTP Response.
 * Supports both gateway AppError and kernel DomainError.
 */
export function toHttp(e: unknown, requestId?: string): Response {
  const requestIdFinal = requestId ?? crypto.randomUUID();

  // Handle kernel DomainError
  if (isDomainError(e)) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      [HEADER_NAMES.REQUEST_ID]: requestIdFinal,
    };

    // Rate limit headers for kernel errors
    if (e.details?.retryAfter) {
      headers["Retry-After"] = String(Math.ceil(Number(e.details.retryAfter)));
    }

    // Logging and error tracking based on severity
    try {
      if (e.status >= 500) {
        logger.error(e.message, { code: e.code, requestId: requestIdFinal });
        // Track 5xx errors for alerting
        captureException(new Error(e.message), {
          tags: { code: e.code, requestId: requestIdFinal },
          level: 'error',
        });
      } else if (e.status === 429) {
        logger.warn(e.message, { code: e.code, requestId: requestIdFinal, details: e.details });
      }
    } catch {}

    // Build response body using DomainError's toJSON
    const errorObj = {
      ...e.toJSON(),
      requestId: requestIdFinal,
    };

    return new Response(JSON.stringify({ error: errorObj }), {
      status: e.status,
      headers,
    });
  }

  // Handle gateway AppError
  if (e instanceof AppError) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      [HEADER_NAMES.REQUEST_ID]: requestIdFinal,
    };

    // Rate limit headers
    if (e.code === "RATE_LIMITED" && e.details) {
      const d = e.details as RateLimitDetails;
      const retryAfterSec = Number(d.retryAfterSec);
      const remaining = Number(d.remaining);
      const resetAt = Number(d.resetAt);
      if (!Number.isNaN(retryAfterSec))
        headers["Retry-After"] = String(Math.max(1, Math.ceil(retryAfterSec)));
      if (!Number.isNaN(remaining))
        headers["X-RateLimit-Remaining"] = String(
          Math.max(0, Math.floor(remaining))
        );
      if (!Number.isNaN(resetAt))
        headers["X-RateLimit-Reset"] = String(Math.floor(resetAt));
    }

    // Logging and error tracking based on severity
    try {
      if (e.status >= 500) {
        logger.error(e.message, { code: e.code, requestId: requestIdFinal });
        // Track 5xx errors for alerting
        captureException(e, {
          tags: { code: e.code, requestId: requestIdFinal },
          level: 'error',
        });
      } else if (e.code === "RATE_LIMITED") {
        logger.warn(e.message, { code: e.code, requestId: requestIdFinal, details: e.details });
      } else if (e.code === "CONFLICT_VERSION_MISMATCH") {
        logger.info(e.message, { code: e.code, requestId: requestIdFinal });
      }
    } catch {}

    // Build response body
    const errorObj: Record<string, unknown> = {
      code: e.code,
      message: e.userMessage,
      requestId: requestIdFinal,
    };
    if (e.action) errorObj.action = e.action;
    if (e.retryable) errorObj.retryable = e.retryable;
    if (e.details && typeof e.details === "object" && "fields" in e.details) {
      errorObj.fields = e.details.fields;
    }
    const body = { error: errorObj };

    return new Response(JSON.stringify(body), {
      status: e.status,
      headers,
    });
  }

  // Map common DB errors to friendly codes
  try {
    if (e && typeof e === "object") {
      const anyErr = e as { name?: unknown; code?: unknown; message?: unknown };
      const name = typeof anyErr.name === "string" ? anyErr.name : "";
      const codeNum = typeof anyErr.code === "number" ? anyErr.code : undefined;
      const msg = typeof anyErr.message === "string" ? anyErr.message : "";

      // Duplicate key (Mongo E11000)
      if (codeNum === 11000 || /E11000/i.test(msg)) {
        const headers = {
          "content-type": "application/json",
          [HEADER_NAMES.REQUEST_ID]: requestIdFinal,
        } as Record<string, string>;
        const def = getErrorDef("CONFLICT_ALREADY_EXISTS");
        return new Response(
          JSON.stringify({
            error: {
              code: "CONFLICT_ALREADY_EXISTS",
              message: def.message,
              requestId: requestIdFinal,
              retryable: def.retryable,
            },
          }),
          { status: 409, headers }
        );
      }

      // Database connectivity/server selection errors (mongoose/mongo)
      const isDbConnErr =
        /MongoNetworkError/i.test(name) ||
        /MongoServerSelectionError/i.test(name) ||
        /MongooseServerSelectionError/i.test(name) ||
        /ECONNREFUSED|ENOTFOUND|timed out|failed to connect|server selection timed out/i.test(
          msg
        );
      if (isDbConnErr) {
        const headers = {
          "content-type": "application/json",
          [HEADER_NAMES.REQUEST_ID]: requestIdFinal,
        } as Record<string, string>;
        try {
          logger.error("Database connection failed", { requestId: requestIdFinal, err: serializeError(e) });
          // Track database errors for alerting
          captureException(e instanceof Error ? e : new Error(msg || 'Database connection failed'), {
            tags: { requestId: requestIdFinal, errorType: 'database' },
            level: 'fatal',
          });
        } catch {}
        const def = getErrorDef("SERVER_DATABASE_ERROR");
        return new Response(
          JSON.stringify({
            error: {
              code: "SERVER_DATABASE_ERROR",
              message: def.message,
              requestId: requestIdFinal,
              retryable: def.retryable,
            },
          }),
          { status: 500, headers }
        );
      }
    }
  } catch {}

  // Fallback: Internal server error
  try {
    logger.error("Unhandled error", { requestId: requestIdFinal, err: serializeError(e) });
    // Track unhandled errors for alerting
    captureException(e instanceof Error ? e : new Error(String(e)), {
      tags: { requestId: requestIdFinal, errorType: 'unhandled' },
      level: 'error',
    });
  } catch {}

  const def = getErrorDef("SERVER_INTERNAL");
  return new Response(
    JSON.stringify({
      error: {
        code: "SERVER_INTERNAL",
        message: def.message,
        requestId: requestIdFinal,
        retryable: def.retryable,
      },
    }),
    {
      status: 500,
      headers: {
        "content-type": "application/json",
        [HEADER_NAMES.REQUEST_ID]: requestIdFinal,
      },
    }
  );
}
