# Phase 6: Documentation

> **For LLMs**: Finalize documentation and ensure everything is properly documented.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Blocked |
| **Dependencies** | Phase 5 (testing) |
| **Blocks** | None (final phase) |
| **Focus** | Developer docs, API docs, runbooks |

---

## Prerequisites Check

Before starting this phase:
- Phase 0-5 complete
- All architecture issues resolved
- Test coverage at target levels
- Code is stable

---

## Tasks

### 1. Update Architecture Documentation

Ensure all ARCHITECTURE/ docs reflect current state:

**Checklist**:
- [ ] Update INDEX.md metrics (compliance should be 100%)
- [ ] Move resolved issues to RESOLVED.md
- [ ] Update all "Last Updated" timestamps
- [ ] Verify all code examples still work

---

### 2. Create API Documentation

**Using OpenAPI/Swagger**:
```typescript
// packages/foundation/gateway/src/docs/openapi.ts
import { OpenAPIGenerator } from '@unisane/devtools';

export function generateOpenAPISpec() {
  const contracts = loadAllContracts();

  return OpenAPIGenerator.generate({
    info: {
      title: 'Unisane API',
      version: '1.0.0',
      description: 'Multi-tenant SaaS platform API',
    },
    servers: [
      { url: 'https://api.example.com', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    contracts,
    auth: {
      type: 'bearer',
      bearerFormat: 'JWT',
    },
  });
}
```

**Checklist**:
- [ ] Generate OpenAPI spec from contracts
- [ ] Add descriptions to all endpoints
- [ ] Document request/response schemas
- [ ] Add example values
- [ ] Host Swagger UI at /docs

---

### 3. Create Module Documentation

**For each module, document**:

```markdown
# Module: {name}

## Overview
Brief description of what this module does.

## Domain Model
```
┌──────────────┐
│   Entity1    │
├──────────────┤
│ field1: type │
│ field2: type │
└──────────────┘
```

## Service API

### functionName(args)
- **Purpose**: What it does
- **Args**: Parameters
- **Returns**: Return type
- **Errors**: What can go wrong
- **Events**: Events emitted

## Port Dependencies
- FlagsPort: for feature flags
- BillingPort: for subscription checks

## Events Emitted
- `module.entity.created`: When entity is created
- `module.entity.updated`: When entity is updated

## Configuration
| Env Var | Description | Default |
|---------|-------------|---------|
| MODULE_X | Description | value |
```

**Checklist**:
- [ ] Document all 15 modules
- [ ] Include domain models
- [ ] List service functions
- [ ] Document port dependencies
- [ ] List events emitted

---

### 4. Create Adapter Documentation

**For each adapter**:

```markdown
# Adapter: {name}

## Overview
What external service this connects to.

## Configuration

| Config Key | Type | Required | Description |
|------------|------|----------|-------------|
| apiKey | string | Yes | API key |
| timeout | number | No | Timeout in ms |

## Methods

### methodName(args)
Maps to external API: `POST /v1/endpoint`

**Rate Limits**: 100 req/min
**Retry**: Yes, with exponential backoff

## Error Handling
| Error | Cause | Retryable |
|-------|-------|-----------|
| NetworkError | Connection failed | Yes |
| AuthError | Invalid API key | No |

## Resilience
- Circuit breaker: 5 failures, 30s reset
- Retry: 3 attempts, 200ms base
- Timeout: 10s
```

**Checklist**:
- [ ] Document all 12 adapters
- [ ] Include configuration
- [ ] Document each method
- [ ] Describe error handling
- [ ] Note resilience settings

---

### 5. Create Runbooks

**Runbook Template**:
```markdown
# Runbook: {Issue Name}

## Symptoms
- What alerts fire
- What users report
- What logs show

## Diagnosis
1. Check X in logs
2. Verify Y metric
3. Test Z endpoint

## Resolution
### Quick Fix
Steps for immediate mitigation

### Root Cause Fix
Steps for permanent fix

## Prevention
How to prevent recurrence
```

**Runbooks to Create**:
- [ ] Database connection failures
- [ ] Cache unavailable
- [ ] Stripe webhook failures
- [ ] Email delivery failures
- [ ] Rate limiting triggered
- [ ] Circuit breaker open
- [ ] Memory/CPU alerts
- [ ] Auth service issues

---

### 6. Create Developer Onboarding Guide

```markdown
# Developer Onboarding

## Prerequisites
- Node.js 20+
- pnpm 8+
- Docker (for local services)

## Setup
1. Clone repository
2. Copy `.env.example` to `.env`
3. Run `pnpm install`
4. Run `docker compose up -d` (MongoDB, Redis)
5. Run `pnpm dev`

## Project Structure
[Quick overview of directories]

## Making Changes

### Adding a New Feature
1. Read RULES.md
2. Check if port exists
3. Follow PATTERNS.md
4. Write tests
5. Submit PR

### Common Tasks
- Adding a new endpoint: [link]
- Creating a new adapter: [link]
- Adding a feature flag: [link]

## Testing
- `pnpm test` - Run all tests
- `pnpm test:watch` - Watch mode
- `pnpm test:coverage` - Coverage report

## Debugging
- How to enable debug logs
- How to trace requests
- How to profile performance

## Getting Help
- Slack channel
- Documentation links
- Who to ask for what
```

**Checklist**:
- [ ] Create onboarding guide
- [ ] Test setup steps on fresh clone
- [ ] Link to relevant docs
- [ ] Include troubleshooting

---

### 7. Create RESOLVED.md

Move all fixed issues to a resolved file:

```markdown
# Resolved Issues

Issues that have been fixed. Kept for reference.

## K-001: Silent Cache Fallback
**Resolved**: 2025-01-XX
**Fix**: Cache errors now propagate, no silent fallback
**PR**: #123

## BR-001: Razorpay Portal Throws
**Resolved**: 2025-01-XX
**Fix**: Returns fallback URL instead of throwing
**PR**: #124

[... more resolved issues ...]
```

**Checklist**:
- [ ] Create RESOLVED.md
- [ ] Move fixed issues from P0/P1/P2
- [ ] Include resolution date and PR link
- [ ] Keep brief description of fix

---

## Final Verification

```bash
# All docs are current
# - Check Last Updated dates
# - Verify code examples compile

# API docs work
# - OpenAPI spec generates
# - Swagger UI loads
# - Examples are valid

# Tests pass
pnpm test

# Build succeeds
pnpm build

# Coverage at target
pnpm test:coverage
```

---

## Success Criteria

Phase 6 is complete when:

1. Architecture docs updated (100% compliance)
2. API documentation generated and hosted
3. All modules documented
4. All adapters documented
5. Runbooks created for common issues
6. Developer onboarding guide complete
7. RESOLVED.md contains all fixed issues
8. All "Last Updated" dates current

---

## Project Complete

When Phase 6 is complete, the architecture refactoring is done:

- ✅ 100% hexagonal compliance
- ✅ Zero direct module imports
- ✅ All adapters have resilience
- ✅ 70%+ test coverage
- ✅ Comprehensive documentation

---

> **Last Updated**: 2025-01-15
