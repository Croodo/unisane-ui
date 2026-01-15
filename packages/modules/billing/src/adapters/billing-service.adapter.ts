/**
 * Billing Service Adapter
 *
 * Implementation of BillingServicePort for the billing module.
 * This adapter is registered at app bootstrap to allow other modules
 * to access billing functionality without direct coupling.
 */

import type { BillingServicePort, BillingProvider } from "@unisane/kernel";
import { getBillingMode } from "../service/mode";
import { assertActiveSubscriptionForCredits } from "../service/subscription";
import { findScopeIdByCustomer } from "../data/scope-integrations.repository";

/**
 * Billing service adapter implementation.
 */
export const billingServiceAdapter: BillingServicePort = {
  async getBillingMode() {
    return getBillingMode();
  },

  async assertActiveSubscriptionForCredits() {
    return assertActiveSubscriptionForCredits();
  },

  async findScopeIdByCustomer(provider: BillingProvider, customerId: string) {
    return findScopeIdByCustomer(provider, customerId);
  },
};
