import type { AppEnv } from "@unisane/kernel";
import type { PlanId } from "@unisane/kernel";

export type EvaluateFlagsArgs = {
  env?: AppEnv;
  keys: string[];
  context: {
    tenantId?: string;
    userId?: string;
    email?: string;
    country?: string;
    plan?: string;
  };
};

export type EvalCtx = {
  plan?: PlanId;
  userId?: string;
  tenantId?: string;
  country?: string;
  email?: string;
  tenantTags?: string[];
  now?: Date;
};

export type FlagRow = {
  env: string;
  key: string;
  enabledDefault: boolean;
  rules: unknown[];
  snapshotVersion: number;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpsertConflict = { conflict: true; expected: number };
export type UpsertOk = { ok: true; flag: FlagRow | null };
export type UpsertResult = UpsertConflict | UpsertOk;

// Planned shape for granular overrides when implemented
export type OverrideRow = {
  env: string;
  key: string;
  scopeType: "tenant" | "user";
  scopeId: string;
  value: boolean;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetFlagArgs = {
  env: string;
  key: string;
};

export type GetFlagsArgs = {
  env: string;
  keys: string[];
};
