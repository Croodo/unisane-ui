"use client";

import { useState, useEffect } from "react";
import { TextField } from "@unisane/ui/components/text-field";
import { Select } from "@unisane/ui/components/select";
import { Switch } from "@unisane/ui/components/switch";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import type { SettingConfig } from "../types";

interface SettingCardProps {
  config: SettingConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  loading?: boolean;
}

export function SettingCard({
  config,
  value,
  onChange,
  loading,
}: SettingCardProps) {

  const renderInput = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon symbol="progress_activity" size="sm" className="animate-spin" />
          <Typography variant="bodySmall">Loading...</Typography>
        </div>
      );
    }

    switch (config.type) {
      case "boolean":
        return (
          <Switch
            id={`${config.namespace}-${config.key}`}
            label="Enable"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        );

      case "number":
        return (
          <div className="sm:max-w-xs">
            <TextField
              label=""
              labelClassName="sr-only"
              type="number"
              value={typeof value === "number" ? String(value) : ""}
              onChange={(e) => onChange(Number(e.target.value))}
              placeholder={config.placeholder}
            />
          </div>
        );

      case "select":
        return (
          <div className="sm:max-w-xs">
            <Select
              value={String(value ?? "")}
              onChange={(val) => onChange(val)}
              placeholder={config.placeholder || "Select..."}
              options={config.options ?? []}
            />
          </div>
        );

      case "textarea":
        return (
          <TextField
            label=""
            labelClassName="sr-only"
            multiline
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
          />
        );

      case "array":
        return (
          <ArrayInput
            value={value}
            onChange={onChange}
            placeholder={config.placeholder}
            disabled={loading}
          />
        );

      case "text":
      default:
        return (
          <div className="sm:max-w-md">
            <TextField
              label=""
              labelClassName="sr-only"
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder={config.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
      <div className="space-y-1">
        <Typography variant="titleMedium">
          {config.label}
        </Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {config.description}
        </Typography>
        <Typography
          variant="labelSmall"
          className="text-on-surface-variant/60 font-mono pt-1"
        >
          {config.namespace}.{config.key}
        </Typography>
      </div>

      <div className="overflow-visible sm:max-w-md">
        {renderInput()}
      </div>
    </div>
  );
}

function ArrayInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
}) {
  const [text, setText] = useState(() =>
    Array.isArray(value) ? value.join("\n") : ""
  );

  // Sync with external value changes
  // This is an intentional pattern for controlled form components
  useEffect(() => {
    const currentArray = Array.isArray(value) ? value : [];
    const textLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (JSON.stringify(currentArray) !== JSON.stringify(textLines)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync with external controlled value
      setText(currentArray.join("\n"));
    }
  }, [value, text]);

  const handleChange = (newText: string) => {
    setText(newText);
    const lines = newText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    onChange(lines);
  };

  return (
    <TextField
      label=""
      labelClassName="sr-only"
      multiline
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder || "One item per line"}
      disabled={disabled}
    />
  );
}
