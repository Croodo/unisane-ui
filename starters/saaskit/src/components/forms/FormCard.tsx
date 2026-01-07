"use client";

import { forwardRef } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FormCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional icon next to title */
  icon?: LucideIcon;
  /** Save callback - shows Save button when provided */
  onSave?: () => void | Promise<void>;
  /** Discard callback - shows Discard button when hasChanges is true */
  onDiscard?: () => void;
  /** Whether save operation is in progress */
  saving?: boolean;
  /** Whether form has unsaved changes */
  hasChanges?: boolean;
  /** Custom footer content (replaces default buttons) */
  footer?: React.ReactNode;
  /** Hide default footer entirely */
  hideFooter?: boolean;
};

/**
 * FormCard - Reusable card with form state management UI
 *
 * @example
 * <FormCard
 *   title="Workspace Profile"
 *   description="Basic information"
 *   icon={Building2}
 *   onSave={handleSave}
 *   onDiscard={handleDiscard}
 *   saving={isSaving}
 *   hasChanges={hasChanges}
 * >
 *   <Input value={name} onChange={setName} />
 * </FormCard>
 */
const FormCard = forwardRef<HTMLDivElement, FormCardProps>(
  (
    {
      className,
      title,
      description,
      icon: Icon,
      onSave,
      onDiscard,
      saving,
      hasChanges,
      footer,
      hideFooter,
      children,
      ...props
    },
    ref
  ) => {
    const showDefaultFooter = !hideFooter && !footer && (onSave || onDiscard);

    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card shadow-sm", className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-0">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-4">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 pb-6">{footer}</div>}

        {showDefaultFooter && (
          <div className="flex items-center justify-end gap-2 px-6 pb-6">
            {hasChanges && onDiscard && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDiscard}
                disabled={saving}
              >
                Discard
              </Button>
            )}
            {onSave && (
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={saving || !hasChanges}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
FormCard.displayName = "FormCard";

export { FormCard };
