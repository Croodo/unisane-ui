/**
 * Config platform stub - provides cache and pub/sub interfaces
 * Actual implementations are injected by the application
 */

// Cache interface
export interface ConfigCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

const noopCache: ConfigCache = {
  get: async () => null,
  set: async () => {},
  delete: async () => {},
};

let _cache: ConfigCache = noopCache;

export async function cacheGet<T>(key: string): Promise<T | null> {
  return _cache.get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  return _cache.set(key, value, ttlMs);
}

export async function cacheDelete(key: string): Promise<void> {
  return _cache.delete(key);
}

export function setConfigCache(impl: ConfigCache): void {
  _cache = impl;
}

// Pub/Sub interface
export type MessageHandler<T = unknown> = (message: T) => void | Promise<void>;

export interface ConfigBus {
  publish<T>(channel: string, message: T): Promise<void>;
  subscribe<T>(channel: string, handler: MessageHandler<T>): () => void;
}

const noopBus: ConfigBus = {
  publish: async () => {},
  subscribe: () => () => {},
};

let _bus: ConfigBus = noopBus;

export async function publish<T>(channel: string, message: T): Promise<void> {
  return _bus.publish(channel, message);
}

export function subscribe<T>(channel: string, handler: MessageHandler<T>): () => void {
  return _bus.subscribe(channel, handler);
}

export function setConfigBus(impl: ConfigBus): void {
  _bus = impl;
}
