/**
 * Provider → local status mappers for subscriptions and payments.
 *
 * Re-exports mapping functions from kernel for backward compatibility.
 * New code should import directly from @unisane/kernel.
 */

export {
  mapStripeSubStatus,
  mapRazorpaySubStatus,
} from '@unisane/kernel';
