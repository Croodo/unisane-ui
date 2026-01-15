import {
  col,
  COLLECTIONS,
  seekPageMongoCollection,
  type CreditKind,
  type FeatureKey,
  type Document,
  type Filter,
  type WithId,
} from '@unisane/kernel';
import type { CreditsRepoPort } from '../domain/ports';
import type { LedgerEntry } from '../domain/types';

type CreditLedgerDoc = {
  scopeId: string;
  kind: CreditKind;
  amount: number;
  reason?: string | null;
  feature?: FeatureKey | null;
  idemKey?: string;
  expiresAt?: Date | null;
  createdAt?: Date;
};

const ledgerCol = () => col<CreditLedgerDoc>(COLLECTIONS.CREDIT_LEDGER);

export const CreditsRepoMongo: CreditsRepoPort = {
  async findByIdem(scopeId, idemKey) {
    const row = (await ledgerCol().findOne({ scopeId, idemKey } as Document)) as CreditLedgerDoc | null;
    if (!row) return null;
    return {
      id: String((row as { _id?: unknown })._id ?? ''),
      kind: (row.kind as CreditKind) ?? 'grant',
      amount: (row.amount as number) ?? 0,
      reason: (row.reason as string) ?? '',
      feature: (row.feature as FeatureKey | null | undefined) ?? null,
      createdAt: (row.createdAt as Date | undefined) ?? new Date(),
      expiresAt: (row.expiresAt as Date | null | undefined) ?? null,
    } as LedgerEntry;
  },
  async insertGrant(args) {
    const now = new Date();
    const r = await ledgerCol().insertOne({
      scopeId: args.scopeId,
      kind: 'grant',
      amount: args.amount,
      reason: args.reason,
      idemKey: args.idemKey,
      ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
      createdAt: now,
    } as CreditLedgerDoc);
    return { id: String(r.insertedId) };
  },
  async insertBurn(args) {
    const now = new Date();
    const r = await ledgerCol().insertOne({
      scopeId: args.scopeId,
      kind: 'burn',
      amount: args.amount,
      feature: args.feature,
      reason: args.reason ?? `use:${args.feature}`,
      idemKey: args.idemKey,
      createdAt: now,
    } as CreditLedgerDoc);
    return { id: String(r.insertedId) };
  },
  async totalsAvailable(scopeId, now = new Date()) {
    const agg = await ledgerCol()
      .aggregate<{ _id: null; grants: number; burns: number }>([
        { $match: { scopeId } },
        {
          $group: {
            _id: null,
            grants: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$kind', 'grant'] }, { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', now] }] }] },
                  '$amount',
                  0,
                ],
              },
            },
            burns: { $sum: { $cond: [{ $eq: ['$kind', 'burn'] }, '$amount', 0] } },
          },
        },
      ])
      .toArray();
    const grants = agg[0]?.grants ?? 0;
    const burns = agg[0]?.burns ?? 0;
    return { grants, burns, available: grants - burns };
  },
  async getBalancesByScopeIds(scopeIds: string[], now = new Date()): Promise<Map<string, number>> {
    if (!scopeIds?.length) return new Map<string, number>();
    const rows = (await ledgerCol()
      .aggregate([
        { $match: { scopeId: { $in: scopeIds } } },
        {
          $group: {
            _id: "$scopeId",
            grants: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$kind", "grant"] },
                      {
                        $or: [
                          { $eq: ["$expiresAt", null] },
                          { $gt: ["$expiresAt", now] },
                        ],
                      },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
            burns: {
              $sum: { $cond: [{ $eq: ["$kind", "burn"] }, "$amount", 0] },
            },
          },
        },
        { $project: { _id: 1, creditsAvailable: { $subtract: ["$grants", "$burns"] } } },
      ])
      .toArray()) as Array<{ _id: string; creditsAvailable: number }>;
    const m = new Map<string, number>();
    for (const r of rows) m.set(String(r._id), r.creditsAvailable ?? 0);
    return m;
  },
  async totalsGrantsByReason(scopeId, now = new Date()) {
    const agg = await ledgerCol()
      .aggregate<{
        _id: null;
        subscriptionGrants: number;
        topupGrants: number;
        otherGrants: number;
      }>([
        { $match: { scopeId } },
        {
          $group: {
            _id: null,
            subscriptionGrants: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$kind', 'grant'] },
                      {
                        $or: [
                          { $eq: ['$expiresAt', null] },
                          { $gt: ['$expiresAt', now] },
                        ],
                      },
                      {
                        $regexMatch: {
                          input: { $ifNull: ['$reason', ''] },
                          regex: /^subscription:/,
                        },
                      },
                    ],
                  },
                  '$amount',
                  0,
                ],
              },
            },
            topupGrants: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$kind', 'grant'] },
                      {
                        $or: [
                          { $eq: ['$expiresAt', null] },
                          { $gt: ['$expiresAt', now] },
                        ],
                      },
                      {
                        $regexMatch: {
                          input: { $ifNull: ['$reason', ''] },
                          // Treat purchase and explicit topup:* as top-up credits
                          regex: /^(purchase(?::|$)|topup:)/,
                        },
                      },
                    ],
                  },
                  '$amount',
                  0,
                ],
              },
            },
            otherGrants: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$kind', 'grant'] },
                      {
                        $or: [
                          { $eq: ['$expiresAt', null] },
                          { $gt: ['$expiresAt', now] },
                        ],
                      },
                      {
                        $not: [
                          {
                            $regexMatch: {
                              input: { $ifNull: ['$reason', ''] },
                              regex: /^subscription:/,
                            },
                          },
                        ],
                      },
                      {
                        $not: [
                          {
                            $regexMatch: {
                              input: { $ifNull: ['$reason', ''] },
                              regex: /^(purchase(?::|$)|topup:)/,
                            },
                          },
                        ],
                      },
                    ],
                  },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray();
    const row = agg[0];
    return {
      subscriptionGrants: row?.subscriptionGrants ?? 0,
      topupGrants: row?.topupGrants ?? 0,
      otherGrants: row?.otherGrants ?? 0,
    };
  },
  /**
   * Combined aggregation for breakdown - returns totals AND grants by reason in a single query.
   * Uses $facet to avoid two separate collection scans.
   */
  async totalsWithBreakdown(scopeId, now = new Date()) {
    // Helper conditions for grant expiry check
    const grantNotExpired = {
      $and: [
        { $eq: ['$kind', 'grant'] },
        { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', now] }] },
      ],
    };

    const agg = await ledgerCol()
      .aggregate<{
        totals: Array<{ grants: number; burns: number }>;
        byReason: Array<{ subscriptionGrants: number; topupGrants: number; otherGrants: number }>;
      }>([
        { $match: { scopeId } },
        {
          $facet: {
            // First facet: total grants and burns
            totals: [
              {
                $group: {
                  _id: null,
                  grants: {
                    $sum: { $cond: [grantNotExpired, '$amount', 0] },
                  },
                  burns: {
                    $sum: { $cond: [{ $eq: ['$kind', 'burn'] }, '$amount', 0] },
                  },
                },
              },
            ],
            // Second facet: grants broken down by reason
            byReason: [
              {
                $group: {
                  _id: null,
                  subscriptionGrants: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            grantNotExpired,
                            { $regexMatch: { input: { $ifNull: ['$reason', ''] }, regex: /^subscription:/ } },
                          ],
                        },
                        '$amount',
                        0,
                      ],
                    },
                  },
                  topupGrants: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            grantNotExpired,
                            { $regexMatch: { input: { $ifNull: ['$reason', ''] }, regex: /^(purchase(?::|$)|topup:)/ } },
                          ],
                        },
                        '$amount',
                        0,
                      ],
                    },
                  },
                  otherGrants: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            grantNotExpired,
                            { $not: [{ $regexMatch: { input: { $ifNull: ['$reason', ''] }, regex: /^subscription:/ } }] },
                            { $not: [{ $regexMatch: { input: { $ifNull: ['$reason', ''] }, regex: /^(purchase(?::|$)|topup:)/ } }] },
                          ],
                        },
                        '$amount',
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const totalsRow = agg[0]?.totals?.[0];
    const byReasonRow = agg[0]?.byReason?.[0];

    const grants = totalsRow?.grants ?? 0;
    const burns = totalsRow?.burns ?? 0;

    return {
      grants,
      burns,
      available: grants - burns,
      subscriptionGrants: byReasonRow?.subscriptionGrants ?? 0,
      topupGrants: byReasonRow?.topupGrants ?? 0,
      otherGrants: byReasonRow?.otherGrants ?? 0,
    };
  },
  async listLedgerPage(args) {
    type Row = { _id: unknown; kind?: CreditKind; amount?: number; reason?: string; feature?: FeatureKey | null; createdAt?: Date; expiresAt?: Date | null };
    const sortVec = [
      { key: "createdAt", order: -1 as const },
      { key: "_id", order: -1 as const },
    ];
    const { items, nextCursor } = await seekPageMongoCollection<CreditLedgerDoc, LedgerEntry>({
      collection: ledgerCol(),
      baseFilter: { scopeId: args.scopeId } as Filter<CreditLedgerDoc>,
      limit: args.limit,
      cursor: args.cursor ?? null,
      sortVec,
      projection: {
        _id: 1,
        kind: 1,
        amount: 1,
        reason: 1,
        feature: 1,
        createdAt: 1,
        expiresAt: 1,
      },
      map: (r: WithId<CreditLedgerDoc>) => ({
        id: String(r._id ?? ''),
        kind: (r.kind as CreditKind) ?? 'grant',
        amount: r.amount ?? 0,
        reason: r.reason ?? '',
        feature: (r.feature as FeatureKey | null | undefined) ?? null,
        createdAt: r.createdAt ?? new Date(),
        expiresAt: r.expiresAt ?? null,
      }),
    });
    const rows = items;
    return { rows, ...(nextCursor ? { nextCursor } : {}) } as const;
  },
};
