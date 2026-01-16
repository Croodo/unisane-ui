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
  /**
   * AUTH-003 FIX: Use atomic findOneAndUpdate to prevent race condition.
   *
   * Previously, this function used find + update which could cause lost updates
   * when multiple failed login attempts occurred concurrently.
   *
   * Now uses a two-phase approach:
   * 1. Atomically increment failedLogins and return the updated document
   * 2. If threshold reached, atomically set lock and reset counter
   */
  async recordFailedLoginAttempt(credId, opts = {}) {
    const lockOn = Math.max(1, Math.trunc(opts.lockOnCount ?? 5));
    const lockMs = Math.max(1, Math.trunc(opts.lockForMs ?? 10 * 60 * 1000));

    // AUTH-003 FIX: Atomically increment failed login count
    const incrementResult = await credCol().findOneAndUpdate(
      { _id: maybeObjectId(credId) } as Filter<AuthCredentialDoc>,
      {
        $inc: { failedLogins: 1 },
        $set: { updatedAt: new Date() },
      } as UpdateFilter<AuthCredentialDoc>,
      { returnDocument: 'after' }
    );

    const doc = incrementResult as WithId<AuthCredentialDoc> | null;
    if (!doc) return null;

    // Check if we've reached the lock threshold
    if (doc.failedLogins >= lockOn) {
      // AUTH-003 FIX: Atomically set lock and reset counter
      // Use conditional update to prevent race with concurrent requests
      const lockResult = await credCol().findOneAndUpdate(
        {
          _id: maybeObjectId(credId),
          failedLogins: { $gte: lockOn }, // Only lock if still at/above threshold
        } as Filter<AuthCredentialDoc>,
        {
          $set: {
            lockedUntil: new Date(Date.now() + lockMs),
            failedLogins: 0,
            updatedAt: new Date(),
          },
        } as UpdateFilter<AuthCredentialDoc>,
        { returnDocument: 'after' }
      );

      const lockedDoc = lockResult as WithId<AuthCredentialDoc> | null;
      if (lockedDoc) {
        return mapDocToView(lockedDoc);
      }
    }

    return mapDocToView(doc);
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
