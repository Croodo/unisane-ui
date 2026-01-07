Billing module — Repos, Ports, and DB adapters
=============================================

Structure
- domain/
  - schemas.ts — Zod DTOs for API inputs/outputs
  - types.ts — optional status types (PaymentStatus, InvoiceStatus, SubscriptionStatus)
  - ports/ — provider‑agnostic repo interfaces
    - subscriptions.ts — SubscriptionsRepo
    - payments.ts — PaymentsRepo
    - invoices.ts — InvoicesRepo
- data/
  - <resource>.repo.ts — façade selecting the adapter by DB provider via `selectRepo`
  - <resource>.repo.mongo.ts — MongoDB adapter
  - keys.ts — idempotency/lock keys (e.g., refundLockKey)
- service/ — business logic (verb‑first): subscribe, cancel, refund, reconcile, list*, etc.

DB provider selection
- Central decision: `src/core/db/provider.ts` with `getDbProvider()`
- Repos use `src/core/repo/select.ts` to pick the adapter:
  ```ts
  const repo = selectRepo<PaymentsRepo>({ mongo: mongoPaymentsRepo /*, mysql: mysqlPaymentsRepo */ });
  ```
- Default is Mongo. When you add a MySQL adapter, include it in the map and set `DB_PROVIDER=mysql`.

Adding a new DB adapter (MySQL example)
1) Implement the port in a new file `data/<resource>.repository.mysql.ts` using your SQL client/ORM.
2) Wire the adapter in the façade:
   - Update `data/<resource>.repo.ts` to pass `{ mongo: ..., mysql: mysql... }` to `selectRepo()`.
3) If DB bootstrap differs, add `connectMysql()` in `src/core/db/index.ts` and a branch in `connectDb()`.
4) Leave services unchanged — they depend only on ports.

Ports overview
- PaymentsRepo
  - listPage({ tenantId, cursor?, limit }) → PaymentListPage
  - findByProviderPaymentId({ tenantId, providerPaymentId }) → PaymentDetail|null
  - markRefunded(id)
  - upsertByProviderId({ tenantId, provider, providerPaymentId, amount?, currency?, status, capturedAt? })
  - listByProviderId(provider) → [{ tenantId, providerPaymentId }]
- InvoicesRepo
  - listPage({ tenantId, cursor?, limit }) → InvoiceListPage
  - upsertByProviderId({ tenantId, provider, providerInvoiceId, amount, currency, status, issuedAt?, url? })
- SubscriptionsRepo
  - getLatest(tenantId) → SubscriptionView|null
  - getLatestProviderSubId(tenantId) → string|null
  - setCancelAtPeriodEnd(tenantId), setCanceledImmediate(tenantId), setQuantity(tenantId, q)
  - upsertByProviderId({ tenantId, provider, providerSubId, planId, quantity, status, cancelAtPeriodEnd?, currentPeriodEnd? })
  - listByProviderId(provider) → [{ tenantId, providerSubId }]

Notes
- Services and webhooks use repo ports only — no direct model imports.
- The façade pattern + ports make adding databases a zero‑change operation for services and routes.
- Keep outputs JSON‑safe (no `undefined`), and normalize provider statuses in services if needed.
- Public surface: import billing services from the module barrel `@/src/modules/billing` (no deep `service/*` paths). Platform code should never import billing repos directly.
- Status model: we persist canonical `status` and raw `providerStatus` on Subscription; mapping helpers live in `src/modules/billing/domain/mappers.ts`.
