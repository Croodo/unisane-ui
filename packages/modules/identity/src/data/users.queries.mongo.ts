/**
 * User queries - Pagination and statistics
 * Complex read operations that don't modify data.
 */

import { col } from "@unisane/kernel";
import type { Collection, WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { seekPageMongoCollection } from "@unisane/kernel";
import type { SortField } from "@unisane/kernel";
import { runStatsAggregation } from "@unisane/kernel";
import { UserSchema } from "../domain/entity";
import { buildUserFilter, type UserFilterArgs } from "./users.filters";

// Internal document type matching the users collection schema
type UserDoc = {
  _id: string | ObjectId;
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
  globalRole?: string | null;
  authUserId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  sessions?: Record<string, unknown>;
  sessionsRevokedAt?: Date | null;
  deletedBy?: string | null;
};

function usersCol(): Collection<UserDoc> {
  return col<UserDoc>("users");
}

// Row type for list results
type UserListRow = {
  id: string;
  email: string;
  displayName?: string | null;
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * List users with cursor-based pagination.
 * Supports sorting by multiple fields and filtering.
 */
export async function listPaged(args: {
  limit: number;
  cursor?: string | null;
  sortVec: SortField[];
  projection?: Record<string, 0 | 1>;
  filters?: UserFilterArgs | undefined;
}): Promise<{
  items: UserListRow[];
  nextCursor?: string;
  prevCursor?: string;
}> {
  // Ensure projection includes all sort keys + _id for cursor stability
  const enforcedProj: Record<string, 0 | 1> = {
    ...(args.projection ?? {}),
  };
  for (const f of args.sortVec) enforcedProj[f.key] = 1;
  enforcedProj._id = 1;

  // Use shared filter builder (SSOT)
  const baseFilter = buildUserFilter(args);

  const { items, nextCursor, prevCursor } = await seekPageMongoCollection<
    UserDoc,
    UserListRow
  >({
    collection: usersCol(),
    sortVec: args.sortVec,
    limit: Math.min(args.limit, 500),
    cursor: args.cursor ?? null,
    baseFilter,
    projection: enforcedProj,
    map: (u: WithId<UserDoc>) => ({
      id: String(u._id),
      email: u.email,
      displayName: u.displayName ?? null,
      imageUrl: u.imageUrl ?? null,
      createdAt: u.createdAt ?? new Date(),
      updatedAt: u.updatedAt ?? u.createdAt ?? new Date(),
    }),
  });

  return {
    items,
    ...(nextCursor ? { nextCursor } : {}),
    ...(prevCursor ? { prevCursor } : {}),
  };
}

/**
 * Get user statistics with facets.
 * Used for admin dashboard and list headers.
 */
export async function stats(args: {
  filters?: UserFilterArgs | undefined;
}): Promise<{
  total: number;
  facets: Record<string, Record<string, number>>;
}> {
  const filter = buildUserFilter(args);
  return runStatsAggregation(usersCol(), filter, UserSchema);
}

/**
 * Aggregated query functions for UsersApi interface.
 * Import this object and spread into the main repository.
 */
export const usersQueriesMongo = {
  listPaged,
  stats,
};
