import { withTransaction, Slug, isDuplicateKeyError } from "@unisane/kernel";
import { getTenantsRepo } from "../providers";
import {
  usersRepository,
  membershipsRepository,
} from "../data/repo";
import { z } from "zod";

import type { CreateTenantForUserArgs } from "../domain/types";
export type { CreateTenantForUserArgs };

import type { FindTenantBySlugArgs } from "../domain/types";
export type { FindTenantBySlugArgs };

/**
 * IDEN-001 FIX: Zod schema for validating tenant data from repository.
 * Ensures type safety without unsafe casting.
 */
const ZTenantFromRepo = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().optional(),
  planId: z.string().nullable().optional(),
});

/**
 * TENT-001 FIX: Use retry loop with unique index to prevent slug race conditions.
 *
 * Previously, the code checked if slug exists then created, which could race.
 * Now uses a direct create attempt with retry on duplicate key errors.
 * The database unique index on slug ensures correctness.
 *
 * Max retries prevent infinite loops if something goes wrong.
 */
const MAX_SLUG_RETRIES = 10;

export async function createTenantForUser(args: CreateTenantForUserArgs) {
  const tenantsRepo = getTenantsRepo();
  const base = args.input.slug?.trim() || args.input.name.trim();
  const name = args.input.name.trim();

  // TENT-001 FIX: Start with suffix 0, increment on collision
  let suffix = 0;
  let slug = Slug.fromName(base).toString();
  let tenant: Awaited<ReturnType<typeof tenantsRepo.create>> | null = null;

  const run = async () => {
    // TENT-001 FIX: Retry loop that relies on unique index for correctness
    for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
      try {
        tenant = await tenantsRepo.create({ slug, name });
        break; // Success, exit the loop
      } catch (e) {
        if (isDuplicateKeyError(e)) {
          // Collision detected, try next suffix
          suffix += 1;
          slug = Slug.fromName(`${base}-${suffix}`).toString();
          continue;
        }
        // Non-duplicate error, rethrow
        throw e;
      }
    }

    if (!tenant) {
      throw new Error(`Failed to create tenant: could not find unique slug after ${MAX_SLUG_RETRIES} attempts`);
    }

    await membershipsRepository.addRole(tenant.id, args.userId, "owner");
    return tenant;
  };

  const t = await withTransaction(run);
  return {
    id: t.id,
    slug,
    name,
    plan: t.planId ?? "free",
  } as const;
}

export async function findTenantBySlug(args: FindTenantBySlugArgs) {
  const tenantsRepo = getTenantsRepo();
  const slug = String(args.slug ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return null;
  const t = await tenantsRepo.findBySlug(slug);
  if (!t) return null;

  // IDEN-001 FIX: Validate tenant data with Zod instead of unsafe casting
  const parseResult = ZTenantFromRepo.safeParse(t);
  if (!parseResult.success) {
    console.warn("[identity/tenants] Invalid tenant data from repository:", {
      slug,
      errors: parseResult.error.flatten().fieldErrors,
    });
    return null;
  }
  const tenant = parseResult.data;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name ?? "",
    plan: tenant.planId ?? "free",
  } as const;
}
