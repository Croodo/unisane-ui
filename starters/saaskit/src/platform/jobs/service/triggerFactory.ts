import { HEADER_NAMES } from "@unisane/gateway";
import { metrics } from "@/src/platform/telemetry";

import type { AuthCtx } from '@unisane/gateway';

/**
 * Raw factory invoked by the generated sidecar for POST /api/rest/v1/admin/jobs/:name/run
 * Proxies to the internal /api/_jobs/run?task=<name>, preserving request id and streaming the response.
 */
export async function triggerJob(args: {
  req: Request;
  params?: { [k: string]: unknown };
  body?: unknown;
  ctx: AuthCtx;
  requestId: string;
}) {
  const jobName = String(args.params?.["name"] ?? "").trim();
  if (!jobName) {
    return new Response(
      JSON.stringify({ error: { code: "VALIDATION_FAILED", message: "Missing job name" } }),
      { status: 422, headers: { "content-type": "application/json", [HEADER_NAMES.REQUEST_ID]: args.requestId } }
    );
  }
  // Construct same-origin URL to /api/_jobs/run
  let origin: string;
  try {
    origin = new URL(args.req.url).origin;
  } catch {
    origin = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || "http://127.0.0.1:3000";
  }
  const url = new URL("/api/_jobs/run", origin);
  url.searchParams.set("task", jobName);

  const t0 = Date.now();
  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [HEADER_NAMES.REQUEST_ID]: args.requestId,
    },
  });
  const ms = Date.now() - t0;
  try { metrics.inc('admin_job_trigger', 1, { job: jobName, status: resp.status }); } catch {}
  try { metrics.timing('admin_job_trigger_ms', ms, { job: jobName, status: resp.status }); } catch {}

  // Pass through status/body so clients see 200 (executed) or 202 (lease held)
  const headers = new Headers(resp.headers);
  headers.set("content-type", headers.get("content-type") ?? "application/json");
  headers.set(HEADER_NAMES.REQUEST_ID, args.requestId);
  return new Response(resp.body, { status: resp.status, headers });
}
