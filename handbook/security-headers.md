# Security Headers Configuration

This document explains the security headers implemented in the application and their purpose.

## Overview

Security headers are HTTP response headers that instruct browsers to enable various security protections. Our implementation aims for an **A+ rating** on [securityheaders.com](https://securityheaders.com).

## Implemented Headers

### 1. Content-Security-Policy (CSP)

**Purpose**: Primary defense against Cross-Site Scripting (XSS) attacks.

**Configuration**:
```
default-src 'self'
script-src 'self' 'unsafe-inline' https://js.stripe.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: https: blob:
font-src 'self' data:
connect-src 'self' https://api.stripe.com
frame-src https://js.stripe.com https://hooks.stripe.com
worker-src 'self' blob:
object-src 'none'
form-action 'self'
frame-ancestors 'none'
base-uri 'self'
upgrade-insecure-requests (production only)
```

**Directives Explained**:
- `default-src 'self'`: By default, only load resources from same origin
- `script-src`: Allow scripts from self, inline scripts (Next.js), and Stripe.js
- `style-src 'unsafe-inline'`: Required for Tailwind CSS and styled components
- `img-src data: https:`: Allow images from data URIs and HTTPS sources
- `frame-src`: Allow Stripe payment iframes
- `connect-src`: Allow API calls to self and Stripe
- `object-src 'none'`: Block Flash, Java applets, etc.
- `frame-ancestors 'none'`: Prevent page from being embedded in iframes
- `upgrade-insecure-requests`: Automatically upgrade HTTP requests to HTTPS

**Known Issues**:
- ⚠️ `'unsafe-inline'` in `script-src`: Required for Next.js hydration. Consider nonce-based CSP for production.
- ⚠️ `'unsafe-eval'` in development: Required for Next.js hot reloading. Removed in production.

**Improvement Roadmap**:
1. Implement nonce-based CSP for script-src (Next.js 13+ supports this)
2. Remove unsafe-eval from production builds
3. Add CSP violation reporting endpoint

### 2. Strict-Transport-Security (HSTS)

**Purpose**: Force HTTPS connections and prevent protocol downgrade attacks.

**Configuration**: `max-age=31536000; includeSubDomains; preload`

**Explanation**:
- `max-age=31536000`: Remember HTTPS preference for 1 year
- `includeSubDomains`: Apply HTTPS to all subdomains
- `preload`: Eligible for browser HSTS preload lists

**Note**: Only applied in production. Ineffective over HTTP connections.

**HSTS Preload**: To submit domain to [hstspreload.org](https://hstspreload.org), ensure:
1. Valid certificate
2. Redirect all HTTP traffic to HTTPS
3. Serve HSTS header on base domain
4. max-age >= 31536000 (1 year)
5. includeSubDomains present
6. preload directive present

### 3. X-Frame-Options

**Purpose**: Prevent clickjacking attacks by controlling iframe embedding.

**Configuration**: `DENY`

**Options**:
- `DENY`: Cannot be embedded in any iframe (most secure)
- `SAMEORIGIN`: Can be embedded only by same-origin pages
- `ALLOW-FROM uri`: Can be embedded by specific URI (deprecated)

**Current Setting**: `DENY` - Maximum protection against clickjacking.

**Change If**: You need to embed your app in iframes (e.g., widget use case). In that case, use `SAMEORIGIN` or rely solely on CSP's `frame-ancestors` directive.

### 4. X-Content-Type-Options

**Purpose**: Prevent MIME type sniffing attacks.

**Configuration**: `nosniff`

**Explanation**: Forces browser to respect the `Content-Type` header instead of trying to guess the content type. Prevents browser from executing files with incorrect MIME types.

**Attack Scenario Prevented**: Attacker uploads a file claiming to be an image but containing JavaScript. Without this header, old browsers might execute the JavaScript.

### 5. X-XSS-Protection

**Purpose**: Enable browser's built-in XSS filter (legacy protection).

**Configuration**: `1; mode=block`

**Explanation**:
- `1`: Enable XSS filter
- `mode=block`: Block page completely instead of sanitizing

**Note**: Deprecated in modern browsers (Chrome, Firefox, Edge use CSP instead). Kept for defense-in-depth and legacy browser support.

### 6. Referrer-Policy

**Purpose**: Control how much referrer information is sent with requests.

**Configuration**: `strict-origin-when-cross-origin`

**Explanation**:
- Same-origin requests: Send full URL as referrer
- Cross-origin HTTPS→HTTPS: Send only origin (no path)
- Cross-origin HTTPS→HTTP: Send nothing (prevent leaking)

**Options**:
- `no-referrer`: Never send referrer (best privacy, may break analytics)
- `strict-origin-when-cross-origin`: Balanced approach (recommended)
- `no-referrer-when-downgrade`: Default browser behavior

### 7. Permissions-Policy

**Purpose**: Control which browser features and APIs can be used.

**Configuration**:
```
geolocation=(), microphone=(), camera=(),
payment=(self), usb=(), magnetometer=(),
gyroscope=(), accelerometer=()
```

**Explanation**:
- `geolocation=()`: Deny geolocation access
- `camera=()`: Deny camera access
- `microphone=()`: Deny microphone access
- `payment=(self)`: Allow Payment Request API only on same origin
- Other sensors denied to prevent tracking

**Customize If**: Your app needs access to device features (e.g., video chat app needs camera/microphone).

### 8. Cross-Origin Policies

**Purpose**: Provide better isolation between origins.

**Configuration**:
- `Cross-Origin-Embedder-Policy: unsafe-none`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `Cross-Origin-Resource-Policy: same-site`

**Explanation**:
- **COEP**: Controls loading of cross-origin resources. Set to `unsafe-none` (permissive) to avoid breaking third-party integrations.
- **COOP**: Isolates browsing context. `same-origin-allow-popups` prevents window references across origins while allowing OAuth popups.
- **CORP**: Controls cross-origin resource loading. `same-site` allows same-site but blocks cross-origin.

**Stricter Settings** (for high-security apps):
- `Cross-Origin-Embedder-Policy: require-corp` (enables SharedArrayBuffer)
- `Cross-Origin-Opener-Policy: same-origin` (full isolation)
- `Cross-Origin-Resource-Policy: same-origin` (strictest)

### 9. X-DNS-Prefetch-Control

**Purpose**: Control DNS prefetching behavior.

**Configuration**: `on`

**Explanation**: Allows browser to prefetch DNS for external links. Improves performance at minimal privacy cost.

**Trade-off**:
- `on`: Better performance (faster external link clicks)
- `off`: Better privacy (no prefetch requests)

## Testing Security Headers

### Local Testing

Start dev server and test headers:

```bash
# Start server
pnpm --filter saaskit dev

# Test headers
curl -I http://localhost:3000 | grep -i "content-security-policy\|x-frame-options\|strict-transport"
```

### Production Testing

Use [securityheaders.com](https://securityheaders.com) to scan your deployment:

```bash
# Target rating: A+
https://securityheaders.com/?q=https://your-domain.com
```

**Expected Score**: A+ rating

**Common Issues**:
- Missing HSTS: Only works over HTTPS
- CSP too permissive: Remove unsafe directives if possible
- Missing headers: Check middleware is applied correctly

## CSP Violation Reporting

To monitor CSP violations in production, add a `report-uri` or `report-to` directive:

```typescript
// Add to CSP directives in middleware.ts
"report-uri https://your-domain.com/api/csp-report"
```

Create a reporting endpoint:

```typescript
// src/app/api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json();
  console.error('CSP Violation:', report);
  // Store in database or send to monitoring service
  return new Response(null, { status: 204 });
}
```

## Troubleshooting

### CSP Errors in Browser Console

**Symptom**: Console shows "refused to load" or "violated Content Security Policy"

**Solutions**:
1. Check which resource is blocked
2. Add domain to appropriate CSP directive
3. For inline scripts, use nonces instead of unsafe-inline
4. For eval usage, find alternative implementation

### HSTS Not Working

**Cause**: HSTS only works over HTTPS

**Solution**:
1. Ensure app is served over HTTPS
2. Check certificate is valid
3. HSTS header is ignored on HTTP

### Headers Not Applied

**Check**:
1. Middleware file exists at `src/middleware.ts`
2. Matcher configuration is correct
3. Route matches middleware pattern
4. Build and restart Next.js server

## Security Header Updates

When adding new third-party integrations:

1. **Test in development** with strict CSP
2. **Check browser console** for CSP violations
3. **Update CSP directives** to allow necessary domains
4. **Document changes** in this file with rationale
5. **Test on securityheaders.com** after deployment

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Security Headers Scanner](https://securityheaders.com)
- [HSTS Preload](https://hstspreload.org/)
