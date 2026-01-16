import { z } from "zod";
import type { UICategory, UIInputType } from "@unisane/config";

export type SettingCategory = UICategory;
export type SettingInputType = UIInputType;

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
  customComponent?: string;
};

export type SettingValue = {
  value: unknown;
  version: number;
};
