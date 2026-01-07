import { col } from '@unisane/kernel';
import type { EmailSuppressionRepoPort } from '../domain/ports';
import type { Document } from 'mongodb';

type SuppressionDoc = {
  _id?: unknown;
  tenantId: string | null;
  email: string;
  reason?: string | null;
  provider?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const supCol = () => col<SuppressionDoc>('email_suppressions');

export const EmailSuppressionRepoMongo: EmailSuppressionRepoPort = {
  async upsert(args) {
    const email = args.email.trim().toLowerCase();
    await supCol().updateOne(
      { email, tenantId: args.tenantId ?? null } as Document,
      { $set: { reason: args.reason, provider: args.provider ?? null, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } } as Document,
      { upsert: true }
    );
  },
  async isSuppressed(email: string, tenantId?: string | null): Promise<boolean> {
    const row = await supCol().findOne({ email: email.trim().toLowerCase(), tenantId: tenantId ?? null } as Document);
    return !!row;
  },
};
