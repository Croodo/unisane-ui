import type { ZodType } from "zod";
import { getSetting } from "./read";
import { getSettingDefinition } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";

export async function getTypedSetting<T>(args: {
  scopeId: string | null;
  ns: string;
  key: string;
  env?: string;
}): Promise<{ value: T; version: number }> {
  const def = getSettingDefinition(args.ns, args.key);
  if (!def) throw ERR.validation("Unknown setting key");

  const raw = await getSetting({
    scopeId: args.scopeId,
    ns: args.ns,
    key: args.key,
    ...(args.env !== undefined ? { env: args.env } : {}),
  });

  const schema = def.schema as ZodType<T>;

  if (!raw) {
    const v = (def.defaultValue ?? schema.parse(undefined)) as T;
    return { value: v, version: 0 };
  }

  const value = schema.parse(raw.value) as T;
  return { value, version: raw.version };
}
