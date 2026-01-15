import {
  col,
  COLLECTIONS,
  Email,
  type Document,
} from '@unisane/kernel';
import type { EmailSuppressionRepoPort } from '../domain/ports';

type SuppressionDoc = {
  _id?: unknown;
  scopeId: string | null;
  email: string;
  reason?: string | null;
  provider?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const supCol = () => col<SuppressionDoc>(COLLECTIONS.EMAIL_SUPPRESSIONS);

export const EmailSuppressionRepoMongo: EmailSuppressionRepoPort = {
  async upsert(args) {
    const email = Email.create(args.email).toString();
    await supCol().updateOne(
      { email, scopeId: args.scopeId ?? null } as Document,
      { $set: { reason: args.reason, provider: args.provider ?? null, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } } as Document,
      { upsert: true }
    );
  },
  async isSuppressed(email: string, scopeId?: string | null): Promise<boolean> {
    const emailNorm = Email.tryCreate(email)?.toString() ?? email.trim().toLowerCase();
    const row = await supCol().findOne({ email: emailNorm, scopeId: scopeId ?? null } as Document);
    return !!row;
  },
};
