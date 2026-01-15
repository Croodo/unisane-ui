/**
 * Users Repository - MongoDB Implementation
 *
 * Core CRUD operations for the users collection.
 * Complex queries and enrichments are delegated to specialized modules:
 * - users.filters.ts - Filter builders (shared)
 * - users.queries.mongo.ts - Pagination & stats
 * - users.enrichments.mongo.ts - Cross-collection aggregations
 */

import {
  col,
  COLLECTIONS,
  softDeleteFilter,
  maybeObjectId,
  encryptField,
  decryptField,
  createSearchToken,
  parseEncryptionKey,
  newEntityId,
  toNativeId,
  UpdateBuilder,
  toMongoUpdate,
  type Collection,
  type GlobalRole,
} from "@unisane/kernel";
import type { ObjectId } from "mongodb";
import type {
  UserCreateInput,
  UserUpdateInput,
  UsersApi,
} from "../domain/types";

// Import specialized modules
import { usersQueriesMongo } from "./users.queries.mongo";
import { usersEnrichmentsMongo } from "./users.enrichments.mongo";

// Internal document type matching the users collection schema
type UserDoc = {
  _id: string | ObjectId;
  email: string;
  emailEncrypted?: string | null; // AES-256-GCM encrypted email
  emailSearchToken?: string | null; // HMAC-SHA256 token for lookups
  displayName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneEncrypted?: string | null; // AES-256-GCM encrypted phone
  phoneSearchToken?: string | null; // HMAC-SHA256 token for lookups
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  locale?: string | null;
  timezone?: string | null;
  globalRole?: GlobalRole | null;
  authUserId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  sessions?: Record<string, unknown>;
  sessionsRevokedAt?: Date | null;
  deletedBy?: string | null;
};

function usersCol(): Collection<UserDoc> {
  return col<UserDoc>(COLLECTIONS.USERS);
}

/**
 * Get the encryption key from environment
 * Returns null if DATA_ENCRYPTION_KEY is not configured (migration mode)
 */
function getEncryptionKey(): Buffer | null {
  const keyBase64 = process.env.DATA_ENCRYPTION_KEY;
  if (!keyBase64) {
    return null; // Encryption not yet enabled (migration phase)
  }
  return parseEncryptionKey(keyBase64);
}

// =============================================================================
// Core CRUD Operations
// =============================================================================

async function create(payload: UserCreateInput) {
  const now = new Date();
  const encryptionKey = getEncryptionKey();

  const doc: UserDoc = {
    _id: toNativeId(newEntityId()) as ObjectId,
    email: payload.email,
    emailEncrypted: encryptionKey ? encryptField(payload.email, encryptionKey) : null,
    emailSearchToken: encryptionKey ? createSearchToken(payload.email.toLowerCase(), encryptionKey) : null,
    displayName: payload.displayName ?? null,
    imageUrl: payload.imageUrl ?? null,
    username: payload.username ?? null,
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
    phone: payload.phone ?? null,
    phoneEncrypted: encryptionKey && payload.phone ? encryptField(payload.phone, encryptionKey) : null,
    phoneSearchToken: encryptionKey && payload.phone ? createSearchToken(payload.phone, encryptionKey) : null,
    emailVerified: null,
    phoneVerified: null,
    locale: payload.locale ?? null,
    timezone: payload.timezone ?? null,
    globalRole: payload.globalRole ?? null,
    authUserId: payload.authUserId ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await usersCol().insertOne(doc);
  return mapDocToRow(doc)!;
}

/** Map MongoDB document to domain row with id instead of _id */
function mapDocToRow(doc: UserDoc): UserRowMapped;
function mapDocToRow(doc: UserDoc | null): UserRowMapped | null;
function mapDocToRow(doc: UserDoc | null): UserRowMapped | null {
  if (!doc) return null;

  const encryptionKey = getEncryptionKey();

  // Decrypt PII fields if encryption is enabled
  let email = doc.email;
  let phone = doc.phone;

  if (encryptionKey) {
    // Prefer encrypted fields if available (post-migration)
    if (doc.emailEncrypted) {
      email = decryptField(doc.emailEncrypted, encryptionKey);
    }
    if (doc.phoneEncrypted) {
      phone = decryptField(doc.phoneEncrypted, encryptionKey);
    }
  }

  return {
    id: String(doc._id),
    email,
    displayName: doc.displayName,
    imageUrl: doc.imageUrl,
    username: doc.username,
    firstName: doc.firstName,
    lastName: doc.lastName,
    phone,
    emailVerified: doc.emailVerified,
    phoneVerified: doc.phoneVerified,
    locale: doc.locale,
    timezone: doc.timezone,
    globalRole: doc.globalRole,
    authUserId: doc.authUserId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
    deletedBy: doc.deletedBy,
    sessionsRevokedAt: doc.sessionsRevokedAt,
  };
}

type UserRowMapped = {
  id: string;
  email: string;
  displayName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  locale?: string | null;
  timezone?: string | null;
  globalRole?: GlobalRole | null;
  authUserId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  sessionsRevokedAt?: Date | null;
};

async function findByEmail(email: string) {
  const encryptionKey = getEncryptionKey();

  const query = encryptionKey
    ? {
        // Use searchToken for encrypted lookups (post-migration)
        emailSearchToken: createSearchToken(email.toLowerCase(), encryptionKey),
        ...softDeleteFilter(),
      }
    : {
        // Fall back to plaintext search (pre-migration)
        email,
        ...softDeleteFilter(),
      };

  const doc = await usersCol().findOne(query);
  return mapDocToRow(doc);
}

async function findByAuthUserId(authUserId: string) {
  const doc = await usersCol().findOne({
    authUserId,
    ...softDeleteFilter(),
  });
  return mapDocToRow(doc);
}

async function findByUsername(username: string) {
  const doc = await usersCol().findOne({
    username,
    ...softDeleteFilter(),
  });
  return mapDocToRow(doc);
}

async function findByPhone(phone: string) {
  const encryptionKey = getEncryptionKey();

  const query = encryptionKey
    ? {
        // Use searchToken for encrypted lookups (post-migration)
        phoneSearchToken: createSearchToken(phone, encryptionKey),
        ...softDeleteFilter(),
      }
    : {
        // Fall back to plaintext search (pre-migration)
        phone,
        ...softDeleteFilter(),
      };

  const doc = await usersCol().findOne(query);
  return mapDocToRow(doc);
}

async function findById(id: string) {
  const doc = await usersCol().findOne({
    _id: maybeObjectId(id),
    ...softDeleteFilter(),
  });
  return mapDocToRow(doc);
}

async function findByIds(ids: string[]) {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const objIds = uniqueIds.map(maybeObjectId);
  const docs = await usersCol()
    .find({
      _id: { $in: objIds },
      ...softDeleteFilter(),
    })
    .project({ _id: 1, email: 1, displayName: 1, imageUrl: 1, globalRole: 1 })
    .toArray();

  const map = new Map<
    string,
    {
      id: string;
      email: string;
      displayName?: string | null;
      imageUrl?: string | null;
      globalRole?: unknown | null;
    }
  >();

  for (const doc of docs) {
    map.set(String(doc._id), {
      id: String(doc._id),
      email: doc.email,
      displayName: doc.displayName ?? null,
      imageUrl: doc.imageUrl ?? null,
      globalRole: doc.globalRole ?? null,
    });
  }

  return map;
}

async function updateById(id: string, update: UserUpdateInput) {
  const encryptionKey = getEncryptionKey();
  const builder = new UpdateBuilder<UserDoc>();

  // Always set updatedAt
  builder.set("updatedAt", new Date());

  // Standard fields
  if ("email" in (update ?? {})) {
    builder.set("email", update!.email as string);
    // Also update encrypted fields if encryption is enabled
    if (encryptionKey && update!.email) {
      builder.set("emailEncrypted", encryptField(update!.email, encryptionKey));
      builder.set("emailSearchToken", createSearchToken(update!.email.toLowerCase(), encryptionKey));
    }
  }
  if ("displayName" in (update ?? {}))
    builder.set("displayName", update!.displayName ?? null);
  if ("imageUrl" in (update ?? {})) builder.set("imageUrl", update!.imageUrl ?? null);
  if ("username" in (update ?? {})) builder.set("username", update!.username ?? null);
  if ("firstName" in (update ?? {})) builder.set("firstName", update!.firstName ?? null);
  if ("lastName" in (update ?? {})) builder.set("lastName", update!.lastName ?? null);
  if ("phone" in (update ?? {})) {
    builder.set("phone", update!.phone ?? null);
    // Also update encrypted fields if encryption is enabled
    if (encryptionKey && update!.phone) {
      builder.set("phoneEncrypted", encryptField(update!.phone, encryptionKey));
      builder.set("phoneSearchToken", createSearchToken(update!.phone, encryptionKey));
    } else if (encryptionKey && !update!.phone) {
      // Clear encrypted fields if phone is removed
      builder.set("phoneEncrypted", null);
      builder.set("phoneSearchToken", null);
    }
  }
  if ("locale" in (update ?? {})) builder.set("locale", update!.locale ?? null);
  if ("timezone" in (update ?? {})) builder.set("timezone", update!.timezone ?? null);
  if ("globalRole" in (update ?? {}))
    builder.set("globalRole", update!.globalRole ?? null);
  if ("authUserId" in (update ?? {}))
    builder.set("authUserId", update!.authUserId ?? null);

  // Verification flags (system-set)
  const flagUpdate = update as Partial<
    Pick<UserDoc, "emailVerified" | "phoneVerified">
  >;
  if ("emailVerified" in (update ?? {}))
    builder.set("emailVerified", flagUpdate.emailVerified ?? null);
  if ("phoneVerified" in (update ?? {}))
    builder.set("phoneVerified", flagUpdate.phoneVerified ?? null);

  // Session management
  const updObj = update as Record<string, unknown> | null | undefined;
  if (updObj && Object.prototype.hasOwnProperty.call(updObj, "sessions")) {
    builder.set("sessions", (updObj as Record<string, unknown>).sessions as Record<string, unknown>);
  }
  if ("sessionsRevokedAt" in (update ?? {}))
    builder.set("sessionsRevokedAt", update!.sessionsRevokedAt ?? null);

  // Soft delete fields
  if ("deletedAt" in (update ?? {})) builder.set("deletedAt", update!.deletedAt ?? null);
  if ("deletedBy" in (update ?? {})) builder.set("deletedBy", update!.deletedBy ?? null);

  const r = await usersCol().findOneAndUpdate(
    { _id: maybeObjectId(id) },
    toMongoUpdate(builder.build()),
    { returnDocument: "after" }
  );

  // Support both driver return shapes: ModifyResult<T> with .value vs. direct doc
  const rUnknown = r as unknown;
  const hasValue = (rUnknown as { value?: unknown }).value !== undefined;
  const updated = (
    hasValue
      ? (rUnknown as { value: unknown }).value
      : (rUnknown as UserDoc | null)
  ) as UserDoc | null;

  return mapDocToRow(updated);
}

async function deleteById(id: string) {
  // Kept for completeness; service prefers soft-delete via updateById
  const res = await usersCol().deleteOne({ _id: maybeObjectId(id) });
  return { deletedCount: res.deletedCount ?? 0 };
}

// =============================================================================
// Composed Repository Export
// =============================================================================

/**
 * MongoDB Users Repository
 * Composes core CRUD with specialized query and enrichment modules.
 *
 * Structure:
 * - Core CRUD: create, find*, updateById, deleteById (~190 lines)
 * - Queries: listPaged, stats (from users.queries.mongo.ts)
 * - Enrichments: getMembershipsCount, etc. (from users.enrichments.mongo.ts)
 */
export const mongoUsersRepository: UsersApi = {
  // Core CRUD operations
  create,
  findByEmail,
  findByAuthUserId,
  findByUsername,
  findByPhone,
  findById,
  findByIds,
  updateById,
  deleteById,

  // Pagination & stats (from users.queries.mongo.ts)
  ...usersQueriesMongo,

  // Cross-collection enrichments (from users.enrichments.mongo.ts)
  ...usersEnrichmentsMongo,
};
