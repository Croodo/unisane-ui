import {
  usersRepository,
  type UserCreateInput,
  type UserUpdateInput,
} from "../data/repo";
import type { GlobalRole } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import { logger } from "@unisane/gateway";
import type { SortField } from "@unisane/kernel";
import { Email, PhoneE164, Username, emitTypedReliable } from "@unisane/kernel";
import { DEFAULT_LOCALE } from "@unisane/kernel";
import { toUserDto } from "../domain/mappers";
import type { MinimalUserRow } from "../domain/types";
import { isDuplicateKeyError } from "@unisane/kernel";

type UserRecord = MinimalUserRow & { createdAt?: Date; updatedAt?: Date };

import type { ListUsersArgs } from "../domain/types";
export type { ListUsersArgs };

import type { UpdateUserArgs } from "../domain/types";
export type { UpdateUserArgs };

import type { DeleteUserArgs } from "../domain/types";
export type { DeleteUserArgs };

import type { RevokeSessionsArgs } from "../domain/types";
export type { RevokeSessionsArgs };

import type { UsernameAvailableArgs } from "../domain/types";
export type { UsernameAvailableArgs };

import type { PhoneAvailableArgs } from "../domain/types";
export type { PhoneAvailableArgs };

export async function createUser(args: {
  email: string;
  displayName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  locale?: string | null;
  timezone?: string | null;
}) {
  const normEmail = Email.create(args.email).toString();
  // Fast existence check to provide stable conflict behavior in tests and before unique index build
  const already = await usersRepository.findByEmail(normEmail);
  if (already) throw ERR.versionMismatch();
  const payload: UserCreateInput = { email: normEmail };
  if (args.displayName !== undefined)
    payload.displayName = args.displayName ?? null;
  if (args.imageUrl !== undefined) payload.imageUrl = args.imageUrl ?? null;
  if (args.username) payload.username = Username.create(args.username).toString();
  if (args.firstName !== undefined) payload.firstName = args.firstName ?? null;
  if (args.lastName !== undefined) payload.lastName = args.lastName ?? null;
  if (args.phone) payload.phone = PhoneE164.create(args.phone).toString();
  if (args.locale !== undefined) payload.locale = args.locale ?? null;
  if (payload.locale === undefined || payload.locale === null)
    payload.locale = DEFAULT_LOCALE;
  if (args.timezone !== undefined) payload.timezone = args.timezone ?? null;
  // Pre-check unique constraints when provided
  if (payload.username) {
    const byU = await usersRepository.findByUsername(payload.username);
    if (byU) throw ERR.versionMismatch();
  }
  if (payload.phone) {
    const byP = await usersRepository.findByPhone(payload.phone);
    if (byP) throw ERR.versionMismatch();
  }
  try {
    const doc = await usersRepository.create(payload);
    const record: UserRecord = {
      id: doc.id,
      email: doc.email,
      displayName: doc.displayName ?? null,
      imageUrl: doc.imageUrl ?? null,
    };
    return toUserDto(record);
  } catch (error) {
    if (isDuplicateKeyError(error)) throw ERR.versionMismatch();
    throw error;
  }
}

export async function updateUser(args: UpdateUserArgs) {
  const { userId, patch } = args;
  const update: UserUpdateInput = {};
  if (Object.prototype.hasOwnProperty.call(patch, "displayName")) {
    update.displayName = patch.displayName ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "imageUrl")) {
    update.imageUrl = patch.imageUrl ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "username")) {
    update.username = patch.username ? Username.create(patch.username).toString() : null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "firstName")) {
    update.firstName = patch.firstName ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "lastName")) {
    update.lastName = patch.lastName ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "phone")) {
    update.phone = patch.phone ? PhoneE164.create(patch.phone).toString() : null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "locale")) {
    update.locale = patch.locale ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "timezone")) {
    update.timezone = patch.timezone ?? null;
  }
  if (!Object.keys(update).length) return null;

  const doc = await usersRepository.updateById(userId, update);
  if (!doc) return null;
  return toUserDto(doc);
}

export async function ensureUserByEmail(
  email: string,
  displayName?: string,
  authUserId?: string
): Promise<string> {
  const norm = Email.create(email).toString();
  // Prefer a stable linkage when available
  if (authUserId) {
    const byAuth = await usersRepository.findByAuthUserId(authUserId);
    if (byAuth?.id) return byAuth.id;
  }
  const existing = await usersRepository.findByEmail(norm);
  if (existing?.id) {
    // Backfill authUserId if missing and provided
    if (authUserId && !existing.authUserId) {
      await usersRepository.updateById(existing.id, { authUserId });
    }
    return existing.id;
  }
  const created = await usersRepository.create({
    email: norm,
    ...(displayName ? { displayName } : {}),
    ...(authUserId ? { authUserId } : {}),
  });
  return created.id;
}

export async function listUsers(args: ListUsersArgs) {
  // Parse sort spec from CSV like "+email,-createdAt" with an allowlist
  const allowed: Record<string, string> = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    email: "email",
    displayName: "displayName",
    globalRole: "globalRole",
    _id: "_id",
  };
  const sortRaw = (args.sort ?? "-createdAt").trim();
  const parts = sortRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sortVec: SortField[] = [];
  for (const p of parts) {
    const order: 1 | -1 = p.startsWith("-") ? -1 : 1;
    const key = p.replace(/^[-+]/, "");
    const dbKey = allowed[key as keyof typeof allowed];
    if (!dbKey) continue;
    sortVec.push({ key: dbKey, order });
  }
  if (!sortVec.length) sortVec.push({ key: "createdAt", order: -1 });
  if (!sortVec.find((v) => v.key === "_id"))
    sortVec.push({ key: "_id", order: sortVec[0]!.order });

  const {
    items: docs,
    nextCursor,
    prevCursor,
  } = await usersRepository.listPaged({
    limit: args.limit,
    cursor: args.cursor ?? null,
    sortVec,
    projection: {
      email: 1,
      displayName: 1,
      imageUrl: 1,
      globalRole: 1,
      updatedAt: 1,
    },
    ...(args.filters ? { filters: args.filters } : {}),
  });
  const items = docs.map((u) => toUserDto(u));
  return {
    items,
    ...(nextCursor ? { nextCursor } : {}),
    ...(prevCursor ? { prevCursor } : {}),
  } as const;
}

export async function getUser(userId: string) {
  const doc = await usersRepository.findById(userId);
  if (!doc || doc.deletedAt) return null;
  return toUserDto(doc);
}

export async function isUsernameAvailable(
  args: UsernameAvailableArgs
): Promise<{ available: boolean }> {
  const username = Username.tryCreate(args.value);
  if (!username) return { available: false };
  const existing = await usersRepository.findByUsername(username.toString());
  return { available: !Boolean(existing) };
}

export async function isPhoneAvailable(
  args: PhoneAvailableArgs
): Promise<{ available: boolean }> {
  const phone = PhoneE164.tryCreate(args.value);
  if (!phone) return { available: false };
  const existing = await usersRepository.findByPhone(phone.toString());
  return { available: !Boolean(existing) };
}

export async function getUserGlobalRole(
  userId: string
): Promise<GlobalRole | null> {
  const doc = await usersRepository.findById(userId);
  const role = doc?.globalRole ?? null;
  if (role === "super_admin") return "super_admin";
  if (role === "support_admin") return "support_admin";
  return null;
}

/**
 * Delete User (Event-Driven)
 *
 * Soft-deletes the user (anonymizes PII) and emits `user.deleted` event.
 * Cascade cleanup is handled by event handlers:
 * - Identity: Soft-deletes memberships for this user
 *
 * Note: Sessions are revoked immediately as a security measure.
 */
export async function deleteUser(args: DeleteUserArgs) {
  const { userId, actorId, reason = 'admin_action' } = args;

  const existing = await usersRepository.findById(userId);
  if (!existing) return { deleted: false as const, cascadeStatus: 'none' as const };

  const anonEmail = `deleted+${getUserId(existing)}@deleted.local`;
  const update: UserUpdateInput = {
    // Anonymize to avoid unique email conflicts and strip PII
    email: anonEmail,
    displayName: null,
    imageUrl: null,
    globalRole: null,
    authUserId: null,
    // Mark deleted and revoke sessions
    sessionsRevokedAt: new Date(),
    deletedAt: new Date(),
    deletedBy: actorId ?? null,
  };
  const updated = await usersRepository.updateById(userId, update);

  if (!updated) {
    return { deleted: false as const, cascadeStatus: 'none' as const };
  }

  // Emit event for cascade handlers
  await emitTypedReliable('user.deleted', {
    userId,
    scopeId: undefined, // User deletion is cross-scope
    actorId,
    reason: reason as 'user_request' | 'admin_action' | 'gdpr_compliance' | 'inactive',
  });

  logger.info('user.deleted.initiated', {
    userId,
    actorId,
    reason,
    message: 'Cascade handlers will process async',
  });

  return { deleted: true as const, cascadeStatus: 'pending' as const };
}

export async function revokeSessions(args: RevokeSessionsArgs) {
  const { userId } = args;
  // Mark sessions as revoked by timestamp; enforcement depends on token validation strategy
  const patch: UserUpdateInput = { sessionsRevokedAt: new Date() };
  await usersRepository.updateById(userId, patch);
  return { revoked: true as const };
}

// --- Service functions for cross-module use (Auth module) ---

/**
 * Find a user by normalized email address.
 * Returns the user row or null if not found.
 */
export async function findUserByEmail(email: string) {
  const norm = Email.create(email).toString();
  const user = await usersRepository.findByEmail(norm);
  if (!user || user.deletedAt) return null;
  return user;
}

/**
 * Find a user by username.
 * Returns the user row or null if not found.
 */
export async function findUserByUsername(username: string) {
  const norm = Username.tryCreate(username);
  if (!norm) return null;
  const user = await usersRepository.findByUsername(norm.toString());
  if (!user || user.deletedAt) return null;
  return user;
}

/**
 * Find a user by phone number.
 * Returns the user row or null if not found.
 */
export async function findUserByPhone(phone: string) {
  const norm = PhoneE164.tryCreate(phone);
  if (!norm) return null;
  const user = await usersRepository.findByPhone(norm.toString());
  if (!user || user.deletedAt) return null;
  return user;
}

/**
 * Update a user by ID with partial data.
 * Returns the updated user or null if not found.
 */
export async function updateUserById(userId: string, update: UserUpdateInput) {
  const doc = await usersRepository.updateById(userId, update);
  if (!doc) return null;
  return doc;
}

/**
 * Get the raw user ID as string from a user row.
 */
export function getUserId(user: { id: string }): string {
  return user.id;
}
