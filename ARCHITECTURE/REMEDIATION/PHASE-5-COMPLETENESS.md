# Phase 5: Completeness

> **For LLMs**: This phase completes missing features and improves system robustness.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete (8/8) |
| **Duration** | Week 7-8 |
| **Dependencies** | Phase 0, 1, 2, 3, 4 complete |
| **Issues Addressed** | P2-MISS-*, P2-SEC-002, P2-REL-001, P2-REL-002 |

---

## Issues in Scope

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| P2-MISS-002 | Email preferences not implemented | 🟡 Medium | ✅ |
| P2-MISS-003 | Phone SMS integration TODO | 🟡 Medium | ✅ |
| P2-MISS-004 | Tenant status field missing | 🟡 Medium | ✅ |
| P2-SEC-002 | Regex-based HTML sanitization | 🟡 Medium | ✅ |
| P2-REL-001 | Fixed window rate limiting | 🟡 Medium | ✅ |
| P2-REL-002 | No graceful degradation for KV | 🟡 Medium | ✅ |
| P2-BUG-003 | SSE no reconnection guidance | 🟡 Medium | ✅ |
| P2-REL-004 | Random signing secret (local storage) | 🟡 Medium | ✅ |

### Implementation Summary (2025-01-16)

- **P2-SEC-002**: HTML sanitization now uses DOMPurify (`kernel/src/security/sanitize.ts`)
- **P2-REL-004**: Local storage signing secret persisted to file (`storage-local/src/index.ts`)
- **P2-BUG-003**: SSE reconnection with Last-Event-ID support (`inapp/stream/route.ts`)
- **P2-MISS-004**: Tenant status field with suspend/activate (`tenants/src/service/update-tenant-status.ts`)
- **P2-REL-001**: Token bucket rate limiting (`gateway/src/middleware/rateLimit.ts`)
- **P2-REL-002**: Resilient cache with fallback (`kernel/src/cache/resilient.ts`)
- **P2-MISS-002**: Email preferences with opt-out (`notify/src/service/prefs.ts`, `email.ts`)
- **P2-MISS-003**: SMS port interface (`kernel/src/sms/port.ts`)

**Total Estimated**: 72 hours

---

## Task 1: Implement Email Preferences (P2-MISS-002)

### Problem

**File**: `packages/modules/notify/src/service/email.ts:29`

Users cannot opt out of marketing emails. System emails (auth, password reset) should bypass preferences.

### Solution

Implement category-based email preferences with opt-out support.

### Checklist

```markdown
### 1.1 Define Email Categories
- [ ] Create category types:
      ```typescript
      // packages/modules/notify/src/types.ts
      export type EmailCategory =
        | 'system'           // Auth, password reset, security - cannot opt out
        | 'transactional'    // Receipts, invoices - cannot opt out
        | 'product'          // Feature updates, tips - can opt out
        | 'marketing'        // Promotions, newsletters - can opt out
        | 'digest';          // Weekly summaries - can opt out

      export const OPT_OUT_ALLOWED: EmailCategory[] = ['product', 'marketing', 'digest'];

      export interface EmailPreferences {
        userId: string;
        optedOut: EmailCategory[];
        updatedAt: Date;
      }
      ```

### 1.2 Create Preferences Repository
- [ ] Add preferences storage:
      ```typescript
      // packages/modules/notify/src/repository/preferences.ts
      export const emailPreferencesRepository = createMongoRepository<
        EmailPreferencesDocument,
        EmailPreferences
      >({
        collectionName: 'email_preferences',
        indexes: [
          { fields: { userId: 1 }, options: { unique: true } },
        ],
      });
      ```

### 1.3 Create Preferences API
- [ ] Get preferences:
      ```typescript
      // packages/modules/notify/src/service/preferences.ts
      export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
        const prefs = await emailPreferencesRepository.findByUserId(userId);
        return prefs ?? { userId, optedOut: [], updatedAt: new Date() };
      }
      ```

- [ ] Update preferences:
      ```typescript
      export async function updateEmailPreferences(
        userId: string,
        optOut: EmailCategory[],
        optIn: EmailCategory[]
      ): Promise<EmailPreferences> {
        // Validate categories
        for (const cat of [...optOut, ...optIn]) {
          if (!OPT_OUT_ALLOWED.includes(cat)) {
            throw ERR.validation(`Cannot change preference for category: ${cat}`);
          }
        }

        const current = await getEmailPreferences(userId);
        const newOptedOut = new Set(current.optedOut);

        for (const cat of optOut) newOptedOut.add(cat);
        for (const cat of optIn) newOptedOut.delete(cat);

        const updated = await emailPreferencesRepository.upsert(
          { userId },
          { userId, optedOut: Array.from(newOptedOut), updatedAt: new Date() }
        );

        return updated;
      }
      ```

### 1.4 Update Email Sending
- [ ] Check preferences before sending:
      ```typescript
      // packages/modules/notify/src/service/email.ts
      export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
        const { category = 'transactional' } = input;

        // System emails bypass all checks
        if (category !== 'system') {
          // Check suppression list
          const suppressed = await isSuppressed(input.to.email, input.scopeId ?? null);
          if (suppressed) {
            return { sent: false, reason: 'suppressed' };
          }

          // Check preferences
          if (input.userId && OPT_OUT_ALLOWED.includes(category)) {
            const prefs = await getEmailPreferences(input.userId);
            if (prefs.optedOut.includes(category)) {
              return { sent: false, reason: 'opted_out', category };
            }
          }
        }

        // Proceed with sending...
      }
      ```

### 1.5 Add Unsubscribe Links
- [ ] Generate unsubscribe tokens:
      ```typescript
      export function generateUnsubscribeToken(
        userId: string,
        category: EmailCategory
      ): string {
        const payload = { userId, category, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
        return jwt.sign(payload, UNSUBSCRIBE_SECRET);
      }

      export function generateUnsubscribeUrl(
        userId: string,
        category: EmailCategory
      ): string {
        const token = generateUnsubscribeToken(userId, category);
        return `${BASE_URL}/unsubscribe?token=${token}`;
      }
      ```

- [ ] Add to email templates:
      ```html
      <a href="{{unsubscribeUrl}}">Unsubscribe from these emails</a>
      ```

### 1.6 Create Unsubscribe Endpoint
- [ ] One-click unsubscribe:
      ```typescript
      // GET /unsubscribe?token=xxx
      export async function GET(req: NextRequest) {
        const token = req.nextUrl.searchParams.get('token');
        const { userId, category } = verifyUnsubscribeToken(token);

        await updateEmailPreferences(userId, [category], []);

        return new Response('You have been unsubscribed.', {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      ```

### 1.7 Add Contract Endpoints
- [ ] GET /api/rest/v1/me/email-preferences
- [ ] PATCH /api/rest/v1/me/email-preferences

### 1.8 Add Tests
- [ ] Test: System emails always sent
- [ ] Test: Opted-out marketing emails not sent
- [ ] Test: Unsubscribe link works
- [ ] Test: Cannot opt out of system emails
```

---

## Task 2: Implement SMS Integration (P2-MISS-003)

### Problem

**File**: `packages/modules/auth/src/service/phoneStart.ts`

Phone verification exists but SMS sending is not implemented.

### Solution

Create SMS adapter port and implement with Twilio.

### Checklist

```markdown
### 2.1 Create SMS Port
- [ ] Define SMS port interface:
      ```typescript
      // packages/foundation/kernel/src/ports/sms.ts
      export interface SmsPort {
        send(message: SmsMessage): Promise<SmsResult>;
        getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
      }

      export interface SmsMessage {
        to: string;          // E.164 format: +1234567890
        body: string;
        from?: string;       // Optional sender ID
      }

      export interface SmsResult {
        success: boolean;
        messageId?: string;
        error?: string;
      }

      export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
      ```

### 2.2 Create Twilio Adapter
- [ ] Implement Twilio adapter:
      ```typescript
      // packages/adapters/sms-twilio/src/index.ts
      import twilio from 'twilio';

      const ZTwilioConfig = z.object({
        accountSid: z.string().startsWith('AC'),
        authToken: z.string().min(1),
        fromNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
      });

      export function createTwilioAdapter(config: unknown): SmsPort {
        const { accountSid, authToken, fromNumber } = ZTwilioConfig.parse(config);
        const client = twilio(accountSid, authToken);

        return {
          async send(message) {
            try {
              const result = await client.messages.create({
                to: message.to,
                from: message.from ?? fromNumber,
                body: message.body,
              });

              return {
                success: true,
                messageId: result.sid,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          },

          async getDeliveryStatus(messageId) {
            const message = await client.messages(messageId).fetch();
            return mapTwilioStatus(message.status);
          },
        };
      }
      ```

### 2.3 Create AWS SNS Adapter (Alternative)
- [ ] Implement SNS adapter:
      ```typescript
      // packages/adapters/sms-sns/src/index.ts
      import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

      export function createSnsAdapter(config: SnsConfig): SmsPort {
        const client = new SNSClient({ region: config.region });

        return {
          async send(message) {
            const command = new PublishCommand({
              PhoneNumber: message.to,
              Message: message.body,
            });

            const result = await client.send(command);

            return {
              success: true,
              messageId: result.MessageId,
            };
          },

          async getDeliveryStatus() {
            // SNS doesn't support delivery status lookup
            return 'sent';
          },
        };
      }
      ```

### 2.4 Update Phone Verification
- [ ] Connect SMS sending:
      ```typescript
      // packages/modules/auth/src/service/phoneStart.ts
      import { getSmsProvider } from '@unisane/kernel';

      export async function startPhoneVerification(phone: string) {
        const code = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store verification code
        await phoneVerificationRepository.create({
          phone: Phone.create(phone).toString(),
          code,
          expiresAt,
          attempts: 0,
        });

        // Send SMS
        const sms = getSmsProvider();
        const result = await sms.send({
          to: phone,
          body: `Your verification code is: ${code}. It expires in 10 minutes.`,
        });

        if (!result.success) {
          throw ERR.external('Failed to send verification SMS');
        }

        return { sent: true, expiresAt };
      }
      ```

### 2.5 Add Rate Limiting
- [ ] Limit SMS per phone number:
      ```typescript
      const SMS_RATE_LIMITS = {
        perPhone: { window: 3600_000, max: 5 },   // 5 per hour per phone
        perUser: { window: 86400_000, max: 10 },  // 10 per day per user
      };

      async function checkSmsRateLimit(phone: string, userId?: string) {
        const phoneKey = `sms:phone:${phone}`;
        const phoneCount = await kv.incr(phoneKey);
        if (phoneCount === 1) await kv.expire(phoneKey, 3600);

        if (phoneCount > SMS_RATE_LIMITS.perPhone.max) {
          throw ERR.rateLimit('Too many SMS requests to this phone number');
        }

        // Similar for userId...
      }
      ```

### 2.6 Add Configuration
- [ ] Update bootstrap:
      ```typescript
      // starters/saaskit/src/bootstrap.ts
      async function setupSmsProvider() {
        const { SMS_PROVIDER, TWILIO_ACCOUNT_SID } = getEnv();

        if (SMS_PROVIDER === 'twilio' || TWILIO_ACCOUNT_SID) {
          const adapter = createTwilioAdapter({
            accountSid: TWILIO_ACCOUNT_SID,
            authToken: getEnv().TWILIO_AUTH_TOKEN,
            fromNumber: getEnv().TWILIO_FROM_NUMBER,
          });
          configureSmsProvider(adapter);
        }
      }
      ```

### 2.7 Add Tests
- [ ] Test: SMS sent successfully
- [ ] Test: Rate limiting enforced
- [ ] Test: Verification code validated
- [ ] Test: Expired code rejected
```

---

## Task 3: Add Tenant Status Field (P2-MISS-004)

### Problem

Tenants don't have active/suspended/deleted status, making it impossible to disable access without deleting.

### Solution

Add status field with enforcement in middleware.

### Checklist

```markdown
### 3.1 Update Tenant Schema
- [ ] Add status field:
      ```typescript
      // packages/modules/tenants/src/types.ts
      export type TenantStatus = 'active' | 'suspended' | 'deleted';

      export interface Tenant {
        id: string;
        name: string;
        slug: string;
        status: TenantStatus;
        statusReason?: string;
        statusChangedAt?: Date;
        statusChangedBy?: string;
        // ... existing fields
      }
      ```

### 3.2 Add Migration
- [ ] Set default status for existing tenants:
      ```typescript
      // migrations/add-tenant-status.ts
      export async function up(db: Db) {
        await db.collection('tenants').updateMany(
          { status: { $exists: false } },
          { $set: { status: 'active' } }
        );

        await db.collection('tenants').createIndex({ status: 1 });
      }
      ```

### 3.3 Add Status Change API
- [ ] Create status update service:
      ```typescript
      // packages/modules/tenants/src/service/status.ts
      export async function updateTenantStatus(args: {
        tenantId: string;
        status: TenantStatus;
        reason?: string;
        actorId: string;
      }) {
        const tenant = await TenantsRepo.findById(args.tenantId);
        if (!tenant) throw ERR.notFound('Tenant not found');

        const previousStatus = tenant.status;

        const updated = await TenantsRepo.update(args.tenantId, {
          status: args.status,
          statusReason: args.reason,
          statusChangedAt: new Date(),
          statusChangedBy: args.actorId,
        });

        // Audit log
        await appendAudit({
          scopeId: args.tenantId,
          actorId: args.actorId,
          action: 'tenant.status.changed',
          resourceType: 'tenant',
          resourceId: args.tenantId,
          before: { status: previousStatus },
          after: { status: args.status, reason: args.reason },
        });

        // Emit event
        await events.emit('tenant.status.changed', {
          tenantId: args.tenantId,
          previousStatus,
          newStatus: args.status,
          reason: args.reason,
        });

        return updated;
      }
      ```

### 3.4 Enforce Status in Middleware
- [ ] Check tenant status:
      ```typescript
      // packages/foundation/gateway/src/middleware/tenant-status.ts
      export async function checkTenantStatus(ctx: AuthContext): Promise<void> {
        if (!ctx.tenantId) return;

        const tenant = await getTenantById(ctx.tenantId);

        if (!tenant) {
          throw ERR.notFound('Tenant not found');
        }

        if (tenant.status === 'suspended') {
          throw ERR.forbidden(
            'This workspace has been suspended. Please contact support.',
            { code: 'TENANT_SUSPENDED' }
          );
        }

        if (tenant.status === 'deleted') {
          throw ERR.notFound('This workspace no longer exists');
        }
      }
      ```

### 3.5 Add Admin Endpoints
- [ ] POST /api/admin/tenants/:tenantId/suspend
- [ ] POST /api/admin/tenants/:tenantId/activate
- [ ] GET /api/admin/tenants?status=suspended

### 3.6 Handle Suspended Tenant Access
- [ ] Allow read-only access for data export:
      ```typescript
      const READ_ONLY_WHEN_SUSPENDED = [
        'GET /api/rest/v1/tenants/:tenantId/export',
        'GET /api/rest/v1/tenants/:tenantId/billing',
      ];
      ```

### 3.7 Add Tests
- [ ] Test: Active tenant can access everything
- [ ] Test: Suspended tenant gets 403
- [ ] Test: Suspended tenant can export data
- [ ] Test: Status change creates audit log
```

---

## Task 4: Improve HTML Sanitization (P2-SEC-002)

### Problem

**File**: `packages/foundation/kernel/src/security/sanitize.ts`

Regex-based HTML sanitization can be bypassed with edge cases.

### Solution

Use DOMPurify for robust sanitization.

### Checklist

```markdown
### 4.1 Add DOMPurify Dependency
- [ ] Install DOMPurify:
      ```bash
      cd packages/foundation/kernel
      pnpm add dompurify isomorphic-dompurify
      pnpm add -D @types/dompurify
      ```

### 4.2 Create DOMPurify Wrapper
- [ ] Implement sanitizer:
      ```typescript
      // packages/foundation/kernel/src/security/sanitize.ts
      import DOMPurify from 'isomorphic-dompurify';

      export interface SanitizeOptions {
        allowedTags?: string[];
        allowedAttributes?: Record<string, string[]>;
        allowDataUrls?: boolean;
      }

      const DEFAULT_OPTIONS: SanitizeOptions = {
        allowedTags: [
          'p', 'br', 'b', 'i', 'u', 'strong', 'em',
          'ul', 'ol', 'li', 'a', 'img',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'code', 'pre',
        ],
        allowedAttributes: {
          a: ['href', 'title', 'target'],
          img: ['src', 'alt', 'title', 'width', 'height'],
        },
        allowDataUrls: false,
      };

      export function sanitizeHtml(
        html: string,
        options: SanitizeOptions = DEFAULT_OPTIONS
      ): string {
        const config: DOMPurify.Config = {
          ALLOWED_TAGS: options.allowedTags,
          ALLOWED_ATTR: Object.entries(options.allowedAttributes ?? {}).flatMap(
            ([tag, attrs]) => attrs
          ),
          ALLOW_DATA_ATTR: false,
          ADD_ATTR: options.allowDataUrls ? ['src'] : [],
        };

        if (!options.allowDataUrls) {
          config.FORBID_ATTR = ['style'];
          config.FORBID_TAGS = ['style', 'script'];
        }

        return DOMPurify.sanitize(html, config);
      }
      ```

### 4.3 Keep Legacy Functions for Compatibility
- [ ] Deprecate but keep old functions:
      ```typescript
      /**
       * @deprecated Use sanitizeHtml() instead
       */
      export function sanitizeString(input: string): string {
        console.warn('sanitizeString is deprecated, use sanitizeHtml');
        return sanitizeHtml(input);
      }
      ```

### 4.4 Update All Usages
- [ ] Find and update all sanitize calls:
      ```bash
      grep -rn "sanitizeString\|stripHtml" packages/ --include="*.ts"
      ```

### 4.5 Add Strict Mode
- [ ] Create strict sanitizer for user content:
      ```typescript
      export function sanitizeUserContent(html: string): string {
        return sanitizeHtml(html, {
          allowedTags: ['p', 'br', 'b', 'i', 'u', 'strong', 'em'],
          allowedAttributes: {},
          allowDataUrls: false,
        });
      }
      ```

### 4.6 Add Tests
- [ ] Test: Basic HTML preserved
- [ ] Test: Script tags removed
- [ ] Test: Event handlers removed
- [ ] Test: data: URLs removed (unless allowed)
- [ ] Test: Nested comments handled
- [ ] Test: Unicode bypass attempts blocked
```

---

## Task 5: Implement Token Bucket Rate Limiting (P2-REL-001)

### Problem

Fixed window rate limiting allows bursts at window boundaries.

### Solution

Implement token bucket algorithm for smoother rate limiting.

### Checklist

```markdown
### 5.1 Implement Token Bucket
- [ ] Create token bucket implementation:
      ```typescript
      // packages/foundation/gateway/src/middleware/token-bucket.ts
      export interface TokenBucketConfig {
        capacity: number;       // Max tokens
        refillRate: number;     // Tokens per second
        refillInterval?: number; // Interval in ms (default 1000)
      }

      export interface TokenBucketResult {
        allowed: boolean;
        remaining: number;
        retryAfter?: number;    // Seconds until token available
      }

      export async function checkTokenBucket(
        key: string,
        config: TokenBucketConfig,
        tokens: number = 1
      ): Promise<TokenBucketResult> {
        const now = Date.now();
        const bucketKey = `tb:${key}`;

        // Lua script for atomic token bucket
        const script = `
          local key = KEYS[1]
          local capacity = tonumber(ARGV[1])
          local refill_rate = tonumber(ARGV[2])
          local now = tonumber(ARGV[3])
          local requested = tonumber(ARGV[4])

          local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
          local tokens = tonumber(bucket[1]) or capacity
          local last_refill = tonumber(bucket[2]) or now

          -- Calculate tokens to add based on time elapsed
          local elapsed = (now - last_refill) / 1000
          local new_tokens = math.min(capacity, tokens + (elapsed * refill_rate))

          -- Check if we have enough tokens
          if new_tokens >= requested then
            new_tokens = new_tokens - requested
            redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 1)
            return {1, new_tokens}
          else
            -- Not enough tokens
            local wait_time = (requested - new_tokens) / refill_rate
            return {0, new_tokens, wait_time}
          end
        `;

        const result = await kv.eval(
          script,
          [bucketKey],
          [config.capacity, config.refillRate, now, tokens]
        ) as [number, number, number?];

        return {
          allowed: result[0] === 1,
          remaining: Math.floor(result[1]),
          retryAfter: result[2] ? Math.ceil(result[2]) : undefined,
        };
      }
      ```

### 5.2 Update Rate Limit Middleware
- [ ] Use token bucket:
      ```typescript
      export async function rateLimitMiddleware(
        req: NextRequest,
        config: RateLimitConfig
      ): Promise<RateLimitResult> {
        const key = buildRateLimitKey(req, config);

        // Use token bucket for smoother limiting
        const result = await checkTokenBucket(key, {
          capacity: config.maxRequests,
          refillRate: config.maxRequests / (config.windowMs / 1000),
        });

        return {
          success: result.allowed,
          limit: config.maxRequests,
          remaining: result.remaining,
          reset: result.retryAfter ?? 0,
        };
      }
      ```

### 5.3 Add Burst Support
- [ ] Allow configurable burst:
      ```typescript
      interface RateLimitConfig {
        maxRequests: number;     // Sustained rate
        windowMs: number;
        burstCapacity?: number;  // Max burst (default: maxRequests)
      }
      ```

### 5.4 Add Tests
- [ ] Test: Requests within rate allowed
- [ ] Test: Burst allowed up to capacity
- [ ] Test: Sustained rate enforced
- [ ] Test: Tokens refill over time
- [ ] Test: Retry-After header accurate
```

---

## Task 6: Add Graceful Degradation for KV (P2-REL-002)

### Problem

**File**: `packages/foundation/kernel/src/cache/provider.ts`

If KV (Redis) fails, the entire application fails.

### Solution

Add in-memory fallback with degradation alerts.

### Checklist

```markdown
### 6.1 Create Fallback Cache
- [ ] Implement memory fallback:
      ```typescript
      // packages/foundation/kernel/src/cache/fallback.ts
      export class MemoryFallbackCache implements CachePort {
        private cache = new Map<string, { value: string; expiresAt: number }>();
        private cleanupInterval: NodeJS.Timeout;

        constructor() {
          // Cleanup expired entries every minute
          this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
        }

        async get(key: string): Promise<string | null> {
          const entry = this.cache.get(key);
          if (!entry) return null;
          if (entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
          }
          return entry.value;
        }

        async set(key: string, value: string, options?: { PX?: number }): Promise<boolean> {
          const expiresAt = options?.PX ? Date.now() + options.PX : Date.now() + 3600_000;
          this.cache.set(key, { value, expiresAt });
          return true;
        }

        // ... other methods

        private cleanup(): void {
          const now = Date.now();
          for (const [key, entry] of this.cache) {
            if (entry.expiresAt < now) {
              this.cache.delete(key);
            }
          }
        }
      }
      ```

### 6.2 Create Resilient Cache Wrapper
- [ ] Wrap cache with fallback:
      ```typescript
      // packages/foundation/kernel/src/cache/resilient.ts
      export class ResilientCache implements CachePort {
        private primary: CachePort;
        private fallback: MemoryFallbackCache;
        private isDegraded = false;
        private consecutiveFailures = 0;
        private readonly maxFailures = 3;

        constructor(primary: CachePort) {
          this.primary = primary;
          this.fallback = new MemoryFallbackCache();
        }

        async get(key: string): Promise<string | null> {
          if (this.isDegraded) {
            return this.fallback.get(key);
          }

          try {
            const result = await this.primary.get(key);
            this.recordSuccess();
            return result;
          } catch (error) {
            return this.handleFailure(error, () => this.fallback.get(key));
          }
        }

        async set(key: string, value: string, options?: CacheSetOptions): Promise<boolean> {
          if (this.isDegraded) {
            return this.fallback.set(key, value, options);
          }

          try {
            const result = await this.primary.set(key, value, options);
            this.recordSuccess();
            return result;
          } catch (error) {
            return this.handleFailure(error, () => this.fallback.set(key, value, options));
          }
        }

        private recordSuccess(): void {
          this.consecutiveFailures = 0;
          if (this.isDegraded) {
            logger.info('Cache recovered, switching back to primary');
            metrics.increment('cache.recovery');
            this.isDegraded = false;
          }
        }

        private async handleFailure<T>(error: unknown, fallbackFn: () => Promise<T>): Promise<T> {
          this.consecutiveFailures++;
          logger.warn('Cache operation failed', {
            error: error instanceof Error ? error.message : 'Unknown',
            consecutiveFailures: this.consecutiveFailures,
          });

          if (this.consecutiveFailures >= this.maxFailures && !this.isDegraded) {
            logger.error('Cache degraded, switching to memory fallback');
            metrics.increment('cache.degradation');
            this.isDegraded = true;

            // Alert ops team
            alerting.send({
              severity: 'warning',
              title: 'Cache Degraded',
              message: 'Application running on memory cache fallback',
            });
          }

          return fallbackFn();
        }
      }
      ```

### 6.3 Add Health Check
- [ ] Monitor degradation status:
      ```typescript
      async function cacheHealthCheck(): Promise<HealthCheckResult> {
        const cache = getCache();

        if (cache instanceof ResilientCache && cache.isDegraded) {
          return {
            status: 'degraded',
            message: 'Running on memory fallback',
          };
        }

        try {
          await cache.set('health:check', 'ok', { PX: 1000 });
          const value = await cache.get('health:check');
          return {
            status: value === 'ok' ? 'healthy' : 'unhealthy',
          };
        } catch {
          return { status: 'unhealthy', message: 'Cache unreachable' };
        }
      }
      ```

### 6.4 Add Tests
- [ ] Test: Normal operation uses primary
- [ ] Test: Failure switches to fallback
- [ ] Test: Recovery switches back to primary
- [ ] Test: Metrics recorded on degradation
```

---

## Task 7: Add SSE Reconnection Guidance (P2-BUG-003)

### Problem

SSE connections close after 30 minutes with no reconnection guidance.

### Solution

Add Last-Event-ID support and reconnection instructions.

### Checklist

```markdown
### 7.1 Add Event IDs
- [ ] Include event IDs in SSE messages:
      ```typescript
      function formatSSE(event: string, data: unknown, id?: string): string {
        const lines = [
          id ? `id: ${id}` : null,
          `event: ${event}`,
          `data: ${JSON.stringify(data)}`,
          '',
        ].filter(Boolean);
        return lines.join('\n') + '\n';
      }
      ```

### 7.2 Handle Last-Event-ID
- [ ] Resume from last event:
      ```typescript
      export async function GET(req: NextRequest) {
        const lastEventId = req.headers.get('Last-Event-ID');

        // If reconnecting, replay missed events
        if (lastEventId) {
          const missedEvents = await getMissedEvents(userId, lastEventId);
          for (const event of missedEvents) {
            controller.enqueue(formatSSE(event.type, event.data, event.id));
          }
        }

        // Continue with live events...
      }
      ```

### 7.3 Add Retry Header
- [ ] Tell client when to retry:
      ```typescript
      // Send retry instruction at connection start
      controller.enqueue(`retry: 3000\n\n`); // Retry after 3 seconds
      ```

### 7.4 Document Client Implementation
- [ ] Add client example:
      ```typescript
      // Client-side reconnection
      function connectSSE() {
        const eventSource = new EventSource('/api/stream', {
          // Browser automatically sends Last-Event-ID
        });

        eventSource.onopen = () => console.log('Connected');
        eventSource.onerror = () => console.log('Reconnecting...');
        eventSource.onmessage = (e) => handleMessage(JSON.parse(e.data));
      }
      ```
```

---

## Task 8: Persist Local Storage Signing Secret (P2-REL-004)

### Problem

**File**: `packages/adapters/storage-local/src/index.ts:82`

Signing secret is random on each startup, invalidating all presigned URLs.

### Solution

Require configured secret or persist generated one.

### Checklist

```markdown
### 8.1 Require Configuration
- [ ] Update config schema:
      ```typescript
      const ZLocalStorageConfig = z.object({
        basePath: z.string().min(1),
        signingSecret: z.string().min(32).describe(
          'Secret for signing URLs. Must be stable across restarts.'
        ),
      });
      ```

### 8.2 Add Environment Variable
- [ ] Document required env var:
      ```bash
      # .env.example
      LOCAL_STORAGE_SIGNING_SECRET=your-32-char-minimum-secret-here
      ```

### 8.3 Fallback to File-Based Secret
- [ ] Generate and persist if not configured:
      ```typescript
      async function getOrCreateSigningSecret(basePath: string): Promise<string> {
        const secretPath = path.join(basePath, '.signing-secret');

        try {
          return await fs.readFile(secretPath, 'utf8');
        } catch {
          // Generate new secret
          const secret = crypto.randomBytes(32).toString('hex');
          await fs.writeFile(secretPath, secret, { mode: 0o600 });
          logger.warn('Generated new signing secret. Configure LOCAL_STORAGE_SIGNING_SECRET for stability.');
          return secret;
        }
      }
      ```

### 8.4 Add Tests
- [ ] Test: Configured secret used
- [ ] Test: File-based secret persists
- [ ] Test: URLs remain valid across restarts
```

---

## Verification

```bash
# 1. Email preferences
npm run test:notify:preferences

# 2. SMS integration
npm run test:auth:phone

# 3. Tenant status
npm run test:tenants:status

# 4. HTML sanitization
npm run test:sanitize

# 5. Rate limiting
npm run test:ratelimit

# 6. Cache degradation
npm run test:cache:fallback
```

---

## Success Criteria

Phase 5 is complete when:

- [ ] Email preferences implemented with opt-out
- [ ] SMS sending works end-to-end
- [ ] Tenant status enforced
- [ ] HTML sanitization uses DOMPurify
- [ ] Token bucket rate limiting implemented
- [ ] Cache gracefully degrades
- [ ] SSE supports reconnection
- [ ] Local storage signing secret persisted
- [ ] All tests passing

---

## Next Phase

After Phase 5 is complete, proceed to **[PHASE-6-POLISH.md](./PHASE-6-POLISH.md)** for final polish and documentation.

---

> **Last Updated**: 2025-01-16
