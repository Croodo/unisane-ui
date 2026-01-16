# Secret Rotation Procedure

> Procedure for rotating secrets and credentials.

---

## Secret Inventory

| Secret | Rotation Frequency | Location |
|--------|-------------------|----------|
| JWT Signing Key | Annually | Vercel/Env |
| Database Password | Quarterly | Vercel/Env |
| API Keys (Stripe, etc.) | As needed | Vercel/Env |
| OAuth Client Secrets | Annually | Vercel/Env |
| Local Storage Signing | On compromise | `.signing-secret` file |

---

## General Rotation Procedure

### 1. Generate New Secret

```bash
# Generate random secret (64 chars)
openssl rand -hex 32

# Generate base64 secret
openssl rand -base64 32
```

### 2. Add New Secret (Dual Active Period)

Keep both old and new secrets active for 24 hours:

```bash
# Add new secret to environment
# OLD_SECRET remains active during transition
NEW_JWT_SECRET=<generated>
```

### 3. Deploy with New Secret

```bash
# Deploy to staging first
pnpm deploy:staging

# Verify everything works
pnpm test:smoke:staging

# Deploy to production
pnpm deploy:production
```

### 4. Remove Old Secret

After 24 hours:
```bash
# Remove old secret from environment
# Update JWT_SECRET to NEW_JWT_SECRET value
```

---

## Specific Secrets

### JWT Signing Key

1. Generate new RS256 key pair:
   ```bash
   openssl genrsa -out new-jwt-private.pem 2048
   openssl rsa -in new-jwt-private.pem -pubout -out new-jwt-public.pem
   ```

2. Add new keys alongside old (supports both during transition)

3. Update environment variables

4. Deploy and verify

5. Remove old keys after 24 hours

### Database Credentials

1. Create new user in database
2. Grant same permissions as old user
3. Update connection string
4. Deploy and verify
5. Revoke old user after confirming

### API Keys (Stripe, etc.)

1. Generate new key in provider dashboard
2. Add new key to environment
3. Deploy and verify
4. Revoke old key in provider dashboard

---

## Emergency Rotation (Compromised Secret)

If a secret is compromised:

1. **Immediately** generate new secret
2. Deploy without dual-active period
3. Accept temporary disruption to invalidate compromised secret
4. Notify security team
5. Audit access logs for unauthorized use
6. Document incident

---

## Verification

After rotation, verify:
- [ ] Authentication still works
- [ ] API integrations functioning
- [ ] No error spikes in logs
- [ ] Existing sessions still valid (for JWT)

---

> **Last Updated**: 2025-01-16
