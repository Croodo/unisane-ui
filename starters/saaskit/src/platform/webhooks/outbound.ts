import { hmacSHA256Hex } from '@/src/platform/webhooks/signing';
import { recordOutbound } from '@unisane/webhooks';
import { HEADER_NAMES } from '@unisane/gateway';
import { getTypedSetting } from '@unisane/settings/service/readTyped';
import { SETTINGS_NS, WEBHOOKS_SETTING_KEYS } from '@unisane/kernel';

export type OutboundWebhookPayload = {
  url: string;
  event: string;
  body: unknown;
  secret?: string;
  headers?: Record<string, string>;
  tenantId?: string | null;
};

function isPrivateHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local')) return true;
  // crude private IP patterns
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  const m = h.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function isAllowedTarget(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    if (isPrivateHostname(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function getAllowedHosts(tenantId?: string | null): Promise<string[]> {
  // Try tenant-scoped allowlist first
  if (tenantId) {
    const s = await getTypedSetting<string[]>({
      tenantId,
      ns: SETTINGS_NS.WEBHOOKS,
      key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
    }).catch(() => null);
    if (s && Array.isArray(s.value)) return s.value;
  }
  // Fallback to global allowlist
  const g = await getTypedSetting<string[]>({
    tenantId: null,
    ns: SETTINGS_NS.WEBHOOKS,
    key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
  }).catch(() => null);
  if (g && Array.isArray(g.value)) return g.value;
  return [];
}

function hostMatchesAllowed(host: string, entry: string): boolean {
  const h = host.toLowerCase();
  const e = entry.toLowerCase();
  if (!e) return false;
  if (e.startsWith('.')) {
    // suffix match (subdomains)
    return h === e.slice(1) || h.endsWith(e);
  }
  return h === e;
}

export async function deliverWebhook(payload: OutboundWebhookPayload): Promise<void> {
  const id = crypto.randomUUID();
  const ts = Math.floor(Date.now() / 1000).toString();
  const json = JSON.stringify(payload.body ?? {});
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(payload.headers ?? {}),
    [HEADER_NAMES.WEBHOOK_ID]: id,
    [HEADER_NAMES.WEBHOOK_TS]: ts,
  };
  if (payload.secret) {
    const sig = hmacSHA256Hex(payload.secret, `${ts}.${json}`);
    headers[HEADER_NAMES.WEBHOOK_SIGNATURE] = sig;
  }
  // SSRF/target guard
  if (!isAllowedTarget(payload.url)) {
    await recordOutbound({
      tenantId: payload.tenantId ?? null,
      target: payload.url,
      status: 'failed',
      httpStatus: null,
      headers,
      payload: payload.body,
      error: 'target_not_allowed',
    });
    throw new Error('webhook target not allowed');
  }

  // Tenant/global allowlist (if configured)
  try {
    const u = new URL(payload.url);
    const allowed = await getAllowedHosts(payload.tenantId ?? null);
    if (allowed.length > 0) {
      const ok = allowed.some((e) => hostMatchesAllowed(u.hostname, e));
      if (!ok) {
        await recordOutbound({
          tenantId: payload.tenantId ?? null,
          target: payload.url,
          status: 'failed',
          httpStatus: null,
          headers,
          payload: payload.body,
          error: 'host_not_allowed',
        });
        throw new Error('webhook host not allowed');
      }
    }
  } catch (e) {
    if (e instanceof Error && (e.message === 'webhook host not allowed')) throw e;
    // ignore parsing errors; earlier checks will catch invalid URL
  }

  // Timeout guard
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(payload.url, { method: 'POST', headers, body: json, signal: controller.signal });
  } catch (e) {
    clearTimeout(to);
    await recordOutbound({
      tenantId: payload.tenantId ?? null,
      target: payload.url,
      status: 'failed',
      httpStatus: null,
      headers,
      payload: payload.body,
      error: (e as Error)?.name === 'AbortError' ? 'timeout' : ((e as Error)?.message ?? 'network_error'),
    });
    throw e;
  } finally {
    clearTimeout(to);
  }

  if (res.ok) {
    await recordOutbound({
      tenantId: payload.tenantId ?? null,
      target: payload.url,
      status: 'delivered',
      httpStatus: res.status,
      headers,
      payload: payload.body,
    });
    return;
  }
  await recordOutbound({
    tenantId: payload.tenantId ?? null,
    target: payload.url,
    status: 'failed',
    httpStatus: res.status,
    headers,
    payload: payload.body,
    error: `HTTP ${res.status}`,
  });
  throw new Error(`webhook delivery failed: ${res.status}`);
}
