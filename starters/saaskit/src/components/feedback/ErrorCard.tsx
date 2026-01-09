"use client";

import { forwardRef } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Surface } from "@unisane/ui/primitives/surface";
import { Text } from "@unisane/ui/primitives/text";
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
            <Text variant="titleMedium" color="error" weight="semibold">
              {title}
            </Text>
            {message && (
              <Text variant="bodyMedium" color="onSurfaceVariant">
                {message}
              </Text>
            )}
            {requestId && (
              <Text variant="labelSmall" color="onSurfaceVariant" className="font-mono">
                Ref: {requestId}
              </Text>
            )}
            {onRetry && (
              <Button
                variant="outlined"
                size="sm"
                onClick={onRetry}
                className="mt-2 self-start"
                icon={<Icon symbol="refresh" size="sm" />}
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
