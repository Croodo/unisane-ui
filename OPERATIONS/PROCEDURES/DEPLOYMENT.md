# Deployment Procedure

> Standard deployment process for production releases.

---

## Pre-Deployment Checklist

- [ ] All tests passing on main branch
- [ ] Security scan completed (no new vulnerabilities)
- [ ] Database migrations tested on staging
- [ ] Feature flags configured (if applicable)
- [ ] Rollback plan documented
- [ ] On-call engineer notified

---

## Deployment Steps

### 1. Notify Team

```
Slack: #deployments
Message: "🚀 Starting production deployment for v{VERSION}"
```

### 2. Deploy to Staging First

```bash
# Deploy to staging
pnpm deploy:staging

# Wait for deployment to complete
# Verify health check passes
curl https://staging.{domain}.com/api/health
```

### 3. Verify Staging

- [ ] Health check passing
- [ ] Smoke tests passing (`pnpm test:smoke:staging`)
- [ ] No error spike in logs (check last 5 minutes)
- [ ] Key flows working (login, core features)

### 4. Deploy to Production

```bash
# Deploy to production
pnpm deploy:production

# Monitor deployment progress
# This typically takes 2-5 minutes
```

### 5. Monitor for 15 Minutes

Watch these metrics:
- Error rate (should be < 0.1%)
- P99 latency (should be < 500ms)
- Active users (should be stable)
- Background job queue (should not grow)

### 6. Announce Completion

```
Slack: #deployments
Message: "✅ Production deployment complete for v{VERSION}"
```

---

## Rollback Trigger Conditions

Immediately rollback if:
- Error rate > 1% for 5 minutes
- P99 latency > 2x normal for 5 minutes
- Any P0 bug reported
- Database errors spiking
- External service degradation

---

## Rollback Steps

See [ROLLBACK.md](./ROLLBACK.md) for detailed rollback procedure.

Quick rollback:
```bash
pnpm deploy:rollback
```

---

## Post-Deployment

- [ ] Close deployment ticket
- [ ] Update release notes
- [ ] Monitor for 1 hour for delayed issues
- [ ] Document any issues encountered

---

> **Last Updated**: 2025-01-16
