import { z } from "zod";

/**
 * Configuration Types
 *
 * Core type definitions for the unified configuration system.
 */

export type Scope = "platform" | "tenant" | "user";
export type Visibility = "platform-only" | "tenant-ui" | "hidden";
export type UICategory = "runtime" | "billing" | "auth" | "webhooks" | "branding" | "general";
export type UIInputType = "text" | "number" | "boolean" | "select" | "textarea" | "array" | "object" | "custom";

export type SelectOption = {
  value: string;
  label: string;
};

export type UIConfig = {
  label: string;
  description: string;
  category: UICategory;
  type: UIInputType;
  options?: SelectOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  customComponent?: string;
};

export type SettingDefinition<T = unknown> = {
  namespace: string;
  key: string;
  scope: Scope;
  visibility: Visibility;
  schema: z.ZodType<T>;
  defaultValue: T;
  ui?: UIConfig;
};

export type SettingKey = `${string}.${string}`;

export type SettingDefinitions = Record<SettingKey, SettingDefinition>;

export type InferSettingValue<D extends SettingDefinition> = z.infer<D["schema"]>;
