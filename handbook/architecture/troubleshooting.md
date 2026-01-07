# Troubleshooting Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

Common issues, debugging strategies, and solutions for the Unisane platform.

---

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Build Errors](#build-errors)
3. [Runtime Errors](#runtime-errors)
4. [Database Issues](#database-issues)
5. [Authentication Problems](#authentication-problems)
6. [API & Contract Errors](#api--contract-errors)
7. [Module & Import Issues](#module--import-issues)
8. [Performance Problems](#performance-problems)
9. [Deployment Issues](#deployment-issues)
10. [Debug Tools](#debug-tools)

---

## Quick Diagnosis

### Error Lookup Table

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Cannot find module '@unisane/...'` | Package not built or linked | Run `pnpm install && pnpm build` |
| `ctx.get() returned undefined` | Called outside ctx.run() | Wrap in `ctx.run()` or check middleware |
| `MONGODB_URI is not defined` | Missing env variable | Add to `.env.local` |
| `ERR_MODULE_NOT_FOUND` | ESM/CJS mismatch | Check `"type": "module"` in package.json |
| `TypeError: X is not a function` | Circular import | Refactor to break cycle |
| `Rate limit exceeded` | Too many requests | Check rate limit config or wait |
| `Unauthorized` | Missing/invalid auth | Check token and auth middleware |
| `Layer violation` | Import from higher layer | Fix import or restructure |

### First Steps

```bash
# 1. Check if all packages are built
pnpm build

# 2. Check for TypeScript errors
pnpm typecheck

# 3. Check for lint issues
pnpm lint

# 4. Verify env variables
cat .env.local | grep -v "^#" | grep -v "^$"

# 5. Check package dependencies
pnpm why @unisane/kernel
```

---

## Build Errors

### "Cannot find module '@unisane/...'"

**Cause:** Package not built or workspace link broken.

**Solution:**
```bash
# Rebuild all packages
pnpm build

# If still failing, clean and reinstall
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf packages/*/dist
pnpm install
pnpm build
```

### TypeScript: "Cannot find type definition"

**Cause:** Missing `@types/*` package or tsconfig issue.

**Solution:**
```bash
# Check if types are installed
pnpm why @types/node

# Add missing types
pnpm add -D @types/node

# Verify tsconfig extends correctly
cat tsconfig.json | grep "extends"
```

### "Duplicate identifier" Errors

**Cause:** Multiple versions of a package installed.

**Solution:**
```bash
# Check for duplicates
pnpm why typescript

# Force single version
pnpm dedupe

# Or add resolution in root package.json
{
  "pnpm": {
    "overrides": {
      "typescript": "^5.3.0"
    }
  }
}
```

### Turborepo Cache Issues

**Cause:** Stale cache causing incorrect builds.

**Solution:**
```bash
# Clear Turborepo cache
rm -rf .turbo
rm -rf node_modules/.cache

# Force rebuild without cache
pnpm build --force
```

### ESM/CJS Module Errors

**Error:** `ERR_REQUIRE_ESM` or `Must use import to load ES Module`

**Cause:** Mixing ESM and CJS modules.

**Solution:**
```json
// Ensure package.json has
{
  "type": "module"
}

// And tsconfig.json has
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

---

## Runtime Errors

### "ctx.get() returned undefined"

**Cause:** Service function called outside of request context.

**Solution:**
```typescript
// WRONG - No context
async function someHandler() {
  const { tenantId } = ctx.get(); // undefined!
}

// CORRECT - Wrapped in ctx.run()
async function someHandler(req: Request) {
  return ctx.run({ tenantId: "...", userId: "..." }, async () => {
    const { tenantId } = ctx.get(); // Works!
  });
}
```

**For testing:**
```typescript
import { createTestContext } from "@unisane/kernel/testing";

it("test with context", async () => {
  await createTestContext({ tenantId: "test" }, async () => {
    const result = await myService();
    expect(result).toBeDefined();
  });
});
```

### "Cannot read property 'X' of undefined"

**Debug steps:**
```typescript
// Add defensive checks
const { tenantId } = ctx.get() ?? {};
if (!tenantId) {
  throw new Error("Context not initialized");
}

// Add logging
logger.debug("Context state", { ctx: ctx.get() });
```

### Memory Leaks

**Symptoms:** Process memory grows continuously.

**Diagnosis:**
```bash
# Check Node.js memory
node --expose-gc -e "
  global.gc();
  console.log(process.memoryUsage());
"

# Profile with Chrome DevTools
node --inspect your-script.js
```

**Common causes:**
1. Event listeners not removed
2. MongoDB cursors not closed
3. Large objects cached indefinitely

**Solutions:**
```typescript
// Always close cursors
const cursor = collection.find({});
try {
  for await (const doc of cursor) {
    // process
  }
} finally {
  await cursor.close();
}

// Use WeakMap for caching
const cache = new WeakMap();
```

### Unhandled Promise Rejections

**Solution:**
```typescript
// Add global handler in app entry
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason: String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Always await promises
await someAsyncOperation(); // Not just someAsyncOperation()

// Or handle with catch
someAsyncOperation().catch((err) => {
  logger.error("Operation failed", { error: err });
});
```

---

## Database Issues

### "MongoServerError: connection pool cleared"

**Cause:** Connection dropped or pool exhausted.

**Solution:**
```typescript
// Increase pool size in connection string
const uri = "mongodb://...?maxPoolSize=50&minPoolSize=10";

// Add retry logic
const client = new MongoClient(uri, {
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 5000,
});
```

### Slow Queries

**Diagnosis:**
```typescript
// Enable query profiling
await db.command({ profile: 2, slowms: 100 });

// Check slow query log
const slowQueries = await db
  .collection("system.profile")
  .find({ millis: { $gt: 100 } })
  .toArray();
```

**Common fixes:**
```typescript
// 1. Add missing indexes
await collection.createIndex({ tenantId: 1, createdAt: -1 });

// 2. Use projection to limit fields
await collection.find({}, { projection: { _id: 1, name: 1 } });

// 3. Limit results
await collection.find({}).limit(100).toArray();
```

### "MongoServerError: E11000 duplicate key"

**Cause:** Unique constraint violation.

**Solution:**
```typescript
// Handle gracefully
try {
  await collection.insertOne(doc);
} catch (err) {
  if (err.code === 11000) {
    // Already exists - handle upsert or return existing
    return collection.findOne({ uniqueField: doc.uniqueField });
  }
  throw err;
}

// Or use upsert
await collection.updateOne(
  { uniqueField: value },
  { $setOnInsert: doc },
  { upsert: true }
);
```

### Redis Connection Errors

**Error:** `ECONNREFUSED` or `ETIMEDOUT`

**Solution:**
```typescript
// Check Redis is running
// redis-cli ping

// Add reconnect strategy
const redis = new Redis({
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: 3,
});

// Handle connection errors
redis.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});
```

---

## Authentication Problems

### "Unauthorized" on All Requests

**Checklist:**
1. Token present in header? `Authorization: Bearer <token>`
2. Token not expired?
3. `NEXTAUTH_SECRET` matches between environments?
4. Cookie domain correct for cross-subdomain?

**Debug:**
```typescript
// Log auth state
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  const session = await getServerSession();
  console.log("Session:", session);

  if (!session) {
    // Check raw token
    const token = req.headers.get("Authorization");
    console.log("Token header:", token);
  }
}
```

### Session Not Persisting

**Cause:** Cookie settings incorrect.

**Solution:**
```typescript
// next-auth config
export const authOptions = {
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: ".example.com", // Include dot for subdomains
      },
    },
  },
};
```

### OAuth Callback Errors

**Error:** "Callback URL mismatch"

**Solution:**
1. Check OAuth provider settings match `NEXTAUTH_URL`
2. Add all valid callback URLs in provider dashboard
3. Ensure no trailing slashes mismatch

```bash
# Correct
NEXTAUTH_URL=https://app.example.com

# Wrong
NEXTAUTH_URL=https://app.example.com/
```

---

## API & Contract Errors

### "Validation failed" Errors

**Cause:** Request doesn't match Zod schema.

**Debug:**
```typescript
// Log validation errors in handler
try {
  const parsed = schema.parse(body);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log("Validation errors:", err.errors);
    return Response.json({ errors: err.errors }, { status: 400 });
  }
}
```

### Route Handler Not Found

**Checklist:**
1. File in correct location? `app/api/v1/resource/route.ts`
2. Exported correct HTTP method? `export async function GET`
3. Path params correct? `app/api/v1/resource/[id]/route.ts`

**Debug:**
```bash
# List all route files
find app/api -name "route.ts" | sort
```

### SDK Type Errors After Contract Change

**Cause:** Generated code out of sync.

**Solution:**
```bash
# Regenerate SDK
pnpm sdk:gen

# Or full codegen
pnpm codegen
```

### Rate Limit Exceeded

**Debug:**
```typescript
// Check current rate limit state
const key = `ratelimit:${userId}`;
const count = await redis.get(key);
const ttl = await redis.ttl(key);
console.log(`Rate limit: ${count}, resets in ${ttl}s`);
```

**Temporary bypass (development only):**
```typescript
// Skip rate limit in development
if (process.env.NODE_ENV === "development") {
  return next();
}
```

---

## Module & Import Issues

### Layer Violation Errors

**Error:** "Cannot import from higher layer"

**Solution:**
```typescript
// WRONG - Layer 3 importing from Layer 5
// packages/tenants/src/service.ts
import { getBalance } from "@unisane/credits"; // ❌

// CORRECT - Use events instead
import { events } from "@unisane/kernel";
await events.emit("credits.balance.needed", { tenantId });
```

### Circular Import Errors

**Symptoms:** `undefined` imports or `TypeError: X is not a function`

**Diagnosis:**
```bash
# Find circular dependencies
npx madge --circular packages/*/src/index.ts
```

**Solutions:**
```typescript
// 1. Move shared code to lower layer
// Instead of A imports B, B imports A
// Create C that both import

// 2. Use lazy imports
export function getService() {
  const { SomeService } = require("./some-service");
  return SomeService;
}

// 3. Use type-only imports
import type { SomeType } from "./module"; // No runtime import
```

### Import Path After Build

**Error:** Works in dev, fails in production.

**Cause:** Path aliases not resolved.

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// next.config.js - paths should work automatically
// For other builds, use tsconfig-paths or bundler alias
```

---

## Performance Problems

### Slow API Response Times

**Diagnosis:**
```typescript
// Add timing logs
const start = performance.now();
const result = await heavyOperation();
const duration = performance.now() - start;
logger.info("Operation timing", { operation: "heavyOperation", durationMs: duration });
```

**Common fixes:**
1. Add database indexes
2. Implement caching
3. Use pagination
4. Optimize N+1 queries

```typescript
// N+1 Problem
for (const user of users) {
  user.tenant = await getTenant(user.tenantId); // BAD: N queries
}

// Solution: Batch load
const tenantIds = users.map((u) => u.tenantId);
const tenants = await getTenantsByIds(tenantIds);
const tenantMap = new Map(tenants.map((t) => [t.id, t]));
users.forEach((u) => (u.tenant = tenantMap.get(u.tenantId)));
```

### High Memory Usage

**Diagnosis:**
```bash
# Check process memory
ps aux | grep node

# Profile heap
node --inspect --expose-gc server.js
# Then connect Chrome DevTools
```

**Solutions:**
```typescript
// 1. Stream large data instead of loading all
const cursor = collection.find({});
for await (const doc of cursor) {
  await process(doc); // Process one at a time
}

// 2. Use pagination
async function* paginate(query, pageSize = 100) {
  let cursor;
  do {
    const page = await query.limit(pageSize).skip(cursor).toArray();
    yield* page;
    cursor = page.length === pageSize ? cursor + pageSize : null;
  } while (cursor);
}

// 3. Clear large objects
let bigData = await loadBigData();
processData(bigData);
bigData = null; // Allow GC
```

### Cold Start Issues (Serverless)

**Solutions:**
```typescript
// 1. Lazy load heavy modules
let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

// 2. Keep connections warm
// vercel.json
{
  "crons": [
    { "path": "/api/health", "schedule": "*/5 * * * *" }
  ]
}

// 3. Reduce bundle size
// next.config.js
{
  experimental: {
    optimizePackageImports: ["@unisane/ui"]
  }
}
```

---

## Deployment Issues

### Build Fails on Vercel

**Common causes:**

1. **Memory limit:**
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024
    }
  }
}
```

2. **Missing env vars:**
```bash
# Check Vercel env vars match local
vercel env ls
```

3. **Node version mismatch:**
```json
// package.json
{
  "engines": {
    "node": ">=20"
  }
}
```

### Environment Variables Not Loading

**Checklist:**
1. `.env.local` exists and has values
2. Variables prefixed correctly (`NEXT_PUBLIC_` for client)
3. Vercel/platform env vars configured
4. No quotes issues: `KEY=value` not `KEY="value"`

**Debug:**
```typescript
// Log env state (don't commit!)
console.log("ENV CHECK:", {
  NODE_ENV: process.env.NODE_ENV,
  HAS_DB: !!process.env.MONGODB_URI,
  HAS_REDIS: !!process.env.REDIS_URL,
});
```

### Docker Container Crashes

**Debug:**
```bash
# Check logs
docker logs container-name

# Run interactively
docker run -it --entrypoint /bin/sh image-name

# Check if env vars passed
docker run --env-file .env image-name
```

**Common fixes:**
```dockerfile
# Ensure proper signal handling
CMD ["node", "server.js"]
# Not: CMD node server.js (shell form)

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

---

## Debug Tools

### Logging

```typescript
// Enable debug logging
// Set env: DEBUG=unisane:*

import { logger } from "@unisane/kernel";

// Structured logging
logger.debug("Operation details", {
  tenantId,
  userId,
  operation: "createTenant",
  input: JSON.stringify(input),
});

// Performance timing
logger.info("Query timing", {
  query: "findTenants",
  durationMs: 123,
  resultCount: 50,
});
```

### Request Tracing

```typescript
// Add request ID to all logs
ctx.run({ requestId: crypto.randomUUID() }, async () => {
  const { requestId } = ctx.get();
  logger.info("Request started", { requestId });

  // All subsequent logs include requestId
  await someOperation();

  logger.info("Request completed", { requestId });
});
```

### Database Query Logging

```typescript
// Enable MongoDB command monitoring
const client = new MongoClient(uri, {
  monitorCommands: true,
});

client.on("commandStarted", (event) => {
  console.log(`Command ${event.commandName} started`);
});

client.on("commandSucceeded", (event) => {
  console.log(`Command ${event.commandName} succeeded in ${event.duration}ms`);
});

client.on("commandFailed", (event) => {
  console.log(`Command ${event.commandName} failed: ${event.failure}`);
});
```

### Local Development Tips

```bash
# Watch mode for packages
pnpm dev

# Run specific package tests
pnpm --filter @unisane/tenants test

# Debug with VS Code
# .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Getting Help

If you can't solve an issue:

1. **Check existing issues:** Search the repo for similar problems
2. **Gather info:** Error message, stack trace, reproduction steps
3. **Minimal reproduction:** Create smallest example that shows the bug
4. **Ask with context:** Include Node version, OS, and relevant config

```bash
# Gather system info
node -v
pnpm -v
cat package.json | jq '.dependencies'
```

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [deployment.md](./deployment.md), [testing.md](./testing.md)
