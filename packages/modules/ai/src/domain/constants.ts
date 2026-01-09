/**
 * AI Domain Constants
 */

export const AI_EVENTS = {
  COMPLETION_STARTED: 'ai.completion.started',
  COMPLETION_FINISHED: 'ai.completion.finished',
  COMPLETION_FAILED: 'ai.completion.failed',
  EMBEDDING_CREATED: 'ai.embedding.created',
} as const;

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  AZURE: 'azure',
} as const;

export type AiProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

export const AI_DEFAULTS = {
  DEFAULT_MODEL: 'gpt-4o',
  DEFAULT_MAX_TOKENS: 4096,
  DEFAULT_TEMPERATURE: 0.7,
  CACHE_TTL_MS: 300_000,
} as const;

export const AI_COLLECTIONS = {
  COMPLETIONS: 'ai_completions',
  EMBEDDINGS: 'ai_embeddings',
} as const;
