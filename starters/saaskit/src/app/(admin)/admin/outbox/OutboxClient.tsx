"use client";
import { useMemo, useState } from "react";
import { DataTable } from "@unisane/data-table";
import type { Column } from "@unisane/data-table";
import { hooks } from "@/src/sdk/hooks";
import type { OutboxAdminDeadListItem, OutboxAdminDeadListResponse } from "@/src/sdk/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@unisane/ui/components/toast";
import { RATE_LIMIT_POLICIES } from "@unisane/gateway/client";
import { PageLayout } from "@/src/context/usePageLayout";

export default function OutboxClient({ initial }: { initial: OutboxAdminDeadListResponse }) {
  const columns = useMemo<Column<OutboxAdminDeadListItem>[]>(
    () => [
      { key: "kind", header: "Kind", width: 120, render: (r) => r.kind },
      {
        key: "attempts",
        header: "Attempts",
        render: (r) => r.attempts,
        align: "end",
        width: 100,
      },
      {
        key: "lastError",
        header: "Last error",
        render: (r) => r.lastError ?? "—",
        width: 420,
      },
      {
        key: "updatedAt",
        header: "Updated",
        render: (r) =>
          r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—",
        width: 200,
      },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <div className="flex items-center justify-end gap-3">
            <RequeueOne id={r.id} />
            <PurgeOne id={r.id} />
          </div>
        ),
        align: "end",
        width: 120,
      },
    ],
    []
  );
  const query = hooks.outbox.admin.deadList({ limit: 50 }, {
    placeholderData: initial.items as any,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    keepPreviousData: true,
  } as any);
  const dataset = useMemo(
    () => (query.data ?? initial.items) as OutboxAdminDeadListItem[],
    [query.data, initial.items]
  );

  return (
    <>
      <PageLayout subtitle="Dead letters; requeue or purge failed jobs." />
      <DataTable<OutboxAdminDeadListItem>
        data={dataset}
        columns={columns}
        title="Outbox — Dead"
        loading={query.isLoading && !query.data}
        tableId="admin-outbox-dead"
      />
      <PageActions rows={dataset} />
      {/* Selection actions could be added by wiring selection state if needed */}
    </>
  );
}

function RequeueOne({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const qc = useQueryClient();
  async function run() {
    try {
      setPending(true);
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadRequeue({ ids: [id] });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.requeueDead"];
      toast.success(`Requeued 1 item · ${pol.max}/${pol.windowSec}s`);
      // Refresh any dead-list queries
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <button
      className="text-xs underline disabled:opacity-50"
      type="button"
      onClick={run}
      disabled={pending}
    >
      {pending ? "Requeuing…" : "Requeue"}
    </button>
  );
}

function PurgeOne({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const qc = useQueryClient();
  async function run() {
    try {
      if (!window.confirm("Permanently delete this dead item?")) return;
      setPending(true);
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadPurge({ ids: [id] });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.purgeDead"];
      toast.success(`Purged 1 item · ${pol.max}/${pol.windowSec}s`);
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <button
      className="ml-3 text-xs underline text-error disabled:opacity-50"
      type="button"
      onClick={run}
      disabled={pending}
    >
      {pending ? "Purging…" : "Purge"}
    </button>
  );
}

function RequeueSelected({ ids }: { ids: string[] }) {
  const [pending, setPending] = useState(false);
  const qc = useQueryClient();
  const disabled = !ids.length || pending;
  async function run() {
    try {
      if (!ids.length) return;
      setPending(true);
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadRequeue({ ids });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.requeueDead"];
      toast.success(
        `Requeued ${ids.length} ${ids.length === 1 ? "item" : "items"} · ${pol.max}/${pol.windowSec}s`
      );
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex items-center gap-3">
      <button
        className="text-xs underline disabled:opacity-50"
        type="button"
        onClick={run}
        disabled={disabled}
        title={
          ids.length
            ? `Requeue ${ids.length} selected`
            : "Select rows to requeue"
        }
      >
        {pending ? "Requeuing…" : `Requeue selected (${ids.length})`}
      </button>
      <PurgeSelected ids={ids} />
    </div>
  );
}

function PurgeSelected({ ids }: { ids: string[] }) {
  const [pending, setPending] = useState(false);
  const qc = useQueryClient();
  const disabled = !ids.length || pending;
  async function run() {
    try {
      if (!ids.length) return;
      if (
        !window.confirm(
          `Permanently delete ${ids.length} dead item(s)? This cannot be undone.`
        )
      )
        return;
      setPending(true);
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadPurge({ ids });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.purgeDead"];
      toast.success(
        `Purged ${ids.length} ${ids.length === 1 ? "item" : "items"} · ${pol.max}/${pol.windowSec}s`
      );
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <button
      className="text-xs underline text-error disabled:opacity-50"
      type="button"
      onClick={run}
      disabled={disabled}
      title={
        ids.length ? `Purge ${ids.length} selected` : "Select rows to purge"
      }
    >
      {pending ? "Purging…" : `Purge selected (${ids.length})`}
    </button>
  );
}

function PageActions({
  rows,
}: {
  rows: OutboxAdminDeadListItem[] | undefined | null;
}) {
  const [pending, setPending] = useState<"requeue" | "purge" | null>(null);
  const qc = useQueryClient();
  const ids = useMemo(
    () => (Array.isArray(rows) ? rows.map((r) => r.id) : []),
    [rows]
  );
  const [allLimit, setAllLimit] = useState<number>(200);
  const has = ids.length > 0;
  async function requeueAll() {
    try {
      if (!has) return;
      setPending("requeue");
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadRequeue({ ids });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.requeueDead"];
      toast.success(
        `Requeued ${ids.length} on page · ${pol.max}/${pol.windowSec}s`
      );
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(null);
    }
  }
  async function purgeAll() {
    try {
      if (!has) return;
      if (
        !window.confirm(
          `Permanently delete ${ids.length} dead item(s) on this page?`
        )
      )
        return;
      setPending("purge");
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadPurge({ ids });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.purgeDead"];
      toast.success(
        `Purged ${ids.length} on page · ${pol.max}/${pol.windowSec}s`
      );
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(null);
    }
  }
  async function requeueAllDead() {
    try {
      setPending("requeue");
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadRequeueAll({ limit: allLimit });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.requeueDeadAll"];
      toast.success(
        `Requeue all (up to ${allLimit}) · ${pol.max}/${pol.windowSec}s`
      );
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(null);
    }
  }
  async function purgeAllDead() {
    try {
      if (
        !window.confirm("Permanently delete dead items across pages (bounded)?")
      )
        return;
      setPending("purge");
      const { browserApi: createApi } = await import(
        "@/src/sdk/clients/generated/browser"
      );
      const api = await createApi();
      await api.admin.outbox.deadPurgeAll({ limit: allLimit });
      const pol = RATE_LIMIT_POLICIES["admin.outbox.purgeDeadAll"];
      toast.success(
        `Purge all (up to ${allLimit}) · ${pol.max}/${pol.windowSec}s`
      );
      void qc.invalidateQueries({
        queryKey: ["outbox", "adminDeadList"],
        exact: false,
      });
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="flex items-center gap-3">
      <button
        className="text-xs underline disabled:opacity-50"
        type="button"
        onClick={requeueAll}
        disabled={!has || pending !== null}
      >
        {pending === "requeue" ? "Requeuing…" : `Requeue page (${ids.length})`}
      </button>
      <button
        className="text-xs underline text-error disabled:opacity-50"
        type="button"
        onClick={purgeAll}
        disabled={!has || pending !== null}
      >
        {pending === "purge" ? "Purging…" : `Purge page (${ids.length})`}
      </button>
      <span className="mx-1 text-on-surface-variant">|</span>
      <label className="text-xs text-on-surface-variant">Limit</label>
      <select
        className="text-xs border rounded px-1 py-0.5"
        value={allLimit}
        onChange={(e) => setAllLimit(Number(e.target.value) || 100)}
      >
        {[50, 100, 200, 500, 1000].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        className="text-xs underline disabled:opacity-50"
        type="button"
        onClick={requeueAllDead}
        disabled={pending !== null}
      >
        {pending === "requeue" ? "Requeuing…" : `Requeue all (bounded)`}
      </button>
      <button
        className="text-xs underline text-error disabled:opacity-50"
        type="button"
        onClick={purgeAllDead}
        disabled={pending !== null}
      >
        {pending === "purge" ? "Purging…" : `Purge all (bounded)`}
      </button>
    </div>
  );
}
