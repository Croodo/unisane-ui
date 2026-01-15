"use client";

import { useMemo, useState } from "react";
import {
  FLAG,
  getFlagMeta,
  isPlatformOnlyFlag,
} from "@unisane/kernel/client";
import type { FlagKey, AppEnv } from "@unisane/kernel/client";
import { hooks } from "@/src/sdk/hooks";
import { Button } from "@unisane/ui/components/button";
import { Badge } from "@unisane/ui/components/badge";
import { toast } from "@unisane/ui/components/toast";
import { Switch } from "@unisane/ui/components/switch";
import { useSession } from "@/src/context/SessionContext";
import { TextField } from "@unisane/ui/components/text-field";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Flag Row Component
// ─────────────────────────────────────────────────────────────────────────────

interface FlagRowProps {
  env: AppEnv;
  tenantId: string;
  flag: FlagState;
  globalDefault: { enabledDefault: boolean } | null | undefined;
  canPublish: boolean;
}

function FlagRow({
  env,
  tenantId,
  flag,
  globalDefault,
  canPublish,
}: FlagRowProps) {
  const ovrQ = hooks.flags.override({
    params: { tenantId, key: flag.key },
    query: { env },
  });
  const ovr = ovrQ.data ?? null;
  const effective = ovr
    ? ovr.value
    : Boolean(globalDefault?.enabledDefault ?? false);
  const [expiry, setExpiry] = useState<string>("");
  const [showExpiry, setShowExpiry] = useState(false);

  const setOvr = hooks.flags.setOverride({
    onSuccess: () => toast.success("Override updated"),
    onError: (e: unknown) =>
      toast.error("Failed to update override", {
        description: (e as Error)?.message ?? "",
      }),
  });

  const clearOvr = hooks.flags.clearOverride({
    onSuccess: () => toast.success("Override cleared"),
    onError: (e: unknown) =>
      toast.error("Failed to clear override", {
        description: (e as Error)?.message ?? "",
      }),
  });

  const pending = setOvr.isPending || clearOvr.isPending;
  const expires = ovr?.expiresAt
    ? new Date(ovr.expiresAt).toLocaleString()
    : null;
  const overrideDisabled = !canPublish || flag.platformOnly;
  const hasOverride = Boolean(ovr);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const expiresAt = expiry ? new Date(expiry).toISOString() : undefined;
    setOvr.mutate({
      params: { tenantId, key: flag.key },
      query: { env },
      body: { value: e.target.checked, ...(expiresAt ? { expiresAt } : {}) },
    });
  };

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
          {hasOverride && (
            <Badge
              variant="tonal"
              className={
                ovr?.value
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-error-container text-on-error-container"
              }
            >
              {ovr?.value ? "On" : "Off"}
            </Badge>
          )}
        </div>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {flag.description}
        </Typography>
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <Typography
            variant="labelSmall"
            className="font-mono text-on-surface-variant/60"
          >
            {flag.key}
          </Typography>
          {typeof globalDefault?.enabledDefault === "boolean" && (
            <Typography variant="labelSmall" className="text-on-surface-variant">
              Default:{" "}
              <span className={globalDefault.enabledDefault ? "text-tertiary" : ""}>
                {globalDefault.enabledDefault ? "On" : "Off"}
              </span>
            </Typography>
          )}
          {expires && (
            <Typography variant="labelSmall" className="text-warning">
              Expires: {expires}
            </Typography>
          )}
        </div>

        {/* Expiry Input - Expandable */}
        {showExpiry && !overrideDisabled && (
          <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-end gap-3">
            <div className="w-56">
              <TextField
                label=""
                labelClassName="sr-only"
                type="datetime-local"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
            {expiry && (
              <Button variant="text" size="sm" onClick={() => setExpiry("")}>
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {hasOverride && (
          <Button
            variant="text"
            size="sm"
            disabled={pending || overrideDisabled}
            onClick={() =>
              clearOvr.mutate({
                params: { tenantId, key: flag.key },
                query: { env },
              })
            }
          >
            Reset
          </Button>
        )}
        <button
          type="button"
          disabled={overrideDisabled}
          onClick={() => setShowExpiry(!showExpiry)}
          className={`p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant ${
            showExpiry ? "text-primary bg-primary-container/30" : ""
          } ${overrideDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Icon symbol="schedule" size="sm" />
        </button>
        <Switch
          checked={effective}
          onChange={handleToggle}
          disabled={pending || overrideDisabled}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

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

  // Count active flags
  const activeFlags = flags.filter((f) => {
    const globalDefault = byKey.get(f.key);
    return Boolean(globalDefault?.enabledDefault);
  }).length;

  return (
    <section>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Typography variant="titleLarge">Feature Flags</Typography>
            <Badge variant="tonal">
              {activeFlags} / {flags.length} enabled
            </Badge>
          </div>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
            Manage feature flag overrides for this tenant. Overrides take precedence over environment defaults.
          </Typography>
        </div>
      </div>

      <div className="divide-y divide-outline-variant rounded-lg border border-outline-variant overflow-hidden">
        {flags.map((flag) => (
          <FlagRow
            key={flag.key}
            env={env}
            tenantId={tenantId}
            flag={flag}
            globalDefault={byKey.get(flag.key)}
            canPublish={!!canPublish}
          />
        ))}
      </div>
    </section>
  );
}
