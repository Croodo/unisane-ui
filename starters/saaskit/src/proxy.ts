import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { HEADER_NAMES, getEnv, checkRateLimit } from '@unisane/kernel';

/**
 * SECURITY FIX (SEC-007): Validate that an origin is a valid URL and matches allowed origins.
 *
 * This function:
 * 1. Validates the origin is a proper URL (prevents malformed origin bypass)
 * 2. Compares the origin against the allowlist using URL comparison
 * 3. Uses strict equality on the origin property (protocol + host + port)
 *
 * @param origin - The origin header value from the request
 * @param allowedOrigins - Array of allowed origin URLs
 * @returns true if the origin is valid and allowed
 */
function isValidCorsOrigin(origin: string, allowedOrigins: string[]): boolean {
  // Empty origin is not valid
  if (!origin || origin.trim() === '') {
    return false;
  }

  // Validate origin is a proper URL
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    // Malformed origin - reject
    return false;
  }

  // Origin must have a protocol (http/https)
  if (!originUrl.protocol || (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:')) {
    return false;
  }

  // Compare against allowed origins
  for (const allowed of allowedOrigins) {
    try {
      const allowedUrl = new URL(allowed);
      // Compare the full origin (protocol + host + port)
      // URL.origin returns "protocol://host:port" (port omitted if default)
      if (originUrl.origin === allowedUrl.origin) {
        return true;
      }
    } catch {
      // Invalid allowed origin in config - skip
      continue;
    }
  }

  return false;
}

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

  // Content Security Policy (CSP) - Primary XSS defense
  // Generate a unique nonce for this request (used for inline scripts)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  // CSP Directives:
  // - In development: Allow unsafe-inline/eval for hot reloading
  // - In production: Use nonce-based CSP for inline scripts, removing unsafe-inline
  //
  // NOTE: Removing 'unsafe-inline' requires all inline scripts to use nonce attribute.
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  //
  // SAAS-002 FIX: Document security implications of dev mode CSP
  // WARNING: Development mode CSP allows 'unsafe-inline' and 'unsafe-eval' for Next.js
  // hot module reloading (HMR) to work. This is intentional and acceptable because:
  // 1. Development mode is only used locally on developer machines
  // 2. Next.js HMR requires eval() for fast refresh to work
  // 3. Production mode uses strict nonce-based CSP
  //
  // If you need to test CSP in development, set USE_STRICT_CSP_IN_DEV=true
  const useStrictCspInDev = process.env.USE_STRICT_CSP_IN_DEV === 'true';
  const useDevCsp = isDev && !useStrictCspInDev;

  const cspDirectives = [
    "default-src 'self'",
    useDevCsp
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://unpkg.com"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://unpkg.com`,
    // Style 'unsafe-inline' is lower risk than script, but ideally should use nonces too
    // For now, keep it to avoid breaking existing styles
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com wss:",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    useDevCsp ? '' : 'upgrade-insecure-requests',
    // Report CSP violations (optional - configure your reporting endpoint)
    // "report-uri /api/csp-report",
  ].filter(Boolean).join('; ');

  res.headers.set('Content-Security-Policy', cspDirectives);
  // Pass nonce to the application via header (for use in Script components)
  res.headers.set('X-CSP-Nonce', nonce);

  // Additional security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Permissions Policy
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', ');
  res.headers.set('Permissions-Policy', permissionsPolicy);

  // Cross-Origin Policies
  res.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  res.headers.set('X-DNS-Prefetch-Control', 'on');

  // ─── CORS ────────────────────────────────────────────────────────────────────
  // SECURITY FIX (SEC-007): Validate origin is a proper URL before reflecting
  // This prevents CORS bypass via malformed or malicious origin headers
  const origin = req.headers.get('origin') ?? '';
  const { ALLOWED_ORIGINS: allowed } = getEnv();

  if (origin && isValidCorsOrigin(origin, allowed)) {
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
