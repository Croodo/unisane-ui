import type { SettingRow, PatchResult } from './types';

export interface SettingsRepo {
  findOne(env: string, scopeId: string | null, ns: string, key: string): Promise<SettingRow | null>;
  upsertPatch(args: { env: string; scopeId: string | null; ns: string; key: string; value?: unknown; unset?: boolean; expectedVersion?: number; actorId?: string }): Promise<PatchResult>;
}
