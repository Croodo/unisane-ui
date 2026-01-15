import type { Filter } from "mongodb";
import type { FilterOp, FilterSpec } from "./types";

export function buildMongoFilter<T>(spec: FilterSpec<T>): Filter<T> {
  const filter: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(spec)) {
    if (value === undefined) continue;

    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      const op = value as FilterOp<unknown>;
      const mongoOp: Record<string, unknown> = {};

      if (op.eq !== undefined) mongoOp["$eq"] = op.eq;
      if (op.neq !== undefined) mongoOp["$ne"] = op.neq;
      if (op.in !== undefined) mongoOp["$in"] = op.in;
      if (op.nin !== undefined) mongoOp["$nin"] = op.nin;
      if (op.gt !== undefined) mongoOp["$gt"] = op.gt;
      if (op.gte !== undefined) mongoOp["$gte"] = op.gte;
      if (op.lt !== undefined) mongoOp["$lt"] = op.lt;
      if (op.lte !== undefined) mongoOp["$lte"] = op.lte;
      if (op.contains !== undefined)
        mongoOp["$regex"] = new RegExp(escapeRegex(op.contains), "i");
      if (op.startsWith !== undefined)
        mongoOp["$regex"] = new RegExp(`^${escapeRegex(op.startsWith)}`, "i");
      if (op.endsWith !== undefined)
        mongoOp["$regex"] = new RegExp(`${escapeRegex(op.endsWith)}$`, "i");

      if (Object.keys(mongoOp).length > 0) {
        filter[key] = mongoOp;
      }
    } else {
      // Direct equality
      filter[key] = value;
    }
  }

  return filter as Filter<T>;
}

/**
 * Escapes special regex characters in a string for safe use in MongoDB $regex queries.
 * This is the canonical implementation - import from here instead of duplicating.
 */
export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Standard soft delete filter for MongoDB queries.
 * Matches documents where deletedAt is null or doesn't exist.
 * Use this instead of reimplementing the $or clause in each repository.
 * Returns a fresh mutable object to satisfy MongoDB's Filter type.
 */
export function softDeleteFilter(): {
  $or: Array<{ deletedAt: null } | { deletedAt: { $exists: false } }>;
} {
  return {
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  };
}

