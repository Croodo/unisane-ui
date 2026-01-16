# Phase 3: Type Safety

> **For LLMs**: This phase addresses type safety issues including type assertions, race conditions, and import patterns.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | 🔴 Not Started |
| **Duration** | Week 5 |
| **Dependencies** | Phase 0, 1, 2 complete |
| **Issues Addressed** | P1-TYPE-001, P1-BUG-002, P1-BUG-005, P1-RACE-001, P2-SEC-001 |

---

## Issues in Scope

| ID | Issue | Severity | Est. Hours |
|----|-------|----------|------------|
| P1-TYPE-001 | Type assertions (as unknown) in 42 files | 🟠 High | 16h |
| P1-BUG-002 | Dynamic require in outbox | 🟠 High | 2h |
| P1-BUG-005 | Import regex too simplistic in devtools | 🟠 High | 8h |
| P1-RACE-001 | Membership seat limit race condition | 🟠 High | 8h |
| P2-SEC-001 | Email regex too permissive | 🟡 Medium | 4h |

**Total Estimated**: 38 hours

---

## Task 1: Audit and Fix Type Assertions (P1-TYPE-001)

### Problem

42 files contain `as unknown` or `as any` type assertions, which bypass TypeScript's type checking and can hide bugs.

### Solution

Audit all type assertions, fix fixable ones, document necessary ones.

### Checklist

```markdown
### 1.1 Generate Full Audit
- [ ] Find all type assertions:
      ```bash
      grep -rn "as unknown\|as any" packages/ --include="*.ts" > type-assertions.txt
      ```
- [ ] Categorize by type:
      - Fixable: Can be replaced with proper types
      - Necessary: Required for dynamic operations (document why)
      - Generated: In generated code (acceptable)

### 1.2 Fix Database Layer Assertions
- [ ] Fix document type assertions:
      ```typescript
      // Before
      const doc = result as unknown as UserDocument;

      // After - Use generic repository
      const doc = await userRepository.findById<UserDocument>(id);
      ```
- [ ] Add proper generics to repository methods

### 1.3 Fix Auth Context Assertions
- [ ] Create proper types for auth context:
      ```typescript
      // packages/foundation/gateway/src/auth/types.ts
      export interface AuthContext {
        isAuthed: boolean;
        userId: string | null;
        tenantId: string | null;
        apiKeyId: string | null;
        role: Role | null;
        permissions: Permission[];
        isSuperAdmin: boolean;
      }

      // Use type guards instead of assertions
      export function isAuthenticated(ctx: AuthContext): ctx is AuthenticatedContext {
        return ctx.isAuthed && ctx.userId !== null;
      }
      ```

### 1.4 Fix Event Handler Assertions
- [ ] Use discriminated unions:
      ```typescript
      // Before
      const payload = event.data as unknown as TenantCreatedPayload;

      // After
      if (event.type === 'tenant.created') {
        // TypeScript knows payload type from discriminated union
        const payload = event.data; // Properly typed
      }
      ```

### 1.5 Document Necessary Assertions
- [ ] For each necessary assertion, add JSDoc:
      ```typescript
      /**
       * Type assertion required because:
       * - Dynamic import returns unknown module shape
       * - Validated at runtime via Zod schema
       * @see ZRouterModule for validation schema
       */
      const router = module.default as unknown as AppRouter;
      ```

### 1.6 Enable Stricter TypeScript Options
- [ ] Update tsconfig.json:
      ```json
      {
        "compilerOptions": {
          "strict": true,
          "noImplicitAny": true,
          "strictNullChecks": true,
          "noUncheckedIndexedAccess": true
        }
      }
      ```

### 1.7 Add ESLint Rules
- [ ] Add rules to flag new assertions:
      ```javascript
      // .eslintrc.js
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
      }
      ```

### 1.8 Track Progress
- [ ] Create tracking spreadsheet:
      | File | Line | Current | Fixed | Notes |
      |------|------|---------|-------|-------|
      | auth.ts | 45 | as unknown | ✅ | Used type guard |
      | db.ts | 102 | as any | 📝 | Required for dynamic |
```

---

## Task 2: Fix Dynamic Require in Outbox (P1-BUG-002)

### Problem

**File**: `packages/adapters/outbox-mongodb/src/index.ts:69-76`

```typescript
// Dynamic require instead of static import
const { ObjectId } = require('mongodb');
```

This causes issues with ESM/CJS compatibility and bundlers.

### Solution

Use static imports with proper ESM configuration.

### Checklist

```markdown
### 2.1 Convert to Static Import
- [ ] Update import:
      ```typescript
      // packages/adapters/outbox-mongodb/src/index.ts

      // Before
      function toObjectId(id: string): unknown {
        const { ObjectId } = require('mongodb');
        return new ObjectId(id);
      }

      // After
      import { ObjectId } from 'mongodb';

      function toObjectId(id: string): ObjectId {
        return new ObjectId(id);
      }
      ```

### 2.2 Update Package Configuration
- [ ] Ensure package.json has correct type:
      ```json
      {
        "type": "module",
        "exports": {
          ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts"
          }
        }
      }
      ```

### 2.3 Update Build Configuration
- [ ] Ensure tsup/build config outputs ESM:
      ```typescript
      // tsup.config.ts
      export default {
        format: ['esm'],
        target: 'node18',
        // ...
      };
      ```

### 2.4 Test Import
- [ ] Verify import works in:
      - ESM context
      - Node.js directly
      - Next.js bundler
      - Test environment

### 2.5 Search for Other Dynamic Requires
- [ ] Find all dynamic requires:
      ```bash
      grep -rn "require(" packages/ --include="*.ts"
      ```
- [ ] Convert any found to static imports
```

---

## Task 3: Fix Import Regex in Devtools (P1-BUG-005)

### Problem

**File**: `packages/tooling/devtools/src/extraction/router-parser.ts:14`

```typescript
const regex = /import\s+\{\s*(\w+)\s*\}\s+from/;
```

This simple regex fails for:
- Multi-line imports
- Default imports
- Namespace imports
- Multiple named imports

### Solution

Use ts-morph for proper TypeScript AST parsing.

### Checklist

```markdown
### 3.1 Add ts-morph Dependency
- [ ] Install ts-morph:
      ```bash
      cd packages/tooling/devtools
      pnpm add ts-morph
      ```

### 3.2 Create AST-Based Import Parser
- [ ] Replace regex with ts-morph:
      ```typescript
      // packages/tooling/devtools/src/extraction/router-parser.ts
      import { Project, SyntaxKind } from 'ts-morph';

      export interface ImportInfo {
        name: string;
        alias?: string;
        moduleSpecifier: string;
        isDefault: boolean;
        isNamespace: boolean;
      }

      export function parseImports(filePath: string): ImportInfo[] {
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(filePath);
        const imports: ImportInfo[] = [];

        for (const importDecl of sourceFile.getImportDeclarations()) {
          const moduleSpecifier = importDecl.getModuleSpecifierValue();

          // Handle default import
          const defaultImport = importDecl.getDefaultImport();
          if (defaultImport) {
            imports.push({
              name: defaultImport.getText(),
              moduleSpecifier,
              isDefault: true,
              isNamespace: false,
            });
          }

          // Handle namespace import
          const namespaceImport = importDecl.getNamespaceImport();
          if (namespaceImport) {
            imports.push({
              name: namespaceImport.getText(),
              moduleSpecifier,
              isDefault: false,
              isNamespace: true,
            });
          }

          // Handle named imports
          for (const namedImport of importDecl.getNamedImports()) {
            imports.push({
              name: namedImport.getName(),
              alias: namedImport.getAliasNode()?.getText(),
              moduleSpecifier,
              isDefault: false,
              isNamespace: false,
            });
          }
        }

        return imports;
      }
      ```

### 3.3 Update Router Parser
- [ ] Use new import parser in router parsing:
      ```typescript
      export function parseRouterFile(filePath: string): RouterInfo {
        const imports = parseImports(filePath);

        // Build import map
        const importMap = new Map<string, string>();
        for (const imp of imports) {
          importMap.set(imp.alias ?? imp.name, imp.moduleSpecifier);
        }

        // ... rest of parsing
      }
      ```

### 3.4 Handle Edge Cases
- [ ] Multi-line imports:
      ```typescript
      import {
        foo,
        bar,
        baz,
      } from './module';
      ```
- [ ] Type-only imports:
      ```typescript
      import type { Foo } from './types';
      ```
- [ ] Side-effect imports:
      ```typescript
      import './polyfill';
      ```

### 3.5 Add Tests
- [ ] Test: Single named import
- [ ] Test: Multiple named imports
- [ ] Test: Multi-line imports
- [ ] Test: Default import
- [ ] Test: Namespace import
- [ ] Test: Aliased imports
- [ ] Test: Type-only imports
- [ ] Test: Mixed imports in one declaration
```

---

## Task 4: Fix Membership Seat Limit Race Condition (P1-RACE-001)

### Problem

**File**: `packages/modules/identity/src/service/membership.ts:42-60`

```typescript
// Check seat count
const activeSeats = page.items.filter(m => m.roles.length > 0);
if (activeSeats.length >= maxSeats) {
  throw ERR.forbidden('Seat limit exceeded');
}
// ... time passes (race window) ...
await membershipsRepository.addRole(...);  // Another request could pass check too
```

### Solution

Use distributed locking to ensure atomic seat limit checking.

### Checklist

```markdown
### 4.1 Create Seat Limit Lock
- [ ] Implement distributed lock:
      ```typescript
      // packages/modules/identity/src/service/membership.ts
      import { acquireLock, releaseLock } from '@unisane/kernel';

      export async function addMemberRole(args: AddMemberRoleArgs) {
        const scopeId = getScopeId();
        const lockKey = `seat-limit:${scopeId}`;

        // Acquire lock with timeout
        const lock = await acquireLock(lockKey, {
          ttlMs: 5000,      // Lock expires after 5s
          retryMs: 100,     // Retry every 100ms
          maxRetries: 50,   // Give up after 5s
        });

        if (!lock) {
          throw ERR.conflict('Unable to acquire seat limit lock. Please retry.');
        }

        try {
          // Check seat count (now protected by lock)
          const ent = await resolveEntitlements(scopeId);
          const maxSeats = ent.seats ?? Infinity;

          const page = await membershipsRepository.listByScope(scopeId, maxSeats + 1);
          const activeSeats = page.items.filter(m => m.roles.length > 0);

          if (activeSeats.length >= maxSeats) {
            throw ERR.forbidden(
              `Seat limit exceeded. Current: ${activeSeats.length}, Max: ${maxSeats}`
            );
          }

          // Add role (now safe)
          const result = await membershipsRepository.addRole(args);

          return result;
        } finally {
          await releaseLock(lockKey, lock);
        }
      }
      ```

### 4.2 Implement Lock Utilities in Kernel
- [ ] Create lock utilities:
      ```typescript
      // packages/foundation/kernel/src/locks/distributed-lock.ts
      export interface LockOptions {
        ttlMs: number;
        retryMs?: number;
        maxRetries?: number;
      }

      export interface Lock {
        key: string;
        token: string;
        expiresAt: number;
      }

      export async function acquireLock(
        key: string,
        options: LockOptions
      ): Promise<Lock | null> {
        const token = randomUUID();
        const { ttlMs, retryMs = 100, maxRetries = 10 } = options;

        for (let i = 0; i < maxRetries; i++) {
          const acquired = await kv.set(
            `lock:${key}`,
            token,
            { NX: true, PX: ttlMs }
          );

          if (acquired) {
            return {
              key,
              token,
              expiresAt: Date.now() + ttlMs,
            };
          }

          await sleep(retryMs);
        }

        return null;
      }

      export async function releaseLock(key: string, lock: Lock): Promise<boolean> {
        // Only release if we own the lock (check token)
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;

        const result = await kv.eval(script, [`lock:${key}`], [lock.token]);
        return result === 1;
      }
      ```

### 4.3 Alternative: Atomic Increment with Rollback
- [ ] If Redis scripting not available:
      ```typescript
      export async function addMemberRoleAtomic(args: AddMemberRoleArgs) {
        const scopeId = getScopeId();

        // Atomic increment of seat counter
        const counterKey = `seats:${scopeId}`;
        const ent = await resolveEntitlements(scopeId);
        const maxSeats = ent.seats ?? Infinity;

        const newCount = await kv.incr(counterKey);

        if (newCount > maxSeats) {
          // Rollback
          await kv.decr(counterKey);
          throw ERR.forbidden(`Seat limit exceeded. Max: ${maxSeats}`);
        }

        try {
          const result = await membershipsRepository.addRole(args);
          return result;
        } catch (error) {
          // Rollback on failure
          await kv.decr(counterKey);
          throw error;
        }
      }
      ```

### 4.4 Add Tests
- [ ] Test: Single add within limit succeeds
- [ ] Test: Single add at limit fails
- [ ] Test: Concurrent adds - only maxSeats succeed
- [ ] Test: Lock timeout releases lock
- [ ] Test: Failed add doesn't consume seat
```

---

## Task 5: Improve Email Validation (P2-SEC-001)

### Problem

**File**: `packages/foundation/kernel/src/value-objects/email.ts`

```typescript
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

This regex accepts invalid emails like `a@b.c` and rejects valid ones with special characters.

### Solution

Use a proper email validation library or RFC 5322 compliant regex.

### Checklist

```markdown
### 5.1 Option A: Use Validation Library
- [ ] Install email-validator:
      ```bash
      pnpm add email-validator
      ```
- [ ] Update Email value object:
      ```typescript
      // packages/foundation/kernel/src/value-objects/email.ts
      import * as EmailValidator from 'email-validator';

      export class Email {
        private constructor(private readonly value: string) {}

        static create(input: string): Email {
          const normalized = input.toLowerCase().trim();

          if (!EmailValidator.validate(normalized)) {
            throw new ValidationError(`Invalid email format: ${input}`);
          }

          return new Email(normalized);
        }

        static tryCreate(input: string): Email | null {
          try {
            return Email.create(input);
          } catch {
            return null;
          }
        }
      }
      ```

### 5.2 Option B: RFC 5322 Regex
- [ ] Use comprehensive regex:
      ```typescript
      // RFC 5322 compliant (simplified)
      const EMAIL_PATTERN = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
      ```

### 5.3 Update Zod Schema
- [ ] Update email schema:
      ```typescript
      // packages/foundation/kernel/src/schemas/common.ts
      export const ZEmail = z.string()
        .email('Invalid email format')
        .transform(v => v.toLowerCase().trim())
        .refine(
          v => Email.tryCreate(v) !== null,
          'Email validation failed'
        );
      ```

### 5.4 Add Test Cases
- [ ] Valid emails to accept:
      - `user@example.com`
      - `user.name@example.com`
      - `user+tag@example.com`
      - `user@subdomain.example.com`
      - `"quoted string"@example.com` (RFC valid)
- [ ] Invalid emails to reject:
      - `plainaddress`
      - `@missing-local.com`
      - `missing@domain`
      - `two@@at.com`
      - `spaces in@email.com`

### 5.5 Consider IDN Support
- [ ] For international domains:
      ```typescript
      import { toASCII } from 'punycode';

      function normalizeEmail(email: string): string {
        const [local, domain] = email.split('@');
        const asciiDomain = toASCII(domain);
        return `${local}@${asciiDomain}`;
      }
      ```
```

---

## Verification

Run these checks after completing all tasks:

```bash
# 1. Type assertions count reduced
grep -rn "as unknown\|as any" packages/ --include="*.ts" | wc -l
# Should be significantly reduced (document remaining)

# 2. No dynamic requires
grep -rn "require(" packages/ --include="*.ts" --exclude-dir="node_modules" | wc -l
# Should be 0

# 3. TypeScript strict mode
npm run typecheck
# Should pass with strict options

# 4. Import parsing
npm run test:devtools:imports
# All import patterns handled

# 5. Race condition
npm run test:membership:concurrent
# Only maxSeats succeed

# 6. Email validation
npm run test:email
# All test cases pass
```

---

## Success Criteria

Phase 3 is complete when:

- [ ] Type assertions audited and documented
- [ ] Fixable type assertions converted to proper types
- [ ] Necessary assertions have JSDoc documentation
- [ ] No dynamic requires in production code
- [ ] Devtools handles all import patterns
- [ ] Seat limit race condition fixed with distributed lock
- [ ] Email validation RFC compliant
- [ ] TypeScript strict mode enabled
- [ ] All tests passing

---

## Next Phase

After Phase 3 is complete, proceed to **[PHASE-4-OBSERVABILITY.md](./PHASE-4-OBSERVABILITY.md)** for observability improvements.

---

> **Last Updated**: 2025-01-16
