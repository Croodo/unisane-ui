"use client";

import { useMemo } from "react";
import { Button } from "@unisane/ui/components/button";
import { TextField } from "@unisane/ui/components/text-field";
import { Typography } from "@unisane/ui/components/typography";
import { Card } from "@unisane/ui/components/card";
import { toast } from "@unisane/ui/components/toast";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import { normalizeError } from "@/src/sdk/errors";
import { useFormCard } from "@/src/hooks/useFormCard";
import { Select } from "@unisane/ui/components/select";

interface BannerValue extends Record<string, unknown> {
  message: string;
  variant: "info" | "warning" | "success";
}

function normalizeBanner(value: unknown): BannerValue {
  if (typeof value === "string") {
    return { message: value, variant: "info" };
  }
  if (value && typeof value === "object") {
    const v = value as { message?: unknown; variant?: unknown };
    const message = typeof v.message === "string" ? v.message : "";
    const variant =
      v.variant === "warning" || v.variant === "success" || v.variant === "info"
        ? (v.variant as BannerValue["variant"])
        : "info";
    return { message, variant };
  }
  return { message: "", variant: "info" };
}

interface BannerSettingsCardProps {
  tenantId?: string | undefined;
}

export function BannerSettingsCard({ tenantId }: BannerSettingsCardProps) {
  const queryEnabled = Boolean(tenantId);
  const q = hooks.settings.get(
    tenantId
      ? { params: { tenantId }, query: { ns: "app", key: "banner" } }
      : undefined,
    { enabled: queryEnabled }
  );
  const data = q.data as SettingsGet | undefined;

  const serverBanner = useMemo(
    () => normalizeBanner(data?.value ?? null),
    [data?.value]
  );

  const form = useFormCard({
    serverValue: serverBanner,
    serverVersion: data?.version,
  });

  const patch = hooks.settings.patch({
    onSuccess: (res: { version: number }) => {
      form.markSaved(res.version);
      toast.success("Banner saved");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to save banner", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const isSaving = patch.isPending;

  const handleSave = () => {
    if (!tenantId) return;
    patch.mutate({
      params: { tenantId },
      body: {
        namespace: "app",
        key: "banner",
        value: form.value,
        ...(form.version !== undefined
          ? { expectedVersion: form.version }
          : {}),
      },
    });
  };

  const handleClear = () => {
    if (!tenantId) return;
    patch.mutate({
      params: { tenantId },
      body: {
        namespace: "app",
        key: "banner",
        unset: true,
        ...(form.version !== undefined
          ? { expectedVersion: form.version }
          : {}),
      },
    });
  };

  return (
    <Card variant="outlined">
      <Card.Header>
        <Card.Title>Workspace Banner</Card.Title>
        <Card.Description>
          Optional announcement shown at the top of your workspace
        </Card.Description>
      </Card.Header>
      <Card.Content className="p-0 divide-y divide-outline-variant/50">
        {/* Message */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Message</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Banner text content
            </Typography>
          </div>
          <TextField
            label="Message"
            multiline
            rows={2}
            value={form.value.message}
            onChange={(e) => form.setValue("message", e.target.value)}
            placeholder="Welcome to your workspace!"
          />
        </div>

        {/* Variant */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Style</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Banner appearance
            </Typography>
          </div>
          <Select
            label="Variant"
            value={form.value.variant}
            onChange={(v: string) =>
              form.setValue("variant", v as "success" | "warning" | "info")
            }
            options={[
              { value: "info", label: "Info" },
              { value: "success", label: "Success" },
              { value: "warning", label: "Warning" },
            ]}
          />
        </div>
      </Card.Content>

      <div className="flex items-center justify-between px-5 py-4 border-t border-outline-variant/50">
        <Typography variant="labelSmall" className="text-on-surface-variant">
          Version: {form.version ?? "—"}
        </Typography>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outlined"
            disabled={!tenantId || isSaving}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            disabled={!tenantId || isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
