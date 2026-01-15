# Adapters Reference

> **For LLMs**: Complete inventory of all adapters. Load when working with external integrations.

---

## Overview

Adapters connect the application to external services (databases, APIs, storage).

**Rule**: All adapters MUST use resilience wrappers.

```typescript
import { createResilientAdapter } from '@unisane/kernel';

export function createMyAdapter(config: Config): MyPort {
  const adapter = new MyAdapterImpl(config);
  return createResilientAdapter('my-adapter', adapter);
}
```

---

## Adapter Inventory

| Adapter | Port | Package | Resilience | Status |
|---------|------|---------|------------|--------|
| billing-stripe | BillingPort | `@unisane/billing-stripe` | ✅ | Active |
| billing-razorpay | BillingPort | `@unisane/billing-razorpay` | ✅ | Active |
| email-ses | EmailPort | `@unisane/email-ses` | ✅ | Active |
| email-resend | EmailPort | `@unisane/email-resend` | ✅ | Active |
| storage-s3 | StoragePort | `@unisane/storage-s3` | ✅ | Active |
| storage-gcs | StoragePort | `@unisane/storage-gcs` | ⚠️ P0 | Needs fix |
| storage-local | StoragePort | `@unisane/storage-local` | ⚠️ P1 | Needs fix |
| database-mongodb | DatabasePort | `@unisane/database-mongodb` | ✅ | Active |
| cache-redis | CachePort | `@unisane/cache-redis` | ✅ | Active |
| cache-vercel-kv | CachePort | `@unisane/cache-vercel-kv` | ⚠️ P0 | Needs fix |
| ai-openai | AIPort | `@unisane/ai-openai` | ✅ | Active |
| ai-anthropic | AIPort | `@unisane/ai-anthropic` | ✅ | Active |

---

## Standard Resilience Configuration

```typescript
// kernel/src/resilience/config.ts
export const ADAPTER_RESILIENCE_STANDARD = {
  circuitBreaker: {
    failureThreshold: 5,      // Open after 5 failures
    resetTimeout: 30000,      // 30s before half-open
  },
  retry: {
    maxRetries: 3,            // 3 retry attempts
    baseDelayMs: 200,         // 200ms initial delay
    maxDelayMs: 5000,         // 5s max delay
    backoffMultiplier: 2,     // Exponential backoff
  },
  timeout: {
    requestTimeout: 10000,    // 10s request timeout
    connectTimeout: 5000,     // 5s connect timeout
  },
};
```

---

## Billing Adapters

### billing-stripe

**Package**: `packages/adapters/billing-stripe`

**Configuration**:
```typescript
interface StripeConfig {
  secretKey: string;          // sk_live_... or sk_test_...
  webhookSecret: string;      // whsec_...
  apiVersion?: string;        // Defaults to latest
}
```

**Methods**:
| Method | Description | Resilience |
|--------|-------------|------------|
| createCheckoutSession | Create Stripe Checkout | Retry + CB |
| createPortalSession | Customer portal | Retry + CB |
| getSubscription | Fetch subscription | Retry + CB |
| cancelSubscription | Cancel sub | Retry + CB |
| updateSubscriptionPlan | Change plan | Retry + CB |

**Known Issues**: BS-001 (silent errors in ensureCustomerId)

---

### billing-razorpay

**Package**: `packages/adapters/billing-razorpay`

**Configuration**:
```typescript
interface RazorpayConfig {
  keyId: string;              // rzp_live_... or rzp_test_...
  keySecret: string;
  webhookSecret: string;
}
```

**Methods**:
| Method | Description | Status |
|--------|-------------|--------|
| createCheckoutSession | Create order | ✅ |
| createPortalSession | Portal link | ⚠️ BR-001 |
| getSubscription | Fetch sub | ✅ |
| cancelSubscription | Cancel | ✅ |
| updateSubscriptionPlan | Change plan | ⚠️ BR-002 |

**Known Issues**: BR-001, BR-002 (contract violations)

---

## Email Adapters

### email-ses

**Package**: `packages/adapters/email-ses`

**Configuration**:
```typescript
interface SESConfig {
  region: string;             // AWS region
  accessKeyId?: string;       // Optional if using IAM role
  secretAccessKey?: string;
  fromAddress: string;        // Verified sender
  timeoutMs?: number;         // Default: 10000
}
```

**Resilience**:
- Circuit breaker: 5 failures
- Retry: 3 attempts
- Timeout: 10s

---

### email-resend

**Package**: `packages/adapters/email-resend`

**Configuration**:
```typescript
interface ResendConfig {
  apiKey: string;             // re_...
  fromAddress: string;
  timeoutMs?: number;         // Default: 10000
}
```

**Known Issues**: ER-001 (missing timeout - P1)

---

## Storage Adapters

### storage-s3

**Package**: `packages/adapters/storage-s3`

**Configuration**:
```typescript
interface S3Config {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;          // For S3-compatible (MinIO)
  forcePathStyle?: boolean;
}
```

**Methods**:
| Method | Timeout | Description |
|--------|---------|-------------|
| upload | 30s | Upload file |
| download | 30s | Download file |
| delete | 10s | Delete file |
| getSignedUrl | 5s | Pre-signed URL |
| listFiles | 10s | List bucket |

---

### storage-gcs

**Package**: `packages/adapters/storage-gcs`

**Configuration**:
```typescript
interface GCSConfig {
  bucket: string;
  projectId: string;
  keyFilename?: string;       // Path to service account
  credentials?: object;       // Or inline credentials
}
```

**Known Issues**: SG-002 (no resilience wrapper - P0)

---

### storage-local

**Package**: `packages/adapters/storage-local`

**Configuration**:
```typescript
interface LocalConfig {
  basePath: string;           // Local directory
  maxFileSize?: number;       // In bytes
}
```

**Known Issues**: SL-001 (no resilience wrapper - P1)

---

## Database Adapters

### database-mongodb

**Package**: `packages/adapters/database-mongodb`

**Configuration**:
```typescript
interface MongoConfig {
  uri: string;                // mongodb://... or mongodb+srv://...
  database: string;
  options?: MongoClientOptions;
}
```

**Known Issues**: DM-001 (connection race condition - P1)

---

## Cache Adapters

### cache-redis

**Package**: `packages/adapters/cache-redis`

**Configuration**:
```typescript
interface RedisConfig {
  url: string;                // redis://...
  password?: string;
  tls?: boolean;
}
```

---

### cache-vercel-kv

**Package**: Built into kernel

**Configuration**:
```typescript
// Uses environment variables
// KV_REST_API_URL
// KV_REST_API_TOKEN
```

**Known Issues**: K-001 (silent fallback to memory - P0)

---

## AI Adapters

### ai-openai

**Package**: `packages/adapters/ai-openai`

**Configuration**:
```typescript
interface OpenAIConfig {
  apiKey: string;             // sk-...
  organization?: string;
  baseUrl?: string;           // For proxies
  defaultModel?: string;      // Default: gpt-4
}
```

**Resilience**:
- Retry: 3 attempts (rate limit aware)
- Timeout: 60s (for long generations)
- Circuit breaker: 5 failures

---

### ai-anthropic

**Package**: `packages/adapters/ai-anthropic`

**Configuration**:
```typescript
interface AnthropicConfig {
  apiKey: string;             // sk-ant-...
  defaultModel?: string;      // Default: claude-3-sonnet
  maxTokens?: number;
}
```

**Resilience**: Same as OpenAI

---

## Creating a New Adapter

See [PATTERNS.md](../PATTERNS.md#pattern-3-creating-a-new-adapter) for the complete pattern.

**Checklist**:
- [ ] Implements a port interface
- [ ] Validates config in constructor
- [ ] Uses `createResilientAdapter` wrapper
- [ ] Has structured error handling
- [ ] Logs errors with context
- [ ] Has integration tests

---

## Adapter Testing

```typescript
// Use sandbox/test credentials
describe('StripeAdapter (integration)', () => {
  const adapter = createStripeAdapter({
    secretKey: process.env.STRIPE_TEST_KEY!,
    webhookSecret: 'whsec_test',
  });

  it('creates checkout session', async () => {
    const session = await adapter.createCheckoutSession({...});
    expect(session.id).toMatch(/^cs_test_/);
  });
});
```

---

> **Last Updated**: 2025-01-15
