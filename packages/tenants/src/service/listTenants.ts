/**
 * List Tenants
 *
 * List tenants with pagination.
 * Note: This is an admin operation - doesn't use ctx.get() as it lists all tenants.
 */

import { TenantsRepo } from "../data/tenants.repository";

/**
 * List tenants with pagination.
 * Note: This is an admin operation - doesn't use ctx.get() as it lists all tenants.
 */
export async function listTenants(args: {
  limit: number;
  cursor?: string | null;
  sort?: string;
}) {
  const input: { limit: number; cursor?: string | null; sort?: string } = {
    limit: args.limit,
  };
  if (typeof args.cursor !== "undefined") input.cursor = args.cursor ?? null;
  if (typeof args.sort !== "undefined") input.sort = args.sort;
  return TenantsRepo.listPaged(input);
}
