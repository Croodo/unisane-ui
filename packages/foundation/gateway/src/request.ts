import { HEADER_NAMES } from './headers';

export function tenantIdFromUrl(req?: Request): string | undefined {
  if (!req) return undefined;
  try {
    const pathname = new URL(req.url).pathname;
    const match = pathname.match(/\/tenants\/([^\/]+)/);
    const id = match ? match[1] : undefined;
    // Ignore special non-tenant segment routes, e.g. /tenants/by-slug/:slug
    if (id === 'by-slug') return undefined;
    return id;
  } catch {
    return undefined;
  }
}

export function readApiKeyToken(headers: Headers): string {
  const authz = headers.get(HEADER_NAMES.AUTHORIZATION) ?? '';
  const direct = headers.get('x-api-key') ?? '';
  if (direct) return direct.trim();
  const m = authz.match(/^\s*ApiKey\s+(.+)$/i);
  return m ? (m[1]?.trim() ?? '') : '';
}

export function readBearerToken(headers: Headers): string {
  const authz = headers.get(HEADER_NAMES.AUTHORIZATION) ?? '';
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
