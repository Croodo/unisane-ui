export type SettingRow = {
  env: string;
  scopeId: string | null;
  namespace: string;
  key: string;
  value: unknown | null;
  version: number;
  updatedBy?: string;
  updatedAt?: Date;
};

export type PatchConflict = { conflict: true; expected: number };
export type PatchOk = {
  ok: true;
  setting: {
    env: string;
    namespace: string;
    key: string;
    value: unknown | null;
    version: number;
  };
};
export type PatchResult = PatchConflict | PatchOk;

export type PatchSettingArgs = {
  scopeId: string | null;
  namespace: string;
  key: string;
  value?: unknown;
  unset?: boolean;
  expectedVersion?: number;
  actorId?: string;
  env?: string;
};

export type GetSettingArgs = {
  scopeId: string | null;
  ns: string;
  key: string;
  env?: string;
};

export type PatchSettingWithPolicyArgs = PatchSettingArgs & {
  actorIsSuperAdmin?: boolean;
};
