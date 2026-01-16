# Phase 6: Polish & Documentation

> **Priority**: P3 | **Estimated Hours**: 72h | **Week**: 9

---

## Overview

This phase addresses low-priority improvements, documentation gaps, and final polish items that improve developer experience and long-term maintainability but aren't blocking production readiness.

---

## Prerequisites

- [x] Phase 5 (Completeness) 100% complete
- [x] All P0, P1, P2 issues resolved (except 2 deferred security items)
- [ ] E2E tests passing

---

## Issues in This Phase

| ID | Issue | Est. Hours | Status |
|----|-------|------------|--------|
| P3-DOC-001 | Missing API documentation | 12h | ✅ Already exists (`/api/docs`) |
| P3-DOC-002 | Outdated ARCHITECTURE docs | 8h | ✅ Complete |
| P3-DOC-003 | Missing runbook for operations | 10h | ✅ Complete (`OPERATIONS/`) |
| P3-CODE-001 | Inconsistent error message formats | 6h | ✅ Already consistent (`ErrorCatalog`) |
| P3-CODE-002 | Dead code cleanup | 4h | ✅ Complete (removed outdated TODOs) |
| P3-CODE-003 | Test coverage gaps | 16h | ⬜ Deferred (significant effort) |
| P3-DX-001 | Devtools customization improvements | 8h | ✅ Already exists (`defineConfig()`) |
| P3-DX-002 | Better error messages in CLI | 4h | ✅ Already exists (`cli-core/errors.ts`) |
| P3-API-001 | API versioning strategy | 4h | ✅ Already implemented (`versioning.ts`) |

---

## Task 1: API Documentation (P3-DOC-001)

### Problem
API endpoints lack comprehensive documentation for external consumers.

### Solution
Generate OpenAPI documentation from ts-rest contracts.

### Implementation

#### 1.1 Install OpenAPI Generator

```bash
npm install @ts-rest/open-api -w @unisane/gateway
```

#### 1.2 Create OpenAPI Generation Script

```typescript
// packages/gateway/src/openapi/generator.ts
import { generateOpenApi } from '@ts-rest/open-api';
import { apiContract } from '@unisane/contracts';

export function generateApiDocs() {
  return generateOpenApi(apiContract, {
    info: {
      title: 'Unisane API',
      version: '1.0.0',
      description: 'Unisane SaaS Platform API',
    },
    servers: [
      {
        url: 'https://api.unisane.com',
        description: 'Production',
      },
      {
        url: 'https://staging-api.unisane.com',
        description: 'Staging',
      },
    ],
  });
}
```

#### 1.3 Add Documentation Endpoint

```typescript
// packages/gateway/src/routes/docs.ts
import { Hono } from 'hono';
import { generateApiDocs } from '../openapi/generator';

const docs = new Hono();

docs.get('/openapi.json', (c) => {
  const spec = generateApiDocs();
  return c.json(spec);
});

docs.get('/docs', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Unisane API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
          });
        </script>
      </body>
    </html>
  `);
});

export { docs };
```

### Checklist

- [ ] Install @ts-rest/open-api
- [ ] Create OpenAPI generator
- [ ] Add /docs endpoint
- [ ] Add /openapi.json endpoint
- [ ] Verify all endpoints documented
- [ ] Add authentication examples
- [ ] Add error response examples
- [ ] Test documentation rendering

---

## Task 2: Update Architecture Documentation (P3-DOC-002)

### Problem
Architecture documentation may be outdated after remediation phases.

### Solution
Update all architecture documents to reflect current state.

### Implementation

#### 2.1 Update INDEX.md

```markdown
## Current State

| Metric | Current | Target |
|--------|---------|--------|
| **Current Phase** | Production Ready | Maintenance |
| **Hexagonal Compliance** | 100% | 100% |
| **Critical Issues (P0)** | 0 | 0 |
| **High Priority Issues (P1)** | 0 | 0 |
| **Medium Issues (P2)** | 0 | <10 |
| **Test Coverage** | 70% | 70% |
```

#### 2.2 Archive Remediation Documents

After all phases complete:

```bash
mkdir -p ARCHITECTURE/ARCHIVE/REMEDIATION-2025-01
mv ARCHITECTURE/REMEDIATION/*.md ARCHITECTURE/ARCHIVE/REMEDIATION-2025-01/
```

#### 2.3 Update RULES.md

Add any new rules discovered during remediation:

```markdown
## New Rules (Post-Audit)

### Security
- All environment variables must be validated at startup
- PII fields must use encrypted storage
- Rate limiting required on all expensive operations

### Reliability
- All external calls must have timeouts
- No console.log in production code
- All timers must be cleaned up on disposal
```

### Checklist

- [ ] Update INDEX.md current state metrics
- [ ] Update RULES.md with new rules
- [ ] Update PATTERNS.md with new patterns
- [ ] Update REFERENCE/PORTS.md
- [ ] Update REFERENCE/ADAPTERS.md
- [ ] Update REFERENCE/MODULES.md
- [ ] Archive remediation documents
- [ ] Remove obsolete documentation
- [ ] Verify all cross-references valid

---

## Task 3: Operations Runbook (P3-DOC-003)

### Problem
No documentation for operational procedures.

### Solution
Create comprehensive runbook for operations team.

### Implementation

#### 3.1 Create Runbook Structure

```
OPERATIONS/
├── RUNBOOK.md           # Main runbook
├── INCIDENTS/           # Incident templates
│   ├── TEMPLATE.md
│   └── EXAMPLES/
├── PROCEDURES/          # Standard procedures
│   ├── DEPLOYMENT.md
│   ├── ROLLBACK.md
│   ├── SECRET-ROTATION.md
│   └── DATABASE-MIGRATION.md
└── ALERTS/              # Alert response guides
    ├── HIGH-ERROR-RATE.md
    ├── HIGH-LATENCY.md
    └── DATABASE-CONNECTION.md
```

#### 3.2 Main Runbook Template

```markdown
# Unisane Operations Runbook

## Quick Reference

| Scenario | Document |
|----------|----------|
| Deploy to production | [DEPLOYMENT.md](./PROCEDURES/DEPLOYMENT.md) |
| Rollback deployment | [ROLLBACK.md](./PROCEDURES/ROLLBACK.md) |
| Rotate secrets | [SECRET-ROTATION.md](./PROCEDURES/SECRET-ROTATION.md) |
| High error rate alert | [HIGH-ERROR-RATE.md](./ALERTS/HIGH-ERROR-RATE.md) |

## Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://app.unisane.com | Live |
| Staging | https://staging.unisane.com | Pre-prod testing |
| Development | https://dev.unisane.com | Development |

## Key Contacts

| Role | Contact | When to Escalate |
|------|---------|------------------|
| On-call Engineer | PagerDuty | All P0/P1 alerts |
| Security Team | security@unisane.com | Security incidents |
| Database Admin | dba@unisane.com | Database issues |

## Health Checks

\`\`\`bash
# Check API health
curl https://api.unisane.com/health

# Check background jobs
curl https://api.unisane.com/health/jobs

# Check database connectivity
curl https://api.unisane.com/health/db
\`\`\`
```

#### 3.3 Deployment Procedure

```markdown
# Deployment Procedure

## Pre-Deployment Checklist

- [ ] All tests passing on main branch
- [ ] Security scan completed
- [ ] Database migrations tested on staging
- [ ] Feature flags configured
- [ ] Rollback plan documented

## Deployment Steps

1. **Notify team**
   \`\`\`
   Slack: #deployments - "Starting production deployment for v{VERSION}"
   \`\`\`

2. **Deploy to staging first**
   \`\`\`bash
   npm run deploy:staging
   \`\`\`

3. **Verify staging**
   - [ ] Health check passing
   - [ ] Smoke tests passing
   - [ ] No error spike in logs

4. **Deploy to production**
   \`\`\`bash
   npm run deploy:production
   \`\`\`

5. **Monitor for 15 minutes**
   - Watch error rates
   - Watch latency metrics
   - Watch user feedback channels

## Rollback Trigger Conditions

- Error rate > 5% for 5 minutes
- P99 latency > 2x baseline
- Any P0 bug reported
```

### Checklist

- [ ] Create OPERATIONS directory structure
- [ ] Write main RUNBOOK.md
- [ ] Write DEPLOYMENT.md procedure
- [ ] Write ROLLBACK.md procedure
- [ ] Write SECRET-ROTATION.md procedure
- [ ] Write DATABASE-MIGRATION.md procedure
- [ ] Write alert response guides
- [ ] Create incident template
- [ ] Review with operations team
- [ ] Test all documented procedures

---

## Task 4: Consistent Error Messages (P3-CODE-001)

### Problem
Error messages across the codebase have inconsistent formats.

### Solution
Standardize error message format across all modules.

### Implementation

#### 4.1 Create Error Message Standard

```typescript
// packages/kernel/src/errors/format.ts
export interface StandardError {
  code: string;        // Machine-readable code: MODULE_ACTION_ERROR
  message: string;     // Human-readable message
  details?: unknown;   // Additional context
  suggestion?: string; // How to fix (for developers)
}

export function formatError(
  module: string,
  action: string,
  error: string,
  options?: { details?: unknown; suggestion?: string }
): StandardError {
  return {
    code: `${module.toUpperCase()}_${action.toUpperCase()}_${error.toUpperCase()}`,
    message: `${module}: Failed to ${action} - ${error}`,
    details: options?.details,
    suggestion: options?.suggestion,
  };
}
```

#### 4.2 Update Modules to Use Standard Format

```typescript
// Before
throw new Error('User not found');

// After
import { formatError } from '@unisane/kernel';

throw new Error(JSON.stringify(formatError(
  'auth',
  'authenticate',
  'user_not_found',
  { suggestion: 'Check if the user ID is correct' }
)));
```

#### 4.3 Create Error Catalog

```typescript
// packages/kernel/src/errors/catalog.ts
export const ErrorCatalog = {
  AUTH: {
    USER_NOT_FOUND: formatError('auth', 'authenticate', 'user_not_found'),
    INVALID_CREDENTIALS: formatError('auth', 'authenticate', 'invalid_credentials'),
    SESSION_EXPIRED: formatError('auth', 'validate', 'session_expired'),
  },
  BILLING: {
    PAYMENT_FAILED: formatError('billing', 'process', 'payment_failed'),
    INSUFFICIENT_CREDITS: formatError('billing', 'consume', 'insufficient_credits'),
  },
  // ... more categories
} as const;
```

### Checklist

- [ ] Create error format standard
- [ ] Create error catalog
- [ ] Update kernel errors
- [ ] Update module errors
- [ ] Update adapter errors
- [ ] Update gateway errors
- [ ] Add error code documentation
- [ ] Test error format consistency

---

## Task 5: Dead Code Cleanup (P3-CODE-002)

### Problem
Accumulated dead code from iterations and refactoring.

### Solution
Identify and remove unused code.

### Implementation

#### 5.1 Find Unused Exports

```bash
# Using ts-prune or similar tool
npx ts-prune | grep -v '(used in module)'
```

#### 5.2 Find Unused Files

```bash
# Check for files not imported anywhere
npx unimported
```

#### 5.3 Manual Review Areas

Check these common dead code locations:

```typescript
// 1. Commented code blocks
// TODO: Old implementation, remove if not needed
// function oldFunction() { ... }

// 2. Unused utility functions
export function deprecatedHelper() { /* never called */ }

// 3. Unused type definitions
export type LegacyUser = { /* no longer used */ };

// 4. Unused constants
export const OLD_CONFIG = { /* migrated to new config */ };
```

### Checklist

- [ ] Run ts-prune to find unused exports
- [ ] Run unimported to find unused files
- [ ] Review and remove commented code blocks
- [ ] Remove unused utility functions
- [ ] Remove unused type definitions
- [ ] Remove unused constants
- [ ] Remove unused test utilities
- [ ] Verify build still works
- [ ] Verify tests still pass

---

## Task 6: Test Coverage Gaps (P3-CODE-003)

### Problem
Test coverage is approximately 20%, target is 70%.

### Solution
Add tests focusing on critical paths first.

### Implementation

#### 6.1 Coverage Priority Order

1. **Critical Business Logic** (billing, auth, credits)
2. **Data Integrity** (repositories, migrations)
3. **Security** (input validation, authorization)
4. **Integration Points** (adapters, external APIs)
5. **Edge Cases** (error handling, boundary conditions)

#### 6.2 Test Template for Modules

```typescript
// packages/module-{name}/src/__tests__/{feature}.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestContext } from '@unisane/testing';

describe('{Feature}', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  describe('{action}', () => {
    it('should succeed with valid input', async () => {
      // Arrange
      const input = { /* valid data */ };

      // Act
      const result = await ctx.module.action(input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it('should fail with invalid input', async () => {
      // Arrange
      const input = { /* invalid data */ };

      // Act
      const result = await ctx.module.action(input);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('EXPECTED_ERROR');
    });

    it('should handle edge case: {description}', async () => {
      // Test edge case
    });
  });
});
```

#### 6.3 Critical Tests to Add

| Module | Test File | Priority |
|--------|-----------|----------|
| credits | consume.test.ts | 1 |
| credits | purchase.test.ts | 1 |
| auth | authenticate.test.ts | 1 |
| auth | session.test.ts | 1 |
| billing | payment.test.ts | 1 |
| billing | subscription.test.ts | 1 |
| membership | invite.test.ts | 2 |
| membership | seat-limit.test.ts | 2 |
| storage | upload.test.ts | 2 |
| storage | quota.test.ts | 2 |

### Checklist

- [ ] Set up test utilities package
- [ ] Add credits module tests
- [ ] Add auth module tests
- [ ] Add billing module tests
- [ ] Add membership module tests
- [ ] Add storage module tests
- [ ] Add adapter tests
- [ ] Add integration tests
- [ ] Reach 70% coverage
- [ ] Add coverage CI check

---

## Task 7: Devtools Improvements (P3-DX-001)

### Problem
Devtools have limited customization options.

### Solution
Add configuration options for generated code.

### Implementation

#### 7.1 Add Configuration File Support

```typescript
// unisane.config.ts
import { defineConfig } from '@unisane/devtools';

export default defineConfig({
  routes: {
    outputDir: 'src/app/api',
    routePrefix: '/api/v1',
    middleware: ['auth', 'rateLimit'],
  },
  sdk: {
    outputDir: 'src/lib/sdk',
    clientName: 'UnisaneClient',
    includeTypes: true,
  },
  codegen: {
    prettier: true,
    eslint: true,
  },
});
```

#### 7.2 Add Custom Templates Support

```typescript
// Allow users to override default templates
export default defineConfig({
  templates: {
    route: './templates/route.hbs',
    sdk: './templates/sdk.hbs',
  },
});
```

#### 7.3 Add Dry Run Mode

```bash
# Preview generated files without writing
npx unisane generate --dry-run
```

### Checklist

- [ ] Add configuration file support
- [ ] Add custom templates support
- [ ] Add dry run mode
- [ ] Add verbose logging option
- [ ] Add watch mode for development
- [ ] Update devtools documentation
- [ ] Add configuration examples
- [ ] Test with various configurations

---

## Task 8: Better CLI Error Messages (P3-DX-002)

### Problem
CLI error messages are not helpful for debugging.

### Solution
Add context and suggestions to CLI errors.

### Implementation

#### 8.1 Enhanced Error Display

```typescript
// packages/devtools/src/cli/errors.ts
import chalk from 'chalk';

export function displayError(error: Error, context?: string) {
  console.error(chalk.red('✖ Error:'), error.message);

  if (context) {
    console.error(chalk.dim('  Context:'), context);
  }

  if (error instanceof ValidationError) {
    console.error(chalk.yellow('  Suggestion:'), error.suggestion);
    console.error(chalk.dim('  Documentation:'), error.docsUrl);
  }

  if (process.env.DEBUG) {
    console.error(chalk.dim('  Stack trace:'));
    console.error(chalk.dim(error.stack));
  }
}
```

#### 8.2 Common Error Suggestions

```typescript
const errorSuggestions: Record<string, string> = {
  'ENOENT': 'File not found. Check the path is correct.',
  'EACCES': 'Permission denied. Try running with sudo or check file permissions.',
  'MODULE_NOT_FOUND': 'Missing dependency. Run npm install.',
  'CONTRACT_NOT_FOUND': 'Contract file not found. Ensure @unisane/contracts is installed.',
};
```

### Checklist

- [ ] Add enhanced error display
- [ ] Add error suggestions mapping
- [ ] Add documentation links to errors
- [ ] Add DEBUG mode for stack traces
- [ ] Test all CLI commands for helpful errors
- [ ] Update CLI help text

---

## Task 9: API Versioning Strategy (P3-API-001)

### Problem
No clear API versioning strategy defined.

### Solution
Document and implement API versioning approach.

### Implementation

#### 9.1 Versioning Approach: URL Path

```typescript
// /api/v1/users - Version 1
// /api/v2/users - Version 2

const v1Contract = c.router({
  users: {
    get: {
      path: '/api/v1/users/:id',
      // ...
    },
  },
});

const v2Contract = c.router({
  users: {
    get: {
      path: '/api/v2/users/:id',
      // ...
    },
  },
});
```

#### 9.2 Version Deprecation Policy

```markdown
## API Version Lifecycle

1. **Active**: Fully supported, receives all updates
2. **Deprecated**: Supported but no new features, deprecation warning in responses
3. **Sunset**: Read-only, 90-day notice before removal
4. **Removed**: Returns 410 Gone with migration guide

## Current Versions

| Version | Status | Sunset Date |
|---------|--------|-------------|
| v1 | Active | N/A |
```

#### 9.3 Deprecation Headers

```typescript
// Add deprecation headers for old versions
app.use('/api/v1/*', async (c, next) => {
  await next();
  c.header('Deprecation', 'true');
  c.header('Sunset', 'Sat, 01 Jan 2026 00:00:00 GMT');
  c.header('Link', '</api/v2>; rel="successor-version"');
});
```

### Checklist

- [ ] Document versioning strategy
- [ ] Add version to all API paths
- [ ] Add deprecation header middleware
- [ ] Create version migration guide template
- [ ] Update API documentation
- [ ] Communicate versioning policy to users

---

## Verification

After completing all tasks:

```bash
# Verify documentation
ls OPERATIONS/

# Verify API docs
curl http://localhost:3000/openapi.json | jq '.info.version'

# Verify test coverage
npm run test:coverage

# Verify dead code removed
npx ts-prune | wc -l  # Should be minimal

# Verify build
npm run build

# Verify all tests pass
npm run test
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| API documentation coverage | 100% |
| Architecture docs updated | All files |
| Operations runbook complete | Yes |
| Test coverage | ≥70% |
| Dead code | 0 |
| CLI error satisfaction | Helpful messages |

---

## Sign-off Requirements

- [ ] Documentation reviewed by tech writer
- [ ] Runbook tested by operations team
- [ ] API versioning approved by product
- [ ] Test coverage target met
- [ ] All remediation phases complete
- [ ] Production ready certification

---

## Post-Remediation

After Phase 6 completion:

1. **Schedule retrospective** - Review what worked and what didn't
2. **Update processes** - Incorporate learnings into development workflow
3. **Set up monitoring** - Ensure regression detection for fixed issues
4. **Plan maintenance** - Schedule regular audits (quarterly recommended)
5. **Celebrate** 🎉 - Acknowledge team effort in reaching production readiness

---

> **Last Updated**: 2025-01-16
