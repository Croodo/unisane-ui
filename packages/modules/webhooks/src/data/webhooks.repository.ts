import type { WebhooksRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { WebhooksRepoMongo } from './webhooks.repository.mongo';

export const WebhooksRepo = selectRepo<WebhooksRepoPort>({ mongo: WebhooksRepoMongo });

export async function countOutboundFailuresSince(scopeIds: string[], since: Date): Promise<Map<string, number>> {
  return WebhooksRepo.countOutboundFailuresSince(scopeIds, since);
}
