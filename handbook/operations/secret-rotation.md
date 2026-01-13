# Secret Rotation Procedures

This document outlines procedures for rotating sensitive credentials and secrets in the Unisane platform.

## Overview

Regular secret rotation is a security best practice that limits the impact of credential compromise. This guide covers rotation procedures for all secrets used in the Unisane platform.

## Rotation Schedule

### Recommended Rotation Frequency

| Secret Type | Rotation Frequency | Risk Level |
|-------------|-------------------|------------|
| JWT Signing Keys | Every 6 months | High |
| Data Encryption Keys | Every 12 months | Critical |
| API Keys (Production) | Every 90 days | High |
| API Keys (Development) | Every 180 days | Medium |
| OAuth Client Secrets | Every 12 months | Medium |
| Database Passwords | Every 6 months | High |
| Session Secrets | Every 6 months | Medium |
| Webhook Secrets | As needed | Low |

### Immediate Rotation Required

Rotate secrets immediately if:
- A secret is compromised or suspected of being compromised
- An employee with access leaves the organization
- A security breach occurs
- A secret is accidentally committed to version control
- A third-party integration is compromised

## General Rotation Principles

1. **Zero-Downtime**: All rotations should be performed without service interruption
2. **Dual-Key Period**: Support both old and new keys during transition
3. **Validation**: Verify new key works before removing old key
4. **Audit**: Log all rotation activities
5. **Backup**: Keep encrypted backups of old keys for recovery

## JWT Signing Keys Rotation

JWT signing keys are used to sign and verify authentication tokens.

### Step 1: Generate New Key Pair

```bash
# Generate new RSA key pair (4096-bit)
openssl genrsa -out jwt-private-new.pem 4096
openssl rsa -in jwt-private-new.pem -pubout -out jwt-public-new.pem

# Or generate Ed25519 key pair (recommended for better performance)
openssl genpkey -algorithm ED25519 -out jwt-private-new.pem
openssl pkey -in jwt-private-new.pem -pubout -out jwt-public-new.pem

# Assign a new key ID
KEY_ID="key-$(date +%Y%m%d)"
```

### Step 2: Add New Key to Environment (Dual-Key Mode)

```bash
# Add new key as current
export JWT_PRIVATE_KEY="$(cat jwt-private-new.pem)"
export JWT_PUBLIC_KEY="$(cat jwt-public-new.pem)"
export JWT_KID="${KEY_ID}"

# Keep old key for verification
export JWT_PUBLIC_KEY_PREV="$(cat jwt-public-old.pem)"
export JWT_KID_PREV="key-20231215"  # Previous key ID
```

### Step 3: Deploy Configuration

```bash
# Update secrets in your secret manager (e.g., AWS Secrets Manager, Doppler)
# For Doppler:
doppler secrets set JWT_PRIVATE_KEY="$(cat jwt-private-new.pem)" --project unisane --config prod
doppler secrets set JWT_PUBLIC_KEY="$(cat jwt-public-new.pem)" --project unisane --config prod
doppler secrets set JWT_KID="${KEY_ID}" --project unisane --config prod

# Keep old public key for verification
doppler secrets set JWT_PUBLIC_KEY_PREV="$(cat jwt-public-old.pem)" --project unisane --config prod

# Rolling restart (zero-downtime)
kubectl rollout restart deployment/unisane-api
# Or for containerized deployments:
# docker-compose up -d --force-recreate
```

### Step 4: Monitor and Validate

```bash
# Monitor logs for token verification errors
kubectl logs -f deployment/unisane-api | grep "token verification failed"

# Test new token issuance
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  | jq -r '.token' | cut -d. -f1 | base64 -d | jq .kid

# Should output: "key-20240113" (new key ID)
```

### Step 5: Remove Old Key (After Grace Period)

Wait 7-30 days (based on token TTL) before removing old key:

```bash
# Remove old key from environment
doppler secrets delete JWT_PUBLIC_KEY_PREV --project unisane --config prod
doppler secrets delete JWT_KID_PREV --project unisane --config prod

# Rolling restart
kubectl rollout restart deployment/unisane-api
```

### Step 6: Audit and Document

```bash
# Record rotation in audit log
echo "$(date): JWT keys rotated. New KID: ${KEY_ID}" >> /var/log/secret-rotations.log

# Update documentation
# Store encrypted backup of old key (offline)
```

## Data Encryption Keys Rotation

Data encryption keys protect PII (Personally Identifiable Information) stored in the database.

⚠️ **WARNING**: Data encryption key rotation requires database migration. Plan carefully.

### Step 1: Generate New Encryption Key

```bash
# Generate new 32-byte (256-bit) key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Example output: AbCd1234EfGh5678IjKl9012MnOp3456QrSt7890UvWx1234=
```

### Step 2: Add New Key as Secondary

```bash
# Set new key as DATA_ENCRYPTION_KEY_NEW
export DATA_ENCRYPTION_KEY_NEW="AbCd1234EfGh5678IjKl9012MnOp3456QrSt7890UvWx1234="

# Keep current key for reading existing data
export DATA_ENCRYPTION_KEY="<current-key>"

# Deploy configuration
doppler secrets set DATA_ENCRYPTION_KEY_NEW="$DATA_ENCRYPTION_KEY_NEW" --project unisane --config prod
```

### Step 3: Run Re-encryption Migration

```bash
# Run migration to re-encrypt all PII with new key
pnpm --filter saaskit db:migrate:run 004_reencrypt_pii

# Migration will:
# 1. Read each record using old key
# 2. Re-encrypt with new key
# 3. Update searchTokens
# 4. Verify data integrity
```

### Step 4: Validate Re-encryption

```bash
# Test query with new encryption
curl -X GET https://api.example.com/users/search?email=test@example.com \
  -H "Authorization: Bearer $TOKEN"

# Check logs for decryption errors
kubectl logs -f deployment/unisane-api | grep "decryption failed"
```

### Step 5: Promote New Key to Primary

```bash
# Promote new key to primary
export DATA_ENCRYPTION_KEY="$DATA_ENCRYPTION_KEY_NEW"
unset DATA_ENCRYPTION_KEY_NEW

# Update secrets
doppler secrets set DATA_ENCRYPTION_KEY="$DATA_ENCRYPTION_KEY" --project unisane --config prod
doppler secrets delete DATA_ENCRYPTION_KEY_NEW --project unisane --config prod

# Rolling restart
kubectl rollout restart deployment/unisane-api
```

### Step 6: Secure Old Key

```bash
# Store old key in encrypted offline backup (for disaster recovery)
echo "DATA_ENCRYPTION_KEY_OLD=$DATA_ENCRYPTION_KEY" | \
  gpg --encrypt --recipient ops@example.com > keys-backup-$(date +%Y%m%d).gpg

# Move to secure offline storage
```

## API Keys Rotation (Third-Party Services)

Rotate API keys for external services (Stripe, AWS, etc.).

### Stripe Keys

```bash
# 1. Generate new key in Stripe Dashboard
# Dashboard > Developers > API Keys > Create restricted key

# 2. Update environment
export STRIPE_SECRET_KEY="sk_live_<new-key>"
doppler secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project unisane --config prod

# 3. Deploy
kubectl rollout restart deployment/unisane-api

# 4. Test
curl -X POST https://api.example.com/billing/checkout/session \
  -H "Authorization: Bearer $TOKEN"

# 5. Revoke old key in Stripe Dashboard
# Dashboard > Developers > API Keys > Delete old key
```

### AWS Credentials

```bash
# 1. Create new IAM user access key
aws iam create-access-key --user-name unisane-prod

# 2. Update environment
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
doppler secrets set AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" --project unisane --config prod
doppler secrets set AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" --project unisane --config prod

# 3. Deploy
kubectl rollout restart deployment/unisane-api

# 4. Test
aws s3 ls s3://unisane-uploads --profile prod

# 5. Delete old access key
aws iam delete-access-key --user-name unisane-prod --access-key-id AKIA<old-key>
```

## Session Secrets Rotation

Session secrets are used for cookie signing and session encryption.

### BETTER_AUTH_SECRET Rotation

```bash
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 2. Update environment (dual-secret mode if supported)
export BETTER_AUTH_SECRET="<new-secret>"
export BETTER_AUTH_SECRET_OLD="<old-secret>"  # For reading old sessions

# 3. Deploy
doppler secrets set BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" --project unisane --config prod
kubectl rollout restart deployment/unisane-api

# 4. Wait for all sessions to expire (e.g., 30 days)

# 5. Remove old secret
doppler secrets delete BETTER_AUTH_SECRET_OLD --project unisane --config prod
```

**Note**: Session secret rotation will invalidate existing sessions. Plan rotation during low-traffic periods.

## OAuth Client Secrets Rotation

Rotate OAuth client secrets for external identity providers.

### Google OAuth

```bash
# 1. Generate new client secret in Google Cloud Console
# Console > APIs & Services > Credentials > OAuth 2.0 Client IDs

# 2. Add new secret to environment
export GOOGLE_CLIENT_SECRET="<new-secret>"
doppler secrets set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" --project unisane --config prod

# 3. Deploy
kubectl rollout restart deployment/unisane-api

# 4. Test OAuth flow
# Navigate to https://app.example.com/auth/signin/google

# 5. Delete old secret from Google Cloud Console
```

### GitHub OAuth

Same process as Google OAuth, using GitHub Developer Settings.

## Database Password Rotation

Rotate database credentials with zero downtime.

### MongoDB Atlas

```bash
# 1. Create new database user in Atlas UI
# Database Access > Add New Database User

# 2. Update connection string
export MONGODB_URI="mongodb+srv://newuser:newpass@cluster.mongodb.net/db"
doppler secrets set MONGODB_URI="$MONGODB_URI" --project unisane --config prod

# 3. Deploy (rolling restart maintains connections)
kubectl rollout restart deployment/unisane-api

# 4. Verify new connections
kubectl exec -it deployment/unisane-api -- mongosh "$MONGODB_URI" --eval "db.serverStatus()"

# 5. Delete old database user in Atlas UI
```

## Emergency Rotation Procedure

If a secret is compromised:

### Immediate Actions (Within 1 Hour)

1. **Revoke compromised secret** in the source system (if possible)
2. **Generate new secret** using procedures above
3. **Deploy new secret** to all environments
4. **Force restart** all services
5. **Invalidate all sessions** (if auth-related)
6. **Monitor logs** for unauthorized access attempts

### Post-Incident (Within 24 Hours)

1. **Audit access logs** - Check for unauthorized usage
2. **Review blast radius** - What data was accessible?
3. **Notify stakeholders** - Security team, compliance, management
4. **Document incident** - What happened, how it was resolved
5. **Update procedures** - Prevent recurrence

### Example: Compromised Stripe Key

```bash
# IMMEDIATE
# 1. Revoke in Stripe Dashboard
# Dashboard > Developers > API Keys > Delete compromised key

# 2. Generate new key
# Dashboard > Developers > API Keys > Create restricted key

# 3. Emergency deploy
export STRIPE_SECRET_KEY="sk_live_<new-key>"
doppler secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project unisane --config prod
kubectl rollout restart deployment/unisane-api --grace-period=0

# 4. Verify
curl -X GET https://api.stripe.com/v1/balance \
  -u "$STRIPE_SECRET_KEY:" \
  | jq .available

# POST-INCIDENT
# 5. Audit Stripe events
# Dashboard > Events > Filter by API key

# 6. Check for unauthorized charges
# Dashboard > Payments > Filter by date

# 7. Document incident
echo "$(date): Emergency rotation - Stripe key compromised. New key: sk_live_***${STRIPE_SECRET_KEY: -4}" >> /var/log/incidents.log
```

## Automation

### Automated Rotation Script Template

```bash
#!/bin/bash
# rotate-secret.sh - Generic secret rotation script

set -euo pipefail

SECRET_NAME="$1"
SECRET_TYPE="$2"  # jwt|encryption|api|session

generate_secret() {
  case "$SECRET_TYPE" in
    jwt)
      openssl genpkey -algorithm ED25519
      ;;
    encryption|session)
      node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
      ;;
    api)
      echo "Generate via provider dashboard"
      exit 1
      ;;
    *)
      echo "Unknown secret type: $SECRET_TYPE"
      exit 1
      ;;
  esac
}

main() {
  echo "Rotating $SECRET_NAME ($SECRET_TYPE)..."

  # Generate new secret
  NEW_SECRET=$(generate_secret)

  # Update in secret manager
  doppler secrets set "${SECRET_NAME}" "$NEW_SECRET" --project unisane --config prod

  # Deploy
  kubectl rollout restart deployment/unisane-api

  # Wait for rollout
  kubectl rollout status deployment/unisane-api

  # Verify
  echo "Rotation complete. Please test the service."
}

main
```

## Monitoring and Alerts

### Set Up Alerts

Monitor for issues after rotation:

```yaml
# Example: Prometheus alert
- alert: HighAuthFailureRate
  expr: rate(auth_failures_total[5m]) > 0.1
  for: 5m
  annotations:
    summary: "High authentication failure rate (possible key rotation issue)"
```

### Post-Rotation Checklist

- [ ] All services restarted successfully
- [ ] No increase in error rates
- [ ] Authentication still works
- [ ] API integrations still work
- [ ] Database connections stable
- [ ] No alerts triggered
- [ ] Old key revoked/deleted
- [ ] Rotation documented in audit log

## Rollback Procedure

If rotation causes issues:

```bash
# 1. Restore old secret
export SECRET_NAME="<old-value>"
doppler secrets set SECRET_NAME="$SECRET_NAME" --project unisane --config prod

# 2. Emergency restart
kubectl rollout restart deployment/unisane-api --grace-period=0

# 3. Verify service recovery
curl -X GET https://api.example.com/health

# 4. Investigate root cause
kubectl logs -f deployment/unisane-api --tail=100

# 5. Document rollback
echo "$(date): Rolled back $SECRET_NAME rotation due to errors" >> /var/log/incidents.log
```

## Compliance and Audit

### Audit Trail

Maintain logs of all rotations:

```bash
# /var/log/secret-rotations.log format:
2024-01-13T10:30:00Z JWT_SIGNING_KEY rotated by ops@example.com (key-20240113)
2024-01-13T11:00:00Z STRIPE_SECRET_KEY rotated by ops@example.com
```

### Compliance Requirements

- **SOC 2**: Rotate secrets at least annually
- **PCI DSS**: Rotate encryption keys every 12 months
- **HIPAA**: Rotate at least annually or when personnel changes
- **GDPR**: No specific requirement, but recommended

## Tools and Resources

- **Secret Manager**: [Doppler](https://doppler.com), [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/), [HashiCorp Vault](https://www.vaultproject.io/)
- **Key Generation**: OpenSSL, Node.js crypto module
- **Deployment**: Kubernetes, Docker Compose
- **Monitoring**: Prometheus, Grafana, Sentry

## Support

For questions or issues with secret rotation:
- Security Team: security@example.com
- On-call Engineer: ops@example.com
- Incident Channel: #incidents (Slack)

## References

- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [NIST Guidelines for Cryptographic Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [AWS Secret Rotation Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
