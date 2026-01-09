import { getSettingDefinition } from "@unisane/kernel";
import { patchTypedSetting } from "./patchTyped";
import { patchSetting } from "./patch";
import { ERR } from "@unisane/gateway";
import type { PatchSettingWithPolicyArgs } from "../domain/types";

export type { PatchSettingWithPolicyArgs };

export async function patchSettingWithPolicy(args: PatchSettingWithPolicyArgs) {
  const def = getSettingDefinition(args.namespace, args.key);

  if (def) {
    if (def.visibility === "platform-only" && !args.actorIsSuperAdmin) {
      throw ERR.FORBID(
        "Platform-only settings can only be edited by platform admins"
      );
    }

    const { actorIsSuperAdmin: _ignored, ...rest } = args;
    return patchTypedSetting(rest);
  }

  // Unknown keys fall back to the generic path (no registry policy).
  const { actorIsSuperAdmin: _ignored, ...rest } = args;
  return patchSetting(rest);
}
