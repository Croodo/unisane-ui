"use client";
import { useMemo, useState, useCallback, type ChangeEvent } from "react";
import { FLAG, getFlagMeta } from "@/src/shared/constants/feature-flags";
import type { FlagKey } from "@/src/shared/constants/feature-flags";
import { hooks } from "@/src/sdk/hooks";
import { Button } from "@unisane/ui/components/button";
import { toast } from "@unisane/ui/components/toast";
import { useSession } from "@/src/context/SessionContext";
import { PageHeader } from "@/src/context/usePageHeader";
import type { AppEnv } from "@/src/shared/constants/env";
import { Dialog } from "@unisane/ui/components/dialog";
import { ConfirmDialog } from "@unisane/ui/components/confirm-dialog";
import { Badge } from "@unisane/ui/components/badge";
import { isPlatformOnlyFlag } from "@/src/shared/constants/feature-flags";
import { Icon } from "@unisane/ui/primitives/icon";
import { Switch } from "@unisane/ui/components/switch";
import { Input } from "@unisane/ui/primitives/input";
import { Text } from "@unisane/ui/primitives/text";

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
    <div className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low transition-colors">
      <div className="space-y-1 pr-4">
        <div className="flex items-center gap-2">
          <Text variant="bodyMedium" weight="medium">{flag.label}</Text>
          {flag.platformOnly && (
            <Badge variant="outlined" className="text-[10px] px-1.5 py-0 h-5">
              Platform
            </Badge>
          )}
        </div>
        <Text variant="labelSmall" className="font-mono break-all text-on-surface-variant">
          {k}
        </Text>
        <Text variant="labelSmall" color="onSurfaceVariant">{flag.description}</Text>
      </div>
      <div className="flex items-center gap-3">
        {flag.platformOnly && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-tertiary">
            <Icon symbol="shield" size="sm" />
            Protected
          </span>
        )}

        <Button variant="text" size="sm" onClick={() => setDetailsOpen(true)}>
          Details
        </Button>

        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title={flag.label}
        >
          <div className="space-y-3">
            <Text variant="bodySmall" color="onSurfaceVariant">
              {flag.description}
            </Text>
            <Text variant="labelSmall" className="font-mono break-all">{k}</Text>
            <Text variant="labelSmall" color="onSurfaceVariant">
              Env: <span className="font-mono">{env}</span> · Default:{" "}
              <span className={enabled ? "text-primary" : "text-error"}>
                {String(enabled)}
              </span>{" "}
              · Version: v{version}
            </Text>
            <Text variant="labelMedium" weight="semibold">Rules</Text>
            <pre className="max-h-48 overflow-auto rounded-lg border border-outline-variant bg-surface-container p-2 text-label-small">
              {rules && rules.length ? JSON.stringify(rules, null, 2) : "[]"}
            </pre>
            <Text variant="labelSmall" color="onSurfaceVariant">
              Per-tenant overrides can be managed from each tenant&apos;s{" "}
              <span className="font-medium">Flags</span> tab. User-level
              overrides are available via the flags userOverride API.
            </Text>
          </div>
        </Dialog>

        <Switch
          checked={!!enabled}
          disabled={toggling || !canPublish}
          onChange={handleToggle}
        />

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
      <PageHeader title="Feature Flags" subtitle={`Environment: ${env}`} />
      <section className="py-6 space-y-4 max-w-3xl mx-auto">
        <div>
          <Text as="h2" variant="titleMedium">Feature Flags</Text>
          <Text variant="bodySmall" color="onSurfaceVariant">
            Environment: {env}. Platform flags are restricted to super admins.
          </Text>
        </div>
        <div className="flex items-center gap-0 rounded-lg border border-outline-variant bg-surface px-4 py-1.5">
          <div className="relative flex-1 min-w-[220px]">
            <Icon symbol="search" size="sm" className="absolute left-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <Input
              placeholder="Search flags by key or name…"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="h-8 w-full border-none bg-transparent pl-7 pr-2 text-body-small placeholder:text-on-surface-variant focus:outline-none focus:ring-0"
            />
          </div>
          <div className="mx-3 h-5 w-px bg-outline-variant" />
          <button
            type="button"
            onClick={() => setPlatformOnlyFilter((v) => !v)}
            className={`flex items-center gap-2 text-label-small font-medium transition-colors ${
              platformOnlyFilter ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon symbol="shield" size="sm" />
            <span>Platform critical only</span>
          </button>
        </div>
        {filteredCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-outline-variant py-10 text-center text-body-small text-on-surface-variant">
            No flags match the current filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map((g) => (
              <section key={g.id} className="space-y-2">
                <div className="flex items-center gap-2 text-label-small font-semibold tracking-wide uppercase text-on-surface-variant">
                  <span>{g.id}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    ({g.flags.length})
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface divide-y divide-outline-variant">
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
