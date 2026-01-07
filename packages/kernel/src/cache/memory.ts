// Simple in-memory KV with TTL for local dev/tests.
type Entry = { value: string; expiresAt: number | null };

export class MemoryStore {
  private data = new Map<string, Entry>();

  get(key: string): string | null {
    const e = this.data.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && Date.now() > e.expiresAt) {
      this.data.delete(key);
      return null;
    }
    return e.value;
  }

  set(key: string, value: string, opts?: { PX?: number; NX?: boolean }): boolean {
    if (opts?.NX) {
      const cur = this.get(key);
      if (cur !== null) return false;
    }
    const expiresAt = opts?.PX ? Date.now() + opts.PX : null;
    this.data.set(key, { value, expiresAt });
    return true;
  }

  incrBy(key: string, by: number, ttlMs?: number): number {
    const curStr = this.get(key);
    const cur = curStr === null ? 0 : Number(curStr);
    const next = cur + by;
    this.set(key, String(next), ttlMs ? { PX: ttlMs } : undefined);
    return next;
  }

  del(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  // Utility methods to support local scan/mget/expire in redis facade
  keys(): string[] {
    const now = Date.now();
    const out: string[] = [];
    for (const [k, e] of this.data.entries()) {
      if (e.expiresAt !== null && now > e.expiresAt) {
        this.data.delete(k);
      } else {
        out.push(k);
      }
    }
    return out;
  }

  expire(key: string, seconds: number): boolean {
    const e = this.data.get(key);
    if (!e) return false;
    e.expiresAt = Date.now() + Math.max(1, seconds) * 1000;
    this.data.set(key, e);
    return true;
  }
}

export const memoryStore = new MemoryStore();
