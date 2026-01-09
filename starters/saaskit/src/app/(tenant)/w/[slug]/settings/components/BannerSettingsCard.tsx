"use client";

import { useMemo } from "react";
import { Label } from "@unisane/ui/primitives/label";
import { Button } from "@unisane/ui/components/button";
import { Textarea } from "@unisane/ui/primitives/textarea";
import { toast } from "@unisane/ui/components/toast";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import { normalizeError } from "@/src/sdk/errors";
import { FormCard } from "@/src/components/forms";
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
    <FormCard
      title="Workspace banner"
      description="Optional announcement shown at the top of your workspace."
      icon="campaign"
      hideFooter
    >
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-2">
          <Label htmlFor="banner-message">Message</Label>
          <Textarea
            id="banner-message"
            rows={3}
            value={form.value.message}
            onChange={(e) => form.setValue("message", e.target.value)}
            placeholder="Welcome to your workspace!"
          />
        </div>
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select
            value={form.value.variant}
            onChange={(v: string) =>
              form.setValue("variant", v as "success" | "warning" | "info")
            }
            options={[
              { value: "success", label: "Success" },
              { value: "warning", label: "Warning" },
              { value: "info", label: "Info" },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="text-xs text-on-surface-variant">
          Version: {form.version ?? "—"}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outlined"
            size="sm"
            disabled={!tenantId || isSaving}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!tenantId || isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </FormCard>
  );
}
