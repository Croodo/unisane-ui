import type { TenantRow, LatestSub } from './types';
import type { FilterSpec } from '@unisane/kernel';

export type TenantFilter = FilterSpec<TenantRow> & {
  q?: string;
};

export type DeleteTenantCascadeResult = {
  deleted: boolean;
  cascade: {
    apiKeysRevoked: number;
    membershipsDeleted: number;
    storageFilesMarked: number;
  };
};

export interface TenantsRepoPort {
  countAll(): Promise<number>;
  findById(id: string): Promise<TenantRow | null>;
  findBySlug(slug: string): Promise<TenantRow | null>;
  create(input: { slug: string; name: string; planId?: string | null }): Promise<TenantRow>;
  // Batch fetch basic tenant rows by ids
  findMany(ids: string[]): Promise<TenantRow[]>;
  // Minimal update helpers used by cross-module services
  setPlanId(scopeId: string, planId: string): Promise<void>;
  // Admin-only: cascade soft-delete tenant and related access state
  deleteCascade(args: { scopeId: string; actorId?: string }): Promise<DeleteTenantCascadeResult>;
  // Admin-only listing with seek pagination (server components)
  listPaged(args: {
    limit: number;
    cursor?: string | null;
    sort?: string;
    // Optional DB-level filters on base fields only
    filters?: TenantFilter;
  }): Promise<{ items: TenantRow[]; nextCursor?: string; prevCursor?: string }>;
  // Stats endpoint for total count and facets
  stats(args: {
    filters?: TenantFilter;
  }): Promise<{
    total: number;
    facets: Record<string, Record<string, number>>;
  }>;


}
