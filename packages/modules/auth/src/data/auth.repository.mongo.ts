import {
  col,
  COLLECTIONS,
  maybeObjectId,
  UpdateBuilder,
  toMongoUpdate,
  type WithId,
  type Filter,
  type UpdateFilter,
} from '@unisane/kernel';
import type { ObjectId } from 'mongodb';
import type { AuthCredentialView } from '../domain/types';
import type { AuthCredentialRepoPort } from '../domain/ports';

type AuthCredentialDoc = {
  _id?: string | ObjectId;
  userId: string;
  emailNorm: string;
  algo: 'scrypt';
  salt: string;
  hash: string;
  passwordChangedAt: Date;
  failedLogins: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const credCol = () => col<AuthCredentialDoc>(COLLECTIONS.AUTH_CREDENTIALS);

/**
 * Map MongoDB document to AuthCredentialView.
 * Centralizes the mapping logic and avoids repetitive type casting.
 */
function mapDocToView(doc: WithId<AuthCredentialDoc>): AuthCredentialView {
  return {
    id: String(doc._id),
    userId: doc.userId,
    emailNorm: doc.emailNorm,
    algo: doc.algo,
    salt: doc.salt,
    hash: doc.hash,
    passwordChangedAt: doc.passwordChangedAt,
    failedLogins: doc.failedLogins,
    lockedUntil: doc.lockedUntil ?? null,
  };
}

export const AuthCredentialRepoMongo: AuthCredentialRepoPort = {
  async findByEmailNorm(emailNorm: string): Promise<AuthCredentialView | null> {
    const doc = await credCol().findOne({ emailNorm });
    if (!doc) return null;
    return mapDocToView(doc);
  },
  async create(input) {
    const now = new Date();
    const doc: AuthCredentialDoc = {
      userId: input.userId,
      emailNorm: input.emailNorm,
      algo: input.algo,
      salt: input.salt,
      hash: input.hash,
      passwordChangedAt: now,
      failedLogins: 0,
      createdAt: now,
      updatedAt: now,
    };
    const r = await credCol().insertOne(doc);
    return {
      id: String(r.insertedId ?? ''),
      userId: input.userId,
      emailNorm: input.emailNorm,
      algo: 'scrypt',
      salt: input.salt,
      hash: input.hash,
      passwordChangedAt: now,
      failedLogins: 0,
      lockedUntil: null,
    };
  },
  async updatePassword(emailNorm, input) {
    const now = new Date();
    const builder = new UpdateBuilder<AuthCredentialDoc>()
      .set('algo', input.algo)
      .set('salt', input.salt)
      .set('hash', input.hash)
      .set('passwordChangedAt', now)
      .set('failedLogins', 0)
      .set('lockedUntil', null)
      .set('updatedAt', now);
    const result = await credCol().findOneAndUpdate(
      { emailNorm } as Filter<AuthCredentialDoc>,
      toMongoUpdate(builder.build()) as UpdateFilter<AuthCredentialDoc>,
      { returnDocument: 'after' }
    );
    // MongoDB driver returns the document directly or via .value depending on version
    const doc = (result as WithId<AuthCredentialDoc> | null) ?? null;
    if (!doc) return null;
    return mapDocToView(doc);
  },
  async recordFailedLoginAttempt(credId, opts = {}) {
    const lockOn = Math.max(1, Math.trunc(opts.lockOnCount ?? 5));
    const lockMs = Math.max(1, Math.trunc(opts.lockForMs ?? 10 * 60 * 1000));

    const current = await credCol().findOne({ _id: maybeObjectId(credId) });
    if (!current) return null;

    const nextFailed = (current.failedLogins ?? 0) + 1;
    const builder = new UpdateBuilder<AuthCredentialDoc>();
    const updates: Partial<AuthCredentialDoc> = {};
    if (nextFailed >= lockOn) {
      updates.lockedUntil = new Date(Date.now() + lockMs);
      updates.failedLogins = 0;
      builder.set('lockedUntil', updates.lockedUntil);
      builder.set('failedLogins', 0);
    } else {
      updates.failedLogins = nextFailed;
      builder.set('failedLogins', nextFailed);
    }

    await credCol().updateOne(
      { _id: maybeObjectId(credId) },
      toMongoUpdate(builder.build()) as UpdateFilter<AuthCredentialDoc>
    );

    // Merge updates with current document for return value
    const merged: WithId<AuthCredentialDoc> = {
      ...current,
      ...updates,
    };
    return mapDocToView(merged);
  },
  async resetFailedAttempts(credId: string) {
    const builder = new UpdateBuilder<AuthCredentialDoc>()
      .set('failedLogins', 0)
      .set('lockedUntil', null);
    await credCol().updateOne(
      { _id: maybeObjectId(credId) },
      toMongoUpdate(builder.build()) as UpdateFilter<AuthCredentialDoc>
    );
  },
};
