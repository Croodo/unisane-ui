import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { HEADER_NAMES } from '@/src/shared/constants/headers';
import { getEnv } from '@/src/shared/env';
import { checkRateLimit } from '@unisane/kernel';

/**
 * Next.js 16+ proxy handler (replaces middleware.ts).
 * Provides:
 * - Rate limiting for API routes
 * - Security headers
 * - CORS handling
 * - Request ID propagation
 */
export async function proxy(req: NextRequest) {
  const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID();
  const res = NextResponse.next();

  // ─── RATE LIMITING (API ROUTES ONLY) ─────────────────────────────────────────
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ip = (req as any).ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await checkRateLimit(ip);

    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: res.headers,
      });
    }
  }

  // ─── SECURITY HEADERS ────────────────────────────────────────────────────────
  res.headers.set(HEADER_NAMES.REQUEST_ID, requestId);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // ─── CORS ────────────────────────────────────────────────────────────────────
  const origin = req.headers.get('origin') ?? '';
  const { ALLOWED_ORIGINS: allowed } = getEnv();

  if (origin && allowed.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'authorization,content-type,idempotency-key,x-request-id,x-csrf-token'
    );
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // ─── PREFLIGHT ───────────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

// Matcher config for Next.js middleware integration
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all dynamic routes that may need CORS/security headers
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
