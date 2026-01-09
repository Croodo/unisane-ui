// Centralized ID prefixes for public identifiers
export const ID_PREFIX = {
  TENANT: 't_',
  USER: 'u_',
  API_KEY: 'ak_',
} as const;

export type IdPrefixKey = keyof typeof ID_PREFIX;
export type IdPrefix = (typeof ID_PREFIX)[IdPrefixKey];

