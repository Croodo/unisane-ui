import type { WebhookEventListPage, WebhookEventDetail } from './types';
import type { WebhookDirection, WebhookEventStatus, WebhookProvider } from '@unisane/kernel';

export interface WebhooksRepoPort {
  listPage(args: { tenantId: string; limit: number; cursor?: string; direction?: WebhookDirection; status?: WebhookEventStatus }): Promise<WebhookEventListPage>;
  getById(args: { tenantId: string; id: string; direction?: WebhookDirection }): Promise<WebhookEventDetail | null>;
  recordInbound(args: { tenantId: string | null; provider: WebhookProvider; eventId: string | null; status: WebhookEventStatus; headers: Record<string, string>; payload: unknown }): Promise<{ ok: true; deduped?: true }>;
  recordOutbound(args: { tenantId: string | null; target: string; status: WebhookEventStatus; httpStatus: number | null; headers: Record<string, string>; payload: unknown; error?: string | null }): Promise<void>;
  // Admin/stats: failures per tenant over a window
  countOutboundFailuresSince(tenantIds: string[], since: Date): Promise<Map<string, number>>;
}
