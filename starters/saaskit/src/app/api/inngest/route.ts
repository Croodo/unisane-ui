import { serve } from "inngest/next";
import { inngest } from "@/src/platform/inngest/client";
import { exportCsv } from "@/src/platform/inngest/functions/export";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    exportCsv,
  ],
});

export const runtime = "nodejs";
