import { upsertSuppression as repoUpsert, isSuppressed as repoIsSuppressed } from '../data/suppression.repository';

export async function addSuppression(args: { email: string; reason: string; provider?: string; scopeId?: string | null }) {
  await repoUpsert(args);
}

export async function isSuppressed(email: string, scopeId?: string | null): Promise<boolean> {
  return repoIsSuppressed(email, scopeId);
}
