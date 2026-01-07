/**
 * Media Cache Keys
 */

export const mediaKeys = {
  media: (mediaId: string) => `media:${mediaId}` as const,
  tenantMedia: (tenantId: string) => `media:tenant:${tenantId}` as const,
} as const;

export type MediaKeyBuilder = typeof mediaKeys;
