/**
 * Client-side error normalization and UI message handling
 *
 * This module normalizes API errors into a consistent format for the frontend,
 * extracting user-friendly messages, action hints, and retryable flags from
 * the backend error envelope.
 */

import type { ErrorCode } from "../errors/errorCatalog";

export type NormalizedError = {
  status: number | undefined;
  code: ErrorCode | string | undefined; // The error code from API
  kind:
    | "auth"
    | "forbidden"
    | "not_found"
    | "conflict"
    | "validation"
    | "rate_limited"
    | "billing"
    | "server"
    | "network"
    | "unknown";
  message: string; // User-friendly message (shown in UI)
  rawMessage: string | undefined; // Original message from API
  action: string | undefined; // Suggested action
  retryable: boolean; // Whether user can retry
  fields: Array<{ field: string; message: string }> | undefined; // Field-level errors
  requestId: string | undefined; // For support/debugging
};

// Default UI messages when API doesn't provide one
export const UI_ERROR_MESSAGES: Record<NormalizedError["kind"], string> = {
  auth: "Please sign in to continue.",
  forbidden: "You do not have permission to perform this action.",
  not_found: "Not found.",
  conflict: "This changed in the meantime. Refresh and try again.",
  validation: "Some inputs look invalid. Please check and try again.",
  rate_limited: "You're sending too many requests. Please try again shortly.",
  billing: "Billing error. Please check your payment method.",
  server: "Something went wrong. Please try again.",
  network: "Network error. Check your connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

// Map error codes to kinds
function codeToKind(code: string | undefined): NormalizedError["kind"] {
  if (!code) return "unknown";

  if (
    code.startsWith("AUTH_UNAUTHENTICATED") ||
    code === "AUTH_TOKEN_EXPIRED" ||
    code === "AUTH_INVALID_CREDENTIALS"
  ) {
    return "auth";
  }
  if (code.startsWith("AUTH_FORBIDDEN")) {
    return "forbidden";
  }
  if (code.startsWith("RESOURCE_") && code.includes("NOT_FOUND")) {
    return "not_found";
  }
  if (code.startsWith("CONFLICT_")) {
    return "conflict";
  }
  if (code.startsWith("VALIDATION_")) {
    return "validation";
  }
  if (code === "RATE_LIMITED") {
    return "rate_limited";
  }
  if (code.startsWith("BILLING_")) {
    return "billing";
  }
  if (code.startsWith("SERVER_")) {
    return "server";
  }

  return "unknown";
}

// Map status code to kind (fallback when no error code)
function statusToKind(status: number | undefined): NormalizedError["kind"] {
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status === 402) return "billing";
  if (typeof status === "number" && status >= 500) return "server";
  return "unknown";
}

/**
 * Normalize any error (from API or other sources) into a consistent format
 *
 * @example
 * const { mutate } = useSomeMutation({
 *   onError: (e) => {
 *     const ne = normalizeError(e);
 *     toast.error(ne.message, {
 *       description: ne.action,
 *       action: ne.retryable ? { label: 'Retry', onClick: refetch } : undefined
 *     });
 *   }
 * });
 */
export function normalizeError(e: unknown): NormalizedError {
  const anyErr = e as
    | {
        status?: unknown;
        message?: unknown;
        body?: unknown;
      }
    | undefined;

  const status = typeof anyErr?.status === "number" ? anyErr.status : undefined;

  // Extract error envelope from ts-rest response shape: { body: { error: { ... } } }
  let errorEnvelope:
    | {
        code?: string;
        message?: string;
        action?: string;
        retryable?: boolean;
        fields?: Array<{ field: string; message: string }>;
        requestId?: string;
      }
    | undefined;

  const body = anyErr?.body as unknown;
  if (body && typeof body === "object" && "error" in body) {
    const inner = (body as { error?: unknown }).error;
    if (inner && typeof inner === "object") {
      errorEnvelope = inner as typeof errorEnvelope;
    }
  }

  // Get values from envelope or fallback
  const code = errorEnvelope?.code;
  const rawMessage =
    errorEnvelope?.message ??
    (typeof anyErr?.message === "string" ? anyErr.message : undefined);
  const action = errorEnvelope?.action;
  const retryable = errorEnvelope?.retryable ?? false;
  const fields = errorEnvelope?.fields;
  const requestId = errorEnvelope?.requestId;

  // Determine kind from code first, then status
  const kind = code ? codeToKind(code) : statusToKind(status);

  // Use API message if provided, otherwise use default for kind
  const message = rawMessage ?? UI_ERROR_MESSAGES[kind];

  // Check for network errors
  const msgLower = (rawMessage ?? "").toLowerCase();
  if (
    msgLower.includes("failed to fetch") ||
    msgLower.includes("network") ||
    msgLower.includes("offline")
  ) {
    return {
      status,
      code,
      kind: "network",
      message: UI_ERROR_MESSAGES.network,
      rawMessage,
      action,
      retryable: true,
      fields,
      requestId,
    };
  }

  return {
    status,
    code,
    kind,
    message,
    rawMessage,
    action,
    retryable,
    fields,
    requestId,
  };
}

/**
 * Helper to check if an error is retryable
 */
export function isRetryable(e: unknown): boolean {
  return normalizeError(e).retryable;
}

/**
 * Helper to get just the user message
 */
export function getErrorMessage(e: unknown): string {
  return normalizeError(e).message;
}

/**
 * Helper to check if error is an auth error (should redirect to login)
 */
export function isAuthError(e: unknown): boolean {
  return normalizeError(e).kind === "auth";
}
