import { rollupHour } from "@/src/modules/usage/service/rollupHour";
import { rollupDay } from "@/src/modules/usage/service/rollupDay";
import { OutboxService } from "@/src/platform/outbox/service";
import { deliverWebhook } from "@/src/platform/webhooks/outbound";
import type { OutboundWebhookPayload } from "@/src/platform/webhooks/outbound";
import { sendEmail } from "@/src/modules/notify/service/email";
import {
  reconcileStripe,
  reconcileRazorpay,
} from "@/src/modules/billing/service/reconcile";
import { metrics } from "@/src/core/metrics";
import { metrics as telemetry } from "@/src/platform/telemetry";
import { getEnv } from "@/src/shared/env";
import { JobsService } from "@/src/modules/import-export";
import { connectDb } from "@/src/core/db";
import { getSignedUploadUrl } from "@/src/core/storage";
import { redis } from "@/src/core/kv/redis";
import { OutboxRepo } from "@/src/platform/outbox/data/repo";
import { SubscriptionsService } from "@/src/modules/billing";
import {
  clearTenantOverride,
  clearUserOverride,
} from "@/src/modules/flags/service/overrides";
import { listExpiredOverridesForCleanup } from "@/src/modules/flags/data/overrides.repository";
import {
  cleanupOrphanedUploads,
  cleanupDeletedFiles,
} from "@/src/modules/storage";

type EmailPayload = {
  to: { email: string; name?: string };
  template: string;
  props?: Record<string, unknown>;
  locale?: unknown;
};

function isEmailPayload(payload: unknown): payload is EmailPayload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  const to = p.to as Record<string, unknown> | undefined;
  return (
    !!to &&
    typeof to === "object" &&
    typeof to.email === "string" &&
    typeof p.template === "string"
  );
}

export const registry: Record<
  string,
  (ctx: { deadlineMs: number }) => Promise<void>
> = {
  // Deliver queued emails via injected dispatcher; default is no-op
  "deliver-notifications": async (_ctx) => {
    void _ctx;
    // Ensure DB connection for suppression/prefs reads
    await connectDb();
    const dispatchers: { email?: (payload: unknown) => Promise<void> } = {};
    const {
      MAIL_PROVIDER,
      RESEND_API_KEY,
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    } = getEnv();
    if (
      (MAIL_PROVIDER === "resend" && RESEND_API_KEY) ||
      (MAIL_PROVIDER === "ses" &&
        AWS_REGION &&
        AWS_ACCESS_KEY_ID &&
        AWS_SECRET_ACCESS_KEY)
    ) {
      dispatchers.email = async (payload: unknown) => {
        if (!isEmailPayload(payload)) throw new Error("invalid email payload");
        const p = payload;
        const headers = p.locale ? { "X-Locale": String(p.locale) } : undefined;
        await sendEmail({
          to: { email: p.to.email, ...(p.to.name ? { name: p.to.name } : {}) },
          template: p.template,
          ...(p.props ? { props: p.props } : {}),
          ...(headers ? { headers } : {}),
        });
      };
    }
    await OutboxService.deliverBatch(new Date(), 50, dispatchers);
  },
  "deliver-webhooks": async (_ctx) => {
    void _ctx;
    await OutboxService.deliverBatch(new Date(), 50, {
      webhook: async (payload) => {
        // Validate and forward to outbound sender
        const o = payload as Record<string, unknown>;
        const url = typeof o.url === "string" ? o.url : null;
        const event = typeof o.event === "string" ? o.event : null;
        if (!url || !event) throw new Error("invalid webhook payload");
        const base = { url, event, body: o.body } as const;
        const typed: OutboundWebhookPayload = {
          ...base,
          ...(typeof o.secret === "string"
            ? { secret: o.secret as string }
            : {}),
          ...(o.headers && typeof o.headers === "object"
            ? { headers: o.headers as Record<string, string> }
            : {}),
          ...(typeof o.tenantId === "string"
            ? { tenantId: o.tenantId as string }
            : {}),
        };
        await deliverWebhook(typed);
      },
    });
  },
  "retry-dlq": async (_ctx) => {
    void _ctx;
    // Requeue a limited number of dead items for another attempt
    const now = new Date();
    const dead = await OutboxRepo.listDead(50);
    const ids = dead.map((d) => d.id);
    if (ids.length) await OutboxRepo.requeue(ids, now);
  },
  "alert-dead-outbox": async (_ctx) => {
    void _ctx;
    const {
      ALERT_EMAIL,
      OUTBOX_ALERT_EMAIL,
      OUTBOX_DLQ_ALERT_MIN_INTERVAL_MIN,
    } = getEnv();
    const to = OUTBOX_ALERT_EMAIL || ALERT_EMAIL;
    if (!to) return;
    const lockKey = "lock:alert:outbox:dead";
    const acquired = await redis.set(lockKey, Date.now().toString(), {
      NX: true,
      PX: OUTBOX_DLQ_ALERT_MIN_INTERVAL_MIN * 60 * 1000,
    });
    if (!acquired) return; // Recently alerted; skip
    const deadCount = await OutboxRepo.countDead();
    if (deadCount <= 0) return;
    // Send a simple alert email with default template renderer
    try {
      await sendEmail({
        to: { email: to },
        template: "outbox_dead_alert",
        props: { deadCount },
      });
    } catch {
      // ignore mail send failures
    }
  },
  "usage-rollup-hourly": async (_ctx) => {
    void _ctx;
    await rollupHour();
  },
  "usage-rollup-daily": async (_ctx) => {
    void _ctx;
    await rollupDay();
  },
  "materialize-exports": async (ctx) => {
    // Materialize queued export jobs by writing a small file to S3 via presigned PUT
    const deadline = ctx.deadlineMs ?? Date.now() + 25_000;
    const batch = await JobsService.listQueuedExports(10);
    for (const job of batch) {
      if (Date.now() > deadline) break;
      try {
        await JobsService.markExportRunning(job.id);
        const upload = await getSignedUploadUrl(job.key, 300);
        // Simple payload based on format
        let body: string;
        let contentType = "application/json";
        if (job.format === "csv") {
          contentType = "text/csv";
          body = `id,name\n1,Example\n`;
        } else {
          body = JSON.stringify([{ id: 1, name: "Example" }]);
        }
        const res = await fetch(upload.url, {
          method: "PUT",
          headers: { "content-type": contentType },
          body,
        });
        if (!res.ok) throw new Error(`upload failed: ${res.status}`);
        await JobsService.markExportDone(job.id);
      } catch (e) {
        await JobsService.markExportFailed(
          job.id,
          (e as Error)?.message ?? "error"
        );
      }
    }
  },
  "storage.cleanupOrphaned": async (_ctx) => {
    void _ctx;
    const result = await cleanupOrphanedUploads();
    if (result.cleaned > 0) {
      telemetry.inc("storage.orphaned_cleaned", 1, { cleaned: result.cleaned });
    }
  },
  "storage.cleanupDeleted": async (_ctx) => {
    void _ctx;
    const result = await cleanupDeletedFiles();
    if (result.cleaned > 0) {
      telemetry.inc("storage.deleted_cleaned", 1, { cleaned: result.cleaned });
    }
  },
  "flags.cleanupOverrides": async (_ctx) => {
    void _ctx;
    await connectDb();
    const now = new Date();
    const docs = await listExpiredOverridesForCleanup(now, 200);

    for (const d of docs) {
      const env =
        typeof d.env === "string"
          ? (d.env as import("@/src/shared/constants/env").AppEnv)
          : undefined;
      const key = String(d.key);
      const scopeId = String(d.scopeId);
      try {
        if (d.scopeType === "tenant") {
          await clearTenantOverride({
            ...(env ? { env } : {}),
            key,
            tenantId: scopeId,
            actorIsSuperAdmin: true,
          });
        } else if (d.scopeType === "user") {
          await clearUserOverride({
            ...(env ? { env } : {}),
            key,
            userId: scopeId,
            actorIsSuperAdmin: true,
          });
        }
      } catch {
        // best-effort cleanup; continue on failures
      }
    }
  },
};

// --- Instrument all jobs with RED metrics (no-op if StatsD not configured) ---
type JobFn = (ctx: { deadlineMs: number }) => Promise<void>;
function wrapWithMetrics(name: string, fn: JobFn): JobFn {
  return async (ctx) => {
    const t0 = Date.now();
    try {
      await fn(ctx);
      telemetry.inc("jobs.processed_total", 1, { task: name });
    } catch (err) {
      telemetry.inc("jobs.failed_total", 1, { task: name });
      throw err;
    } finally {
      const dt = Date.now() - t0;
      telemetry.timing("jobs.duration_ms", dt, { task: name });
    }
  };
}

if (process.env.DISABLE_JOB_METRICS !== "1") {
  for (const k of Object.keys(registry)) {
    const fn = registry[k];
    if (typeof fn === "function") {
      registry[k] = wrapWithMetrics(k, fn);
    }
  }
}

// Pro jobs (reconcile/dunning) — not registered by default in OSS.
// They can be enabled via SAASKIT_ENABLE_PRO_JOBS or registered by Pro packs.
export function registerProJobs(target: typeof registry) {
  target["reconcile-billing-daily"] = async (_ctx) => {
    void _ctx;
    try {
      const { customers, subs, invoices, payments } = await reconcileStripe(
        _ctx.deadlineMs
      );
      metrics.inc("billing_reconcile_summary", {
        provider: "stripe",
        customers,
        subs,
        invoices,
        payments,
      });
    } catch {
      // ignore job errors; next run will retry
    }
  };
  target["reconcile-billing-razorpay-daily"] = async (_ctx) => {
    void _ctx;
    try {
      const { subs, payments } = await reconcileRazorpay(_ctx.deadlineMs);
      metrics.inc("billing_reconcile_summary", {
        provider: "razorpay",
        subs,
        payments,
      });
    } catch {
      // ignore job errors; next run will retry
    }
  };
  target["dunning-cycle"] = async (_ctx) => {
    void _ctx;
    const { BILLING_ALERT_EMAIL: to } = getEnv();
    if (!to) return; // no configured recipient
    const now = Date.now();
    const cutoff = new Date(now - 24 * 60 * 60 * 1000);
    const docs = await SubscriptionsService.listByStatusAged(
      ["past_due", "unpaid"],
      cutoff,
      50
    );
    let queued = 0;
    for (const s of docs) {
      if (_ctx.deadlineMs && Date.now() > _ctx.deadlineMs) break;
      const tenantId = (s as { tenantId?: string }).tenantId ?? null;
      await OutboxService.enqueue({
        tenantId,
        kind: "email",
        payload: {
          to: { email: to },
          template: "billing_dunning",
          props: {
            tenantId,
            provider: "stripe",
            status: (s as { status?: string }).status ?? "past_due",
            subId: (s as { providerSubId?: string }).providerSubId ?? null,
            updatedAt: (s as { updatedAt?: Date }).updatedAt ?? null,
          },
          category: "billing",
        },
      });
      queued++;
    }
    if (queued > 0) metrics.inc("billing_dunning_queued", { count: queued });
  };
}

// Optional enablement via env for dev/tests.
try {
  const { SAASKIT_ENABLE_PRO_JOBS } = getEnv();
  if (SAASKIT_ENABLE_PRO_JOBS) registerProJobs(registry);
  // Optional Pro pack hook: if installed, let it register additional tasks.
  // This import should fail gracefully in OSS.
  // @ts-expect-error optional module
  import("@saaskit/pro/jobs")
    .then((mod: unknown) => {
      const maybe = mod as {
        registerJobs?: (target: typeof registry) => unknown;
      } | null;
      if (maybe && typeof maybe.registerJobs === "function") {
        maybe.registerJobs(registry);
      }
    })
    .catch(() => {});
} catch {
  // ignore env parse errors at module init time
}
