import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva("rounded-lg p-4u flex gap-3u", {
  variants: {
    variant: {
      info: "bg-info-container text-on-info-container",
      success: "bg-success-container text-on-success-container",
      warning: "bg-warning-container text-on-warning-container",
      error: "bg-error-container text-on-error-container",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const alertIconMap = {
  info: "info",
  success: "check_circle",
  warning: "warning",
  error: "error",
} as const;

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = "info", title, onClose, icon, children, className, ...props }, ref) => {
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5u">
          {icon || (
            <span className="material-symbols-outlined w-6u h-6u">
              {alertIconMap[variant]}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && <h4 className="text-title-small font-medium mb-1u">{title}</h4>}
          <div className="text-body-medium">{children}</div>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6u h-6u flex items-center justify-center hover:bg-on-surface/8 rounded transition-colors"
            aria-label="Close alert"
          >
            <span className="material-symbols-outlined w-5u h-5u">close</span>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";