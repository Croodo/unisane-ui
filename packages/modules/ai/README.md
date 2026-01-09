# @unisane/ai

LLM integrations: completions, embeddings, multi-provider support.

## Layer

6 - Extended

## Features

- AI text generation with metering
- Feature flag integration
- Subscription and credits enforcement
- Multi-provider support (future)

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | 🔒 | N/A - no database layer |
| `getTenantId()` | ✅ | Used in generate |
| `tenantFilter()` | 🔒 | N/A - no database layer |
| Keys builder | ✅ | `aiKeys` in domain/keys.ts |

## Usage

```typescript
import { generate } from "@unisane/ai";

// Generate text (uses context tenantId)
const result = await generate({
  prompt: "Hello, world!",
  idem: "request-123", // Optional idempotency key
  options: { temperature: 0.7 },
});
// { output: { text: "..." } }
```

## Checks Performed

1. **Feature flag** - `FLAG.AI_GENERATE` must be enabled for tenant
2. **Active subscription** - Requires valid billing subscription
3. **Quota enforcement** - Uses `FEATURE.AI_GENERATE` tokens

## Future Providers

| Provider | Status | Notes |
|----------|--------|-------|
| OpenAI | 🚧 | Planned |
| Anthropic | 🚧 | Planned |
| Cohere | 🚧 | Planned |

## Exports

- `generate` - Generate text with metering
- `aiKeys` - Cache key builder
- `AI_EVENTS` - Event constants
- `AI_PROVIDERS` - Provider type constants
- `AiProviderError` - Error class
- `AiRateLimitError` - Error class
- `AiTokenLimitError` - Error class
- `AiModelNotFoundError` - Error class
