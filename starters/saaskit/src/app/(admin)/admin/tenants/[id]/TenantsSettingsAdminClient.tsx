"use client";

import { useEffect, useState } from "react";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import {
  SETTINGS_NS,
  PLAN_SETTING_KEYS,
  WEBHOOKS_SETTING_KEYS,
} from "@unisane/kernel/client";
import { TextField } from "@unisane/ui/components/text-field";
import { Button } from "@unisane/ui/components/button";
import { Badge } from "@unisane/ui/components/badge";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import { Alert } from "@unisane/ui/components/alert";
import { toast } from "@unisane/ui/components/toast";
import { normalizeError } from "@/src/sdk/errors";

// ─────────────────────────────────────────────────────────────────────────────
// Plan Overrides Section
// ─────────────────────────────────────────────────────────────────────────────

function PlanOverridesSection({ tenantId }: { tenantId: string }) {
  const q = hooks.settings.get({
    params: { tenantId },
    query: { ns: SETTINGS_NS.PLAN, key: PLAN_SETTING_KEYS.OVERRIDES },
  });
  const data = q.data as SettingsGet | undefined;

  const [seats, setSeats] = useState<string>("");
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [raw, setRaw] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const value = (data?.value ?? {}) as Record<string, unknown>;
    const capacities = value?.capacities as Record<string, unknown> | undefined;
    const currentSeats = capacities?.seats;
    setSeats(
      typeof currentSeats === "number" && Number.isFinite(currentSeats)
        ? String(currentSeats)
        : ""
    );
    setVersion(data?.version);
    try {
      setRaw(
        data && data.value != null
          ? JSON.stringify(data.value, null, 2)
          : '{\n  "capacities": { "seats": 1 }\n}'
      );
    } catch {
      setRaw("");
    }
  }, [data]);

  const patch = hooks.settings.patch({
    onSuccess: (res: { version: number }) => {
      setVersion(res.version);
      toast.success("Plan overrides updated");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to update plan overrides", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const isSaving = patch.isPending;
  const hasOverrides = Boolean(
    data?.value && Object.keys(data.value as object).length > 0
  );

  function buildValue(): unknown {
    const base = (data?.value ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...base };

    const n = seats.trim().length ? Number(seats.trim()) : NaN;
    if (!Number.isNaN(n)) {
      next.capacities = { ...((next.capacities as object) ?? {}), seats: n };
    } else if (next.capacities && "seats" in (next.capacities as object)) {
      const { seats: _unused, ...rest } = next.capacities as Record<
        string,
        unknown
      >;
      void _unused;
      next.capacities = rest;
    }

    if (
      next.capacities &&
      Object.keys(next.capacities as object).length === 0
    ) {
      delete next.capacities;
    }

    return next;
  }

  return (
    <section>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Typography variant="titleLarge">Plan Overrides</Typography>
            {hasOverrides && <Badge variant="tonal">Active</Badge>}
          </div>
          <Typography
            variant="bodySmall"
            className="text-on-surface-variant mt-1"
          >
            Override plan entitlements for this tenant. These settings affect
            metering and billing calculations.
          </Typography>
        </div>
        <Typography
          variant="labelSmall"
          className="text-on-surface-variant tabular-nums"
        >
          v{version ?? "—"}
        </Typography>
      </div>

      <div className="divide-y divide-outline-variant">
        {/* Seats Capacity */}
        <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleMedium">Seats Capacity</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Override the maximum number of team members allowed
            </Typography>
            <Typography
              variant="labelSmall"
              className="text-on-surface-variant/60 font-mono pt-1"
            >
              plan.overrides.capacities.seats
            </Typography>
          </div>
          <div className="sm:max-w-xs">
            <TextField
              label=""
              labelClassName="sr-only"
              type="number"
              min={1}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
        </div>

        {/* Advanced JSON Editor */}
        <div className="py-6">
          <Button
            variant="text"
            onClick={() => setShowAdvanced(!showAdvanced)}
            icon={
              <Icon symbol={showAdvanced ? "expand_less" : "expand_more"} />
            }
          >
            {showAdvanced ? "Hide" : "Show"} advanced JSON editor
          </Button>

          {showAdvanced && (
            <div className="mt-4 animate-in slide-in-from-top-1 duration-200">
              <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
                <div className="space-y-1">
                  <Typography variant="titleMedium">Raw Overrides</Typography>
                  <Typography
                    variant="bodySmall"
                    className="text-on-surface-variant"
                  >
                    The seats field above will be merged into this structure
                    when saving
                  </Typography>
                </div>
                <div className="sm:max-w-lg">
                  <TextField
                    label=""
                    labelClassName="sr-only"
                    multiline
                    rows={8}
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-outline-variant">
        <Button
          variant="text"
          disabled={isSaving || !hasOverrides}
          onClick={() => {
            patch.mutate({
              params: { tenantId },
              body: {
                namespace: SETTINGS_NS.PLAN,
                key: PLAN_SETTING_KEYS.OVERRIDES,
                unset: true,
                ...(version !== undefined ? { expectedVersion: version } : {}),
              },
            });
          }}
        >
          Reset to defaults
        </Button>
        <Button
          disabled={isSaving}
          onClick={() => {
            try {
              let base: unknown;
              try {
                base = raw.trim().length ? JSON.parse(raw) : data?.value;
              } catch (e) {
                toast.error("Invalid JSON in overrides", {
                  description: (e as Error)?.message ?? "",
                });
                return;
              }
              const merged = buildValue();
              const value =
                base && typeof base === "object"
                  ? { ...(base as object), ...(merged as object) }
                  : merged;
              patch.mutate({
                params: { tenantId },
                body: {
                  namespace: SETTINGS_NS.PLAN,
                  key: PLAN_SETTING_KEYS.OVERRIDES,
                  value,
                  ...(version !== undefined
                    ? { expectedVersion: version }
                    : {}),
                },
              });
            } catch {
              // Ignore
            }
          }}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhooks Allowed Hosts Section
// ─────────────────────────────────────────────────────────────────────────────

function WebhooksAllowedHostsSection({ tenantId }: { tenantId: string }) {
  const q = hooks.settings.get({
    params: { tenantId },
    query: {
      ns: SETTINGS_NS.WEBHOOKS,
      key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
    },
  });
  const data = q.data as SettingsGet | undefined;

  const [hostsText, setHostsText] = useState("");
  const [version, setVersion] = useState<number | undefined>(undefined);

  useEffect(() => {
    const arr = Array.isArray(data?.value)
      ? (data?.value as unknown[])
          .filter((v) => typeof v === "string" && v.trim().length > 0)
          .map((v) => (v as string).trim())
      : [];
    setHostsText(arr.join("\n"));
    setVersion(data?.version);
  }, [data]);

  const patch = hooks.settings.patch({
    onSuccess: (res: { version: number }) => {
      setVersion(res.version);
      toast.success("Allowed hosts updated");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to update allowed hosts", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const isSaving = patch.isPending;
  const hosts = hostsText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const hasHosts = hosts.length > 0;

  return (
    <section>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Typography variant="titleLarge">Webhook Security</Typography>
            {hasHosts && (
              <Badge variant="tonal">
                {hosts.length} host{hosts.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Typography
            variant="bodySmall"
            className="text-on-surface-variant mt-1"
          >
            Restrict outbound webhook targets to approved hosts only. Leave
            empty to allow all destinations.
          </Typography>
        </div>
        <Typography
          variant="labelSmall"
          className="text-on-surface-variant tabular-nums"
        >
          v{version ?? "—"}
        </Typography>
      </div>

      <div className="divide-y divide-outline-variant">
        <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleMedium">Allowed Hosts</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              One host per line. Use .example.com to allow all subdomains.
            </Typography>
            <Typography
              variant="labelSmall"
              className="text-on-surface-variant/60 font-mono pt-1"
            >
              webhooks.allowedHosts
            </Typography>
          </div>
          <div className="sm:max-w-md">
            <TextField
              label=""
              labelClassName="sr-only"
              multiline
              rows={5}
              value={hostsText}
              onChange={(e) => setHostsText(e.target.value)}
              className="font-mono"
              placeholder={`hooks.partner.com\n.example.com`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-outline-variant">
        <Button
          variant="text"
          disabled={isSaving || !hasHosts}
          onClick={() => {
            patch.mutate({
              params: { tenantId },
              body: {
                namespace: SETTINGS_NS.WEBHOOKS,
                key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
                unset: true,
                ...(version !== undefined ? { expectedVersion: version } : {}),
              },
            });
          }}
        >
          Remove restrictions
        </Button>
        <Button
          disabled={isSaving}
          onClick={() => {
            patch.mutate({
              params: { tenantId },
              body: {
                namespace: SETTINGS_NS.WEBHOOKS,
                key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
                value: hosts,
                ...(version !== undefined ? { expectedVersion: version } : {}),
              },
            });
          }}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function TenantsSettingsAdminClient({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-12">
      {/* Info Banner */}
      <Alert
        variant="warning"
        icon="admin_panel_settings"
        title="Platform Admin Settings"
      >
        These settings require super-admin rights and affect billing,
        entitlements, and webhook security for this tenant.
      </Alert>

      <PlanOverridesSection tenantId={tenantId} />
      <WebhooksAllowedHostsSection tenantId={tenantId} />
    </div>
  );
}
