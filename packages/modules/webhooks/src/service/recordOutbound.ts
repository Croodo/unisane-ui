import { WebhooksRepo } from '../data/webhooks.repository';

export async function recordOutbound(args: {
  scopeId: string | null;
  target: string;
  status: 'delivered' | 'failed';
  httpStatus: number | null;
  headers: Record<string, string>;
  payload: unknown;
  error?: string | null;
}): Promise<void> {
  await WebhooksRepo.recordOutbound(args);
}

