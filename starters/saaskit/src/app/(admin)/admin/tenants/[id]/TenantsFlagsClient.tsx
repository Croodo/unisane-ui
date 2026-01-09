"use client";
import { useMemo, useState } from "react";
import {
  FLAG,
  getFlagMeta,
  isPlatformOnlyFlag,
} from "@/src/shared/constants/feature-flags";
import type { FlagKey } from "@/src/shared/constants/feature-flags";
import type { AppEnv } from "@/src/shared/constants/env";
import { hooks } from "@/src/sdk/hooks";
import { Button } from "@unisane/ui/components/button";
import { Divider } from "@unisane/ui/components/divider";
import { Badge } from "@unisane/ui/components/badge";
import { toast } from "@unisane/ui/components/toast";
import { useSession } from "@/src/context/SessionContext";
import { Input } from "@unisane/ui/primitives/input";
import { Label } from "@unisane/ui/primitives/label";

interface Props {
  env: AppEnv;
  tenantId: string;
}

interface FlagState {
  key: FlagKey;
  label: string;
  description: string;
  platformOnly: boolean;
}

// Subset of flags where tenant-level overrides make sense
const TENANT_FLAG_KEYS: FlagKey[] = [
  FLAG.ADMIN_SURFACE_ENABLED,
  FLAG.ADMIN_JOBS_ENABLED,
  FLAG.UI_NEW_NAV,
  FLAG.UI_ADMIN_DASH,
  FLAG.AUTH_PASSWORD_ENABLED,
  FLAG.BILLING_ENABLED,
  FLAG.BILLING_REFUND,
  FLAG.BILLING_PROV_STRIPE,
  FLAG.BILLING_PROV_RAZORPAY,
  FLAG.CREDITS_ENABLED,
  FLAG.AI_BETA,
  FLAG.AI_GENERATE,
  FLAG.PDF_RENDER,
  FLAG.IMPORT_ENABLED,
  FLAG.EXPORT_ENABLED,
  FLAG.APIKEYS_ENABLED,
];

function Row({
  env,
  tenantId,
  flag,
  globalDefault,
  canPublish,
}: {
  env: AppEnv;
  tenantId: string;
  flag: FlagState;
  globalDefault: { enabledDefault: boolean } | null | undefined;
  canPublish: boolean;
}) {
  const ovrQ = hooks.flags.override({
    params: { tenantId, key: flag.key },
    query: { env },
  });
  const ovr = ovrQ.data ?? null;
  const effective = ovr
    ? ovr.value
    : Boolean(globalDefault?.enabledDefault ?? false);
  const [expiry, setExpiry] = useState<string>("");
  const setOvr = hooks.flags.setOverride({
    onSuccess: () => toast.success("Override updated"),
    onError: (e: unknown) =>
      toast.error("Failed to update override", {
        description: (e as any)?.message ?? "",
      }),
  });
  const clearOvr = hooks.flags.clearOverride({
    onSuccess: () => toast.success("Override cleared"),
    onError: (e: unknown) =>
      toast.error("Failed to clear override", {
        description: (e as any)?.message ?? "",
      }),
  });
  const pending = setOvr.isPending || clearOvr.isPending;
  const expires = ovr?.expiresAt
    ? new Date(ovr.expiresAt).toLocaleString()
    : null;
  const overrideDisabled = !canPublish || flag.platformOnly;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{flag.label}</span>
          {flag.platformOnly && (
            <Badge
              variant="outlined"
              className="text-[10px] px-1.5 py-0 h-5 uppercase"
            >
              Platform
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono break-all">
          {flag.key}
        </div>
        <p className="text-xs text-muted-foreground">{flag.description}</p>
        <div className="text-xs text-muted-foreground">
          Effective:{" "}
          <span className={effective ? "text-emerald-600" : "text-red-600"}>
            {effective ? "On" : "Off"}
          </span>
          {typeof globalDefault?.enabledDefault === "boolean" ? (
            <span>
              {" "}
              · Default: {globalDefault.enabledDefault ? "On" : "Off"}
            </span>
          ) : null}
          {ovr ? (
            <span>
              {" "}
              · Override: {ovr.value ? "On" : "Off"}
              {expires ? ` (until ${expires})` : ""}
            </span>
          ) : (
            <span> · Override: none</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 mr-2">
          <Label
            className="text-xs text-muted-foreground"
            htmlFor={`exp-${flag.key}`}
          >
            Expiry
          </Label>
          <Input
            id={`exp-${flag.key}`}
            type="datetime-local"
            className="h-8 w-56"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            disabled={overrideDisabled}
          />
        </div>
        <Button
          size="sm"
          variant={effective ? "filled" : "outlined"}
          disabled={pending || overrideDisabled}
          onClick={() => {
            const expiresAt = expiry
              ? new Date(expiry).toISOString()
              : undefined;
            setOvr.mutate({
              params: { tenantId, key: flag.key },
              query: { env },
              body: { value: !effective, ...(expiresAt ? { expiresAt } : {}) },
            });
          }}
        >
          {effective ? "Set Off" : "Set On"}
        </Button>
        <Button
          size="sm"
          variant="text"
          disabled={pending || !ovr || overrideDisabled}
          onClick={() =>
            clearOvr.mutate({
              params: { tenantId, key: flag.key },
              query: { env },
            })
          }
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export function TenantsFlagsClient({ env, tenantId }: Props) {
  const { me } = useSession();
  const perms = (me?.perms ?? []) as string[];
  const canPublish = me?.isSuperAdmin || perms.includes("flags.publish");

  const flags = useMemo<FlagState[]>(() => {
    return TENANT_FLAG_KEYS.map((key) => {
      const meta = getFlagMeta(key);
      return {
        key,
        label: meta.label,
        description: meta.description,
        platformOnly: isPlatformOnlyFlag(meta.key),
      };
    });
  }, []);

  const list = hooks.flags.list({ env, keys: flags.map((f) => f.key) });

  const byKey = useMemo(() => {
    const m = new Map<string, { enabledDefault: boolean }>();
    const arr =
      (list.data as
        | Array<{
            key: string;
            flag: { enabledDefault: boolean } | null;
          }>
        | undefined) ?? [];
    for (const it of arr) {
      if (it?.flag) {
        m.set(it.key, {
          enabledDefault: !!it.flag.enabledDefault,
        });
      }
    }
    return m;
  }, [list.data]);

  return (
    <section className="py-2 space-y-3">
      <div className="rounded-md border p-4">
        {flags.map((flag, idx) => (
          <div key={flag.key}>
            <Row
              env={env}
              tenantId={tenantId}
              flag={flag}
              globalDefault={byKey.get(flag.key)}
              canPublish={!!canPublish}
            />
            {idx < flags.length - 1 ? <Divider /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
