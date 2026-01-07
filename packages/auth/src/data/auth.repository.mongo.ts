import { col } from '@unisane/kernel';
import type { AuthCredentialView } from '../domain/types';
import type { AuthCredentialRepoPort } from '../domain/ports';
import { ObjectId } from 'mongodb';
import type { Document, Filter, UpdateFilter } from 'mongodb';
import { maybeObjectId } from '@unisane/kernel';

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

const credCol = () => col<AuthCredentialDoc>('authcredentials');

export const AuthCredentialRepoMongo: AuthCredentialRepoPort = {
  async findByEmailNorm(emailNorm: string): Promise<AuthCredentialView | null> {
    const row = await credCol().findOne({ emailNorm });
    if (!row) return null;
    const base: Record<string, unknown> = {
      id: String((row as { _id?: unknown })._id ?? ''),
      userId: String((row as { userId?: unknown }).userId ?? ''),
      emailNorm: (row as { emailNorm?: string }).emailNorm ?? emailNorm,
      algo: 'scrypt',
      salt: (row as { salt?: string }).salt ?? '',
      hash: (row as { hash?: string }).hash ?? '',
    };
    const pca = (row as { passwordChangedAt?: Date }).passwordChangedAt;
    if (pca) base.passwordChangedAt = pca;
    const fl = (row as { failedLogins?: number }).failedLogins;
    if (typeof fl === 'number') base.failedLogins = fl;
    const lu = (row as { lockedUntil?: Date | null }).lockedUntil;
    if (lu != null) base.lockedUntil = lu;
    return base as AuthCredentialView;
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
    const r = await credCol().findOneAndUpdate(
      { emailNorm } as Filter<AuthCredentialDoc>,
      { $set: { algo: input.algo, salt: input.salt, hash: input.hash, passwordChangedAt: now, failedLogins: 0, lockedUntil: null, updatedAt: now } } as UpdateFilter<AuthCredentialDoc>,
      { returnDocument: 'after' }
    );
    const doc = ((r as unknown as { value?: AuthCredentialDoc | null }).value ?? (r as unknown as AuthCredentialDoc | null)) ?? null;
    if (!doc) return null;
    const base: Record<string, unknown> = {
      id: String((doc as { _id?: unknown })._id ?? ''),
      userId: String((doc as { userId?: unknown }).userId ?? ''),
      emailNorm: (doc as { emailNorm?: string }).emailNorm ?? emailNorm,
      algo: 'scrypt',
      salt: (doc as { salt?: string }).salt ?? input.salt,
      hash: (doc as { hash?: string }).hash ?? input.hash,
    };
    const pca = (doc as { passwordChangedAt?: Date }).passwordChangedAt;
    if (pca) base.passwordChangedAt = pca;
    const fl = (doc as { failedLogins?: number }).failedLogins;
    if (typeof fl === 'number') base.failedLogins = fl;
    const lu = (doc as { lockedUntil?: Date | null }).lockedUntil;
    if (lu != null) base.lockedUntil = lu;
    return base as AuthCredentialView;
  },
  async recordFailed(credId, opts = {}) {
    const lockOn = Math.max(1, Math.trunc(opts.lockOnCount ?? 5));
    const lockMs = Math.max(1, Math.trunc(opts.lockForMs ?? 10 * 60 * 1000));

    const current = await credCol().findOne({ _id: maybeObjectId(credId) });
    if (!current) return null;
    const nextFailed = (current.failedLogins ?? 0) + 1;
    const updates: Partial<AuthCredentialDoc> = {};
    if (nextFailed >= lockOn) {
      updates.lockedUntil = new Date(Date.now() + lockMs);
      updates.failedLogins = 0;
    } else {
      updates.failedLogins = nextFailed;
    }

    await credCol().updateOne({ _id: maybeObjectId(credId) }, { $set: updates as unknown as UpdateFilter<AuthCredentialDoc> });
    const obj = { ...(current as unknown as Record<string, unknown>), ...(updates as unknown as Record<string, unknown>) } as Record<string, unknown>;
    const base: Record<string, unknown> = {
      id: String((obj._id as unknown) ?? ''),
      userId: String((obj.userId as unknown) ?? ''),
      emailNorm: String((obj.emailNorm as unknown) ?? ''),
      algo: 'scrypt',
      salt: String((obj.salt as unknown) ?? ''),
      hash: String((obj.hash as unknown) ?? ''),
    };
    const pca = obj.passwordChangedAt as Date | undefined;
    if (pca) base.passwordChangedAt = pca;
    const fl = obj.failedLogins as number | undefined;
    if (typeof fl === 'number') base.failedLogins = fl;
    const lu = obj.lockedUntil as Date | null | undefined;
    if (lu != null) base.lockedUntil = lu;
    return base as AuthCredentialView;
  },
  async clearFailures(credId: string) {
    await credCol().updateOne({ _id: maybeObjectId(credId) }, { $set: { failedLogins: 0, lockedUntil: null } } as UpdateFilter<AuthCredentialDoc>);
  },
};
