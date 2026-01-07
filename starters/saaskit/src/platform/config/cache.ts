import { kv } from '@unisane/kernel';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await kv.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  await kv.set(key, JSON.stringify(value), { PX: Math.max(1, ttlMs) });
}

