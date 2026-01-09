/**
 * @module @unisane/ai
 * @description LLM integrations: completions, embeddings, multi-provider support
 * @layer 4
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  AiProviderError,
  AiRateLimitError,
  AiTokenLimitError,
  AiModelNotFoundError,
} from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { AI_EVENTS, AI_PROVIDERS, AI_DEFAULTS, AI_COLLECTIONS } from './domain/constants';
export type { AiProvider } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { aiKeys } from './domain/keys';
export type { AiKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from './service/generate'

