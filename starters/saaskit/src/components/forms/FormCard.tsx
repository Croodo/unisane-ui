"use client";

import { forwardRef } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Button } from "@unisane/ui/components/button";
import { Icon } from "@unisane/ui/primitives/icon";
import { Text } from "@unisane/ui/primitives/text";

export type FormCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Material Symbol icon name */
  icon?: string;
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
 *   icon="apartment"
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
      icon,
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
        className={cn(
          "rounded-xl border border-outline-variant bg-surface-container-lowest",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-0">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
              <Icon symbol={icon} size="sm" className="text-on-surface-variant" />
            </div>
          )}
          <div className="space-y-1">
            <Text as="h3" variant="titleMedium">
              {title}
            </Text>
            {description && (
              <Text variant="bodySmall" color="onSurfaceVariant">
                {description}
              </Text>
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
                variant="text"
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
                {saving && <Icon symbol="progress_activity" size="sm" className="mr-2 animate-spin" />}
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
