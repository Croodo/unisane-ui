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
export function createInngestJobsAdapter(inngest: InngestLike): JobsPort {
  return {
    async send<T = Record<string, unknown>>(event: JobEvent<T>): Promise<{ id?: string }> {
      const result = await inngest.send({
        name: event.name,
        data: event.data as Record<string, unknown>,
      });
      // Inngest returns ids array, we return the first one
      return { id: result.ids?.[0] };
    },

    async sendBatch<T = Record<string, unknown>>(events: JobEvent<T>[]): Promise<{ ids?: string[] }> {
      if (events.length === 0) {
        return { ids: [] };
      }

      const result = await inngest.send(
        events.map((event) => ({
          name: event.name,
          data: event.data as Record<string, unknown>,
        }))
      );

      return { ids: result.ids };
    },
  };
}

// Re-export Inngest for convenience (users create their own client with schemas)
export { Inngest, EventSchemas } from 'inngest';
