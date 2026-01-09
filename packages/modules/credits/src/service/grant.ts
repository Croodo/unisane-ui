import { getTenantId, redis, events } from '@unisane/kernel';
import { creditsKeys } from '../domain/keys';
import { CREDITS_EVENTS } from '../domain/constants';
import { findByIdem, insertGrant } from '../data/credits.repository';

export type GrantCreditsArgs = {
  amount: number;
  reason: string;
  idem: string;
  expiresAt?: Date | null;
};

export async function grant(args: GrantCreditsArgs) {
  const tenantId = getTenantId();
  const lock = await redis.set(creditsKeys.idemLock(tenantId, args.idem), '1', { NX: true, PX: 10_000 });
  if (!lock) return { ok: true as const, deduped: true as const };
  try {
    const exists = await findByIdem(tenantId, args.idem);
    if (exists) return { ok: true as const, deduped: true as const };
    const created = await insertGrant({
      tenantId,
      amount: args.amount,
      reason: args.reason,
      idemKey: args.idem,
      ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
    });
    await events.emit(CREDITS_EVENTS.GRANTED, {
      tenantId,
      amount: args.amount,
      reason: args.reason,
      id: created.id,
    });
    return { ok: true as const, id: created.id };
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: number }).code === 11000) {
      return { ok: true as const, deduped: true as const };
    }
    throw e;
  } finally {
    // Let the short TTL expire naturally to reduce stampedes
  }
}
