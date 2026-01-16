import { initFlagsSubscriber } from "@unisane/flags";
import { initSettingsSubscriber } from "@unisane/settings";
import { registerSettingDefinition } from "@unisane/kernel";
import { validateEnvOrThrow } from "./env";
import { registerEventSchemas } from "./events";
import { initCacheInvalidation } from "./cache-invalidation";
import { getAllDefinitions } from "@/src/config";

let initialized = false;

export function initModules() {
  if (initialized) return;
  initialized = true;

  // Validate environment variables at boot
  validateEnvOrThrow();

  // Register domain event schemas (must happen before handlers)
  registerEventSchemas();

  // Register setting definitions with the kernel registry
  // This allows getTypedSetting to find definition schemas and defaults
  const defs = getAllDefinitions();
  console.log(`[initModules] Registering ${defs.length} setting definitions...`);
  for (const def of defs) {
    // Map SaasKit visibility to kernel visibility
    // "tenant-ui" in SaasKit maps to "tenant" in kernel
    const kernelVisibility =
      def.visibility === "tenant-ui" ? "tenant" : def.visibility;

    registerSettingDefinition({
      namespace: def.namespace,
      key: def.key,
      visibility: kernelVisibility as "platform-only" | "tenant" | "user",
      scope: def.scope,
      schema: def.schema,
      defaultValue: def.defaultValue,
    });
    console.log(`[initModules]   - Registered ${def.namespace}:${def.key}`);
  }

  // Initialize cache invalidation subscribers
  initFlagsSubscriber();
  initSettingsSubscriber();

  // Initialize domain event cache invalidation handlers
  initCacheInvalidation();

  console.log("[initModules] Modules initialized");
}
