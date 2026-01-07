"use client";
import { useMemo, useState } from "react";
import { FLAG, getFlagMeta } from "@/src/shared/constants/feature-flags";
import type { FlagKey } from "@/src/shared/constants/feature-flags";
import { hooks } from "@/src/sdk/hooks";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import { useSession } from "@/src/context/SessionContext";
import { PageHeader } from "@/src/context/usePageHeader";
import type { AppEnv } from "@/src/shared/constants/env";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { isPlatformOnlyFlag } from "@/src/shared/constants/feature-flags";
import { Search, Shield } from "lucide-react";
import { Switch } from "@/src/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

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
  const [nextValue, setNextValue] = useState<boolean>(!!enabled);

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors">
      <div className="space-y-1 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{flag.label}</span>
          {flag.platformOnly && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              Platform
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono break-all">
          {k}
        </div>
        <p className="text-xs text-muted-foreground">{flag.description}</p>
      </div>
      <div className="flex items-center gap-3">
        {flag.platformOnly && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-amber-600">
            <Shield className="h-3 w-3" />
            Protected
          </span>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{flag.label}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {flag.description}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-2">
              <div className="text-xs font-mono break-all">{k}</div>
              <div className="text-xs text-muted-foreground">
                Env: <span className="font-mono">{env}</span> · Default:{" "}
                <span className={enabled ? "text-emerald-600" : "text-red-600"}>
                  {String(enabled)}
                </span>{" "}
                · Version: v{version}
              </div>
              <div className="text-xs font-semibold">Rules</div>
              <pre className="max-h-48 overflow-auto rounded border bg-muted p-2 text-xs">
                {rules && rules.length ? JSON.stringify(rules, null, 2) : "[]"}
              </pre>
              <p className="text-xs text-muted-foreground">
                Per-tenant overrides can be managed from each tenant&apos;s{" "}
                <span className="font-medium">Flags</span> tab. User-level
                overrides are available via the flags userOverride API.
              </p>
            </div>
          </DialogContent>
        </Dialog>
        {flag.platformOnly ? (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Switch
              checked={!!enabled}
              disabled={toggling || !canPublish}
              onCheckedChange={(next) => {
                if (toggling || !canPublish) return;
                setNextValue(Boolean(next));
                setConfirmOpen(true);
              }}
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Change platform-critical flag?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium">{flag.label}</span> ({k}) is
                  marked as platform-critical. Changing it may affect the entire
                  deployment.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    patch.mutate({
                      params: { key: k },
                      body: {
                        env,
                        key: k,
                        enabledDefault: Boolean(nextValue),
                        rules: rules as Parameters<
                          typeof patch.mutate
                        >[0]["body"]["rules"],
                        expectedVersion: version,
                      },
                    });
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Switch
            checked={!!enabled}
            disabled={toggling || !canPublish}
            onCheckedChange={(next) => {
              patch.mutate({
                params: { key: k },
                body: {
                  env,
                  key: k,
                  enabledDefault: Boolean(next),
                  rules: rules as Parameters<
                    typeof patch.mutate
                  >[0]["body"]["rules"],
                  expectedVersion: version,
                },
              });
            }}
          />
        )}
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
          <h2 className="text-lg font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted-foreground">
            Environment: {env}. Platform flags are restricted to super admins.
          </p>
        </div>
        <div className="flex items-center gap-0 rounded-md border bg-background px-4 py-1.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search flags by key or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full border-none bg-transparent pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            />
          </div>
          <div className="mx-3 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={() => setPlatformOnlyFilter((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-3 w-3" />
            <span>Platform critical only</span>
          </button>
        </div>
        {filteredCategories.length === 0 ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            No flags match the current filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map((g) => (
              <section key={g.id} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  <span>{g.id}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({g.flags.length})
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border bg-card/70 divide-y">
                  {g.flags.map((f, idx) => (
                    <div key={f.key}>
                      <FlagRow
                        env={env}
                        flag={f}
                        canPublish={!!canPublish}
                        initial={byKey.get(f.key)}
                      />
                    </div>
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
