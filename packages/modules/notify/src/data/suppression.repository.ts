import type { EmailSuppressionRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { EmailSuppressionRepoMongo } from './suppression.repository.mongo';

export const EmailSuppressionRepo = selectRepo<EmailSuppressionRepoPort>({ mongo: EmailSuppressionRepoMongo });

export async function upsertSuppression(args: { email: string; reason: string; provider?: string; scopeId?: string | null }) {
  return EmailSuppressionRepo.upsert(args);
}

export async function isSuppressed(email: string, scopeId?: string | null): Promise<boolean> {
  return EmailSuppressionRepo.isSuppressed(email, scopeId);
}

