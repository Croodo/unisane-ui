# Deployment Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

Complete guide for deploying Unisane platform applications to production.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Deployment Targets](#deployment-targets)
   - [Vercel](#vercel-deployment)
   - [Docker](#docker-deployment)
   - [AWS](#aws-deployment)
   - [Railway](#railway-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security Checklist](#security-checklist)
8. [Zero-Downtime Deployments](#zero-downtime-deployments)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Unisane starters (SaasKit, etc.) are Next.js applications that can be deployed to any platform supporting Node.js. The platform consists of:

```
┌─────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Next.js    │  │   MongoDB    │  │    Redis     │       │
│  │   App        │  │   Database   │  │    Cache     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Stripe     │  │  Resend/SES  │  │  S3/R2       │       │
│  │   Payments   │  │  Email       │  │  Storage     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Inngest    │  │   Sentry     │  │  PostHog     │       │
│  │   Jobs       │  │  Errors      │  │  Analytics   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` for development and configure production secrets in your deployment platform.

```bash
# ═══════════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════════
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXT_PUBLIC_MARKETING_URL=https://www.example.com

# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
# OR for local:
# MONGODB_URI=mongodb://localhost:27017/unisane

# ═══════════════════════════════════════════════════════════════
# REDIS (Cache & Rate Limiting)
# ═══════════════════════════════════════════════════════════════
REDIS_URL=redis://default:password@redis-host:6379
# OR Upstash:
# UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
# UPSTASH_REDIS_REST_TOKEN=xxx

# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════
# NextAuth / Auth.js
NEXTAUTH_URL=https://app.example.com
NEXTAUTH_SECRET=your-32-char-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# ═══════════════════════════════════════════════════════════════
# PAYMENTS (Stripe)
# ═══════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Product/Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# ═══════════════════════════════════════════════════════════════
# EMAIL
# ═══════════════════════════════════════════════════════════════
# Resend (recommended)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@example.com

# OR AWS SES
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx
# AWS_REGION=us-east-1

# ═══════════════════════════════════════════════════════════════
# FILE STORAGE
# ═══════════════════════════════════════════════════════════════
# AWS S3
AWS_S3_BUCKET=my-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# OR Cloudflare R2
# R2_ACCOUNT_ID=xxx
# R2_ACCESS_KEY_ID=xxx
# R2_SECRET_ACCESS_KEY=xxx
# R2_BUCKET=my-bucket

# ═══════════════════════════════════════════════════════════════
# AI PROVIDERS (Optional)
# ═══════════════════════════════════════════════════════════════
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# ═══════════════════════════════════════════════════════════════
# BACKGROUND JOBS
# ═══════════════════════════════════════════════════════════════
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx

# ═══════════════════════════════════════════════════════════════
# MONITORING
# ═══════════════════════════════════════════════════════════════
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ═══════════════════════════════════════════════════════════════
# FEATURE FLAGS
# ═══════════════════════════════════════════════════════════════
# If using external flag service:
# LAUNCHDARKLY_SDK_KEY=sdk-xxx
```

### Environment Validation

The kernel validates required env vars on startup:

```typescript
// packages/kernel/src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  // ... other required vars
});

export const env = envSchema.parse(process.env);
```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create cluster** at [MongoDB Atlas](https://cloud.mongodb.com)
2. **Configure network access**: Add your deployment IPs or use `0.0.0.0/0` for serverless
3. **Create database user** with read/write permissions
4. **Get connection string**: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### Database Indexes

Run migrations to create required indexes:

```bash
# In your project
pnpm db:migrate
```

Or manually ensure these indexes exist:

```javascript
// Required indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ tenantId: 1 });

db.tenants.createIndex({ slug: 1 }, { unique: true });
db.tenants.createIndex({ ownerId: 1 });

db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.creditLedger.createIndex({ tenantId: 1, createdAt: -1 });
db.creditLedger.createIndex({ tenantId: 1, idemKey: 1 }, { unique: true });

db.subscriptions.createIndex({ tenantId: 1 });
db.subscriptions.createIndex({ stripeSubscriptionId: 1 }, { unique: true });
```

### Redis Setup

**Upstash** (recommended for serverless):
1. Create database at [Upstash](https://upstash.com)
2. Use REST API URL and token

**Self-hosted**:
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

---

## Deployment Targets

### Vercel Deployment

Vercel is the recommended deployment platform for Next.js applications.

#### Setup

1. **Connect repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Set build settings**:
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`

#### vercel.json Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/webhooks/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Deploy Command

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

---

### Docker Deployment

#### Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ─────────────────────────────────────────────────────────
# Dependencies
# ─────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────
# Builder
# ─────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for public env vars
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_POSTHOG_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY

RUN pnpm build

# ─────────────────────────────────────────────────────────
# Runner
# ─────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      args:
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

#### Build & Run

```bash
# Build image
docker build -t unisane-app .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

### AWS Deployment

#### Using AWS App Runner

1. **Push to ECR**:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com
docker build -t unisane-app .
docker tag unisane-app:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/unisane-app:latest
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/unisane-app:latest
```

2. **Create App Runner service** in AWS Console or via CLI

#### Using AWS ECS

```yaml
# task-definition.json
{
  "family": "unisane-app",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/unisane-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT}:secret:unisane/mongodb"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/unisane-app",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024"
}
```

---

### Railway Deployment

Railway provides simple deployments with built-in databases.

1. **Connect GitHub repo** to Railway
2. **Add services**: MongoDB, Redis (or use Railway's built-in)
3. **Configure variables** in Railway dashboard
4. **Deploy**

```bash
# Or use Railway CLI
railway login
railway init
railway up
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # ─────────────────────────────────────────────────────────
  # Lint & Type Check
  # ─────────────────────────────────────────────────────────
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  # ─────────────────────────────────────────────────────────
  # Test
  # ─────────────────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          REDIS_URL: redis://localhost:6379

  # ─────────────────────────────────────────────────────────
  # Deploy Preview (PR)
  # ─────────────────────────────────────────────────────────
  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      - run: pnpm vercel build --token=${{ secrets.VERCEL_TOKEN }}
      - run: pnpm vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  # ─────────────────────────────────────────────────────────
  # Deploy Production (main)
  # ─────────────────────────────────────────────────────────
  deploy-production:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: pnpm vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - id: deploy
        run: echo "url=$(pnpm vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})" >> $GITHUB_OUTPUT

      # Notify on success
      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployed to production: ${{ steps.deploy.outputs.url }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
pnpm lint-staged
```

---

## Monitoring & Observability

### Sentry Error Tracking

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### PostHog Analytics

```typescript
// lib/analytics.ts
import posthog from "posthog-js";

export function initAnalytics() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // Manual pageview tracking
    });
  }
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  posthog.capture(name, properties);
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { db, redis } from "@unisane/kernel";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      cache: "unknown",
    },
  };

  try {
    await db.command({ ping: 1 });
    checks.services.database = "healthy";
  } catch {
    checks.services.database = "unhealthy";
    checks.status = "degraded";
  }

  try {
    await redis.ping();
    checks.services.cache = "healthy";
  } catch {
    checks.services.cache = "unhealthy";
    checks.status = "degraded";
  }

  return Response.json(checks, {
    status: checks.status === "healthy" ? 200 : 503,
  });
}
```

### Logging

```typescript
// Using kernel logger in production
import { logger } from "@unisane/kernel";

// Structured logging
logger.info("user.signup", {
  userId: user.id,
  email: user.email,
  provider: "google",
});

logger.error("payment.failed", {
  tenantId,
  error: err.message,
  stripeErrorCode: err.code,
});
```

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] `NEXTAUTH_SECRET` is 32+ characters, randomly generated
- [ ] Database user has minimal required permissions
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on all public endpoints
- [ ] Input validation on all API routes (Zod schemas)
- [ ] SQL/NoSQL injection protection (parameterized queries)
- [ ] XSS protection (React auto-escapes, CSP headers)

### Headers Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Zero-Downtime Deployments

### Vercel (Automatic)

Vercel handles zero-downtime deployments automatically with atomic deployments.

### Docker/Kubernetes

Use rolling updates:

```yaml
# kubernetes deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Database Migrations

For zero-downtime migrations:

1. **Add new columns as nullable** first
2. **Deploy code** that writes to both old and new
3. **Migrate data** in background
4. **Deploy code** that reads from new
5. **Remove old columns** in final migration

---

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Docker Rollback

```bash
# Tag previous version
docker tag unisane-app:previous unisane-app:latest

# Restart
docker-compose up -d
```

### Database Rollback

```bash
# Run down migration
pnpm db:migrate:down

# Or restore from backup
mongorestore --uri="$MONGODB_URI" --archive=backup.archive
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 on startup | Missing env vars | Check `env.ts` validation errors in logs |
| Database connection timeout | Network/firewall | Check MongoDB Atlas network access |
| Redis connection refused | Wrong URL or not running | Verify `REDIS_URL` format |
| Auth redirect loop | Wrong `NEXTAUTH_URL` | Must match actual deployment URL |
| Stripe webhooks failing | Wrong webhook secret | Regenerate in Stripe dashboard |
| Build failing on Vercel | Memory limit | Increase function memory or optimize build |

### Debug Mode

```bash
# Enable debug logging
DEBUG=unisane:* pnpm start

# Vercel function logs
vercel logs [deployment-url]
```

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [dev-tools.md](./dev-tools.md), [troubleshooting.md](./troubleshooting.md)
