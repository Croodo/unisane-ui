/**
 * Boot-time environment validation.
 *
 * This is intentionally a thin wrapper around the canonical Zod schema in
 * `src/shared/env.ts` so we don't drift between "docs validation" and actual runtime parsing.
 */

import { EnvSchema } from "@/src/shared/env";

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

function formatZodIssues(err: unknown): string[] {
  const zod = err as {
    issues?: Array<{ path?: Array<string | number>; message?: string }>;
  };
  const issues = zod.issues ?? [];
  return issues.map((i) => {
    const p = (i.path ?? []).join(".");
    return p ? `${p}: ${i.message ?? "invalid"}` : String(i.message ?? "invalid");
  });
}

/**
 * Validates environment variables and returns a result object.
 * This does not mutate global state; it just checks `process.env`.
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    errors.push(...formatZodIssues(parsed.error));
  } else {
    const v = parsed.data;

    // Auth configuration warning (at least one method should exist)
    const hasJwt =
      Boolean(v.JWT_JWKS_URL) ||
      Boolean(v.JWT_PUBLIC_KEY) ||
      Boolean(v.JWT_PRIVATE_KEY) ||
      Boolean(v.SESSION_SECRET) ||
      Boolean(v.BETTER_AUTH_SECRET);
    if (!hasJwt) {
      warnings.push(
        "No auth signing/verification configuration found. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY (or JWT_JWKS_URL) or SESSION_SECRET/BETTER_AUTH_SECRET."
      );
    }

    // Production hardening warnings
    if (process.env.NODE_ENV === "production" && v.USE_MEMORY_STORE) {
      warnings.push(
        "USE_MEMORY_STORE=true in production. Rate limiting, caching, and idempotency will not be durable."
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates environment variables at boot and logs results.
 * Throws an error if required variables are missing/invalid.
 *
 * @param failOnError - If true, throws on validation errors. Default: true in production.
 */
export function validateEnvOrThrow(failOnError?: boolean): void {
  const isProd = process.env.NODE_ENV === "production";
  const shouldFail = failOnError ?? isProd;

  const result = validateEnv();

  for (const warning of result.warnings) {
    console.warn(`[env] ⚠️  ${warning}`);
  }

  if (!result.valid) {
    for (const error of result.errors) {
      console.error(`[env] ❌ ${error}`);
    }
    if (shouldFail) {
      throw new Error(
        "Environment validation failed. Fix the above errors before starting the application."
      );
    } else {
      console.warn(
        "[env] Environment validation failed but continuing (development mode)."
      );
    }
  } else {
    console.log("[env] ✅ Environment validation passed");
  }
}

