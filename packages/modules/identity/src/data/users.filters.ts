/**
 * User filter builders - Shared between queries and stats
 * Extracted for single responsibility and reusability
 *
 * Uses database-agnostic QueryBuilder pattern from @unisane/kernel
 */

import { QueryBuilder, toMongoFilter, softDeleteFilter } from "@unisane/kernel";

export type UserFilterArgs = {
  q?: string;
  email?: { eq?: string; contains?: string; in?: string[] };
  displayName?: { eq?: string; contains?: string };
  updatedAt?: { gte?: Date | string; lte?: Date | string };
};

/**
 * User entity type for QueryBuilder type safety.
 */
interface UserEntity {
  email: string;
  displayName: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Build a MongoDB filter document for user queries.
 * Applies soft-delete filter by default and supports:
 * - Full-text search (q) across email and displayName
 * - Email filters (exact, contains, in array)
 * - DisplayName filters (exact, contains)
 * - UpdatedAt range filters (gte, lte)
 */
export function buildUserFilter(args: {
  filters?: UserFilterArgs | undefined;
}): Record<string, unknown> {
  const query = new QueryBuilder<UserEntity>();

  // Apply soft-delete filter (deletedAt is null)
  query.whereNull("deletedAt");

  if (!args.filters) {
    return toMongoFilter(query.build());
  }

  const f = args.filters;

  // Full-text search across email and displayName using OR
  if (f.q && f.q.trim().length) {
    query.whereTextSearch(f.q.trim(), ["email", "displayName"]);
  }

  // Email filters (only one can apply - eq takes precedence)
  if (f.email?.eq) {
    query.whereEq("email", f.email.eq);
  } else if (f.email?.contains) {
    query.whereContains("email", f.email.contains);
  } else if (f.email?.in?.length) {
    query.whereIn("email", f.email.in);
  }

  // DisplayName filters
  if (f.displayName?.eq) {
    query.whereEq("displayName", f.displayName.eq);
  } else if (f.displayName?.contains) {
    query.whereContains("displayName", f.displayName.contains);
  }

  // UpdatedAt range filter
  if (f.updatedAt?.gte && f.updatedAt?.lte) {
    query.whereBetween(
      "updatedAt",
      new Date(f.updatedAt.gte),
      new Date(f.updatedAt.lte)
    );
  } else if (f.updatedAt?.gte) {
    query.whereGte("updatedAt", new Date(f.updatedAt.gte));
  } else if (f.updatedAt?.lte) {
    query.whereLte("updatedAt", new Date(f.updatedAt.lte));
  }

  // Build and convert to MongoDB filter
  const spec = query.build();
  const mongoFilter = toMongoFilter(spec);

  // Merge with soft-delete filter from kernel (for compatibility)
  return {
    ...softDeleteFilter(),
    ...mongoFilter,
  };
}
