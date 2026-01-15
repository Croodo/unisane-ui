"use client";
import { useMemo, useState, useCallback, type ChangeEvent } from "react";
import { FLAG, getFlagMeta, isPlatformOnlyFlag } from "@unisane/kernel/client";
import type { FlagKey, AppEnv } from "@unisane/kernel/client";
import { hooks } from "@/src/sdk/hooks";
import { Button } from "@unisane/ui/components/button";
import { toast } from "@unisane/ui/components/toast";
import { useSession } from "@/src/context/SessionContext";
import { PageLayout } from "@/src/context/usePageLayout";
import { Dialog } from "@unisane/ui/components/dialog";
import { ConfirmDialog } from "@unisane/ui/components/confirm-dialog";
import { Badge } from "@unisane/ui/components/badge";
import { Icon } from "@unisane/ui/primitives/icon";
import { Switch } from "@unisane/ui/components/switch";
import { TextField } from "@unisane/ui/components/text-field";
import { Typography } from "@unisane/ui/components/typography";
import { EmptyState } from "@/src/components/feedback/EmptyState";

interface Props {
  env: AppEnv;
}

interface FlagMeta {
  enabledDefault: boolean;
  snapshotVersion: number;
  rules?: unknown[];
}

interface FlagState {
  key: FlagKey;
  label: string;
  description: string;
  category: string;
  platformOnly: boolean;
}

function FlagRow({
  env,
  flag,
  initial,
  canPublish,
}: {
  env: AppEnv;
  flag: FlagState;
  initial: FlagMeta | undefined;
  canPublish: boolean;
}) {
  const k = flag.key as string;
  const q = hooks.flags.get(
    { params: { key: k }, query: { env } },
    { enabled: !initial }
  );
  const fallback = q.data;
  const enabled = initial?.enabledDefault ?? Boolean(fallback?.enabledDefault);
  const version = initial?.snapshotVersion ?? fallback?.snapshotVersion ?? 0;
  const rules = (initial?.rules ?? fallback?.rules ?? []) as unknown[];
  const patch = hooks.flags.patch({
    onSuccess: () => toast.success("Flag updated"),
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast.error("Failed to update", { description: msg });
    },
  });
  const toggling = patch.isPending;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [nextValue, setNextValue] = useState<boolean>(!!enabled);

  const handleToggle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked;
      if (flag.platformOnly) {
        setNextValue(next);
        setConfirmOpen(true);
      } else {
        patch.mutate({
          params: { key: k },
          body: {
            env,
            key: k,
            enabledDefault: next,
            rules: rules as Parameters<typeof patch.mutate>[0]["body"]["rules"],
            expectedVersion: version,
          },
        });
      }
    },
    [flag.platformOnly, k, env, patch, rules, version]
  );

  const handleConfirm = useCallback(() => {
    patch.mutate({
      params: { key: k },
      body: {
        env,
        key: k,
        enabledDefault: Boolean(nextValue),
        rules: rules as Parameters<typeof patch.mutate>[0]["body"]["rules"],
        expectedVersion: version,
      },
    });
    setConfirmOpen(false);
  }, [k, env, patch, nextValue, rules, version]);

  return (
    <div className="flex items-center gap-4 px-4 py-4 hover:bg-surface-container-low/50 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Typography variant="titleMedium">{flag.label}</Typography>
          {flag.platformOnly && (
            <Badge variant="outlined" className="text-[10px] px-1.5 py-0 h-5">
              Platform
            </Badge>
          )}
        </div>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {flag.description}
        </Typography>
        <Typography
          variant="labelSmall"
          className="font-mono text-on-surface-variant/60 pt-1"
        >
          {k}
        </Typography>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
        >
          <Icon symbol="info" size="sm" />
        </button>
        <Switch
          checked={!!enabled}
          disabled={toggling || !canPublish}
          onChange={handleToggle}
        />
      </div>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={flag.label}
      >
        <div className="space-y-3">
          <Typography variant="bodyMedium" className="text-on-surface-variant">
            {flag.description}
          </Typography>
          <Typography variant="labelSmall" className="font-mono break-all">{k}</Typography>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Env: <span className="font-mono">{env}</span> · Default:{" "}
            <span className={enabled ? "text-primary" : "text-error"}>
              {String(enabled)}
            </span>{" "}
            · Version: v{version}
          </Typography>
          <Typography variant="labelMedium" className="font-semibold">Rules</Typography>
          <pre className="max-h-48 overflow-auto rounded-lg border border-outline-variant bg-surface-container p-2 text-label-small">
            {rules && rules.length ? JSON.stringify(rules, null, 2) : "[]"}
          </pre>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Per-tenant overrides can be managed from each tenant&apos;s{" "}
            <span className="font-medium">Flags</span> tab. User-level
            overrides are available via the flags userOverride API.
          </Typography>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change platform-critical flag?"
        description={`${flag.label} (${k}) is marked as platform-critical. Changing it may affect the entire deployment.`}
        variant="warning"
        onConfirm={handleConfirm}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    </div>
  );
}

export function FlagsClient({ env }: Props) {
  const { me } = useSession();
  const perms = (me?.perms ?? []) as string[];
  const canPublish = me?.isSuperAdmin || perms.includes("flags.publish");
  const allFlags = useMemo<FlagState[]>(() => {
    const keys = Object.values(FLAG) as FlagKey[];
    return keys
      .map((key) => {
        const meta = getFlagMeta(key);
        return {
          key,
          label: meta.label,
          description: meta.description,
          category: meta.category,
          platformOnly: isPlatformOnlyFlag(meta.key),
        } as FlagState;
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, []);
  const [search, setSearch] = useState("");
  const [platformOnlyFilter, setPlatformOnlyFilter] = useState(false);

  const list = hooks.flags.list({ env, keys: allFlags.map((i) => i.key) });
  const byKey = useMemo(() => {
    const m = new Map<string, FlagMeta>();
    const arr = list.data;
    if (arr)
      for (const it of arr)
        if (it?.flag)
          m.set(it.key, {
            enabledDefault: !!it.flag.enabledDefault,
            snapshotVersion: Number(it.flag.snapshotVersion ?? 0),
            ...(it.flag.rules ? { rules: it.flag.rules as unknown[] } : {}),
          });
    return m;
  }, [list.data]);

  const categories = useMemo(() => {
    const byCat = new Map<string, FlagState[]>();
    for (const f of allFlags) {
      const cat = f.category || "Other";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(f);
    }
    return Array.from(byCat.entries())
      .map(([id, flags]) => ({
        id,
        flags: flags.sort((a, b) => a.key.localeCompare(b.key)),
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [allFlags]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .map((g) => ({
        id: g.id,
        flags: g.flags.filter((f) => {
          if (platformOnlyFilter && !f.platformOnly) return false;
          if (!q) return true;
          return (
            f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((g) => g.flags.length > 0);
  }, [categories, search, platformOnlyFilter]);

  return (
    <>
      <PageLayout subtitle="Manage feature flags and their default states per environment" />
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-md">
            <TextField
              label="Search"
              variant="outlined"
              placeholder="Search flags by key or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Icon symbol="search" />}
              trailingIcon={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="hover:text-on-surface transition-colors"
                  >
                    <Icon symbol="close" size="sm" />
                  </button>
                ) : undefined
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={platformOnlyFilter ? "filled" : "outlined"}
              onClick={() => setPlatformOnlyFilter((v) => !v)}
              icon={<Icon symbol="shield" />}
            >
              Platform critical only
            </Button>
            <Badge variant="filled" className="px-3 py-1">
              {env.toUpperCase()}
            </Badge>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <EmptyState
              icon="flag"
              title="No flags found"
              description={search ? `No flags match "${search}". Try a different search term.` : "No flags match the current filters."}
              size="sm"
            />
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((g) => (
              <section key={g.id}>
                <div className="mb-6">
                  <Typography variant="titleLarge">{g.id}</Typography>
                  <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                    {g.flags.length} {g.flags.length === 1 ? "flag" : "flags"}
                  </Typography>
                </div>
                <div className="divide-y divide-outline-variant rounded-lg border border-outline-variant overflow-hidden">
                  {g.flags.map((f) => (
                    <FlagRow
                      key={f.key}
                      env={env}
                      flag={f}
                      canPublish={!!canPublish}
                      initial={byKey.get(f.key)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
