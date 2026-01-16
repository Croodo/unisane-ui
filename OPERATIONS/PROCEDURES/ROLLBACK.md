# Rollback Procedure

> Emergency rollback procedure for production deployments.

---

## When to Rollback

Rollback immediately if:
- Error rate > 1% sustained for 5+ minutes
- P99 latency > 2x baseline sustained
- Any critical bug affecting core functionality
- Data integrity issues detected
- Security vulnerability discovered

---

## Quick Rollback (< 2 minutes)

```bash
# Rollback to previous version
pnpm deploy:rollback

# Verify rollback
curl https://api.{domain}.com/api/health
```

---

## Manual Rollback Steps

If automated rollback fails:

### 1. Identify Previous Version

```bash
# List recent deployments
vercel ls --prod

# Or check deployment history
git log --oneline -10
```

### 2. Deploy Previous Version

```bash
# Deploy specific commit
git checkout {PREVIOUS_COMMIT}
pnpm deploy:production --force

# Or redeploy previous deployment
vercel rollback {DEPLOYMENT_ID}
```

### 3. Verify Rollback

```bash
# Check health
curl https://api.{domain}.com/api/health

# Check version
curl https://api.{domain}.com/api/health | jq '.version'

# Verify error rate dropping
# Check monitoring dashboard
```

---

## Database Rollback

If migration caused issues:

```bash
# Rollback last migration
pnpm db:migrate:rollback

# Verify database state
pnpm db:status
```

⚠️ **Warning**: Database rollbacks may cause data loss. Evaluate carefully before proceeding.

---

## Post-Rollback

1. [ ] Announce in #deployments: "⚠️ Rollback complete to v{VERSION}"
2. [ ] Create incident report if SEV1/SEV2
3. [ ] Document what went wrong
4. [ ] Fix the issue before re-deploying
5. [ ] Schedule retrospective if needed

---

## Escalation

If rollback fails or issues persist:

1. Page on-call lead
2. Consider putting site in maintenance mode
3. Escalate to CTO if data integrity at risk

---

> **Last Updated**: 2025-01-16
