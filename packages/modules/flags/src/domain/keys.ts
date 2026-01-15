/**
 * Flags Cache Keys
 */

import { KV } from '@unisane/kernel';
import type { FlagOverrideScope } from '@unisane/kernel';

export const flagsKeys = {
  flag: (flagKey: string) => `flags:${flagKey}` as const,
  override: (tenantId: string, flagKey: string) => `flags:override:${tenantId}:${flagKey}` as const,
  tenantOverrides: (tenantId: string) => `flags:overrides:${tenantId}` as const,
  /** Cache key for flag value by env */
  flagByEnv: (env: string, key: string) => `${KV.FLAG}${env}:${key}` as const,
  /** Cache key for flag override by scope */
  overrideByScope: (env: string, key: string, scopeType: FlagOverrideScope, scopeId: string) =>
    `${KV.FLAG}${env}:${key}:ovr:${scopeType}:${scopeId}` as const,
} as const;

export type FlagsKeyBuilder = typeof flagsKeys;
