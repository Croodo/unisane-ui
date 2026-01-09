import type { Collection, Document } from "mongodb";
import type { EntitySchema } from "../schema/types";
import { extractFacetFields } from "../schema/utils";
import type { SortField } from "../pagination/types";

export type StatsResult = {
  total: number;
  facets: Record<string, Record<string, number>>;
};

type FacetResultItem = {
  _id: unknown;
  count: number;
};

export async function runStatsAggregation<T extends Document>(
  collection: Collection<T>,
  filter: Record<string, unknown>,
  schema: EntitySchema
): Promise<StatsResult> {
  const facetFields = extractFacetFields(schema);

  const facetStage: Record<string, Array<Record<string, unknown>>> = {
    total: [{ $count: "count" }],
  };

  for (const [name, meta] of Object.entries(facetFields)) {
    facetStage[name] = [
      {
        $group: {
          _id: { $ifNull: [`$${meta.path}`, "unknown"] },
          count: { $sum: 1 },
        },
      },
    ];
  }

  const pipeline = [{ $match: filter }, { $facet: facetStage }];
  const results = await collection.aggregate(pipeline).toArray();
  const result = results[0] as Record<string, unknown> | undefined;

  const totalArr = result?.total as Array<{ count: number }> | undefined;
  const total = totalArr?.[0]?.count ?? 0;

  const facets: Record<string, Record<string, number>> = {};
  for (const name of Object.keys(facetFields)) {
    const items = (result?.[name] as FacetResultItem[] | undefined) ?? [];
    facets[name] = mapFacetResult(items);
  }

  return { total, facets };
}

function mapFacetResult(items: FacetResultItem[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = String(item._id ?? "unknown");
    result[key] = Number(item.count ?? 0);
  }
  return result;
}

export function parseSortSpec(
  sortSpec: string | undefined | null,
  allowedFields: Record<string, string>,
  defaultSort: string = "-createdAt"
): SortField[] {
  const sortRaw = (sortSpec ?? defaultSort).trim();
  const parts = sortRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const sortVec: SortField[] = [];

  for (const p of parts) {
    const order: 1 | -1 = p.startsWith("-") ? -1 : 1;
    const key = p.replace(/^[-+]/, "");
    const dbKey = allowedFields[key];
    if (!dbKey) continue;
    sortVec.push({ key: dbKey, order });
  }

  if (!sortVec.length) {
    sortVec.push({ key: "createdAt", order: -1 });
  }

  if (!sortVec.find((v) => v.key === "_id")) {
    sortVec.push({ key: "_id", order: sortVec[0]!.order });
  }

  return sortVec;
}

export const COMMON_SORT_FIELDS: Record<string, string> = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  _id: "_id",
};
