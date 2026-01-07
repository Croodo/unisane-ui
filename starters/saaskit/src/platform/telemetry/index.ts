// Telemetry facade (StatsD/DogStatsD). No-op until configured.

type Tags = Record<string, string | number | boolean | undefined>;

type StatsClient = {
  timing: (stat: string, time: number, tags?: string[]) => void;
  increment: (stat: string, value?: number, tags?: string[]) => void;
};

let stats: StatsClient | null = null;
let prefix = "saaskit";

function makeTags(t?: Tags): string[] | undefined {
  if (!t) return undefined;
  const arr: string[] = [];
  for (const [k, v] of Object.entries(t)) {
    if (v === undefined) continue;
    arr.push(`${k}:${String(v)}`);
  }
  return arr.length ? arr : undefined;
}

function loadStats(): StatsClient | null {
  try {
    const host = process.env.STATSD_HOST;
    const port = process.env.STATSD_PORT ? Number(process.env.STATSD_PORT) : undefined;
    prefix = process.env.STATSD_PREFIX || "saaskit";
    if (!host) return null;
    // Lazy require to avoid bundling if not used
     
    const StatsD = require("statsd-client");
    // The library has loose types; coerce to our facade
    const c: StatsClient = new StatsD({ host, port, prefix, tcp: false, mock: false }) as unknown as StatsClient;
    return c;
  } catch {
    return null;
  }
}

export const metrics = {
  inc(name: string, value = 1, tags?: Tags) {
    if (!stats) stats = loadStats();
    if (!stats) return;
    stats.increment(`${prefix}.${name}`, value, makeTags(tags));
  },
  timing(name: string, ms: number, tags?: Tags) {
    if (!stats) stats = loadStats();
    if (!stats) return;
    stats.timing(`${prefix}.${name}`, ms, makeTags(tags));
  },
};

type HttpObs = {
  op?: string | null;
  method: string;
  status: number;
  ms: number;
};

export function observeHttp({ op, method, status, ms }: HttpObs) {
  metrics.timing("http.server.duration_ms", ms, { op: op ?? undefined, method, status });
  if (status >= 500) metrics.inc("http.server.errors_total", 1, { op: op ?? undefined, method, status });
}

export function incRateLimited(op?: string | null) {
  metrics.inc("rate_limited_total", 1, { op: op ?? undefined });
}

export function incIdemReplay() {
  metrics.inc("idempotency_replay_total", 1);
}

export function incIdemWaitTimeout() {
  metrics.inc("idempotency_wait_timeout_total", 1);
}
