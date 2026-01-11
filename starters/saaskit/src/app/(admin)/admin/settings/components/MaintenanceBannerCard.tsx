"use client";

import { useState, useEffect, useRef } from "react";
import { TextField } from "@unisane/ui/components/text-field";
import { Select } from "@unisane/ui/components/select";
import { Switch } from "@unisane/ui/components/switch";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";

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
  loading?: boolean;
}

export function MaintenanceBannerCard({
  namespace,
  settingKey,
  value,
  onChange,
  loading,
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

    if (field === "enabled") setEnabled(newValue as boolean);
    if (field === "message") setMessage(newValue as string);
    if (field === "variant")
      setVariant(newValue as "info" | "warning" | "danger");

    onChange(updated);
  };

  if (loading) {
    return (
      <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
        <div className="space-y-1">
          <Typography variant="titleMedium">Maintenance Banner</Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant">
            Display a global banner during maintenance
          </Typography>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon symbol="progress_activity" size="sm" className="animate-spin" />
          <Typography variant="bodySmall">Loading...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
      <div className="space-y-1">
        <Typography variant="titleMedium">
          Maintenance Banner
        </Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          Display a global banner across all workspaces during maintenance windows
        </Typography>
        <Typography
          variant="labelSmall"
          className="text-on-surface-variant/60 font-mono pt-1"
        >
          {namespace}.{settingKey}
        </Typography>
      </div>

      <div className="space-y-4 overflow-visible sm:max-w-md">
        <Switch
          id="banner-enabled"
          label="Banner enabled"
          checked={enabled}
          onChange={(e) => handleChange("enabled", e.target.checked)}
        />

        <TextField
          label=""
          labelClassName="sr-only"
          multiline
          value={message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder="We are performing scheduled maintenance..."
        />

        <div className="space-y-2 overflow-visible sm:max-w-[200px]">
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
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Controls the visual style
          </Typography>
        </div>
      </div>
    </div>
  );
}
