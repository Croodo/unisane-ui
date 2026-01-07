import { Inngest, EventSchemas } from "inngest";
import { getEnv } from "./env";

// Create a client to send and receive events.
// Keep a small SSOT event schema here for type-safe `event.data` in functions.
let eventKey: string | undefined;
try {
  eventKey = getEnv().INNGEST_EVENT_KEY;
} catch {
  // Allow non-runtime contexts (codegen/typecheck) to import this module without full env.
}

export const inngest = new Inngest({
  id: "saaskit",
  ...(eventKey ? { eventKey } : {}),
  schemas: new EventSchemas().fromRecord<{
    "app/export.requested": {
      data: { tenantId: string; jobId: string };
    };
  }>(),
});
