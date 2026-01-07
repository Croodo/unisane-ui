/**
 * AI Cache Keys
 */

export const aiKeys = {
  completion: (hash: string) => `ai:completion:${hash}` as const,
  embedding: (hash: string) => `ai:embedding:${hash}` as const,
  rateLimit: (tenantId: string, provider: string) =>
    `ai:ratelimit:${tenantId}:${provider}` as const,
} as const;

export type AiKeyBuilder = typeof aiKeys;
