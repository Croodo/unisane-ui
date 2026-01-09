/**
 * User filter builders - Shared between queries and stats
 * Extracted for single responsibility and reusability
 */

import { escapeRegex, softDeleteFilter } from "@unisane/kernel";

export type UserFilterArgs = {
  q?: string;
  email?: { eq?: string; contains?: string; in?: string[] };
  displayName?: { eq?: string; contains?: string };
  updatedAt?: { gte?: Date | string; lte?: Date | string };
};

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
  const baseFilter: Record<string, unknown> = {
    ...softDeleteFilter(),
  };

  if (!args.filters) return baseFilter;

  const f = args.filters;

  // Full-text search across email and displayName
  if (f.q && f.q.trim().length) {
    const needle = escapeRegex(f.q.trim());
    const existingAnd = (baseFilter["$and"] as unknown[] | undefined) ?? [];
    baseFilter["$and"] = [
      ...existingAnd,
      {
        $or: [
          { email: { $regex: needle, $options: "i" } },
          { displayName: { $regex: needle, $options: "i" } },
        ],
      },
    ];
  }

  // Email filters
  if (f.email?.eq) {
    baseFilter["email"] = f.email.eq;
  } else if (f.email?.contains) {
    baseFilter["email"] = {
      $regex: escapeRegex(f.email.contains),
      $options: "i",
    };
  } else if (f.email?.in?.length) {
    baseFilter["email"] = { $in: f.email.in };
  }

  // DisplayName filters
  if (f.displayName?.eq) {
    baseFilter["displayName"] = f.displayName.eq;
  } else if (f.displayName?.contains) {
    baseFilter["displayName"] = {
      $regex: escapeRegex(f.displayName.contains),
      $options: "i",
    };
  }

  // UpdatedAt range filter
  if (f.updatedAt?.gte || f.updatedAt?.lte) {
    const range: Record<string, unknown> = {};
    if (f.updatedAt.gte) range.$gte = new Date(f.updatedAt.gte);
    if (f.updatedAt.lte) range.$lte = new Date(f.updatedAt.lte);
    baseFilter["updatedAt"] = range;
  }

  return baseFilter;
}
