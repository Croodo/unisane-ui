"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  normalizeError,
  isAuthError,
  type NormalizedError,
} from "@/src/sdk/errors";

export type UseApiErrorOptions = {
  /** Custom handler for auth errors (default: redirect to login) */
  onAuthError?: (ne: NormalizedError) => void;
  /** Whether to auto-redirect on auth errors (default: true) */
  redirectOnAuth?: boolean;
  /** Base message prefix (e.g., "Failed to save") */
  messagePrefix?: string;
  /** Custom handler called after showing toast */
  onError?: (ne: NormalizedError) => void;
};

/**
 * Hook for standardized API error handling
 *
 * Features:
 * - Normalizes errors using the SDK normalizer
 * - Auto-redirects to login on auth errors
 * - Shows toast with action hint and retry option
 * - Handles field-level errors for forms
 *
 * @example
 * const handleError = useApiError();
 *
 * const mutation = useSomeMutation({
 *   onError: (e) => handleError(e, { messagePrefix: "Failed to save" }),
 * });
 *
 * @example
 * // With form field errors
 * const handleError = useApiError();
 *
 * const mutation = useSomeMutation({
 *   onError: (e) => {
 *     const ne = handleError(e, { messagePrefix: "Failed to create" });
 *     // Handle field errors in form
 *     if (ne.fields) {
 *       ne.fields.forEach(({ field, message }) => {
 *         form.setError(field, { message });
 *       });
 *     }
 *   },
 * });
 */
export function useApiError(defaultOptions?: UseApiErrorOptions) {
  const router = useRouter();
  const pathname = usePathname();

  const handleError = useCallback(
    (error: unknown, options?: UseApiErrorOptions): NormalizedError => {
      const opts = { ...defaultOptions, ...options };
      const ne = normalizeError(error);

      // Handle auth errors
      if (isAuthError(error)) {
        if (opts.onAuthError) {
          opts.onAuthError(ne);
        } else if (opts.redirectOnAuth !== false) {
          toast.error(ne.message);
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
          return ne;
        }
      }

      // Build toast message
      const title = opts.messagePrefix
        ? `${opts.messagePrefix}: ${ne.message}`
        : ne.message;

      // Show toast with enhanced info
      toast.error(title, {
        description: ne.action ?? ne.rawMessage,
        ...(ne.requestId && {
          description:
            `${ne.action ?? ne.rawMessage ?? ""}\nRef: ${ne.requestId}`.trim(),
        }),
      });

      // Call custom handler
      if (opts.onError) {
        opts.onError(ne);
      }

      return ne;
    },
    [router, pathname, defaultOptions]
  );

  return handleError;
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
): NormalizedError {
  const ne = normalizeError(error);

  const title = messagePrefix ? `${messagePrefix}: ${ne.message}` : ne.message;

  toast.error(title, {
    description: ne.action ?? ne.rawMessage,
  });

  return ne;
}

export default useApiError;
