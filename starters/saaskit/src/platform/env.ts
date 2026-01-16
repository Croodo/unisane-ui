/**
 * Boot-time environment validation.
 *
 * This is intentionally a thin wrapper around the canonical Zod schema in
 * kernel's env module so we don't drift between "docs validation" and actual runtime parsing.
 */

import { EnvSchema, logger } from "@unisane/kernel";

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
  const isProd = process.env.NODE_ENV === "production";

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

    // Email provider validation
    const hasEmailProvider =
      Boolean(v.RESEND_API_KEY) ||
      (Boolean(v.AWS_REGION) && Boolean(v.AWS_ACCESS_KEY_ID) && Boolean(v.AWS_SECRET_ACCESS_KEY));
    if (!hasEmailProvider) {
      warnings.push(
        "No email provider configured. Set RESEND_API_KEY or AWS credentials (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)."
      );
    }

    // CONF-001 FIX: Validate MAIL_FROM when email provider is configured
    if (hasEmailProvider) {
      const mailFrom = (v as Record<string, unknown>).MAIL_FROM as string | undefined;
      if (!mailFrom) {
        if (isProd) {
          errors.push("MAIL_FROM is required in production when email provider is configured");
        } else {
          warnings.push("MAIL_FROM not set - will use 'noreply@example.com' which won't work in production");
        }
      } else if (!mailFrom.includes('@') || mailFrom.includes('example.com')) {
        if (isProd) {
          errors.push("MAIL_FROM must be a valid email address (not example.com) in production");
        } else {
          warnings.push("MAIL_FROM appears to be a placeholder - update before production");
        }
      }
    }

    // CONF-002 FIX: Complete billing provider validation
    if (v.BILLING_PROVIDER === 'stripe') {
      if (!v.STRIPE_SECRET_KEY) {
        errors.push("STRIPE_SECRET_KEY is required when BILLING_PROVIDER=stripe");
      } else if (!v.STRIPE_SECRET_KEY.startsWith('sk_')) {
        errors.push("STRIPE_SECRET_KEY must start with 'sk_'");
      } else if (isProd && v.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        warnings.push("STRIPE_SECRET_KEY is a test key in production - use a live key");
      }
      if (!v.STRIPE_WEBHOOK_SECRET) {
        if (isProd) {
          errors.push("STRIPE_WEBHOOK_SECRET is required in production for secure webhook handling");
        } else {
          warnings.push("STRIPE_WEBHOOK_SECRET is recommended when using Stripe billing");
        }
      } else if (!v.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
        errors.push("STRIPE_WEBHOOK_SECRET must start with 'whsec_'");
      }
      if (!v.BILLING_PORTAL_RETURN_URL) {
        errors.push("BILLING_PORTAL_RETURN_URL is required when using Stripe billing");
      }
      // Validate publishable key format if present
      const stripePubKey = (v as Record<string, unknown>).STRIPE_PUBLISHABLE_KEY as string | undefined;
      if (stripePubKey && !stripePubKey.startsWith('pk_')) {
        errors.push("STRIPE_PUBLISHABLE_KEY must start with 'pk_'");
      }
    } else if (v.BILLING_PROVIDER === 'razorpay') {
      if (!v.RAZORPAY_KEY_ID) {
        errors.push("RAZORPAY_KEY_ID is required when BILLING_PROVIDER=razorpay");
      } else if (!v.RAZORPAY_KEY_ID.startsWith('rzp_')) {
        errors.push("RAZORPAY_KEY_ID must start with 'rzp_live_' or 'rzp_test_'");
      } else if (isProd && v.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
        warnings.push("RAZORPAY_KEY_ID is a test key in production - use a live key");
      }
      if (!v.RAZORPAY_KEY_SECRET) {
        errors.push("RAZORPAY_KEY_SECRET is required when BILLING_PROVIDER=razorpay");
      }
      // Validate webhook secret if present
      const razorpayWebhookSecret = (v as Record<string, unknown>).RAZORPAY_WEBHOOK_SECRET as string | undefined;
      if (!razorpayWebhookSecret && isProd) {
        errors.push("RAZORPAY_WEBHOOK_SECRET is required in production for secure webhook handling");
      }
    }

    // Database validation
    if (!v.MONGODB_URI) {
      errors.push("MONGODB_URI is required for database connection");
    }

    // Production hardening warnings
    if (isProd) {
      if (v.USE_MEMORY_STORE) {
        warnings.push(
          "USE_MEMORY_STORE=true in production. Rate limiting, caching, and idempotency will not be durable."
        );
      }
      if (!v.DATA_ENCRYPTION_KEY) {
        warnings.push(
          "DATA_ENCRYPTION_KEY not set in production. PII will not be encrypted at rest."
        );
      }
      if (!v.REDIS_URL && !v.USE_MEMORY_STORE) {
        warnings.push(
          "REDIS_URL not set in production. Consider configuring Redis for better performance and durability."
        );
      }
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
    logger.warn(warning, { module: 'env' });
  }

  if (!result.valid) {
    for (const error of result.errors) {
      logger.error(error, { module: 'env' });
    }
    if (shouldFail) {
      throw new Error(
        "Environment validation failed. Fix the above errors before starting the application."
      );
    } else {
      logger.warn('Environment validation failed but continuing (development mode)', { module: 'env' });
    }
  } else {
    logger.info('Environment validation passed', { module: 'env' });
  }
}

