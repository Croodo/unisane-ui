"use client";

import { Component, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import { Text } from "@unisane/ui/primitives/text";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  pageUrl: string | null;
  componentStack: string | null;
}

/**
 * Formats error message to be more user-friendly
 */
function formatErrorMessage(message: string): string {
  // Handle Zod validation errors (arrays of objects)
  if (message.startsWith("[") && message.includes('"code"')) {
    try {
      const parsed = JSON.parse(message);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstError = parsed[0];
        if (firstError.message) {
          return `Validation error: ${firstError.message}`;
        }
      }
    } catch {
      // Not valid JSON, continue with original
    }
  }

  // Handle common technical errors with friendlier messages
  if (message.includes("is not a function")) {
    return "A data processing error occurred";
  }
  if (message.includes("Cannot read properties of")) {
    return "Unable to load required data";
  }
  if (message.includes("Network") || message.includes("fetch")) {
    return "A network error occurred";
  }

  return message;
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
    <Button
      variant="text"
      size="sm"
      onClick={handleCopy}
      icon={<Icon symbol={copied ? "check" : "content_copy"} size="sm" />}
      className="text-on-surface-variant shrink-0"
    >
      {copied ? "Copied" : label || "Copy"}
    </Button>
  );
}

/**
 * Extracts the failing component name from the component stack
 */
function getFailingComponent(componentStack: string | null): string | null {
  if (!componentStack) return null;
  // Component stack looks like: "at ComponentName (file.tsx:123:45)"
  const match = componentStack.trim().match(/^at\s+(\w+)/);
  return match?.[1] ?? null;
}

/**
 * ErrorDetails - collapsible technical details section
 */
function ErrorDetails({
  error,
  errorId,
  pageUrl,
  componentStack,
}: {
  error: Error | null;
  errorId: string | null;
  pageUrl: string | null;
  componentStack: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!error?.message) return null;

  const fullMessage = error.message;
  const failingComponent = getFailingComponent(componentStack);

  return (
    <div className="w-full flex flex-col items-center space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <Icon
          symbol={expanded ? "expand_less" : "expand_more"}
          size="sm"
        />
        <Text variant="labelSmall">
          {expanded ? "Hide details" : "Show technical details"}
        </Text>
      </button>

      {expanded && (
        <div className="w-full rounded-xl bg-surface-container p-4 space-y-3 text-left">
          {/* Page URL */}
          {pageUrl && (
            <div className="space-y-1.5">
              <Text variant="labelSmall" color="onSurfaceVariant">
                Page
              </Text>
              <Text
                variant="bodySmall"
                className="font-mono text-on-surface-variant break-all"
              >
                {pageUrl}
              </Text>
            </div>
          )}

          {/* Failing Component */}
          {failingComponent && (
            <div className="space-y-1.5 pt-3 border-t border-outline-variant">
              <Text variant="labelSmall" color="onSurfaceVariant">
                Component
              </Text>
              <Text
                variant="bodySmall"
                className="font-mono text-on-surface-variant"
              >
                {failingComponent}
              </Text>
            </div>
          )}

          {/* Error Message */}
          <div className="space-y-1.5 pt-3 border-t border-outline-variant">
            <Text variant="labelSmall" color="onSurfaceVariant">
              Error Message
            </Text>
            <div className="flex items-start gap-2">
              <Text
                variant="bodySmall"
                className="font-mono text-on-surface-variant break-all flex-1"
              >
                {fullMessage}
              </Text>
              <CopyButton text={fullMessage} />
            </div>
          </div>

          {/* Error Reference */}
          {errorId && (
            <div className="space-y-1.5 pt-3 border-t border-outline-variant">
              <Text variant="labelSmall" color="onSurfaceVariant">
                Error Reference
              </Text>
              <div className="flex items-center gap-2">
                <Text variant="bodySmall" className="font-mono text-on-surface-variant flex-1">
                  {errorId}
                </Text>
                <CopyButton text={errorId} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * GlobalErrorBoundary
 *
 * Catches uncaught errors at the application root level and displays
 * a full-page error UI with recovery options.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      pageUrl: null,
      componentStack: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for this error instance
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      hasError: true,
      error,
      errorId,
      pageUrl: typeof window !== "undefined" ? window.location.href : null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture component stack for technical details
    this.setState({
      componentStack: errorInfo.componentStack || null,
    });

    // Log error to console with full details
    console.error("GlobalErrorBoundary caught error:", {
      error,
      errorInfo,
      errorId: this.state.errorId,
      pageUrl: this.state.pageUrl,
      timestamp: new Date().toISOString(),
    });
  }

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const friendlyMessage = error?.message
        ? formatErrorMessage(error.message)
        : "An unexpected error occurred";

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="w-full max-w-md lg:max-w-lg space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
                <Icon symbol="warning" size="lg" className="text-error" />
              </div>
            </div>

            {/* Error Title & Friendly Message */}
            <div className="space-y-2">
              <Text as="h1" variant="headlineMedium" align="center">
                Something went wrong
              </Text>
              <Text variant="bodyMedium" color="onSurfaceVariant" align="center">
                {friendlyMessage}
              </Text>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={this.handleGoHome}
                variant="filled"
                icon={<Icon symbol="home" size="sm" />}
              >
                Go to Home
              </Button>
              <Button onClick={this.handleReload} variant="outlined">
                Reload Page
              </Button>
            </div>

            {/* Collapsible Technical Details */}
            <ErrorDetails
              error={error}
              errorId={errorId}
              pageUrl={this.state.pageUrl}
              componentStack={this.state.componentStack}
            />

            {/* Support Link */}
            <Text variant="labelSmall" color="onSurfaceVariant" align="center" className="pt-2">
              If this problem persists, please contact support.
            </Text>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
