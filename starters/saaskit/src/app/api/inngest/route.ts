import { serve } from "inngest/next";
import { inngest } from "@unisane/kernel";
import { exportCsv } from "@/src/platform/inngest/functions/export";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    exportCsv,
  ],
});

export const runtime = "nodejs";
