/**
 * Credits Port Adapter
 *
 * Implements CreditsPort interface from kernel.
 * Wraps the existing credits module service functions.
 * Used by other modules (ai, billing) via the kernel port.
 */

import type {
  CreditsPort,
  CreditBalance,
  CreditTransaction,
} from "@unisane/kernel";
import { runWithScope } from "@unisane/kernel";
import { consume, type ConsumeCreditsArgs } from "./service/consume";
import { grantWithExplicitScope } from "./service/grant";
import { listLedger } from "./service/ledger";
import {
  totalsAvailable,
  listLedgerPage,
} from "./data/credits.repository";

/**
 * CreditsPort implementation that wraps the credits module services.
 */
export const creditsAdapter: CreditsPort = {
  async consume(args) {
    // Run within scope context (assume tenant scope for credits)
    return runWithScope({ type: "tenant", id: args.scopeId }, async () => {
      const consumeArgs: ConsumeCreditsArgs = {
        amount: args.amount,
        reason: args.reason,
        feature: args.feature,
      };

      const result = await consume(consumeArgs);

      // Get new balance after consume
      const { available } = await totalsAvailable(args.scopeId, new Date());

      if ("skipped" in result && result.skipped) {
        return { consumed: 0, remaining: available };
      }

      return { consumed: args.amount, remaining: available };
    });
  },

  async grant(args) {
    // DATA-003 FIX: Idempotency key must be deterministic for deduplication to work.
    // Previously used Date.now() which made every call unique, breaking idempotency.
    // Now uses scopeId + reason + amount + expiresAt (if provided) for consistent deduplication.
    // Callers should include unique identifiers in `reason` (e.g., "subscription:sub_123:period_456")
    const idemComponents = [
      'grant',
      args.scopeId,
      args.reason,
      String(args.amount),
    ];
    if (args.expiresAt) {
      idemComponents.push(args.expiresAt.toISOString());
    }
    const idem = idemComponents.join(':');

    const result = await grantWithExplicitScope({
      scopeId: args.scopeId,
      amount: args.amount,
      reason: args.reason,
      idem,
      expiresAt: args.expiresAt,
    });

    // Get new balance after grant
    const { available } = await totalsAvailable(args.scopeId, new Date());

    if ("deduped" in result && result.deduped) {
      return { granted: 0, newBalance: available };
    }

    return { granted: args.amount, newBalance: available };
  },

  async getBalance(scopeId) {
    const { available } = await totalsAvailable(scopeId, new Date());

    // Get expiring credits from ledger
    const { rows } = await listLedgerPage({ scopeId, limit: 100 });
    const expiring = rows
      .filter(
        (r) =>
          r.kind === "grant" && r.expiresAt && r.expiresAt > new Date()
      )
      .map((r) => ({
        amount: r.amount,
        expiresAt: r.expiresAt!,
      }));

    const balance: CreditBalance = {
      available,
      reserved: 0, // Credits module doesn't currently track reserved credits
      expiring,
    };

    return balance;
  },

  async hasSufficient(scopeId, amount) {
    const { available } = await totalsAvailable(scopeId, new Date());
    return available >= amount;
  },

  async getTransactions(args) {
    return runWithScope({ type: "tenant", id: args.scopeId }, async () => {
      const { items } = await listLedger({
        limit: args.limit ?? 50,
        cursor: args.offset ? String(args.offset) : undefined,
      });

      const transactions: CreditTransaction[] = items.map((item) => ({
        id: item.id,
        scopeId: args.scopeId,
        kind: item.kind,
        amount: item.amount,
        reason: item.reason,
        balanceAfter: 0, // Not tracked in current implementation
        metadata: item.feature ? { feature: item.feature } : undefined,
        createdAt: item.createdAt,
      }));

      // Total is not efficiently available without additional query
      // For now, return items.length as an approximation
      return { transactions, total: transactions.length };
    });
  },
};
