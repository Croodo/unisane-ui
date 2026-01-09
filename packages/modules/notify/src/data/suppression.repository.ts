import type { EmailSuppressionRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { EmailSuppressionRepoMongo } from './suppression.repository.mongo';

export const EmailSuppressionRepo = selectRepo<EmailSuppressionRepoPort>({ mongo: EmailSuppressionRepoMongo });

export async function upsertSuppression(args: { email: string; reason: string; provider?: string; tenantId?: string | null }) {
  return EmailSuppressionRepo.upsert(args);
}

export async function isSuppressed(email: string, tenantId?: string | null): Promise<boolean> {
  return EmailSuppressionRepo.isSuppressed(email, tenantId);
}

