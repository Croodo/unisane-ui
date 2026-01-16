import { z } from "zod";
import { ZAppEnv, ZLogLevel } from "./constants/env";
import {
  ZMailProvider,
  ZBillingProvider,
} from "./constants/providers";
import {
  ZBillingMode,
  DEFAULT_BILLING_MODE,
} from "./constants/billing-mode";
import { ZDbProvider } from "./constants/db";
import { ZCookieSameSite } from "./constants/cookies";
import { SESSION_CONFIG } from "./constants/session";

// Centralized env parsing. Keep most keys optional to avoid breaking local/dev.
// Consumers should feature-detect (e.g., check provider + secret pairs) before use.
const BaseEnvSchema = z.object({
  // Core
  APP_ENV: ZAppEnv.default("dev"),
  ALLOWED_ORIGINS: z.string().default(""),
  LOG_LEVEL: ZLogLevel.default("info"),
  // DB provider switch (default mongo)
  DB_PROVIDER: ZDbProvider.optional(),
  // Mongo
  MONGODB_URI: z.string().url().optional(),
  // MongoDB connection pool tuning (optional, sensible defaults provided)
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().optional(),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().int().nonnegative().optional(),
  // MongoDB transactions require replica set; set to false for local dev without replica set
  MONGODB_TRANSACTIONS_ENABLED: z.coerce.boolean().optional().default(true),
  // MySQL (variant)
  MYSQL_URL: z.string().url().optional(),
  // MySQL connection variables (optional alternative to MYSQL_URL)
  MYSQL_HOST: z.string().optional(),
  MYSQL_PORT: z.coerce.number().int().positive().optional().default(3306),
  MYSQL_USER: z.string().optional(),
  MYSQL_PASSWORD: z.string().optional(),
  MYSQL_DATABASE: z.string().optional(),
  MYSQL_SSL: z.coerce.boolean().optional().default(false),
  MYSQL_SSL_CA_PATH: z.string().optional(),
  MYSQL_SSL_CERT_PATH: z.string().optional(),
  MYSQL_SSL_KEY_PATH: z.string().optional(),
  MYSQL_SSL_REJECT_UNAUTHORIZED: z.coerce.boolean().optional().default(true),
  MYSQL_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().optional().default(5000),
  // Tests may force memory-only provider for KV/Redis
  USE_MEMORY_STORE: z.coerce.boolean().optional().default(false),

  // Auth
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_JWKS_URL: z.string().url().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_KID: z.string().optional(),
  JWT_PUBLIC_KEY_PREV: z.string().optional(),
  JWT_KID_PREV: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),

  // Cookies/CORS
  COOKIE_SAMESITE: ZCookieSameSite.default("lax"),
  COOKIE_DOMAIN: z.string().optional(),
  AUTH_PASSWORD_ENABLED: z.coerce.boolean().default(true),
  AUTH_OTP_ENABLED: z.coerce.boolean().default(false),
  // JWT/session TTLs
  JWT_ACCESS_TTL_SEC: z.coerce
    .number()
    .int()
    .positive()
    .default(SESSION_CONFIG.DEFAULT_EXPIRATION_SEC),
  COOKIE_ACCESS_TTL_SEC: z.coerce
    .number()
    .int()
    .positive()
    .default(SESSION_CONFIG.DEFAULT_EXPIRATION_SEC),

  // KV/Redis (choose one in deployment)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),

  // Mail
  MAIL_PROVIDER: ZMailProvider.optional(),
  MAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  // Public base URL override (if behind a proxy/CDN)
  PUBLIC_BASE_URL: z.string().url().optional(),
  // OAuth providers (comma-separated list of providers to enable)
  OAUTH_PROVIDERS: z.string().optional(),
  // Provider app credentials (optional; required per provider you enable)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SES_CONFIG_SET: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_FORCE_PATH_STYLE: z.coerce.boolean().optional(),

  // Billing
  BILLING_PROVIDER: ZBillingProvider.optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  BILLING_ALERT_EMAIL: z.string().email().optional(),
  BILLING_PORTAL_RETURN_URL: z.string().url().optional(),
  // Optional mapping: friendly plan codes -> provider IDs (JSON)
  BILLING_PLAN_MAP_JSON: z.string().optional(),
  // Optional mapping: top-up packs (e.g. "10-USD") -> provider price IDs (JSON)
  BILLING_TOPUP_MAP_JSON: z.string().optional(),
  // Webhooks
  SES_SNS_TOPIC_ARN: z.string().optional(),

  // Flags/metrics
  ENABLE_METRICS: z.coerce.boolean().default(false),
  STATSD_HOST: z.string().optional(),
  STATSD_PORT: z.coerce.number().int().positive().default(8125),
  STATSD_PREFIX: z.string().default("saaskit"),

  // Credits pricing override JSON
  CREDITS_PER_MAJOR_UNIT_JSON: z.string().optional(),

  // Ops alerts
  ALERT_EMAIL: z.string().email().optional(),
  OUTBOX_ALERT_EMAIL: z.string().email().optional(),
  OUTBOX_DLQ_ALERT_MIN_INTERVAL_MIN: z.coerce
    .number()
    .int()
    .positive()
    .default(60),

  // Inngest (optional; required when running Inngest in production)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Google Vision OCR (optional; used by AI/extraction providers)
  GOOGLE_VISION_API_KEY: z.string().optional(),

  // OpenAI (optional; used by AI/LLM providers)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().optional(),

  // Gemini (optional; used by AI/multimodal providers)
  GEMINI_API_KEY: z.string().optional(),

  // PDF Rasterizer (optional; used for reliable PDF->image conversion)
  PDF_RASTERIZER_URL: z.string().url().optional(),
  PDF_RASTERIZER_API_KEY: z.string().optional(),

  // OpenAPI/Docs (optional)
  OPENAPI_SERVER_URLS: z.string().optional(), // comma-separated list of base URLs for the API

  // Public (client-side) variables
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_BASE: z.string().url().optional(), // Legacy
  NEXT_PUBLIC_BILLING_CURRENCY: z.string().default("USD"),

  // Pro feature gates (developer-friendly; optional)
  SAASKIT_ENABLE_PRO_JOBS: z.coerce.boolean().default(false),

  // Field-level encryption for PII (optional; required for GDPR compliance)
  // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  DATA_ENCRYPTION_KEY: z.string().optional(),
});

export const EnvSchema = BaseEnvSchema.superRefine((v, ctx) => {
  // DB requirements (variant-aware)
  const db = v.DB_PROVIDER ?? "mongo";
  if (db === "mongo") {
    if (!v.MONGODB_URI) {
      ctx.addIssue({
        code: "custom",
        message: "MONGODB_URI is required when DB_PROVIDER=mongo",
      });
    }
  } else if (db === "mysql") {
    const hasUrl = Boolean(v.MYSQL_URL);
    const hasParts = Boolean(
      v.MYSQL_HOST && v.MYSQL_USER && v.MYSQL_PASSWORD && v.MYSQL_DATABASE
    );
    if (!hasUrl && !hasParts) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide MYSQL_URL or MYSQL_HOST+MYSQL_USER+MYSQL_PASSWORD+MYSQL_DATABASE when DB_PROVIDER=mysql",
      });
    }
  }

  const hasKV = Boolean(v.KV_REST_API_URL && v.KV_REST_API_TOKEN);
  const hasRedis = Boolean(v.REDIS_URL);
  if (!v.USE_MEMORY_STORE) {
    if (!hasKV && !hasRedis) {
      ctx.addIssue({
        code: "custom",
        message:
          "Configure either KV (KV_REST_API_URL+KV_REST_API_TOKEN) or REDIS_URL",
      });
    }
    if (hasKV && hasRedis) {
      ctx.addIssue({
        code: "custom",
        message: "Configure only one store: KV or REDIS (not both)",
      });
    }
  }

  // Mail provider requirements
  if (v.MAIL_PROVIDER === "resend" && !v.RESEND_API_KEY) {
    ctx.addIssue({
      code: "custom",
      message: "RESEND_API_KEY is required when MAIL_PROVIDER=resend",
    });
  }
  if (v.MAIL_PROVIDER === "ses") {
    if (!v.AWS_REGION || !v.AWS_ACCESS_KEY_ID || !v.AWS_SECRET_ACCESS_KEY) {
      ctx.addIssue({
        code: "custom",
        message:
          "AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY are required when MAIL_PROVIDER=ses",
      });
    }
  }

  // Billing provider requirements
  if (v.BILLING_PROVIDER === "stripe") {
    if (!v.STRIPE_SECRET_KEY || !v.STRIPE_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: "custom",
        message:
          "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required when BILLING_PROVIDER=stripe",
      });
    }
  }
  if (v.BILLING_PROVIDER === "razorpay") {
    if (
      !v.RAZORPAY_KEY_ID ||
      !v.RAZORPAY_KEY_SECRET ||
      !v.RAZORPAY_WEBHOOK_SECRET
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET are required when BILLING_PROVIDER=razorpay",
      });
    }
  }

  // Storage requirements: if bucket is set, AWS credentials must be present
  if (v.STORAGE_BUCKET) {
    if (!v.AWS_REGION || !v.AWS_ACCESS_KEY_ID || !v.AWS_SECRET_ACCESS_KEY) {
      ctx.addIssue({
        code: "custom",
        message:
          "AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY are required when STORAGE_BUCKET is set",
      });
    }
  }

  // Production hardening
  if (v.APP_ENV === "prod") {
    if (!v.ALLOWED_ORIGINS.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "ALLOWED_ORIGINS must be set in production",
      });
    }
    // Note: JWT keys are validated at auth route usage time; not enforced here to avoid
    // constraining unrelated prod-only tests (e.g., webhook verification in prod mode).
  }
});

export type Env = z.infer<typeof EnvSchema> & { ALLOWED_ORIGINS: string[] };

/**
 * Get and validate environment configuration.
 *
 * KERN-014 FIX: Wraps Zod parsing with improved error handling to prevent
 * cryptic stack traces during bootstrap. Logs specific validation errors
 * to help developers quickly identify configuration issues.
 *
 * @throws Error with detailed message listing invalid/missing env vars
 */
export function getEnv(): Env {
  try {
    const parsed = EnvSchema.parse(process.env);
    const ALLOWED_ORIGINS = parsed.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    return { ...parsed, ALLOWED_ORIGINS } as Env;
  } catch (error) {
    // KERN-014 FIX: Provide helpful error messages for env validation failures
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(
        `Environment configuration invalid:\n${issues}\n\n` +
        `Check your .env file or environment variables.`
      );
    }
    throw error;
  }
}

/**
 * Validate critical runtime configuration without mutating global state.
 * Returns an array of missing keys (some entries are groups like "A|B").
 */
export function validateCriticalEnv(
  input?: Partial<NodeJS.ProcessEnv>
): string[] {
  const e = (input ?? process.env) as Record<string, string | undefined>;
  const missing: string[] = [];

  const db = (e.DB_PROVIDER ?? "mongo").toLowerCase().trim();
  if (db === "mongo") {
    if (!e.MONGODB_URI) missing.push("MONGODB_URI");
  } else if (db === "mysql") {
    const hasUrl = Boolean(e.MYSQL_URL);
    const hasParts = Boolean(
      e.MYSQL_HOST && e.MYSQL_USER && e.MYSQL_PASSWORD && e.MYSQL_DATABASE
    );
    if (!hasUrl && !hasParts) missing.push("MYSQL_URL|MYSQL_HOST+MYSQL_USER+MYSQL_PASSWORD+MYSQL_DATABASE");
  }

  // JWT verification: either JWKS or a public key present
  if (!(e.JWT_JWKS_URL || e.JWT_PUBLIC_KEY))
    missing.push("JWT_JWKS_URL|JWT_PUBLIC_KEY");

  // KV / Redis presence for RL/idem/locks
  const useMemory = String(e.USE_MEMORY_STORE ?? "").toLowerCase() === "true";
  const hasRedis = Boolean(e.REDIS_URL);
  const hasKv = Boolean(e.KV_REST_API_URL && e.KV_REST_API_TOKEN);
  if (!useMemory && !hasRedis && !hasKv)
    missing.push("REDIS_URL|KV_REST_API_URL+KV_REST_API_TOKEN");

  return missing;
}

export function assertCriticalEnv(input?: Partial<NodeJS.ProcessEnv>): void {
  const m = validateCriticalEnv(input);
  if (m.length) throw new Error(`Critical env missing: ${m.join(", ")}`);
}
