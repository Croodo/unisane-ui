import { connectDb, kv, getEnv, randomToken, logger, InternalError, Email } from "@unisane/kernel";
import { AuthCredentialRepo } from "../data/auth.repository";

export async function resetStart(input: {
  email: string;
  ttlSec: number;
  redirectTo?: string;
}): Promise<{ sent: boolean }> {
  await connectDb();
  const emailNorm = Email.create(input.email).toString();
  const cred = await AuthCredentialRepo.findByEmailNorm(emailNorm);
  if (!cred) return { sent: true }; // do not reveal existence
  const token = randomToken(32);
  const { resetTokenKey } = await import("../domain/keys");
  const key = resetTokenKey(cred.emailNorm, token);
  await kv.set(key, String(cred.userId), { PX: input.ttlSec * 1000 });
  try {
    const { OutboxService, OutboxRepo } = await import("@unisane/kernel");
    const url = buildResetUrl({
      email: cred.emailNorm,
      token,
      ...(input.redirectTo ? { redirectTo: input.redirectTo } : {}),
    });
    const enq = await OutboxService.enqueue({
      scopeId: "__system__",
      kind: "email",
      payload: {
        to: { email: cred.emailNorm },
        template: "auth_password_reset",
        props: { url },
      },
    });
    // Hybrid approach: after enqueue, attempt immediate send. If it works, mark delivered; otherwise the job will retry later.
    try {
      const { sendEmail } = await import("@unisane/notify");
      await sendEmail({ to: { email: cred.emailNorm }, template: "auth_password_reset", props: { url } });
      await OutboxRepo.markProcessed(enq.id);
    } catch (err) {
      // best-effort; leave queued for job-based delivery
      logger.warn("resetStart: immediate email send failed, falling back to job", { err });
    }
  } catch (err) {
    // AUTH-004 FIX: Log outbox enqueueing errors instead of silently swallowing them.
    // We still return { sent: true } to avoid revealing whether the email exists,
    // but we log the error so operators can detect and fix issues.
    logger.error("resetStart: failed to enqueue password reset email", {
      err,
      emailNorm,
      // Don't log token for security reasons
    });
  }
  return { sent: true };
}

/**
 * AUTH-008 FIX: Validate redirectTo parameter to prevent open redirect attacks.
 *
 * Validates that:
 * 1. Absolute URLs must have origin in ALLOWED_ORIGINS
 * 2. Relative paths must start with / and not contain .. or //
 * 3. No query strings or fragments in relative paths (we add our own params)
 */
function isValidRedirectPath(path: string): boolean {
  // Must start with /
  if (!path.startsWith('/')) return false;
  // No path traversal
  if (path.includes('..')) return false;
  // No double slashes (protocol-relative URL attempt)
  if (path.includes('//')) return false;
  // No query strings or fragments - we add our own params
  if (path.includes('?') || path.includes('#')) return false;
  // Only allow alphanumeric, dash, underscore, and forward slash
  if (!/^[a-zA-Z0-9\-_/]+$/.test(path)) return false;
  return true;
}

function buildResetUrl(args: {
  email: string;
  token: string;
  redirectTo?: string;
}): string {
  const { ALLOWED_ORIGINS } = getEnv();
  const base = pickBase(args.redirectTo, ALLOWED_ORIGINS);
  const u = new URL(base);
  // Default path if caller gave only origin
  if (!args.redirectTo || /^https?:\/\//i.test(args.redirectTo)) {
    if (!u.pathname || u.pathname === "/") u.pathname = "/forgot-password";
  } else {
    // AUTH-008 FIX: Validate relative path to prevent open redirect
    const relativePath = args.redirectTo;
    if (isValidRedirectPath(relativePath)) {
      u.pathname = relativePath;
    } else {
      // Invalid relative path - use default
      logger.warn("resetStart: invalid redirectTo path, using default", {
        redirectTo: relativePath,
      });
      u.pathname = "/forgot-password";
    }
  }
  u.searchParams.set("token", args.token);
  u.searchParams.set("email", args.email);
  return u.toString();
}

function pickBase(redirectTo: string | undefined, allowed: string[]): string {
  const { APP_ENV } = getEnv();
  // If redirectTo is absolute and origin is allowed, use it as base
  if (redirectTo && /^https?:\/\//i.test(redirectTo)) {
    try {
      const u = new URL(redirectTo);
      const origin = `${u.protocol}//${u.host}`;
      if (allowed.includes(origin)) return origin;
    } catch {}
  }
  // Prefer first allowed origin when present
  if (allowed.length) return allowed[0]!;
  // In production, do not fall back to localhost — require configuration
  if (APP_ENV === "prod") {
    throw new InternalError(
      "ALLOWED_ORIGINS must include at least one origin in production"
    );
  }
  // Dev fallback
  return "http://localhost:3000";
}
