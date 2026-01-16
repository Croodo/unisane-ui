import { serve } from "inngest/next";
import { inngest } from "@/src/platform/inngest/client";
import { exportCsv } from "@/src/platform/inngest/functions/export";
import { logger } from "@unisane/kernel";

/**
 * ROUTE-002 FIX: Wrap Inngest serve handlers with error logging.
 * Inngest's serve() returns handlers that may throw unhandled errors.
 */
const inngestHandlers = serve({
  client: inngest,
  functions: [
    exportCsv,
  ],
});

const log = logger.child({ module: "inngest", route: "api" });

// ROUTE-002 FIX: Wrap each handler with error catching
async function wrapHandler(
  handler: (req: Request) => Promise<Response>,
  req: Request
): Promise<Response> {
  try {
    return await handler(req);
  } catch (error) {
    log.error("inngest handler error", {
      error: error instanceof Error ? error.message : String(error),
      url: req.url,
      method: req.method,
    });
    return new Response(
      JSON.stringify({ error: { message: "Internal server error" } }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

export const GET = (req: Request) => wrapHandler(inngestHandlers.GET, req);
export const POST = (req: Request) => wrapHandler(inngestHandlers.POST, req);
export const PUT = (req: Request) => wrapHandler(inngestHandlers.PUT, req);

export const runtime = "nodejs";
