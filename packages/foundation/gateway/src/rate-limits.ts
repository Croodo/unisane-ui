/**
 * Rate Limit Policies
 *
 * Defines rate limiting configurations for all API operations.
 * Used by the gateway middleware to enforce request limits.
 */
export const RATE_LIMIT_POLICIES = {
  // Auth and identity
  "auth.signOut": { max: 30, windowSec: 60 },
  "me.get": { max: 300, windowSec: 60 }, // Increased for polling/multi-tab
  "me.profile.get": { max: 60, windowSec: 60 },
  "me.profile.patch": { max: 20, windowSec: 60 },
  "auth.password.signup": { max: 10, windowSec: 60 }, // Slightly relaxed but still strict
  "auth.password.signin": { max: 20, windowSec: 60 },
  "auth.password.reset.start": { max: 5, windowSec: 60 },
  "auth.password.reset.verify": { max: 10, windowSec: 60 },
  // OAuth start/callback (per-IP; includes provider in key)
  "auth.oauth.start": { max: 30, windowSec: 60 },
  "auth.oauth.callback": { max: 60, windowSec: 60 },
  "auth.otp.start": { max: 5, windowSec: 60 },
  "auth.otp.verify": { max: 10, windowSec: 60 },
  "auth.phone.start": { max: 5, windowSec: 60 },
  "auth.phone.verify": { max: 10, windowSec: 60 },
  "auth.token.exchange": { max: 20, windowSec: 60 },
  "auth.csrf": { max: 120, windowSec: 60 }, // High for multi-tab
  "users.list": { max: 60, windowSec: 60 },
  "users.create": { max: 10, windowSec: 60 },
  "users.update": { max: 20, windowSec: 60 },
  "users.delete": { max: 10, windowSec: 60 },
  "users.sessions.revoke": { max: 10, windowSec: 60 },
  "users.usernameAvailable": { max: 60, windowSec: 60 },
  "users.phoneAvailable": { max: 60, windowSec: 60 },
  "notify.email": { max: 20, windowSec: 60 },
  "webhooks.listEvents": { max: 60, windowSec: 60 },
  "audit.list": { max: 60, windowSec: 60 },
  "billing.config": { max: 60, windowSec: 60 },
  "billing.listInvoices": { max: 60, windowSec: 60 },
  "billing.listPayments": { max: 60, windowSec: 60 },
  "billing.cancel": { max: 10, windowSec: 60 },
  "billing.refund": { max: 10, windowSec: 60 },
  "billing.changePlan": { max: 20, windowSec: 60 },
  "credits.ledger": { max: 60, windowSec: 60 },
  "credits.breakdown": { max: 60, windowSec: 60 },
  "settings.get": { max: 120, windowSec: 60 },
  "settings.patch": { max: 60, windowSec: 60 }, // Allow rapid toggles
  // Feature flags — admin/read heavy; safe higher reads, moderate writes
  "flags.patch": { max: 60, windowSec: 60 },
  "flags.list": { max: 120, windowSec: 60 },
  "flags.override.get": { max: 120, windowSec: 60 },
  "flags.override.set": { max: 60, windowSec: 60 },
  "flags.override.clear": { max: 60, windowSec: 60 },
  // User-level flag overrides
  "flags.userOverride.get": { max: 120, windowSec: 60 },
  "flags.userOverride.set": { max: 60, windowSec: 60 },
  "flags.userOverride.clear": { max: 60, windowSec: 60 },
  "flags.evaluate": { max: 120, windowSec: 60 },
  "inapp.list": { max: 60, windowSec: 60 },
  "inapp.markRead": { max: 60, windowSec: 60 },
  "inapp.markAllSeen": { max: 20, windowSec: 60 },
  "inapp.delete": { max: 60, windowSec: 60 },
  "inapp.deleteAll": { max: 10, windowSec: 60 },
  "inapp.unreadCount": { max: 120, windowSec: 60 },
  "flags.get": { max: 120, windowSec: 60 },
  "apikeys.create": { max: 20, windowSec: 60 },
  "apikeys.list": { max: 60, windowSec: 60 },
  "apikeys.revoke": { max: 20, windowSec: 60 },
  "memberships.getOne": { max: 60, windowSec: 60 },
  "memberships.list": { max: 60, windowSec: 60 },
  "memberships.listMine": { max: 60, windowSec: 60 },
  "memberships.addRole": { max: 20, windowSec: 60 },
  "memberships.grantPerm": { max: 20, windowSec: 60 },
  "memberships.removeRole": { max: 20, windowSec: 60 },
  "memberships.revokePerm": { max: 20, windowSec: 60 },
  "memberships.remove": { max: 20, windowSec: 60 },
  "billing.subscribe": { max: 10, windowSec: 60 },
  "billing.portal": { max: 20, windowSec: 60 },
  "billing.getSubscription": { max: 60, windowSec: 60 },
  "billing.changeQuantity": { max: 20, windowSec: 60 },
  "billing.topup": { max: 10, windowSec: 60 },
  "credits.grant": { max: 20, windowSec: 60 },
  "credits.burn": { max: 60, windowSec: 60 },
  "credits.balance": { max: 60, windowSec: 60 },
  "notify.preferences.get": { max: 60, windowSec: 60 },
  "notify.preferences.update": { max: 20, windowSec: 60 },
  "export.startExport": { max: 5, windowSec: 60 },
  "export.getStatus": { max: 60, windowSec: 60 },
  "usage.increment": { max: 120, windowSec: 60 },
  "import.start": { max: 5, windowSec: 60 },
  "webhooks.replayEvent": { max: 10, windowSec: 60 },
  "ai.generate": { max: 20, windowSec: 60 },
  // Demo: PDF render (credits-charged)
  "pdf.render": { max: 20, windowSec: 60 },
  "entitlements.get": { max: 120, windowSec: 60 },
  "tenants.create": { max: 10, windowSec: 60 },
  "tenants.findBySlug": { max: 60, windowSec: 60 },
  // New admin op naming (more permissive for admin tools)
  "admin.tenants.list": { max: 120, windowSec: 60 },
  "admin.users.list": { max: 120, windowSec: 60 },
  "admin.tenants.read": { max: 120, windowSec: 60 },
  "admin.users.read": { max: 120, windowSec: 60 },
  "admin.tenants.export": { max: 5, windowSec: 60 },
  "admin.users.export": { max: 5, windowSec: 60 },
  "admin.tenants.stats": { max: 120, windowSec: 60 },
  "admin.tenants.delete": { max: 5, windowSec: 60 },
  "admin.users.stats": { max: 120, windowSec: 60 },
  "admin.users.facets": { max: 120, windowSec: 60 },
  "admin.users.memberships": { max: 120, windowSec: 60 },
  // Admin job triggers (super-admin only)
  "admin.jobs.run": { max: 10, windowSec: 60 },
  // Admin outbox (DLQ)
  "admin.outbox.listDead": { max: 60, windowSec: 60 },
  "admin.outbox.requeueDead": { max: 20, windowSec: 60 },
  "admin.outbox.purgeDead": { max: 20, windowSec: 60 },
  "admin.outbox.requeueDeadAll": { max: 5, windowSec: 60 },
  "admin.outbox.purgeDeadAll": { max: 5, windowSec: 60 },
  // Analytics dashboard (admin-only, read-heavy)
  "analytics.dashboard": { max: 120, windowSec: 60 },
  // Owner-only destructive ops guard (perm: tenants.manage)
  "tenants.manage": { max: 10, windowSec: 60 },
  // Inbound provider webhooks (burst protection per provider path)
  "webhooks.in.stripe": { max: 120, windowSec: 60 },
  "webhooks.in.razorpay": { max: 120, windowSec: 60 },
  "webhooks.in.resend": { max: 120, windowSec: 60 },
  "webhooks.in.ses": { max: 120, windowSec: 60 },
  // Storage
  "storage.upload.request": { max: 30, windowSec: 60 },
  "storage.upload.confirm": { max: 60, windowSec: 60 },
  "storage.download": { max: 120, windowSec: 60 },
  "storage.delete": { max: 30, windowSec: 60 },
  "storage.list": { max: 60, windowSec: 60 },
  // Media processing (CPU intensive)
  "media.transform": { max: 10, windowSec: 60 },
  "media.optimize": { max: 20, windowSec: 60 },
  "media.avatar": { max: 60, windowSec: 60 },
  "media.variants": { max: 5, windowSec: 60 },
  // Admin settings
  "admin.settings.get": { max: 120, windowSec: 60 },
  "admin.settings.patch": { max: 60, windowSec: 60 },
  // Admin audit
  "admin.audit.list": { max: 120, windowSec: 60 },
} as const;

export type OpKey = keyof typeof RATE_LIMIT_POLICIES;

export function getRatePolicy(op: OpKey) {
  return RATE_LIMIT_POLICIES[op];
}
