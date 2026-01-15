"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@unisane/ui/components/toast";
import {
  normalizeError,
  isAuthError,
  type NormalizedError,
} from "@/src/sdk/errors";

/**
 * Error display strategy determines how different error types are shown to users.
 *
 * - "toast": Temporary notification (default for most errors)
 * - "banner": Persistent inline banner (use ErrorBanner component)
 * - "redirect": Redirect to another page (login, billing, etc.)
 * - "inline": Field-level errors only (for form validation)
 */
export type ErrorDisplayStrategy = "toast" | "banner" | "redirect" | "inline";

/**
 * Result of error handling with display recommendations
 */
export type ErrorHandleResult = {
  /** The normalized error */
  error: NormalizedError;
  /** Recommended display strategy */
  strategy: ErrorDisplayStrategy;
  /** Redirect URL if strategy is "redirect" */
  redirectUrl?: string;
  /** Whether the toast was shown (only true for "toast" strategy) */
  toastShown: boolean;
};

export type UseApiErrorOptions = {
  /** Custom handler for auth errors (default: redirect to login) */
  onAuthError?: (ne: NormalizedError) => void;
  /** Whether to auto-redirect on auth errors (default: true) */
  redirectOnAuth?: boolean;
  /** Base message prefix (e.g., "Failed to save") */
  messagePrefix?: string;
  /** Custom handler called after showing toast */
  onError?: (ne: NormalizedError) => void;
  /**
   * Override the automatic display strategy.
   * If not provided, strategy is determined by error kind:
   * - server (500) → "banner" (persistent)
   * - auth (401) → "redirect" to login
   * - forbidden (403) → "toast" or "redirect" based on context
   * - validation (422) → "inline" (field errors)
   * - rate_limited (429) → "toast" with duration info
   * - network → "toast" (retryable)
   * - others → "toast"
   */
  displayStrategy?: ErrorDisplayStrategy;
  /**
   * For "banner" strategy, whether to also show a toast.
   * Useful when you have a banner component but also want toast notification.
   */
  alsoShowToast?: boolean;
};

/**
 * Determine the display strategy based on error kind
 */
function getDefaultStrategy(ne: NormalizedError): ErrorDisplayStrategy {
  switch (ne.kind) {
    case "auth":
      return "redirect";
    case "validation":
      // Validation errors with fields should be shown inline on forms
      return ne.fields && ne.fields.length > 0 ? "inline" : "toast";
    case "server":
      // 500 errors should be persistent (banner), not auto-dismissing toast
      return "banner";
    case "forbidden":
    case "not_found":
    case "conflict":
    case "rate_limited":
    case "billing":
    case "network":
    case "unknown":
    default:
      return "toast";
  }
}

/**
 * Hook for standardized API error handling
 *
 * Features:
 * - Normalizes errors using the SDK normalizer
 * - Auto-redirects to login on auth errors
 * - Smart display strategy based on error type
 * - Shows toast with action hint and retry option
 * - Handles field-level errors for forms
 * - Returns display strategy recommendation for UI components
 *
 * @example
 * const handleError = useApiError();
 *
 * const mutation = useSomeMutation({
 *   onError: (e) => handleError(e, { messagePrefix: "Failed to save" }),
 * });
 *
 * @example
 * // With form field errors (recommended pattern)
 * const handleError = useApiError();
 * const [bannerError, setBannerError] = useState<NormalizedError | null>(null);
 *
 * const mutation = useSomeMutation({
 *   onError: (e) => {
 *     const result = handleError(e, { messagePrefix: "Failed to create" });
 *
 *     // Handle based on strategy
 *     if (result.strategy === "inline" && result.error.fields) {
 *       result.error.fields.forEach(({ field, message }) => {
 *         form.setError(field as keyof FormData, { message });
 *       });
 *     } else if (result.strategy === "banner") {
 *       setBannerError(result.error);
 *     }
 *   },
 * });
 *
 * // In JSX:
 * {bannerError && (
 *   <ErrorBanner error={bannerError} onRetry={refetch} onDismiss={() => setBannerError(null)} />
 * )}
 */
export function useApiError(defaultOptions?: UseApiErrorOptions) {
  const router = useRouter();
  const pathname = usePathname();

  const handleError = useCallback(
    (error: unknown, options?: UseApiErrorOptions): ErrorHandleResult => {
      const opts = { ...defaultOptions, ...options };
      const ne = normalizeError(error);

      // Determine display strategy
      const strategy = opts.displayStrategy ?? getDefaultStrategy(ne);

      let toastShown = false;
      let redirectUrl: string | undefined;

      // Handle based on strategy
      switch (strategy) {
        case "redirect": {
          // Auth errors redirect to login
          if (opts.onAuthError) {
            opts.onAuthError(ne);
          } else if (opts.redirectOnAuth !== false) {
            // Show a brief toast before redirect
            toast.error(ne.message);
            toastShown = true;
            redirectUrl = `/login?next=${encodeURIComponent(pathname)}`;
            router.push(redirectUrl);
          }
          break;
        }

        case "banner": {
          // Banner errors are NOT shown as toast by default
          // The caller should render an ErrorBanner component
          // But can optionally also show toast
          if (opts.alsoShowToast) {
            showToast(ne, opts.messagePrefix);
            toastShown = true;
          }
          break;
        }

        case "inline": {
          // Inline validation errors: don't show toast, let form handle it
          // Caller should map ne.fields to form.setError()
          // But show toast if no fields (fallback)
          if (!ne.fields || ne.fields.length === 0) {
            showToast(ne, opts.messagePrefix);
            toastShown = true;
          }
          break;
        }

        case "toast":
        default: {
          showToast(ne, opts.messagePrefix);
          toastShown = true;
          break;
        }
      }

      // Call custom handler
      if (opts.onError) {
        opts.onError(ne);
      }

      return {
        error: ne,
        strategy,
        ...(redirectUrl !== undefined && { redirectUrl }),
        toastShown,
      };
    },
    [router, pathname, defaultOptions]
  );

  return handleError;
}

/**
 * Show a toast notification for an error
 */
function showToast(ne: NormalizedError, messagePrefix?: string): void {
  const title = messagePrefix ? `${messagePrefix}: ${ne.message}` : ne.message;

  // Build description with action and request ID
  let description = ne.action ?? ne.rawMessage ?? undefined;
  if (ne.requestId) {
    description = description
      ? `${description}\nRef: ${ne.requestId}`
      : `Ref: ${ne.requestId}`;
  }

  // Rate limited errors include duration info
  if (ne.kind === "rate_limited") {
    toast.error(title, {
      description,
      duration: 10000, // Show longer for rate limit
    });
  } else {
    toast.error(title, { description });
  }
}

/**
 * Simple error handler for one-off use (no hooks)
 * Use this in callbacks where hooks can't be called
 *
 * @example
 * onError: (e) => showApiError(e, "Failed to save")
 */
export function showApiError(
  error: unknown,
  messagePrefix?: string
): ErrorHandleResult {
  const ne = normalizeError(error);
  const strategy = getDefaultStrategy(ne);

  // For simple usage, always show toast (no redirect handling)
  showToast(ne, messagePrefix);

  return {
    error: ne,
    strategy,
    toastShown: true,
  };
}

/**
 * Helper to map field errors to a react-hook-form instance
 *
 * @example
 * const mutation = useSomeMutation({
 *   onError: (e) => {
 *     const result = handleError(e);
 *     mapFieldErrors(result.error, form.setError);
 *   },
 * });
 */
export function mapFieldErrors<T extends Record<string, unknown>>(
  error: NormalizedError,
  setError: (field: keyof T & string, error: { message: string }) => void
): boolean {
  if (!error.fields || error.fields.length === 0) {
    return false;
  }

  for (const { field, message } of error.fields) {
    setError(field as keyof T & string, { message });
  }

  return true;
}

export default useApiError;
