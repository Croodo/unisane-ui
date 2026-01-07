"use client";

import { useEffect, useState } from "react";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import {
  SETTINGS_NS,
  PLAN_SETTING_KEYS,
  WEBHOOKS_SETTING_KEYS,
} from "@/src/shared/constants/settings";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { normalizeError } from "@/src/sdk/errors";

function PlanOverridesCard({ tenantId }: { tenantId: string }) {
  const q = hooks.settings.get({
    params: { tenantId },
    query: { ns: SETTINGS_NS.PLAN, key: PLAN_SETTING_KEYS.OVERRIDES },
  });
  const data = q.data as SettingsGet | undefined;

  const [seats, setSeats] = useState<string>("");
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [raw, setRaw] = useState<string>("");

  // Sync form state from fetched data - intentional controlled component pattern
  useEffect(() => {
    const value = (data?.value ?? {}) as any;
    const currentSeats = value?.capacities?.seats;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync form state from API response
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

  function buildValue(): unknown {
    const base = (data?.value ?? {}) as any;
    const next: any = { ...base };

    const n = seats.trim().length ? Number(seats.trim()) : NaN;
    if (!Number.isNaN(n)) {
      next.capacities = { ...(next.capacities ?? {}), seats: n };
    } else if (next.capacities && "seats" in next.capacities) {
      const { seats: _unusedSeats, ...rest } = next.capacities;
      void _unusedSeats; // Mark as intentionally unused
      next.capacities = rest;
    }

    if (next.capacities && Object.keys(next.capacities).length === 0) {
      delete next.capacities;
    }

    return next;
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <h3 className="text-base font-medium">Plan overrides</h3>
        <p className="text-sm text-muted-foreground">
          Per-tenant entitlements overrides (e.g., seats). Changes are
          platform-only and affect metering.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,2fr]">
        <div className="space-y-2">
          <Label htmlFor="seats">Seats capacity override</Label>
          <Input
            id="seats"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            placeholder="Leave empty to use plan default"
          />
          <p className="text-xs text-muted-foreground">
            When set, overrides the default seats capacity from the plan.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="overrides-raw">Raw overrides (JSON)</Label>
          <Textarea
            id="overrides-raw"
            rows={6}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Advanced: full overrides object. The seats field above will be
            merged into this structure when saving.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Version: {version ?? "—"}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => {
              patch.mutate({
                params: { tenantId },
                body: {
                  namespace: SETTINGS_NS.PLAN,
                  key: PLAN_SETTING_KEYS.OVERRIDES,
                  unset: true,
                  ...(version !== undefined
                    ? { expectedVersion: version }
                    : {}),
                },
              });
            }}
          >
            Clear overrides
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => {
              try {
                // Start from the JSON editor value; fall back to current object.
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
                    ? { ...(base as any), ...(merged as any) }
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
              } catch {}
            }}
          >
            {isSaving ? "Saving…" : "Save overrides"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WebhooksAllowedHostsCard({ tenantId }: { tenantId: string }) {
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

  // Sync form state from fetched data - intentional controlled component pattern
  useEffect(() => {
    const arr = Array.isArray(data?.value)
      ? (data?.value as unknown[])
          .filter((v) => typeof v === "string" && v.trim().length > 0)
          .map((v) => (v as string).trim())
      : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync form state from API response
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

  function parseHosts(): string[] {
    return hostsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <h3 className="text-base font-medium">Webhook allowed hosts</h3>
        <p className="text-sm text-muted-foreground">
          Restrict outbound webhook targets for this tenant. One host or domain
          suffix per line (e.g., <code>hooks.example.com</code> or{" "}
          <code>.example.com</code>).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hosts">Allowed hosts</Label>
        <Textarea
          id="hosts"
          rows={6}
          value={hostsText}
          onChange={(e) => setHostsText(e.target.value)}
          className="font-mono text-xs"
          placeholder={`hooks.partner.com\n.example.com`}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Version: {version ?? "—"}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => {
              patch.mutate({
                params: { tenantId },
                body: {
                  namespace: SETTINGS_NS.WEBHOOKS,
                  key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
                  unset: true,
                  ...(version !== undefined
                    ? { expectedVersion: version }
                    : {}),
                },
              });
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => {
              const hosts = parseHosts();
              patch.mutate({
                params: { tenantId },
                body: {
                  namespace: SETTINGS_NS.WEBHOOKS,
                  key: WEBHOOKS_SETTING_KEYS.ALLOWED_HOSTS,
                  value: hosts,
                  ...(version !== undefined
                    ? { expectedVersion: version }
                    : {}),
                },
              });
            }}
          >
            {isSaving ? "Saving…" : "Save allowed hosts"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TenantsSettingsAdminClient({ tenantId }: { tenantId: string }) {
  return (
    <section className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Platform-only settings for this tenant. Changes here require super-admin
        rights and affect billing, entitlements and webhook security.
      </p>
      <PlanOverridesCard tenantId={tenantId} />
      <WebhooksAllowedHostsCard tenantId={tenantId} />
    </section>
  );
}
