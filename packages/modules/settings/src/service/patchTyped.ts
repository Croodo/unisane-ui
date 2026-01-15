import { patchSetting } from "./patch";
import type { PatchSettingArgs } from "./patch";
import { getSettingDefinition } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";
import type { ZodTypeAny } from "zod";

export async function patchTypedSetting(args: PatchSettingArgs) {
  const def = getSettingDefinition(args.namespace, args.key);
  if (!def) {
    // If no definition is found, we cannot perform type validation.
    // We still allow the patch operation to proceed without type enforcement.
    return patchSetting(args);
  }

  // Scope enforcement: platform-scoped settings should not carry a scopeId.
  if (def.scope === "platform" && args.scopeId !== null) {
    throw ERR.forbidden("Platform settings cannot be patched at tenant scope");
  }

  // Parse/validate the value against the registry schema when provided.
  let nextArgs: PatchSettingArgs = args;
  if (args.value !== undefined) {
    const schema = def.schema as ZodTypeAny;
    const parsed = schema.parse(args.value);
    nextArgs = { ...args, value: parsed };
  }

  // Visibility enforcement is handled at the route/UI layer. Services only
  // enforce structural scope and shape here.

  return patchSetting(nextArgs);
}
