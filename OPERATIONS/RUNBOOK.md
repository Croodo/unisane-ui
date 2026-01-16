# Unisane Operations Runbook

> Quick reference for common operational procedures and incident response.

---

## Quick Reference

| Scenario | Document |
|----------|----------|
| Deploy to production | [PROCEDURES/DEPLOYMENT.md](./PROCEDURES/DEPLOYMENT.md) |
| Rollback deployment | [PROCEDURES/ROLLBACK.md](./PROCEDURES/ROLLBACK.md) |
| Rotate secrets | [PROCEDURES/SECRET-ROTATION.md](./PROCEDURES/SECRET-ROTATION.md) |
| Database maintenance | [PROCEDURES/DATABASE.md](./PROCEDURES/DATABASE.md) |
| High error rate alert | [ALERTS/HIGH-ERROR-RATE.md](./ALERTS/HIGH-ERROR-RATE.md) |
| High latency alert | [ALERTS/HIGH-LATENCY.md](./ALERTS/HIGH-LATENCY.md) |
| Cache degradation | [ALERTS/CACHE-DEGRADED.md](./ALERTS/CACHE-DEGRADED.md) |

---

## Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | `https://app.{domain}.com` | Live traffic |
| Staging | `https://staging.{domain}.com` | Pre-production testing |
| Development | `http://localhost:3000` | Local development |

---

## Health Checks

```bash
# Check API health
curl https://api.{domain}.com/api/health

# Check with verbose output
curl -v https://api.{domain}.com/api/health | jq

# Check specific components
curl https://api.{domain}.com/api/health/db
curl https://api.{domain}.com/api/health/cache
curl https://api.{domain}.com/api/health/storage
```

---

## Key Metrics to Monitor

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Error Rate (5xx) | < 0.1% | 0.1-1% | > 1% |
| P99 Latency | < 500ms | 500ms-2s | > 2s |
| Cache Hit Rate | > 90% | 80-90% | < 80% |
| CPU Usage | < 70% | 70-85% | > 85% |
| Memory Usage | < 80% | 80-90% | > 90% |

---

## Common Commands

### Logs

```bash
# View recent application logs
pnpm logs:app --tail 100

# Filter by error level
pnpm logs:app --level error

# Search for specific request
pnpm logs:app --filter "requestId=abc123"
```

### Database

```bash
# Check connection count
pnpm db:status

# Run pending migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:rollback
```

### Cache

```bash
# Check Redis connection
redis-cli ping

# View cache stats
redis-cli INFO stats

# Flush specific namespace (careful!)
redis-cli KEYS "rate:*" | xargs redis-cli DEL
```

---

## Incident Response

### Severity Levels

| Severity | Definition | Response Time | Escalation |
|----------|------------|---------------|------------|
| **SEV1** | Total outage, data loss risk | Immediate | On-call → Lead → CTO |
| **SEV2** | Degraded service, major feature broken | 15 minutes | On-call → Lead |
| **SEV3** | Minor feature broken, workaround available | 1 hour | On-call |
| **SEV4** | Cosmetic, low impact | Next business day | Backlog |

### Incident Checklist

```markdown
1. [ ] Acknowledge incident in monitoring system
2. [ ] Create incident channel (if SEV1/SEV2)
3. [ ] Identify scope and impact
4. [ ] Communicate status to stakeholders
5. [ ] Implement fix or rollback
6. [ ] Verify resolution
7. [ ] Write incident report (SEV1/SEV2)
8. [ ] Schedule retrospective (SEV1)
```

---

## Contact Information

| Role | Contact | When to Escalate |
|------|---------|------------------|
| On-call Engineer | PagerDuty | All production alerts |
| Engineering Lead | Slack #eng-leads | SEV1/SEV2 incidents |
| Security Team | security@{domain}.com | Security incidents |
| Database Admin | Slack #dba | Database issues |

---

## Quick Fixes

### High Error Rate

1. Check recent deployments
2. Review error logs for patterns
3. If deployment-related: rollback
4. If not deployment-related: check external dependencies

### High Latency

1. Check database query times
2. Check cache hit rates
3. Check external API response times
4. If cache miss spike: investigate cache health

### Memory Issues

1. Check for memory leaks in recent changes
2. Review background job queue sizes
3. Consider scaling or restarting instances

---

## Maintenance Windows

| Task | Frequency | Duration | Impact |
|------|-----------|----------|--------|
| Database migrations | As needed | 5-30 min | Brief slowdown |
| Certificate renewal | Quarterly | 5 min | None |
| Dependency updates | Weekly | 15 min | None |
| Full backup verification | Monthly | 2 hours | None |

---

> **Last Updated**: 2025-01-16
