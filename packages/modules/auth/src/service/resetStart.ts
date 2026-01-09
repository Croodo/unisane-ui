import { connectDb, kv, getEnv, randomToken } from "@unisane/kernel";
import { AuthCredentialRepo } from "../data/auth.repository";
import { normalizeEmail } from "@unisane/identity";

export async function resetStart(input: {
  email: string;
  ttlSec: number;
  redirectTo?: string;
}): Promise<{ sent: boolean }> {
  await connectDb();
  const emailNorm = normalizeEmail(input.email);
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
      tenantId: "__system__",
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
      console.error('[resetStart] Immediate email send failed, falling back to job:', err);
    }
  } catch {}
  return { sent: true };
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
    // relative path
    u.pathname = args.redirectTo;
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
    throw new Error(
      "ALLOWED_ORIGINS must include at least one origin in production"
    );
  }
  // Dev fallback
  return "http://localhost:3000";
}
