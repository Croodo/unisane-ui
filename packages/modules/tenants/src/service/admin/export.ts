import { listAdminTenants } from "../admin/list";
import { streamCsv } from "@unisane/kernel";

export async function exportAdminTenants(args: {
  req: Request;
  params: { [k: string]: unknown } | undefined;
  body: unknown;
  ctx: unknown;
  query: {
    limit: number;
    cursor?: string | undefined;
    sort?: string | undefined;
  };
  requestId: string;
}) {
  const page = await listAdminTenants({
    limit: args.query.limit,
    ...(args.query.cursor ? { cursor: args.query.cursor } : {}),
    ...(args.query.sort ? { sort: args.query.sort } : {}),
  });
  const headers = [
    "id",
    "slug",
    "name",
    "planId",
    "membersCount",
    "adminsCount",
    "apiKeysCount",
    "flagOverridesCount",
    "invoicesOpenCount",
    "webhooksFailed24h",
    "creditsAvailable",
    "lastActivityAt",
    "subStatus",
    "subQuantity",
    "subPeriodEnd",
  ] as const;
  const items = page.items as Array<{
    id: string;
    slug: string;
    name: string;
    planId: string;
    membersCount?: number;
    adminsCount?: number;
    apiKeysCount?: number;
    flagOverridesCount?: number;
    invoicesOpenCount?: number;
    webhooksFailed24h?: number;
    creditsAvailable?: number;
    lastActivityAt?: string | null;
    subscription?: {
      status: string | null;
      quantity: number | null;
      currentPeriodEnd: string | null;
    } | null;
  }>;
  const rows = items.map((t) => {
    const sub = t.subscription ?? null;
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      planId: t.planId,
      membersCount: t.membersCount ?? 0,
      adminsCount: t.adminsCount ?? 0,
      apiKeysCount: t.apiKeysCount ?? 0,
      flagOverridesCount: t.flagOverridesCount ?? 0,
      invoicesOpenCount: t.invoicesOpenCount ?? 0,
      webhooksFailed24h: t.webhooksFailed24h ?? 0,
      creditsAvailable: t.creditsAvailable ?? 0,
      lastActivityAt: t.lastActivityAt ?? null,
      subStatus: sub?.status ?? null,
      subQuantity: sub?.quantity ?? null,
      subPeriodEnd: sub?.currentPeriodEnd ?? null,
    };
  });
  const csv = streamCsv(rows, headers as unknown as string[]);
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const filename = `tenants-${yyyy}${mm}${dd}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
      "x-generated-at": d.toISOString(),
    },
  });
}
