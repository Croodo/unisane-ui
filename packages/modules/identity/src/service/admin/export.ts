import { listUsers } from "../users";
import { streamCsv } from "@unisane/kernel";

export async function exportAdminUsers(args: {
  req: Request;
  params: { [k: string]: unknown } | undefined;
  body: unknown;
  ctx: unknown;
  query: { limit: number; cursor?: string | undefined; sort?: string | undefined };
  requestId: string;
}) {
  // Convert simple query to service args; factories remain raw Response wrappers
  const page = await listUsers({
    limit: args.query.limit,
    ...(args.query.cursor ? { cursor: args.query.cursor } : {}),
    ...(args.query.sort ? { sort: args.query.sort } : {}),
  });
  const headers = ["id","email","displayName","role","updatedAt"] as const;
  type UserItem = {
    id: string;
    email: string;
    displayName: string | null;
    role: string | null;
    updatedAt?: string | Date | null;
  };
  const items = page.items as UserItem[];
  const rows = items.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName ?? null,
    role: u.role ?? null,
    updatedAt:
      typeof u.updatedAt === "string"
        ? u.updatedAt
        : u.updatedAt instanceof Date
          ? u.updatedAt.toISOString()
          : null,
  }));
  const csv = streamCsv(rows, headers as unknown as string[]);
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const filename = `users-${yyyy}${mm}${dd}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename=${filename}`,
      'cache-control': 'no-store',
      'x-generated-at': d.toISOString(),
    },
  });
}
