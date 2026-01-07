"use client";

import { forwardRef } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export type ErrorCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string | undefined;
  message?: string | undefined;
  requestId?: string | undefined;
  onRetry?: (() => void) | undefined;
};

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
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-destructive/20 bg-destructive/5 p-6",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-destructive">{title}</h3>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            {requestId && (
              <p className="text-xs text-muted-foreground font-mono">
                Ref: {requestId}
              </p>
            )}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ErrorCard.displayName = "ErrorCard";

export { ErrorCard };
