export const KV = {
  RL: 'rl:',            // rate limit buckets
  IDEM: 'idem:',        // idempotency snapshots
  IDEMLOCK: 'idemlock:',// short lock
  LOCK: 'lock:',        // generic (jobs)
  FLAG: 'flag:v1:',     // feature flag cache
  SETTING: 'setting:v1:', // settings cache
  PERMSET: 'permset:v1:', // cached permission sets
  PUBSUB: 'cfg-bus',      // config invalidation channel
  USAGE: 'usage:',        // minute buckets
  INAPP: 'inapp:',        // in-app pub channels: inapp:{tenant}:{user}
  WEBHOOK_IDEM: 'whidem:', // inbound webhook idempotency keys: whidem:{provider}:{eventId}
  ENTITLEMENTS: 'entitlements:v1:', // cached entitlements per tenant
  ANALYTICS: 'analytics:v1:', // analytics dashboard cache
} as const;
