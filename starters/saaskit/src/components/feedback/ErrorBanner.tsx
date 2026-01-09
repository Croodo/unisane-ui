"use client";

import { forwardRef, useState } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import { Text } from "@unisane/ui/primitives/text";
import type { NormalizedError } from "@/src/sdk/errors";

/**
 * ErrorBanner variants based on error kind
 */
type ErrorVariant = "error" | "warning" | "info";

export type ErrorBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Normalized error object from normalizeError() */
  error: NormalizedError;
  /** Called when retry button is clicked */
  onRetry?: () => void;
  /** Called when dismiss button is clicked */
  onDismiss?: () => void;
  /** Whether to show the dismiss button */
  dismissible?: boolean;
  /** Override the variant (auto-detected from error kind if not provided) */
  variant?: ErrorVariant;
};

/**
 * Get variant based on error kind
 */
function getVariant(kind: NormalizedError["kind"]): ErrorVariant {
  switch (kind) {
    case "rate_limited":
    case "network":
      return "warning";
    case "server":
    case "billing":
      return "error";
    default:
      return "error";
  }
}

/**
 * Get icon based on variant
 */
function getIconSymbol(variant: ErrorVariant): string {
  switch (variant) {
    case "warning":
      return "warning";
    case "info":
      return "info";
    default:
      return "error";
  }
}

/**
 * CopyButton - handles copy-to-clipboard with feedback
 */
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="text" size="sm" onClick={handleCopy} className="h-7 px-2">
      <Icon symbol={copied ? "check" : "content_copy"} size="xs" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}

/**
 * RateLimitCountdown - shows countdown for rate limit errors
 */
function RateLimitCountdown({ retryAfter }: { retryAfter: number }) {
  const [remaining] = useState(retryAfter);

  return (
    <span className="inline-flex items-center gap-1 text-label-small">
      <Icon symbol="schedule" size="xs" />
      Retry in {remaining}s
    </span>
  );
}

/**
 * ErrorBanner
 *
 * Persistent error display component for API errors.
 * Unlike toasts, this component does NOT auto-dismiss and stays visible
 * until the user takes action (retry, dismiss, or error resolves).
 */
const ErrorBanner = forwardRef<HTMLDivElement, ErrorBannerProps>(
  (
    {
      className,
      error,
      onRetry,
      onDismiss,
      dismissible = false,
      variant: variantOverride,
      ...props
    },
    ref
  ) => {
    const variant = variantOverride ?? getVariant(error.kind);
    const iconSymbol = getIconSymbol(variant);

    const variantStyles = {
      error: "border-error/30 bg-error-container text-on-error-container",
      warning: "border-tertiary/30 bg-tertiary-container text-on-tertiary-container",
      info: "border-primary/30 bg-primary-container text-on-primary-container",
    };

    const iconStyles = {
      error: "bg-error/10 text-error",
      warning: "bg-tertiary/10 text-tertiary",
      info: "bg-primary/10 text-primary",
    };

    // Extract retry-after from rate limit errors
    const retryAfter =
      error.kind === "rate_limited" && error.status === 429
        ? (error as unknown as { retryAfter?: number }).retryAfter
        : undefined;

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          "rounded-xl border p-4",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              iconStyles[variant]
            )}
          >
            <Icon symbol={iconSymbol} size="sm" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Message */}
            <Text variant="bodyMedium" weight="medium">{error.message}</Text>

            {/* Action hint */}
            {error.action && (
              <Text variant="bodySmall" color="onSurfaceVariant">{error.action}</Text>
            )}

            {/* Field errors summary */}
            {error.fields && error.fields.length > 0 && (
              <ul className="text-body-small text-on-surface-variant list-disc list-inside">
                {error.fields.slice(0, 3).map((f, i) => (
                  <li key={i}>
                    <span className="font-medium">{f.field}</span>: {f.message}
                  </li>
                ))}
                {error.fields.length > 3 && (
                  <li>...and {error.fields.length - 3} more</li>
                )}
              </ul>
            )}

            {/* Request ID and rate limit countdown */}
            <div className="flex flex-wrap items-center gap-2 text-label-small text-on-surface-variant">
              {error.requestId && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-mono">Ref: {error.requestId}</span>
                  <CopyButton text={error.requestId} />
                </span>
              )}
              {retryAfter && <RateLimitCountdown retryAfter={retryAfter} />}
            </div>

            {/* Actions */}
            {(error.retryable || dismissible) && (
              <div className="flex items-center gap-2 pt-1">
                {error.retryable && onRetry && (
                  <Button variant="outlined" size="sm" onClick={onRetry}>
                    <Icon symbol="refresh" size="xs" className="mr-1.5" />
                    Try again
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && onDismiss && (
            <Button
              variant="text"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
              aria-label="Dismiss"
            >
              <Icon symbol="close" size="sm" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);
ErrorBanner.displayName = "ErrorBanner";

export { ErrorBanner };
