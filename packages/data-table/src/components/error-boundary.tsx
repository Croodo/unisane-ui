"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { Button, Icon } from "@unisane/ui";
import { useI18n } from "../i18n";

// ─── ERROR STATE PROPS ───────────────────────────────────────────────────────

interface DataTableErrorDisplayProps {
  error: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

/**
 * Error state component for displaying table errors
 */
export function DataTableErrorDisplay({
  error,
  resetError,
  title,
  message,
}: DataTableErrorDisplayProps) {
  const { t } = useI18n();
  const displayTitle = title ?? t("errorTitle");
  const displayMessage = message ?? error.message ?? t("errorMessage");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface rounded-lg border border-outline-variant">
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4">
        <Icon symbol="error" className="w-6 h-6 text-error" />
      </div>
      <h3 className="text-title-medium text-on-surface mb-1">{displayTitle}</h3>
      <p className="text-body-medium text-on-surface-variant max-w-md mb-4">
        {displayMessage}
      </p>
      {process.env.NODE_ENV === "development" && (
        <details className="mb-4 w-full max-w-md text-left">
          <summary className="text-label-medium text-on-surface-variant cursor-pointer hover:text-on-surface">
            {t("errorDetails")}
          </summary>
          <pre className="mt-2 p-3 bg-surface-container rounded-sm text-body-small text-error overflow-auto max-h-32">
            {error.stack ?? error.message}
          </pre>
        </details>
      )}
      {resetError && (
        <Button variant="filled" onClick={resetError}>
          <Icon symbol="refresh" className="w-4 h-4 mr-2" />
          {t("retry")}
        </Button>
      )}
    </div>
  );
}

// ─── ERROR BOUNDARY PROPS ────────────────────────────────────────────────────

interface DataTableErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface DataTableErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for DataTable components
 * Catches JavaScript errors in child component tree and displays a fallback UI
 *
 * @example
 * ```tsx
 * <DataTableErrorBoundary
 *   onError={(error, info) => logError(error, info)}
 *   fallback={({ error, reset }) => (
 *     <CustomError error={error} onReset={reset} />
 *   )}
 * >
 *   <DataTable data={data} columns={columns} />
 * </DataTableErrorBoundary>
 * ```
 */
export class DataTableErrorBoundary extends Component<
  DataTableErrorBoundaryProps,
  DataTableErrorBoundaryState
> {
  constructor(props: DataTableErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DataTableErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("DataTable Error:", error);
      console.error("Error Info:", errorInfo.componentStack);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Custom fallback render function
      if (typeof fallback === "function") {
        return fallback({ error, reset: this.resetError });
      }

      // Custom fallback element
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return <DataTableErrorDisplay error={error} resetError={this.resetError} />;
    }

    return children;
  }
}

export default DataTableErrorBoundary;
