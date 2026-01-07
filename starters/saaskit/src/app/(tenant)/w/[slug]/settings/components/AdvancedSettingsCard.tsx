"use client";

import { useMemo, useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import { normalizeError } from "@/src/sdk/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

interface AdvancedSettingsCardProps {
  tenantId?: string | undefined;
}

function SettingEditor({
  tenantId,
  ns,
  keyName,
  data,
}: {
  tenantId?: string | undefined;
  ns: string;
  keyName: string;
  data: SettingsGet | null;
}) {
  const [expectedVersion, setExpectedVersion] = useState<number | undefined>(
    () => (data?.version as number | undefined) ?? undefined
  );
  const [jsonMode, setJsonMode] = useState<boolean>(
    () => typeof data?.value !== "string"
  );
  const [raw, setRaw] = useState<string>(() => {
    const v = data?.value;
    try {
      return typeof v === "string" ? v : JSON.stringify(v ?? null, null, 2);
    } catch {
      return String(v ?? "");
    }
  });

  const patch = hooks.settings.patch({
    onSuccess: (res: { version: number }) => {
      setExpectedVersion(res.version);
      toast.success("Setting saved");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to save setting", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  function parseValue(): unknown {
    if (!jsonMode) return raw;
    try {
      return raw.trim().length ? JSON.parse(raw) : null;
    } catch (e: unknown) {
      toast.error("Invalid JSON", { description: (e as Error)?.message ?? "" });
      throw e;
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="val">Value</Label>
          <label className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={jsonMode}
              onChange={(e) => setJsonMode(e.target.checked)}
            />
            JSON mode
          </label>
        </div>
        <Textarea
          id="val"
          rows={6}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={jsonMode ? '{"enabled": true}' : "plain text"}
        />
        <div className="text-xs text-muted-foreground">
          Version: {expectedVersion ?? "—"}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!tenantId || !ns || !keyName || patch.isPending}
          onClick={() => {
            try {
              if (!tenantId) return;
              const value = parseValue();
              patch.mutate({
                params: { tenantId },
                body: {
                  namespace: ns,
                  key: keyName,
                  value,
                  ...(expectedVersion !== undefined ? { expectedVersion } : {}),
                },
              });
            } catch {}
          }}
        >
          {patch.isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!tenantId || !ns || !keyName || patch.isPending}
          onClick={() => {
            const ok = window.confirm("Unset this key? This cannot be undone.");
            if (!ok) return;
            if (!tenantId) return;
            patch.mutate({
              params: { tenantId },
              body: {
                namespace: ns,
                key: keyName,
                unset: true,
                ...(expectedVersion !== undefined ? { expectedVersion } : {}),
              },
            });
          }}
        >
          Unset
        </Button>
      </div>
    </div>
  );
}

export function AdvancedSettingsCard({ tenantId }: AdvancedSettingsCardProps) {
  const [ns, setNs] = useState("app");
  const [key, setKey] = useState("");

  const queryEnabled = Boolean(tenantId && ns && key);
  const q = hooks.settings.get(
    tenantId && ns && key
      ? { params: { tenantId }, query: { ns, key } }
      : undefined,
    { enabled: queryEnabled }
  );
  const data = q.data as SettingsGet | undefined;

  const editorKey = useMemo(
    () => `${tenantId ?? "na"}:${ns}:${key}:${data?.version ?? "none"}`,
    [tenantId, ns, key, data?.version]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Advanced settings</CardTitle>
        <CardDescription>
          Read and patch arbitrary namespaced settings for this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ns">Namespace</Label>
            <Input
              id="ns"
              value={ns}
              onChange={(e) => setNs(e.target.value)}
              placeholder="e.g. app"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. banner"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              size="sm"
              disabled={!queryEnabled || q.isFetching}
              onClick={() => q.refetch()}
            >
              {q.isFetching ? "Loading…" : "Load"}
            </Button>
          </div>
        </div>

        <Separator />

        <SettingEditor
          key={editorKey}
          tenantId={tenantId}
          ns={ns}
          keyName={key}
          data={data ?? null}
        />
      </CardContent>
    </Card>
  );
}
