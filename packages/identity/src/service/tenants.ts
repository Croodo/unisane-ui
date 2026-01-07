import { withTransaction, toSlug, isDuplicateKeyError } from "@unisane/kernel";
import { getTenantsRepo } from "../providers";
import {
  usersRepository,
  membershipsRepository,
} from "../data/repo";

import type { CreateTenantForUserArgs } from "../domain/types";
export type { CreateTenantForUserArgs };

import type { FindTenantBySlugArgs } from "../domain/types";
export type { FindTenantBySlugArgs };

export async function createTenantForUser(args: CreateTenantForUserArgs) {
  const tenantsRepo = getTenantsRepo();
  const base = args.input.slug?.trim() || args.input.name.trim();
  let slug = toSlug(base);
  let n = 0;
  while (true) {
    const exists = await tenantsRepo.findBySlug(slug);
    if (!exists) break;
    n += 1;
    slug = toSlug(`${base}-${n}`);
  }
  const name = args.input.name.trim();

  const run = async () => {
    let t;
    try {
      t = await tenantsRepo.create({ slug, name });
    } catch (e) {
      // Handle race condition: another request created the same slug
      if (isDuplicateKeyError(e)) {
        let retrySlug = slug;
        let i = n;
        while (true) {
          i += 1;
          retrySlug = toSlug(`${base}-${i}`);
          const exists = await tenantsRepo.findBySlug(retrySlug);
          if (!exists) break;
        }
        t = await tenantsRepo.create({ slug: retrySlug, name });
        slug = retrySlug;
      } else {
        throw e;
      }
    }
    await membershipsRepository.addRole(t.id, args.userId, "owner");
    return t;
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
  return {
    id: t.id,
    slug: (t as { slug: string }).slug,
    name: (t as { name: string }).name,
    plan:
      ((t as { planId?: string | null }).planId as string | undefined) ??
      "free",
  } as const;
}
