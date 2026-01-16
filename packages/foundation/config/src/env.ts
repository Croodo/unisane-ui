import { z, type ZodType, type ZodTypeDef } from "zod";

/**
 * Environment Configuration Helpers
 *
 * Type-safe environment variable definitions with validation,
 * provider-aware conditional requirements, and helpful error messages.
 *
 * @example
 * ```ts
 * const env = defineEnv({
 *   // Required vars
 *   DATABASE_URL: env.string().url(),
 *
 *   // Optional with default
 *   LOG_LEVEL: env.enum(["debug", "info", "warn", "error"]).default("info"),
 *
 *   // Coerced types
 *   PORT: env.port().default(3000),
 *   ENABLE_CACHE: env.boolean().default(true),
 *
 *   // Provider-specific (validated conditionally)
 *   MAIL_PROVIDER: env.enum(["ses", "resend"]).optional(),
 *   RESEND_API_KEY: env.string().optional(),
 * })
 * .require((e) => e.MAIL_PROVIDER === "resend", ["RESEND_API_KEY"])
 * .build();
 *
 * const config = env.parse(process.env);
 * ```
 */

type EnvVarDef<T> = {
  schema: ZodType<T, ZodTypeDef, unknown>;
  envKey?: string;
  description?: string;
  sensitive?: boolean;
  clientSafe?: boolean;
};

type EnvSchemaShape = Record<string, ZodType<unknown, ZodTypeDef, unknown>>;

type ConditionalRequirement<T extends EnvSchemaShape> = {
  condition: (env: Partial<z.infer<z.ZodObject<T>>>) => boolean;
  requiredKeys: (keyof T)[];
  message?: string;
};

export class EnvBuilder<T extends EnvSchemaShape> {
  private shape: T;
  private conditionals: ConditionalRequirement<T>[] = [];
  private metadata: Map<keyof T, Omit<EnvVarDef<unknown>, "schema">> = new Map();

  constructor(shape: T) {
    this.shape = shape;
  }

  /**
   * Add a conditional requirement: if condition is true, keys must be present
   */
  require(
    condition: (env: Partial<z.infer<z.ZodObject<T>>>) => boolean,
    keys: (keyof T)[],
    message?: string
  ): this {
    this.conditionals.push({ condition, requiredKeys: keys, message });
    return this;
  }

  /**
   * Add metadata for documentation/introspection
   */
  meta(key: keyof T, meta: Omit<EnvVarDef<unknown>, "schema">): this {
    this.metadata.set(key, meta);
    return this;
  }

  /**
   * Build the final schema with conditional validation
   */
  build() {
    const shape = this.shape;
    const metadata = this.metadata;
    const conditionals = this.conditionals;
    const baseSchema = z.object(shape);

    const schemaWithConditionals = baseSchema.superRefine((data, ctx) => {
      for (const cond of conditionals) {
        if (cond.condition(data as Partial<z.infer<z.ZodObject<T>>>)) {
          for (const key of cond.requiredKeys) {
            const value = data[key as string];
            if (value === undefined || value === null || value === "") {
              ctx.addIssue({
                code: "custom",
                path: [key as string],
                message:
                  cond.message ??
                  `${String(key)} is required when condition is met`,
              });
            }
          }
        }
      }
    });

    return {
      schema: schemaWithConditionals,
      metadata,

      /**
       * Parse environment with helpful error messages
       */
      parse(env: Record<string, string | undefined> = process.env) {
        try {
          return schemaWithConditionals.parse(env) as z.infer<z.ZodObject<T>>;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const issues = error.issues
              .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
              .join("\n");
            throw new Error(
              `Environment configuration invalid:\n${issues}\n\n` +
                `Check your .env file or environment variables.`
            );
          }
          throw error;
        }
      },

      /**
       * Safe parse that returns result object
       */
      safeParse(env: Record<string, string | undefined> = process.env) {
        return schemaWithConditionals.safeParse(env);
      },

      /**
       * Get list of all env var keys
       */
      keys(): (keyof T)[] {
        return Object.keys(shape) as (keyof T)[];
      },

      /**
       * Get client-safe keys (for NEXT_PUBLIC_* exposure)
       */
      clientSafeKeys(): (keyof T)[] {
        return Array.from(metadata.entries())
          .filter(([, meta]) => meta.clientSafe)
          .map(([key]) => key);
      },
    };
  }
}

/**
 * Env schema building helpers
 */
export const env = {
  /**
   * String variable
   */
  string() {
    return z.string();
  },

  /**
   * URL variable (validated)
   */
  url() {
    return z.string().url();
  },

  /**
   * Email variable (validated)
   */
  email() {
    return z.string().email();
  },

  /**
   * Enum variable
   */
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return z.enum(values);
  },

  /**
   * Boolean variable (coerced from string)
   */
  boolean() {
    return z.coerce.boolean();
  },

  /**
   * Number variable (coerced from string)
   */
  number() {
    return z.coerce.number();
  },

  /**
   * Integer variable (coerced from string)
   */
  int() {
    return z.coerce.number().int();
  },

  /**
   * Port number (1-65535)
   */
  port() {
    return z.coerce.number().int().min(1).max(65535);
  },

  /**
   * Positive integer
   */
  positiveInt() {
    return z.coerce.number().int().positive();
  },

  /**
   * JSON string that will be parsed
   */
  json<T extends z.ZodTypeAny>(schema: T) {
    return z.string().transform((val, ctx) => {
      try {
        const parsed = JSON.parse(val);
        const result = schema.safeParse(parsed);
        if (!result.success) {
          ctx.addIssue({
            code: "custom",
            message: `Invalid JSON structure: ${result.error.message}`,
          });
          return z.NEVER;
        }
        return result.data as z.infer<T>;
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid JSON",
        });
        return z.NEVER;
      }
    });
  },

  /**
   * Comma-separated list
   */
  list() {
    return z.string().transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  },
};

/**
 * Create an environment configuration builder
 */
export function defineEnv<T extends EnvSchemaShape>(shape: T): EnvBuilder<T> {
  return new EnvBuilder(shape);
}

/**
 * Type helper to infer env config type from builder
 */
export type InferEnv<B extends EnvBuilder<EnvSchemaShape>> =
  B extends EnvBuilder<infer T> ? z.infer<z.ZodObject<T>> : never;
