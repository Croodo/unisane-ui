import { getEnv } from "./env";

/**
 * Small helper to cache and parse JSON configuration from environment.
 * Callers provide a reader for the raw env string and a parser for the
 * JSON payload; the returned function memoizes by raw value.
 */
export function createEnvJsonCache<T>(
  readRaw: () => string | undefined,
  parse: (raw: unknown) => T,
  empty: T
): () => T {
  let lastRaw: string | undefined;
  let lastValue: T = empty;
  return () => {
    const raw = readRaw();
    if (raw === lastRaw) return lastValue;
    lastRaw = raw;
    if (!raw) {
      lastValue = empty;
      return lastValue;
    }
    try {
      const obj = JSON.parse(raw) as unknown;
      lastValue = parse(obj);
      return lastValue;
    } catch {
      lastValue = empty;
      return lastValue;
    }
  };
}
