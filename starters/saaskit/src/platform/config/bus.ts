import { redis } from "@/src/core/kv/redis";
import { kv } from "@/src/core/kv";
import { KV } from "@/src/shared/constants/kv";

// In-process listeners (works in single runtime). For multi-runtime,
// messages are still published to Redis; a real SUB client can be added later.
const listeners = new Set<(event: unknown) => void>();
let pollerStarted = false;
let subscriberStarted = false;
let lastSeenAt = 0;

async function pollOnce(): Promise<void> {
  try {
    const raw = await kv.get(`${KV.PUBSUB}:latest`);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { at?: number; event?: unknown };
    const at = typeof parsed?.at === "number" ? parsed.at : 0;
    if (at > lastSeenAt) {
      lastSeenAt = at;
      const evt = parsed?.event;
      for (const fn of listeners) {
        try {
          void Promise.resolve().then(() => fn(evt));
        } catch {}
      }
    }
  } catch {
    // ignore polling errors
  }
}

function ensurePoller() {
  if (pollerStarted) return;
  pollerStarted = true;
  // Lightweight poller (~2s) to propagate config invalidations across instances via KV
  const intervalMs = 2000;

  setInterval(() => {
    void pollOnce();
  }, intervalMs);
}

async function ensureSubscriber() {
  if (subscriberStarted) return;
  // Prefer native Redis SUB when available
  if (
    typeof (redis as unknown as { supportsSubscribe?: () => boolean })
      .supportsSubscribe === "function" &&
    (
      redis as unknown as { supportsSubscribe: () => boolean }
    ).supportsSubscribe()
  ) {
    subscriberStarted = true;
    if (
      typeof (
        redis as unknown as {
          subscribe?: (
            channel: string,
            h: (m: string) => void
          ) => Promise<void>;
        }
      ).subscribe === "function"
    ) {
      await (
        redis as unknown as {
          subscribe: (channel: string, h: (m: string) => void) => Promise<void>;
        }
      ).subscribe(KV.PUBSUB, (message: string) => {
        try {
          const evt = JSON.parse(message);
          for (const fn of listeners) {
            try {
              void Promise.resolve().then(() => fn(evt));
            } catch {}
          }
        } catch {
          // ignore malformed messages
        }
      });
    }
  }
}

export async function publish(event: unknown): Promise<void> {
  await redis.publish(KV.PUBSUB, JSON.stringify(event));
  // Best-effort cross-instance hint: write latest event to KV for polling/debugging.
  try {
    await kv.set(
      `${KV.PUBSUB}:latest`,
      JSON.stringify({ at: Date.now(), event }),
      { PX: 60_000 }
    );
  } catch {}
  // Fan-out locally (best-effort, non-blocking)
  for (const fn of listeners) {
    try {
      void Promise.resolve().then(() => fn(event));
    } catch {
      // swallow listener errors
    }
  }
}

export type Unsubscribe = () => void;
export function subscribe(handler: (event: unknown) => void): Unsubscribe {
  listeners.add(handler);
  void ensureSubscriber();
  if (!subscriberStarted) ensurePoller();
  return () => listeners.delete(handler);
}
