// Usage constants - UsageWindow is exported from ./time.ts
export const USAGE_RESOURCE_TYPES = ['api', 'storage', 'compute'] as const;
export type UsageResourceType = (typeof USAGE_RESOURCE_TYPES)[number];

