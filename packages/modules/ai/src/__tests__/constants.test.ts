import { describe, it, expect } from "vitest";
import {
  AI_EVENTS,
  AI_PROVIDERS,
  AI_DEFAULTS,
  AI_COLLECTIONS,
} from "../domain/constants";

describe("AI Constants", () => {
  describe("AI_EVENTS", () => {
    it("should have COMPLETION_STARTED event", () => {
      expect(AI_EVENTS.COMPLETION_STARTED).toBe("ai.completion.started");
    });

    it("should have COMPLETION_FINISHED event", () => {
      expect(AI_EVENTS.COMPLETION_FINISHED).toBe("ai.completion.finished");
    });

    it("should have COMPLETION_FAILED event", () => {
      expect(AI_EVENTS.COMPLETION_FAILED).toBe("ai.completion.failed");
    });

    it("should have EMBEDDING_CREATED event", () => {
      expect(AI_EVENTS.EMBEDDING_CREATED).toBe("ai.embedding.created");
    });

    it("should have events with ai prefix", () => {
      Object.values(AI_EVENTS).forEach((event) => {
        expect(event).toMatch(/^ai\./);
      });
    });

    it("should have exactly 4 event types", () => {
      expect(Object.keys(AI_EVENTS)).toHaveLength(4);
    });
  });

  describe("AI_PROVIDERS", () => {
    it("should have OPENAI provider", () => {
      expect(AI_PROVIDERS.OPENAI).toBe("openai");
    });

    it("should have ANTHROPIC provider", () => {
      expect(AI_PROVIDERS.ANTHROPIC).toBe("anthropic");
    });

    it("should have GOOGLE provider", () => {
      expect(AI_PROVIDERS.GOOGLE).toBe("google");
    });

    it("should have AZURE provider", () => {
      expect(AI_PROVIDERS.AZURE).toBe("azure");
    });

    it("should have exactly 4 providers", () => {
      expect(Object.keys(AI_PROVIDERS)).toHaveLength(4);
    });

    it("should use lowercase provider names", () => {
      Object.values(AI_PROVIDERS).forEach((provider) => {
        expect(provider).toBe(provider.toLowerCase());
      });
    });
  });

  describe("AI_DEFAULTS", () => {
    it("should have DEFAULT_MODEL set to gpt-4o", () => {
      expect(AI_DEFAULTS.DEFAULT_MODEL).toBe("gpt-4o");
    });

    it("should have DEFAULT_MAX_TOKENS set to 4096", () => {
      expect(AI_DEFAULTS.DEFAULT_MAX_TOKENS).toBe(4096);
    });

    it("should have DEFAULT_TEMPERATURE set to 0.7", () => {
      expect(AI_DEFAULTS.DEFAULT_TEMPERATURE).toBe(0.7);
    });

    it("should have CACHE_TTL_MS set to 5 minutes", () => {
      expect(AI_DEFAULTS.CACHE_TTL_MS).toBe(300_000);
    });

    it("should have positive token limit", () => {
      expect(AI_DEFAULTS.DEFAULT_MAX_TOKENS).toBeGreaterThan(0);
    });

    it("should have temperature between 0 and 1", () => {
      expect(AI_DEFAULTS.DEFAULT_TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(AI_DEFAULTS.DEFAULT_TEMPERATURE).toBeLessThanOrEqual(1);
    });

    it("should have positive cache TTL", () => {
      expect(AI_DEFAULTS.CACHE_TTL_MS).toBeGreaterThan(0);
    });
  });

  describe("AI_COLLECTIONS", () => {
    it("should have COMPLETIONS collection", () => {
      expect(AI_COLLECTIONS.COMPLETIONS).toBe("ai_completions");
    });

    it("should have EMBEDDINGS collection", () => {
      expect(AI_COLLECTIONS.EMBEDDINGS).toBe("ai_embeddings");
    });

    it("should use lowercase with underscores", () => {
      Object.values(AI_COLLECTIONS).forEach((collection) => {
        expect(collection).toMatch(/^[a-z_]+$/);
      });
    });

    it("should have exactly 2 collections", () => {
      expect(Object.keys(AI_COLLECTIONS)).toHaveLength(2);
    });
  });

  describe("Constants Type Safety", () => {
    it("should have readonly events", () => {
      const events = AI_EVENTS;
      expect(events.COMPLETION_STARTED).toBe("ai.completion.started");
    });

    it("should have readonly providers", () => {
      const providers = AI_PROVIDERS;
      expect(providers.OPENAI).toBe("openai");
    });

    it("should have readonly defaults", () => {
      const defaults = AI_DEFAULTS;
      expect(defaults.DEFAULT_MODEL).toBe("gpt-4o");
    });

    it("should have readonly collections", () => {
      const collections = AI_COLLECTIONS;
      expect(collections.COMPLETIONS).toBe("ai_completions");
    });
  });
});
