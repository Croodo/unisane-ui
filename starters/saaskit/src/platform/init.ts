import { initFlagsSubscriber } from "@unisane/flags";
import { initSettingsSubscriber } from "@unisane/settings";
import { validateEnvOrThrow } from "./env";
import { registerEventSchemas } from "./events";
import { initCacheInvalidation } from "./cache-invalidation";

let initialized = false;

export function initModules() {
  if (initialized) return;
  initialized = true;

  // Validate environment variables at boot
  validateEnvOrThrow();

  // Register domain event schemas (must happen before handlers)
  registerEventSchemas();

  // Initialize cache invalidation subscribers
  initFlagsSubscriber();
  initSettingsSubscriber();

  // Initialize domain event cache invalidation handlers
  initCacheInvalidation();

  console.log("[initModules] Modules initialized");
}
