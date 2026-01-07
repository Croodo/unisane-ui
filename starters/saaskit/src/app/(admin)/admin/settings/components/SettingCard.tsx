"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import type { SettingConfig } from "../types";

interface SettingCardProps {
  config: SettingConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => Promise<void>;
  loading?: boolean;
  saving?: boolean;
}

export function SettingCard({
  config,
  value,
  onChange,
  onSave,
  loading,
  saving,
}: SettingCardProps) {
  // Track initial value to detect changes - stored in state for safe comparison
  const [initialValue, setInitialValue] = useState<unknown>(value);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);

  // Update initial value when loading completes (first load only)
  // This is an intentional pattern for syncing with external data on initial load
  useEffect(() => {
    if (!loading && isFirstLoadRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync initial value on first load
      setInitialValue(value);
      isFirstLoadRef.current = false;
    }
  }, [loading, value]);

  // Detect if value has changed from initial - use memoized comparison
  const hasChanges = useMemo(() => {
    return JSON.stringify(value) !== JSON.stringify(initialValue);
  }, [value, initialValue]);

  const handleChange = (newValue: unknown) => {
    // Basic validation - schema validation would be done server-side
    // We could enhance this by passing a validator function as prop if needed
    setValidationError(null);
    onChange(newValue);
  };

  const handleSave = async () => {
    await onSave();
    // Update initial value after successful save
    setInitialValue(value);
  };

  const renderInput = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      );
    }

    switch (config.type) {
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`${config.namespace}-${config.key}`}
              className="h-4 w-4"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
            />
            <Label
              htmlFor={`${config.namespace}-${config.key}`}
              className="text-sm font-normal"
            >
              Enable
            </Label>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) => handleChange(Number(e.target.value))}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            className="max-w-xs"
          />
        );

      case "select":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={(val) => handleChange(val)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder={config.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            className="font-mono text-xs"
          />
        );

      case "array":
        return (
          <ArrayInput
            value={value}
            onChange={handleChange}
            placeholder={config.placeholder}
            disabled={loading}
          />
        );

      case "text":
      default:
        return (
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            className="max-w-md"
          />
        );
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <Label htmlFor={`${config.namespace}-${config.key}`}>
            {config.label}
          </Label>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        <div className="space-y-2">
          {renderInput()}
          {validationError && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading || saving || !hasChanges || !!validationError}
            size="sm"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
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
  onChange: (val: string[]) => void;
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
    <Textarea
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder || "One item per line"}
      rows={6}
      className="font-mono text-xs"
      disabled={disabled}
    />
  );
}
