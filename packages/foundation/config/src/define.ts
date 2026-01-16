import { z, type ZodType, type ZodTypeDef } from "zod";
import type {
  Scope,
  Visibility,
  UICategory,
  SettingDefinition,
  SelectOption,
  UIInputType,
} from "./types";

/**
 * Setting Definition Helpers
 *
 * Fluent API for defining settings with minimal boilerplate.
 * Reduces verbose 15+ line definitions to single function calls.
 *
 * @example
 * ```ts
 * const settings = {
 *   "auth.otpTtlSeconds": define.number("auth", "otpTtlSeconds", {
 *     default: 600,
 *     min: 60,
 *     max: 3600,
 *     label: "OTP TTL (seconds)",
 *     description: "Time-to-live for one-time password codes",
 *   }),
 *
 *   "billing.mode": define.select("billing", "mode", BILLING_MODES, {
 *     default: "subscription",
 *     label: "Billing Mode",
 *     description: "Controls how billing works across the platform",
 *   }),
 * };
 * ```
 */

type BaseOptions = {
  scope?: Scope;
  visibility?: Visibility;
  category?: UICategory;
  label?: string;
  description?: string;
  placeholder?: string;
  customComponent?: string;
};

type NumberOptions = BaseOptions & {
  default: number;
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  nonnegative?: boolean;
};

type TextOptions = BaseOptions & {
  default: string;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
};

type BooleanOptions = BaseOptions & {
  default: boolean;
};

type SelectOptions<T extends readonly string[]> = BaseOptions & {
  default: T[number];
  formatLabel?: (value: string) => string;
};

type ArrayOptions<T> = BaseOptions & {
  default: T[];
  itemSchema?: ZodType<T>;
  minItems?: number;
  maxItems?: number;
};

type ObjectOptions<T extends z.ZodRawShape> = BaseOptions & {
  default: z.infer<z.ZodObject<T>>;
};

function buildUIConfig(
  type: UIInputType,
  options: BaseOptions & { min?: number; max?: number; options?: SelectOption[] }
): SettingDefinition["ui"] | undefined {
  if (!options.label) return undefined;

  return {
    label: options.label,
    description: options.description ?? "",
    category: options.category ?? "general",
    type,
    ...(options.placeholder && { placeholder: options.placeholder }),
    ...(options.min !== undefined && { min: options.min }),
    ...(options.max !== undefined && { max: options.max }),
    ...(options.options && { options: options.options }),
    ...(options.customComponent && { customComponent: options.customComponent }),
  };
}

export const define = {
  /**
   * Define a number setting with optional constraints
   */
  number(
    namespace: string,
    key: string,
    options: NumberOptions
  ): SettingDefinition<number> {
    let schema: z.ZodNumber = z.number();

    if (options.integer) schema = schema.int();
    if (options.positive) schema = schema.positive();
    if (options.nonnegative) schema = schema.nonnegative();
    if (options.min !== undefined) schema = schema.min(options.min);
    if (options.max !== undefined) schema = schema.max(options.max);

    const schemaWithDefault = schema.default(options.default);

    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema: schemaWithDefault as ZodType<number, ZodTypeDef, number>,
      defaultValue: options.default,
      ui: buildUIConfig("number", options),
    };
  },

  /**
   * Define a text/string setting
   */
  text(
    namespace: string,
    key: string,
    options: TextOptions
  ): SettingDefinition<string> {
    let schema: z.ZodString = z.string();

    if (options.minLength !== undefined) schema = schema.min(options.minLength);
    if (options.maxLength !== undefined) schema = schema.max(options.maxLength);
    if (options.pattern) schema = schema.regex(options.pattern);

    const schemaWithDefault = schema.default(options.default);

    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema: schemaWithDefault as ZodType<string, ZodTypeDef, string>,
      defaultValue: options.default,
      ui: buildUIConfig("text", options),
    };
  },

  /**
   * Define a textarea setting (multiline text)
   */
  textarea(
    namespace: string,
    key: string,
    options: TextOptions
  ): SettingDefinition<string> {
    const def = define.text(namespace, key, options);
    if (def.ui) {
      def.ui.type = "textarea";
    }
    return def;
  },

  /**
   * Define a boolean toggle setting
   */
  boolean(
    namespace: string,
    key: string,
    options: BooleanOptions
  ): SettingDefinition<boolean> {
    const schemaWithDefault = z.boolean().default(options.default);

    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema: schemaWithDefault as ZodType<boolean, ZodTypeDef, boolean>,
      defaultValue: options.default,
      ui: buildUIConfig("boolean", options),
    };
  },

  /**
   * Define a select/enum setting with predefined options
   */
  select<const T extends readonly string[]>(
    namespace: string,
    key: string,
    values: T,
    options: SelectOptions<T>
  ): SettingDefinition<T[number]> {
    const schemaWithDefault = z
      .enum(values as unknown as [string, ...string[]])
      .default(options.default);

    const formatLabel =
      options.formatLabel ??
      ((v: string) =>
        v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()));

    const selectOptions: SelectOption[] = values.map((value) => ({
      value,
      label: formatLabel(value),
    }));

    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema: schemaWithDefault as ZodType<T[number], ZodTypeDef, T[number]>,
      defaultValue: options.default,
      ui: buildUIConfig("select", { ...options, options: selectOptions }),
    };
  },

  /**
   * Define an array setting
   */
  array<T = string>(
    namespace: string,
    key: string,
    options: ArrayOptions<T>
  ): SettingDefinition<T[]> {
    const itemSchema = (options.itemSchema ?? z.string().min(1)) as ZodType<T>;
    let schema: z.ZodArray<ZodType<T>> = z.array(itemSchema);

    if (options.minItems !== undefined) schema = schema.min(options.minItems);
    if (options.maxItems !== undefined) schema = schema.max(options.maxItems);

    const schemaWithDefault = schema.default(options.default);

    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema: schemaWithDefault as ZodType<T[], ZodTypeDef, T[]>,
      defaultValue: options.default,
      ui: buildUIConfig("array", options),
    };
  },

  /**
   * Define a complex object setting with a custom schema
   */
  object<T extends z.ZodRawShape>(
    namespace: string,
    key: string,
    shape: T,
    options: ObjectOptions<T>
  ): SettingDefinition<z.infer<z.ZodObject<T>>> {
    type OutputType = z.infer<z.ZodObject<T>>;
    const schemaWithDefault = z.object(shape).default(options.default);

    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema: schemaWithDefault as ZodType<OutputType, ZodTypeDef, OutputType>,
      defaultValue: options.default,
      ui: buildUIConfig("object", options),
    };
  },

  /**
   * Define a setting with a completely custom schema
   * Use this for complex validation that doesn't fit other helpers
   */
  custom<T>(
    namespace: string,
    key: string,
    schema: ZodType<T>,
    defaultValue: T,
    options: BaseOptions = {}
  ): SettingDefinition<T> {
    return {
      namespace,
      key,
      scope: options.scope ?? "platform",
      visibility: options.visibility ?? "platform-only",
      schema,
      defaultValue,
      ui: buildUIConfig("custom", options),
    };
  },
};
