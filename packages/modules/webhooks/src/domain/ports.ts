import type { WebhookEventListPage, WebhookEventDetail } from './types';
import type { WebhookDirection, WebhookEventStatus, WebhookProvider } from '@unisane/kernel';

export interface WebhooksRepoPort {
  listPage(args: { scopeId: string; limit: number; cursor?: string; direction?: WebhookDirection; status?: WebhookEventStatus }): Promise<WebhookEventListPage>;
  getById(args: { scopeId: string; id: string; direction?: WebhookDirection }): Promise<WebhookEventDetail | null>;
  recordInbound(args: { scopeId: string | null; provider: WebhookProvider; eventId: string | null; status: WebhookEventStatus; headers: Record<string, string>; payload: unknown }): Promise<{ ok: true; deduped?: true }>;
  recordOutbound(args: { scopeId: string | null; target: string; status: WebhookEventStatus; httpStatus: number | null; headers: Record<string, string>; payload: unknown; error?: string | null }): Promise<void>;
  // Admin/stats: failures per scope over a window
  countOutboundFailuresSince(scopeIds: string[], since: Date): Promise<Map<string, number>>;
}
