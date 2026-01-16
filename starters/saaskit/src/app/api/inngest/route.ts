import { serve } from "inngest/next";
import { inngest } from "@/src/platform/inngest/client";
import { exportCsv } from "@/src/platform/inngest/functions/export";

/**
 * Inngest API Route Handler
 *
 * This route exposes Inngest's webhook endpoints for function execution.
 * Inngest's serve() handles all request processing internally.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    exportCsv,
  ],
});

export const runtime = "nodejs";
