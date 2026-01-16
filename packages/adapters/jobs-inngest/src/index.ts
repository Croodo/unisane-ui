/**
 * Inngest Jobs Adapter
 *
 * Implements the JobsPort interface using Inngest.
 *
 * @example
 * ```typescript
 * import { createInngestJobsAdapter } from '@unisane/jobs-inngest';
 * import { setJobsProvider } from '@unisane/kernel';
 * import { Inngest, EventSchemas } from 'inngest';
 *
 * // Create the Inngest client with your app-specific config
 * const inngest = new Inngest({
 *   id: 'myapp',
 *   eventKey: process.env.INNGEST_EVENT_KEY,
 *   schemas: new EventSchemas().fromRecord<{
 *     'app/export.requested': { data: { jobId: string } };
 *   }>(),
 * });
 *
 * // Wire the jobs port
 * setJobsProvider(createInngestJobsAdapter(inngest));
 * ```
 */

import type { JobsPort, JobEvent } from '@unisane/kernel';
import { CIRCUIT_BREAKER_DEFAULTS, createResilientProxy } from '@unisane/kernel';
import { z } from 'zod';

/**
 * ING-001 FIX: Zod schema for validating job events.
 * Ensures event name and data are safe before sending to Inngest.
 */
const ZJobEvent = z.object({
  // Event name should be a valid identifier pattern (namespace/action)
  name: z.string()
    .min(1, 'Event name cannot be empty')
    .max(256, 'Event name too long')
    .regex(/^[a-z0-9_-]+\/[a-z0-9_.-]+$/i, 'Event name must match pattern: namespace/action'),
  // Data must be a plain object (no functions, symbols, etc.)
  data: z.record(z.unknown()).default({}),
});

/**
 * ING-001 FIX: Validate and sanitize a job event before sending.
 */
function validateJobEvent(event: JobEvent<unknown>): { name: string; data: Record<string, unknown> } {
  const result = ZJobEvent.safeParse(event);
  if (!result.success) {
    throw new Error(`Invalid job event: ${result.error.message}`);
  }
  return {
    name: result.data.name,
    data: result.data.data,
  };
}

/**
 * Minimal interface for an Inngest-like client.
 * This allows type-safe usage without depending on specific Inngest generics.
 */
export interface InngestLike {
  send(
    event: { name: string; data: Record<string, unknown> } | Array<{ name: string; data: Record<string, unknown> }>
  ): Promise<{ ids?: string[] }>;
}

/**
 * Create a JobsPort adapter from an Inngest client.
 * This allows using the kernel's vendor-agnostic job sending API.
 *
 * @param inngest The Inngest client instance (or any client with a compatible `send` method)
 * @returns JobsPort implementation
 *
 * @example
 * ```typescript
 * import { createInngestJobsAdapter } from '@unisane/jobs-inngest';
 * import { setJobsProvider } from '@unisane/kernel';
 *
 * setJobsProvider(createInngestJobsAdapter(inngest));
 *
 * // Now you can use sendJob() from anywhere
 * import { sendJob } from '@unisane/kernel';
 * await sendJob({ name: 'app/export.requested', data: { jobId: '123' } });
 * ```
 */
/**
 * ING-002 FIX: Internal class for Inngest adapter to support resilient proxy wrapping.
 */
class InngestJobsAdapterImpl implements JobsPort {
  readonly name = 'jobs-inngest' as const;

  constructor(private readonly inngest: InngestLike) {}

  async send<T = Record<string, unknown>>(event: JobEvent<T>): Promise<{ id?: string }> {
    // ING-001 FIX: Validate event before sending
    const validatedEvent = validateJobEvent(event);
    const result = await this.inngest.send(validatedEvent);
    // Inngest returns ids array, we return the first one
    return { id: result.ids?.[0] };
  }

  async sendBatch<T = Record<string, unknown>>(events: JobEvent<T>[]): Promise<{ ids?: string[] }> {
    if (events.length === 0) {
      return { ids: [] };
    }

    // ING-001 FIX: Validate all events before sending
    const validatedEvents = events.map((event) => validateJobEvent(event));
    const result = await this.inngest.send(validatedEvents);

    return { ids: result.ids };
  }
}

/**
 * Create a JobsPort adapter from an Inngest client (without resilience wrapper).
 * Use createResilientInngestJobsAdapter for production use.
 */
export function createInngestJobsAdapter(inngest: InngestLike): JobsPort {
  return new InngestJobsAdapterImpl(inngest);
}

/**
 * ING-002 FIX: Create a resilient Inngest jobs adapter with circuit breaker and retry.
 * Recommended for production use.
 *
 * @param inngest The Inngest client instance
 * @returns JobsPort implementation with resilience
 */
export function createResilientInngestJobsAdapter(inngest: InngestLike): JobsPort {
  return createResilientProxy({
    name: 'jobs-inngest',
    primary: new InngestJobsAdapterImpl(inngest),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}

// Re-export Inngest for convenience (users create their own client with schemas)
export { Inngest, EventSchemas } from 'inngest';
