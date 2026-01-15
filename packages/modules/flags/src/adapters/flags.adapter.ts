/**
 * Flags Adapter
 *
 * Implementation of FlagsPort for the flags module.
 * This adapter is registered at app bootstrap to allow other modules
 * to check feature flags without direct coupling.
 */

import type { FlagsPort } from "@unisane/kernel";
import { isEnabledForScope } from "../service/overrides";

/**
 * Flags adapter implementation.
 */
export const flagsAdapter: FlagsPort = {
  async isEnabledForScope(args) {
    return isEnabledForScope(args);
  },
};
