import { serve } from "inngest/next";
import { inngest } from "@/src/core/inngest";
import { exportCsv } from "@/src/platform/inngest/functions/export";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    exportCsv,
  ],
});

export const runtime = "nodejs";
