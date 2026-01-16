# Phase 0: Security Emergency

> **For LLMs**: This phase addresses all critical security vulnerabilities. Complete ALL tasks before moving to Phase 1.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | 🔴 Not Started |
| **Duration** | Week 1 |
| **Priority** | CRITICAL - Block all other work |
| **Issues Addressed** | P0-SEC-001 through P0-SEC-006, P1-SEC-001 |

---

## Issues in Scope

| ID | Issue | Severity | Est. Hours |
|----|-------|----------|------------|
| P0-SEC-001 | Secrets committed in .env.local | 🔴 Critical | 4h |
| P0-SEC-002 | API key revocation cache lag | 🔴 Critical | 8h |
| P0-SEC-003 | Path traversal in S3 CopySource | 🔴 Critical | 2h |
| P0-SEC-004 | Path traversal in local storage | 🔴 Critical | 4h |
| P0-SEC-005 | CSRF not validated on signout | 🔴 Critical | 2h |
| P0-SEC-006 | CSP allows unsafe-inline | 🔴 Critical | 8h |
| P1-SEC-001 | Missing PII encryption | 🟠 High | 16h |

**Total Estimated**: 44 hours

---

## Task 1: Rotate All Secrets (P0-SEC-001)

### Problem

The `.env.local` file is committed to the repository containing:
- JWT private/public keypair
- OAuth client secrets (Google, GitHub)
- Potentially other sensitive credentials

### Solution

1. Generate new secrets
2. Remove .env.local from repository
3. Clean git history
4. Set up secrets management

### Checklist

```markdown
### 1.1 Generate New Secrets
- [ ] Generate new JWT keypair:
      ```bash
      openssl genrsa -out jwt-private.pem 4096
      openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
      ```
- [ ] Generate new session secret:
      ```bash
      openssl rand -base64 32
      ```
- [ ] Regenerate Google OAuth credentials in Google Cloud Console
- [ ] Regenerate GitHub OAuth credentials in GitHub Developer Settings
- [ ] Generate new DATA_ENCRYPTION_KEY:
      ```bash
      openssl rand -base64 32
      ```

### 1.2 Remove from Repository
- [ ] Add to .gitignore:
      ```
      .env.local
      .env.*.local
      *.pem
      ```
- [ ] Remove from git tracking:
      ```bash
      git rm --cached .env.local
      git rm --cached starters/saaskit/.env.local
      ```
- [ ] Commit the removal

### 1.3 Clean Git History (IMPORTANT)
- [ ] Create backup of repository
- [ ] Run BFG Repo-Cleaner or git filter-branch:
      ```bash
      # Using BFG (recommended):
      bfg --delete-files .env.local
      git reflog expire --expire=now --all
      git gc --prune=now --aggressive

      # Force push (coordinate with team):
      git push --force --all
      ```
- [ ] Notify all team members to re-clone repository
- [ ] Verify .env.local not in any branch history

### 1.4 Set Up Secrets Management
- [ ] Choose secrets manager (AWS Secrets Manager / HashiCorp Vault / Doppler)
- [ ] Create secrets in production environment
- [ ] Update deployment scripts to pull secrets
- [ ] Update CI/CD to inject secrets
- [ ] Document secrets management procedure

### 1.5 Verification
- [ ] Search repository for any remaining secrets:
      ```bash
      git log -p --all -S 'BEGIN PRIVATE KEY' --source --all
      git log -p --all -S 'CLIENT_SECRET' --source --all
      ```
- [ ] Verify new secrets work in staging
- [ ] Verify old secrets are rejected
```

---

## Task 2: Fix API Key Revocation Cache (P0-SEC-002)

### Problem

**File**: `packages/foundation/gateway/src/auth/auth.ts`

When an API key is revoked, it remains valid for up to 5 minutes due to KV cache. This is a security vulnerability allowing revoked keys to continue accessing the system.

### Solution

Implement cache invalidation on revocation with immediate effect.

### Checklist

```markdown
### 2.1 Add Cache Invalidation
- [ ] Create `invalidateApiKeyCache()` function:
      ```typescript
      // packages/foundation/gateway/src/auth/auth.ts
      export async function invalidateApiKeyCache(keyHash: string): Promise<void> {
        const cacheKey = apiKeyLookupKey(keyHash);
        await kv.del(cacheKey);
        logger.info('API key cache invalidated', { keyHash: keyHash.slice(0, 8) });
      }
      ```

### 2.2 Emit Revocation Event
- [ ] Add event emission in API key revocation:
      ```typescript
      // packages/modules/identity/src/service/apiKeys.ts
      await events.emit('apiKey.revoked', {
        keyHash,
        scopeId,
        revokedAt: new Date()
      });
      ```

### 2.3 Register Event Handler
- [ ] Add handler to invalidate cache on revocation:
      ```typescript
      // packages/foundation/gateway/src/events/handlers.ts
      events.on('apiKey.revoked', async ({ keyHash }) => {
        await invalidateApiKeyCache(keyHash);
      });
      ```

### 2.4 Add Admin Endpoint
- [ ] Create `/api/admin/keys/:keyId/invalidate-cache` endpoint
- [ ] Protect with super-admin permission
- [ ] Log all invalidation requests

### 2.5 Update Documentation
- [ ] Document revocation latency (target: <60 seconds)
- [ ] Document cache invalidation API
- [ ] Update security runbook

### 2.6 Verification
- [ ] Test: Create API key, make request (should succeed)
- [ ] Test: Revoke key, make immediate request (should fail)
- [ ] Test: Verify cache entry deleted in KV
- [ ] Load test: Verify no performance regression
```

---

## Task 3: Fix S3 Path Traversal (P0-SEC-003)

### Problem

**File**: `packages/adapters/storage-s3/src/index.ts:232`

```typescript
// VULNERABLE: sourceKey not URL-encoded
CopySource: `${bucket}/${sourceKey}`
```

An attacker could craft a sourceKey like `../other-bucket/secret-file` to access files outside the intended bucket.

### Solution

URL-encode the sourceKey properly.

### Checklist

```markdown
### 3.1 Fix Path Construction
- [ ] Update copy operation:
      ```typescript
      // packages/adapters/storage-s3/src/index.ts
      async copy(sourceKey: string, destKey: string): Promise<void> {
        // Validate keys don't contain traversal patterns
        if (sourceKey.includes('..') || destKey.includes('..')) {
          throw new Error('Invalid key: path traversal not allowed');
        }

        // URL-encode the source key
        const encodedSource = encodeURIComponent(sourceKey);

        await this.client.send(new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${encodedSource}`,
          Key: destKey,
        }));
      }
      ```

### 3.2 Add Key Validation Utility
- [ ] Create shared validation function:
      ```typescript
      // packages/adapters/storage-s3/src/validation.ts
      export function validateStorageKey(key: string): void {
        if (!key || typeof key !== 'string') {
          throw new Error('Invalid storage key');
        }
        if (key.includes('..')) {
          throw new Error('Path traversal not allowed');
        }
        if (key.startsWith('/')) {
          throw new Error('Absolute paths not allowed');
        }
        if (key.includes('\0')) {
          throw new Error('Null bytes not allowed');
        }
      }
      ```

### 3.3 Apply to All Operations
- [ ] Add validation to `upload()`
- [ ] Add validation to `download()`
- [ ] Add validation to `delete()`
- [ ] Add validation to `copy()`
- [ ] Add validation to `getSignedUrl()`

### 3.4 Add Tests
- [ ] Test: Normal key works
- [ ] Test: Key with `..` throws
- [ ] Test: Key with `/` prefix throws
- [ ] Test: Key with null byte throws
- [ ] Test: URL-encoded traversal attempts fail

### 3.5 Security Review
- [ ] Have security team review the fix
- [ ] Document the vulnerability and fix
```

---

## Task 4: Fix Local Storage Path Traversal (P0-SEC-004)

### Problem

**File**: `packages/adapters/storage-local/src/index.ts:106`

```typescript
// INCOMPLETE: Doesn't handle all traversal patterns
path.normalize().replace(/^(\.\.(\/|\\|$))+/, '')
```

The regex-based approach can be bypassed with:
- Absolute paths: `/etc/passwd` or `C:\Windows\system.ini`
- Encoded traversal: `%2e%2e%2f`

### Solution

Use `path.relative()` and validate the result stays within basePath.

### Checklist

```markdown
### 4.1 Create Safe Path Resolution
- [ ] Implement secure path resolution:
      ```typescript
      // packages/adapters/storage-local/src/index.ts
      private resolveSafePath(key: string): string {
        // Normalize the key
        const normalizedKey = path.normalize(key);

        // Resolve against basePath
        const resolvedPath = path.resolve(this.basePath, normalizedKey);

        // Verify result is within basePath
        const relativePath = path.relative(this.basePath, resolvedPath);

        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          throw new Error('Path traversal attempt detected');
        }

        return resolvedPath;
      }
      ```

### 4.2 Apply to All Operations
- [ ] Update `upload()` to use `resolveSafePath()`
- [ ] Update `download()` to use `resolveSafePath()`
- [ ] Update `delete()` to use `resolveSafePath()`
- [ ] Update `exists()` to use `resolveSafePath()`
- [ ] Update `list()` to use `resolveSafePath()`

### 4.3 Add Input Validation
- [ ] Reject keys with null bytes
- [ ] Reject keys starting with `/` or drive letters
- [ ] Reject keys with `..` anywhere

### 4.4 Add Tests
- [ ] Test: `../../../etc/passwd` - should throw
- [ ] Test: `/etc/passwd` - should throw
- [ ] Test: `C:\Windows\system.ini` - should throw
- [ ] Test: `%2e%2e%2fetc/passwd` - should throw
- [ ] Test: `normal/path/file.txt` - should work
- [ ] Test: `path/with spaces/file.txt` - should work

### 4.5 Security Review
- [ ] Have security team review the fix
- [ ] Penetration test the fix
```

---

## Task 5: Add CSRF Validation (P0-SEC-005)

### Problem

**File**: `starters/saaskit/src/app/api/auth/signout/route.ts`

The signout endpoint doesn't validate CSRF tokens, allowing attackers to log users out via CSRF attacks (e.g., `<img src="/api/auth/signout">`).

### Solution

Add CSRF token validation to all state-changing cookie-auth endpoints.

### Checklist

```markdown
### 5.1 Identify Affected Endpoints
- [ ] `/api/auth/signout` - POST (state change)
- [ ] `/api/auth/csrf` - GET (token generation - OK)
- [ ] Any other cookie-based mutation endpoints

### 5.2 Add CSRF Validation
- [ ] Update signout route:
      ```typescript
      // starters/saaskit/src/app/api/auth/signout/route.ts
      import { validateCsrfToken } from '@/platform/csrf';

      export async function POST(req: NextRequest) {
        // Validate CSRF token
        const csrfToken = req.headers.get('x-csrf-token');
        const sessionToken = req.cookies.get('session')?.value;

        if (!csrfToken || !sessionToken) {
          return new Response(JSON.stringify({ error: 'CSRF token required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const isValid = await validateCsrfToken(csrfToken, sessionToken);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Proceed with signout...
      }
      ```

### 5.3 Update Frontend
- [ ] Ensure signout button includes CSRF token:
      ```typescript
      const handleSignout = async () => {
        const csrfToken = await getCsrfToken();
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
        });
      };
      ```

### 5.4 Add Tests
- [ ] Test: POST without CSRF token returns 403
- [ ] Test: POST with invalid CSRF token returns 403
- [ ] Test: POST with valid CSRF token succeeds
- [ ] Test: GET request (if accidentally exposed) fails

### 5.5 Documentation
- [ ] Document CSRF requirements for cookie-auth endpoints
- [ ] Update API documentation
```

---

## Task 6: Harden CSP (P0-SEC-006)

### Problem

**File**: `starters/saaskit/src/proxy.ts:44`

```typescript
// Production still allows 'unsafe-inline'
"script-src 'self' 'unsafe-inline' https://js.stripe.com https://unpkg.com"
```

This defeats CSP protection against XSS attacks.

### Solution

Use nonce-based CSP for inline scripts.

### Checklist

```markdown
### 6.1 Implement Nonce Generation
- [ ] Create nonce utility:
      ```typescript
      // starters/saaskit/src/lib/csp.ts
      import { randomBytes } from 'crypto';

      export function generateNonce(): string {
        return randomBytes(16).toString('base64');
      }
      ```

### 6.2 Update Middleware
- [ ] Generate nonce per request:
      ```typescript
      // starters/saaskit/src/proxy.ts
      const nonce = generateNonce();

      const cspDirectives = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
        `style-src 'self' 'nonce-${nonce}'`,
        // ... other directives
      ];

      // Pass nonce to response for use in templates
      res.headers.set('x-nonce', nonce);
      ```

### 6.3 Update Script Tags
- [ ] Add nonce to all inline scripts:
      ```tsx
      // In layout.tsx or pages
      export default function Layout({ children }) {
        const nonce = headers().get('x-nonce');
        return (
          <html>
            <head>
              <script nonce={nonce} src="https://js.stripe.com/v3/" />
            </head>
            <body>{children}</body>
          </html>
        );
      }
      ```

### 6.4 Update Style Tags
- [ ] Add nonce to inline styles if any
- [ ] Or move all styles to external files

### 6.5 Add CSP Violation Reporting
- [ ] Add report-uri directive:
      ```typescript
      "report-uri /api/csp-report"
      ```
- [ ] Create reporting endpoint:
      ```typescript
      // /api/csp-report/route.ts
      export async function POST(req: NextRequest) {
        const report = await req.json();
        logger.warn('CSP violation', report);
        return new Response(null, { status: 204 });
      }
      ```

### 6.6 Testing
- [ ] Test all pages load without CSP violations
- [ ] Test Stripe integration works
- [ ] Test any other third-party scripts
- [ ] Run security scanner to verify no bypass

### 6.7 Gradual Rollout
- [ ] Deploy with report-only mode first:
      ```typescript
      res.headers.set('Content-Security-Policy-Report-Only', csp);
      ```
- [ ] Monitor for violations
- [ ] Switch to enforcing mode after validation
```

---

## Task 7: Add PII Encryption (P1-SEC-001)

### Problem

Personally Identifiable Information (email, phone) is stored in plaintext in the database.

### Solution

Implement field-level encryption using the DATA_ENCRYPTION_KEY.

### Checklist

```markdown
### 7.1 Generate Encryption Key
- [ ] Generate 32-byte key:
      ```bash
      openssl rand -base64 32
      ```
- [ ] Store in secrets manager
- [ ] Add to environment variables

### 7.2 Implement Encryption Utilities
- [ ] Create encryption module:
      ```typescript
      // packages/foundation/kernel/src/crypto/encryption.ts
      import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

      const ALGORITHM = 'aes-256-gcm';

      export function encrypt(plaintext: string, key: Buffer): string {
        const iv = randomBytes(16);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:ciphertext (all base64)
        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
      }

      export function decrypt(ciphertext: string, key: Buffer): string {
        const [ivB64, authTagB64, encrypted] = ciphertext.split(':');

        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
      }
      ```

### 7.3 Create Search Tokens
- [ ] Implement blind index for searching:
      ```typescript
      export function createSearchToken(value: string, key: Buffer): string {
        return createHmac('sha256', key)
          .update(value.toLowerCase().trim())
          .digest('hex');
      }
      ```

### 7.4 Update User Schema
- [ ] Add encrypted fields:
      ```typescript
      interface UserDocument {
        email: string;              // Encrypted
        emailSearchToken: string;   // HMAC for lookup
        phone?: string;             // Encrypted
        phoneSearchToken?: string;  // HMAC for lookup
        // ...
      }
      ```

### 7.5 Update Repository Methods
- [ ] Encrypt on create/update
- [ ] Decrypt on read
- [ ] Use search tokens for queries

### 7.6 Migration
- [ ] Create migration script:
      ```typescript
      async function migrateUserPii() {
        const users = await db.collection('users').find({}).toArray();

        for (const user of users) {
          if (!user.emailSearchToken) {
            await db.collection('users').updateOne(
              { _id: user._id },
              {
                $set: {
                  email: encrypt(user.email, key),
                  emailSearchToken: createSearchToken(user.email, key),
                },
              }
            );
          }
        }
      }
      ```
- [ ] Run migration on staging
- [ ] Verify data integrity
- [ ] Run migration on production

### 7.7 Key Rotation Procedure
- [ ] Document key rotation process
- [ ] Create rotation script
- [ ] Test rotation on staging
```

---

## Verification

Run these checks after completing all tasks:

```bash
# 1. Verify secrets removed from git history
git log -p --all -S 'BEGIN PRIVATE KEY' --source --all
# Should return no results

# 2. Verify new secrets work
npm run test:auth
# Should pass

# 3. Verify API key revocation
npm run test:api-key-revocation
# Should complete within 60 seconds

# 4. Verify path traversal fixed
npm run test:storage-security
# Should pass all traversal tests

# 5. Verify CSRF protection
curl -X POST http://localhost:3000/api/auth/signout
# Should return 403

# 6. Verify CSP
curl -I http://localhost:3000 | grep Content-Security-Policy
# Should NOT contain 'unsafe-inline'

# 7. Verify PII encryption
npm run test:encryption
# Should pass
```

---

## Success Criteria

Phase 0 is complete when:

- [ ] All secrets rotated and old secrets invalidated
- [ ] Git history cleaned of secrets
- [ ] Secrets manager in use for production
- [ ] API keys revocable within 60 seconds
- [ ] No path traversal vulnerabilities (S3 + local)
- [ ] CSRF protection on all cookie-auth endpoints
- [ ] CSP enforced without `unsafe-inline`
- [ ] PII encrypted at rest
- [ ] All tests passing
- [ ] Security team sign-off

---

## Next Phase

After Phase 0 is complete, proceed to **[PHASE-1-BUGS.md](./PHASE-1-BUGS.md)** for critical bug fixes.

---

> **Last Updated**: 2025-01-16
