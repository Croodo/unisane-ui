import {
  col,
  COLLECTIONS,
  Email,
  UpdateBuilder,
  toMongoUpdate,
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
    const now = new Date();
    const builder = new UpdateBuilder<SuppressionDoc>()
      .set("reason", args.reason)
      .set("provider", args.provider ?? null)
      .set("updatedAt", now)
      .setOnInsert("createdAt", now);
    await supCol().updateOne(
      { email, scopeId: args.scopeId ?? null } as Document,
      toMongoUpdate(builder.build()) as Document,
      { upsert: true }
    );
  },
  /**
   * NOTI-001 FIX: Use consistent normalization path with upsert.
   * Both upsert and isSuppressed now use Email.create for strict validation.
   */
  async isSuppressed(email: string, scopeId?: string | null): Promise<boolean> {
    // NOTI-001 FIX: Use Email.create for consistent normalization (same as upsert)
    // If email is invalid, treat as not suppressed rather than failing
    const emailObj = Email.tryCreate(email);
    if (!emailObj) {
      // Invalid email format - can't be suppressed
      return false;
    }
    const emailNorm = emailObj.toString();
    const row = await supCol().findOne({ email: emailNorm, scopeId: scopeId ?? null } as Document);
    return !!row;
  },
};
