"use client";

import { forwardRef } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Surface } from "@unisane/ui/primitives/surface";
import { Typography } from "@unisane/ui/components/typography";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";

export type ErrorCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string | undefined;
  message?: string | undefined;
  requestId?: string | undefined;
  onRetry?: (() => void) | undefined;
};

/**
 * ErrorCard - Displays error information with optional retry action.
 * Uses Material 3 error container colors and typography.
 */
const ErrorCard = forwardRef<HTMLDivElement, ErrorCardProps>(
  (
    {
      className,
      title = "Something went wrong",
      message,
      requestId,
      onRetry,
      ...props
    },
    ref
  ) => {
    return (
      <Surface
        ref={ref}
        tone="errorContainer"
        rounded="md"
        className={cn("p-6 border border-error/20", className)}
        {...props}
      >
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error/10">
            <Icon symbol="error" className="text-error" size="sm" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Typography variant="titleMedium" className="text-error font-semibold">
              {title}
            </Typography>
            {message && (
              <Typography variant="bodyMedium" className="text-on-surface-variant">
                {message}
              </Typography>
            )}
            {requestId && (
              <Typography variant="labelSmall" className="text-on-surface-variant font-mono">
                Ref: {requestId}
              </Typography>
            )}
            {onRetry && (
              <Button
                variant="outlined"
                onClick={onRetry}
                className="mt-2 self-start"
                icon={<Icon symbol="refresh" />}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </Surface>
    );
  }
);
ErrorCard.displayName = "ErrorCard";

export { ErrorCard };
