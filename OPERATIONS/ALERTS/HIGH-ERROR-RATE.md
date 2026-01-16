# Alert: High Error Rate

> Response guide for elevated error rate alerts.

---

## Alert Thresholds

| Level | Threshold | Action |
|-------|-----------|--------|
| Warning | > 0.5% 5xx | Investigate |
| Critical | > 1% 5xx | Immediate action |
| SEV1 | > 5% 5xx | All hands |

---

## Immediate Actions

### 1. Check Recent Deployments

```bash
# View recent deployments
vercel ls --prod

# Check deployment time vs error start time
```

**If deployment correlates with error spike → Consider rollback**

### 2. Review Error Logs

```bash
# Get recent errors
pnpm logs:app --level error --tail 100

# Look for patterns:
# - Same error message repeating
# - Same endpoint failing
# - Same user/tenant affected
```

### 3. Check External Dependencies

```bash
# Check database
curl https://api.{domain}.com/api/health/db

# Check cache
curl https://api.{domain}.com/api/health/cache

# Check external APIs (Stripe, etc.)
# Visit status pages
```

---

## Common Causes

### Database Issues
- Connection pool exhausted
- Slow queries timing out
- Migration issues

**Fix**: Check connection count, review recent queries, scale if needed

### Cache Issues
- Redis unavailable
- Cache miss spike

**Fix**: Check Redis health, verify degradation mode is active

### External API Failures
- Payment provider down
- Email service unavailable

**Fix**: Check provider status page, enable fallback if available

### Code Bugs
- Null pointer exceptions
- Unhandled promise rejections

**Fix**: Identify error pattern, rollback if recent deployment

---

## Escalation

| Duration | Action |
|----------|--------|
| 5 min | Acknowledge, start investigation |
| 15 min | Page engineering lead if cause unknown |
| 30 min | Consider rollback if persisting |
| 1 hour | Escalate to CTO, communicate to stakeholders |

---

## Resolution Checklist

- [ ] Root cause identified
- [ ] Fix deployed or rollback completed
- [ ] Error rate returning to normal
- [ ] Alert resolved in monitoring
- [ ] Incident documented (if SEV1/SEV2)

---

> **Last Updated**: 2025-01-16
