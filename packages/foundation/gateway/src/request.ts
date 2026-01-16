import { isValidId } from '@unisane/kernel';
import { HEADER_NAMES } from './headers';

export function tenantIdFromUrl(req?: Request): string | undefined {
  if (!req) return undefined;
  try {
    const pathname = new URL(req.url).pathname;
    const match = pathname.match(/\/tenants\/([^\/]+)/);
    const id = match ? match[1] : undefined;
    // Ignore special non-tenant segment routes
    // by-slug: /tenants/by-slug/:slug
    // stats, export: /admin/tenants/stats, /admin/tenants/export
    const RESERVED_SEGMENTS = ['by-slug', 'stats', 'export'];
    if (!id || RESERVED_SEGMENTS.includes(id)) return undefined;
    // Only accept valid IDs according to the configured ID generator
    // This prevents paths like /admin/tenants from extracting random segments
    if (!isValidId(id)) return undefined;
    return id;
  } catch {
    return undefined;
  }
}

// GW-003 FIX: Max length for authorization-related headers to prevent DoS
// JWTs are typically 500-2000 bytes, API keys ~50 bytes
// 8KB allows for large JWTs while preventing excessive memory usage
const MAX_AUTH_HEADER_LENGTH = 8192;

export function readApiKeyToken(headers: Headers): string {
  const authz = headers.get(HEADER_NAMES.AUTHORIZATION) ?? '';
  const direct = headers.get('x-api-key') ?? '';

  // GW-003 FIX: Reject oversized headers early
  if (authz.length > MAX_AUTH_HEADER_LENGTH || direct.length > MAX_AUTH_HEADER_LENGTH) {
    return '';
  }

  if (direct) return direct.trim();
  const m = authz.match(/^\s*ApiKey\s+(.+)$/i);
  return m ? (m[1]?.trim() ?? '') : '';
}

export function readBearerToken(headers: Headers): string {
  const authz = headers.get(HEADER_NAMES.AUTHORIZATION) ?? '';

  // GW-003 FIX: Reject oversized headers early
  if (authz.length > MAX_AUTH_HEADER_LENGTH) {
    return '';
  }

  const m = authz.match(/^\s*Bearer\s+(.+)$/i);
  return m ? (m[1]?.trim() ?? '') : '';
}

export function readBearerFromCookie(headers: Headers): string {
  const cookie = headers.get('cookie') ?? '';
  if (!cookie) return '';
  // Split on semicolons; cookies can have spaces after semicolons
  const parts = cookie.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.split('=');
    const key = (k ?? '').trim();
    if (!key) continue;
    if (key === 'access_token') {
      return rest.join('=')?.trim() ?? '';
    }
  }
  return '';
}
