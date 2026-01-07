import { createApi } from "@/src/sdk/server";
import OutboxClient from "./OutboxClient";

export default async function AdminOutboxPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const api = await createApi();
  const seed = await api.admin.outbox.listDead({
    query: { limit: 50, ...(cursor ? { cursor } : {}) },
  } as any);
  return (
    <section className="py-6">
      <OutboxClient initial={seed as any} />
    </section>
  );
}
