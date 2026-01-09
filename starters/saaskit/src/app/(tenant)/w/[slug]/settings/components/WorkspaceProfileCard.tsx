"use client";

import { useMemo } from "react";
import { Input } from "@unisane/ui/primitives/input";
import { Textarea } from "@unisane/ui/primitives/textarea";
import { Label } from "@unisane/ui/primitives/label";
import { toast } from "@unisane/ui/components/toast";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import { normalizeError } from "@/src/sdk/errors";
import { FormCard } from "@/src/components/forms";
import { useFormCard } from "@/src/hooks/useFormCard";

interface WorkspaceProfileCardProps {
  tenantId?: string | undefined;
}

interface WorkspaceProfile extends Record<string, unknown> {
  name: string;
  description: string;
}

function normalizeProfile(value: unknown): WorkspaceProfile {
  if (value && typeof value === "object") {
    const v = value as { name?: unknown; description?: unknown };
    return {
      name: typeof v.name === "string" ? v.name : "",
      description: typeof v.description === "string" ? v.description : "",
    };
  }
  return { name: "", description: "" };
}

export function WorkspaceProfileCard({ tenantId }: WorkspaceProfileCardProps) {
  const queryEnabled = Boolean(tenantId);

  const q = hooks.settings.get(
    tenantId
      ? { params: { tenantId }, query: { ns: "workspace", key: "profile" } }
      : undefined,
    { enabled: queryEnabled }
  );

  const data = q.data as SettingsGet | undefined;

  const serverProfile = useMemo(
    () => normalizeProfile(data?.value ?? null),
    [data?.value]
  );

  const form = useFormCard({
    serverValue: serverProfile,
    serverVersion: data?.version,
  });

  const patch = hooks.settings.patch({
    onSuccess: (res: { version: number }) => {
      form.markSaved(res.version);
      toast.success("Workspace profile saved");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to save profile", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const handleSave = async () => {
    if (!tenantId) return;
    patch.mutate({
      params: { tenantId },
      body: {
        namespace: "workspace",
        key: "profile",
        value: form.value,
        ...(form.version !== undefined
          ? { expectedVersion: form.version }
          : {}),
      },
    });
  };

  return (
    <FormCard
      title="Workspace Profile"
      description="Basic information about your workspace."
      icon="apartment"
      onSave={handleSave}
      onDiscard={form.reset}
      saving={patch.isPending}
      hasChanges={form.hasChanges}
    >
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Workspace Name</Label>
        <Input
          id="workspace-name"
          value={form.value.name}
          onChange={(e) => form.setValue("name", e.target.value)}
          placeholder="My Workspace"
        />
        <p className="text-xs text-on-surface-variant">
          This name is shown in the sidebar and workspace switcher.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workspace-description">Description (optional)</Label>
        <Textarea
          id="workspace-description"
          rows={3}
          value={form.value.description}
          onChange={(e) => form.setValue("description", e.target.value)}
          placeholder="A brief description of what this workspace is for..."
        />
      </div>
    </FormCard>
  );
}
