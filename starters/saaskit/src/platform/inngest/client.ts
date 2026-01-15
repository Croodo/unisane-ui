/**
 * Inngest Client
 *
 * App-specific Inngest client configuration.
 * This creates the Inngest instance with this app's event schemas.
 */

import { Inngest, EventSchemas } from 'inngest';
import { getEnv } from '@unisane/kernel';

// Get event key from environment, allow undefined for non-runtime contexts (codegen/typecheck)
let eventKey: string | undefined;
try {
  eventKey = getEnv().INNGEST_EVENT_KEY;
} catch {
  // Allow non-runtime contexts (codegen/typecheck) to import this module without full env.
}

/**
 * The Inngest client for this application.
 * Use this to create functions and send events.
 *
 * Event schemas are defined inline for type-safe `event.data` in functions.
 */
export const inngest = new Inngest({
  id: 'saaskit',
  ...(eventKey ? { eventKey } : {}),
  schemas: new EventSchemas().fromRecord<{
    'app/export.requested': {
      data: { tenantId: string; jobId: string };
    };
  }>(),
});
