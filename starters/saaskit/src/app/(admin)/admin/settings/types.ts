import { z } from "zod";

export type SettingCategory = "runtime" | "billing" | "auth" | "webhooks";

export type SettingInputType = "text" | "number" | "boolean" | "select" | "textarea" | "array" | "custom";

export type SettingConfig = {
  namespace: string;
  key: string;
  label: string;
  description: string;
  category: SettingCategory;
  type: SettingInputType;
  options?: { value: string; label: string }[];
  validation?: z.ZodType;
  defaultValue?: unknown;
  placeholder?: string;
  min?: number;
  max?: number;
  customComponent?: string; // Name of custom component to use
};

export type SettingValue = {
  value: unknown;
  version: number;
};
