import { createApi } from "@/src/sdk/server";
import OutboxClient from "./OutboxClient";

export default async function AdminOutboxPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const api = await createApi();
  const seed = await api.admin.outbox.deadList({
    query: { limit: 50, ...(cursor ? { cursor } : {}) },
  });
  return (
    <section>
      <OutboxClient initial={seed as any} />
    </section>
  );
}
