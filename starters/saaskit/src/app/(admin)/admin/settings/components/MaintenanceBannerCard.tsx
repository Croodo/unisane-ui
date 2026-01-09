"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@unisane/ui/components/button";
import { Textarea } from "@unisane/ui/primitives/textarea";
import { Label } from "@unisane/ui/primitives/label";
import { Select } from "@unisane/ui/components/select";
import { Icon } from "@unisane/ui/primitives/icon";

interface MaintenanceBannerValue {
  enabled: boolean;
  message: string;
  variant: "info" | "warning" | "danger";
}

interface MaintenanceBannerCardProps {
  namespace: string;
  settingKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => Promise<void>;
  loading?: boolean;
  saving?: boolean;
}

export function MaintenanceBannerCard({
  namespace,
  settingKey,
  value,
  onChange,
  onSave,
  loading,
  saving,
}: MaintenanceBannerCardProps) {
  const bannerValue = (value as MaintenanceBannerValue) || {
    enabled: false,
    message: "",
    variant: "info" as const,
  };

  const [enabled, setEnabled] = useState(bannerValue.enabled);
  const [message, setMessage] = useState(bannerValue.message);
  const [variant, setVariant] = useState<"info" | "warning" | "danger">(
    bannerValue.variant
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isFirstSyncRef = useRef(true);

  // Sync with external value changes on initial load only
  // This is intentional for controlled form components
  useEffect(() => {
    if (!isFirstSyncRef.current) return;

    const newValue = (value as MaintenanceBannerValue) || {
      enabled: false,
      message: "",
      variant: "info" as const,
    };

    // Batch update - only runs once on initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync initial form state from prop
    setEnabled(newValue.enabled);

    setMessage(newValue.message);

    setVariant(newValue.variant);

    isFirstSyncRef.current = false;
  }, [value]);

  const handleChange = (
    field: keyof MaintenanceBannerValue,
    newValue: unknown
  ) => {
    const updated = { enabled, message, variant, [field]: newValue };
    setHasChanges(true);

    if (field === "enabled") setEnabled(newValue as boolean);
    if (field === "message") setMessage(newValue as string);
    if (field === "variant")
      setVariant(newValue as "info" | "warning" | "danger");

    // Basic validation - server-side schema validation will catch any issues
    setValidationError(null);

    onChange(updated);
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Icon symbol="progress_activity" size="sm" className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium">Maintenance Banner</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Display a global banner across all workspaces during maintenance
          windows
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            id="banner-enabled"
            type="checkbox"
            className="h-4 w-4"
            checked={enabled}
            onChange={(e) => handleChange("enabled", e.target.checked)}
          />
          <Label htmlFor="banner-enabled" className="text-sm font-normal">
            Banner enabled
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-message">Message</Label>
          <Textarea
            id="banner-message"
            rows={3}
            value={message}
            onChange={(e) => handleChange("message", e.target.value)}
            placeholder="We are performing scheduled maintenance..."
          />
        </div>

        <div className="space-y-2">
          <Select
            label="Variant"
            value={variant}
            onChange={(val) => handleChange("variant", val)}
            options={[
              { value: "info", label: "Info" },
              { value: "warning", label: "Warning" },
              { value: "danger", label: "Danger" },
            ]}
          />
          <p className="text-xs text-on-surface-variant">
            Controls the visual style used by the runtime banner renderer
          </p>
        </div>

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs text-error">
            <Icon symbol="error" size="sm" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-on-surface-variant">
          {namespace}.{settingKey}
        </div>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!hasChanges || !!validationError || saving || loading}
        >
          {saving ? (
            <>
              <Icon symbol="progress_activity" size="sm" className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
