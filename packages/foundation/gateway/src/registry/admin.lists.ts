import type { FieldDef } from './types';
import { usersAdminFieldRegistry } from './users.admin.fields';
import { tenantsAdminFieldRegistry } from './tenants.admin.fields';
// Use client-safe filter parsing (no kernel dependency)
import { parseFiltersParam } from '../query/filterParams.client';

// Local types used by facetsMap (these match the SDK response shapes)
type TenantsAdminStatsResponse = {
  facets?: { planId?: Record<string, number> };
};
type UsersAdminFacetsResponse = {
  roles?: Record<string, number>;
  hasRole?: { withRole: number; withoutRole: number };
};

// Single source of truth for admin list/grid metadata used by codegen.
// Paths map to the hooks tree (e.g., ['tenants','admin'] => hooks.tenants.admin.useListParams).
export type AdminListConfig = {
  id: string; // used for generated filenames (e.g., "admin.tenants")
  path: [string, string]; // hooks path (namespace/resource)
  hookName: string;
  defaultSort: string;
  defaultLimit: number;
  fieldsRegistry: Record<string, FieldDef>;
  mapFilters: (uiFilters: Record<string, unknown>, search?: string) => Record<string, unknown>;
  facetsOp?: string[]; // e.g. ['tenants','admin','facets']
  facetsMap?: (res: unknown) => Record<string, Record<string, number>>;
  deriveQuery?: (params: { cursor?: string | null; sort?: string | null; q?: string | null; filters?: string | Record<string, unknown> | null; limit?: number; defaults?: { sort?: string; limit?: number } }) => {
    query: Record<string, unknown>;
    uiFilters: Record<string, unknown>;
    search: string;
  };
};

// Helper function to safely get config by ID
function getConfigById(id: string): AdminListConfig {
  const config = adminListConfigs.find((c) => c.id === id);
  if (!config) {
    throw new Error(`Admin list config not found: ${id}. This is a bug - check adminListConfigs array.`);
  }
  return config;
}

// Helper function to map filters for tenants
function mapTenantsFilters(uiFilters: Record<string, unknown>, search?: string): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (typeof search === 'string' && search.trim()) {
    f.q = search.trim();
  }
  const planFilter = uiFilters['plan'];
  if (typeof planFilter === 'string' && planFilter.trim()) {
    const val = planFilter.trim();
    if (val === 'free') {
      // "free" includes explicit 'free', null, or missing
      f.planId = { in: ['free', null] };
      // Note: generic FilterSpec doesn't easily support "or missing",
      // but null usually matches missing in some Mongo contexts or we rely on data migration.
    } else {
      f.planId = { eq: val };
    }
  } else if (Array.isArray(planFilter) && planFilter.length) {
    if (planFilter.includes('free')) {
      f.planId = { in: [...planFilter, null] };
    } else {
      f.planId = { in: planFilter };
    }
  }
  return f;
}

// Helper function to map filters for users
function mapUsersFilters(uiFilters: Record<string, unknown>, search?: string): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (typeof search === 'string' && search.trim()) {
    f.q = search.trim();
  }
  const email = uiFilters['email'];
  if (typeof email === 'string' && email.trim()) {
    f.email = { contains: email.trim() };
  }
  const name = uiFilters['displayName'];
  if (typeof name === 'string' && name.trim()) {
    f.displayName = { contains: name.trim() };
  }
  const updated = uiFilters['updatedAt'] as { start?: string; end?: string } | undefined;
  if (updated?.start || updated?.end) {
    f.updatedAt = {
      ...(updated.start ? { gte: updated.start } : {}),
      ...(updated.end ? { lte: updated.end } : {}),
    };
  }
  return f;
}

export const adminListConfigs: AdminListConfig[] = [
  {
    id: 'admin.tenants',
    path: ['tenants', 'admin'],
    hookName: 'useAdminTenantsListParams',
    defaultSort: '-createdAt',
    defaultLimit: 50,
    fieldsRegistry: tenantsAdminFieldRegistry as Record<string, FieldDef>,
    mapFilters: mapTenantsFilters,
    facetsOp: ['tenants', 'admin', 'adminStats'],
    facetsMap: (res: unknown) => {
      const typed = res as TenantsAdminStatsResponse | null | undefined;
      const f: Record<string, Record<string, number>> = {};
      if (typed?.facets?.planId) f['planId'] = typed.facets.planId;
      return f;
    },
    deriveQuery: ({ cursor, sort, q, filters, limit, defaults }) => {
      const parsedFilters = typeof filters === 'string' ? parseFiltersParam(filters) : filters ?? {};
      const search = q ?? '';
      // Use the helper function directly instead of looking up config
      const filtersMapped = mapTenantsFilters(parsedFilters, search);
      const query: Record<string, unknown> = {
        limit: limit ?? defaults?.limit ?? 50,
        sort: sort ?? defaults?.sort ?? '-createdAt',
      };
      if (cursor) query.cursor = cursor;
      if (filtersMapped && Object.keys(filtersMapped).length > 0) query.filters = filtersMapped;
      return { query, uiFilters: parsedFilters, search };
    },
  },
  {
    id: 'admin.users',
    path: ['users', 'admin'],
    hookName: 'useAdminUsersListParams',
    defaultSort: '-updatedAt',
    defaultLimit: 25,
    fieldsRegistry: usersAdminFieldRegistry as Record<string, FieldDef>,
    mapFilters: mapUsersFilters,
    facetsOp: ['users', 'admin', 'facets'],
    facetsMap: (res: unknown) => {
      const typed = res as UsersAdminFacetsResponse | null | undefined;
      const f: Record<string, Record<string, number>> = {};
      if (typed?.roles) f['globalRole'] = typed.roles as Record<string, number>;
      if (typed?.hasRole) f['hasRole'] = { withRole: typed.hasRole.withRole, withoutRole: typed.hasRole.withoutRole } as Record<string, number>;
      return f;
    },
    deriveQuery: ({ cursor, sort, q, filters, limit, defaults }) => {
      const parsedFilters = typeof filters === 'string' ? parseFiltersParam(filters) : filters ?? {};
      const search = q ?? '';
      // Use the helper function directly instead of looking up config
      const filtersMapped = mapUsersFilters(parsedFilters, search);
      const query: Record<string, unknown> = {
        limit: limit ?? defaults?.limit ?? 50,
        sort: sort ?? defaults?.sort ?? '-updatedAt',
      };
      if (cursor) query.cursor = cursor;
      if (filtersMapped && Object.keys(filtersMapped).length > 0) query.filters = filtersMapped;
      return { query, uiFilters: parsedFilters, search };
    },
  },
];

// Export helper for external use (with proper error handling)
export { getConfigById };
