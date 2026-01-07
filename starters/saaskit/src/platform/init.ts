import { initFlagsSubscriber } from "@/src/modules/flags/service/get";
import { initSettingsSubscriber } from "@/src/modules/settings/service/read";
import { validateEnvOrThrow } from "./env";

let initialized = false;

export function initModules() {
  if (initialized) return;
  initialized = true;

  // Validate environment variables at boot
  validateEnvOrThrow();

  // Initialize cache invalidation subscribers
  initFlagsSubscriber();
  initSettingsSubscriber();

  console.log("[initModules] Modules initialized");
}
