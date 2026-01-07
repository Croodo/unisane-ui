/**
 * Flags Domain Constants
 */

export const FLAGS_EVENTS = {
  FLAG_EVALUATED: 'flags.evaluated',
  OVERRIDE_SET: 'flags.override.set',
  OVERRIDE_REMOVED: 'flags.override.removed',
} as const;

export const FLAGS_DEFAULTS = {
  CACHE_TTL_MS: 60_000,
} as const;

export const FLAGS_COLLECTIONS = {
  FLAGS: 'flags',
  OVERRIDES: 'flag_overrides',
} as const;
