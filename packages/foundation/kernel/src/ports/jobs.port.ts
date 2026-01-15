/**
 * Jobs Port
 *
 * Abstract interface for background job scheduling.
 * Implementations can use Inngest, BullMQ, or any other job queue.
 */

/**
 * Job event to be sent to the queue
 */
export interface JobEvent<T = Record<string, unknown>> {
  /** Event name (e.g., "app/export.requested") */
  name: string;
  /** Event data/payload */
  data: T;
}

/**
 * Port interface for background job scheduling
 */
export interface JobsPort {
  /**
   * Send a job event to the queue
   * @param event The event to send
   */
  send<T = Record<string, unknown>>(event: JobEvent<T>): Promise<{ id?: string }>;

  /**
   * Send multiple job events to the queue
   * @param events The events to send
   */
  sendBatch<T = Record<string, unknown>>(events: JobEvent<T>[]): Promise<{ ids?: string[] }>;
}

/**
 * No-op implementation for when no jobs provider is configured.
 * Logs a warning and does nothing.
 */
const noopJobsProvider: JobsPort = {
  send: async (event) => {
    console.warn(`[jobs] No jobs provider configured. Event '${event.name}' was not sent.`);
    return {};
  },
  sendBatch: async (events) => {
    console.warn(`[jobs] No jobs provider configured. ${events.length} events were not sent.`);
    return {};
  },
};

let _jobsProvider: JobsPort = noopJobsProvider;

/**
 * Set the jobs provider implementation.
 * Call this during app bootstrap to configure background job processing.
 *
 * @example
 * ```typescript
 * import { setJobsProvider } from '@unisane/kernel';
 * import { createInngestJobsProvider } from '@unisane/jobs-inngest';
 *
 * const inngestClient = new Inngest({ id: 'myapp' });
 * setJobsProvider(createInngestJobsProvider(inngestClient));
 * ```
 */
export function setJobsProvider(provider: JobsPort): void {
  _jobsProvider = provider;
}

/**
 * Get the current jobs provider.
 */
export function getJobsProvider(): JobsPort {
  return _jobsProvider;
}

/**
 * Check if a jobs provider has been configured (not noop).
 */
export function hasJobsProvider(): boolean {
  return _jobsProvider !== noopJobsProvider;
}

/**
 * Convenience function to send a job event.
 *
 * @example
 * ```typescript
 * await sendJob({
 *   name: 'app/export.requested',
 *   data: { tenantId: 'tenant_123', jobId: 'job_456' },
 * });
 * ```
 */
export async function sendJob<T = Record<string, unknown>>(event: JobEvent<T>): Promise<{ id?: string }> {
  return _jobsProvider.send(event);
}

/**
 * Convenience function to send multiple job events.
 */
export async function sendJobBatch<T = Record<string, unknown>>(events: JobEvent<T>[]): Promise<{ ids?: string[] }> {
  return _jobsProvider.sendBatch(events);
}
