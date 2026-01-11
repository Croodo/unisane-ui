"use client";

import { useMemo } from "react";
import { TextField } from "@unisane/ui/components/text-field";
import { Typography } from "@unisane/ui/components/typography";
import { Button } from "@unisane/ui/components/button";
import { Card } from "@unisane/ui/components/card";
import { toast } from "@unisane/ui/components/toast";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import { normalizeError } from "@/src/sdk/errors";
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
    <Card variant="outlined">
      <Card.Header>
        <Card.Title>Workspace Profile</Card.Title>
        <Card.Description>
          Basic information about your workspace
        </Card.Description>
      </Card.Header>
      <Card.Content className="p-0 divide-y divide-outline-variant/50">
        {/* Workspace Name */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Name</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Displayed in sidebar and switcher
            </Typography>
          </div>
          <TextField
            label="Workspace name"
            value={form.value.name}
            onChange={(e) => form.setValue("name", e.target.value)}
            placeholder="My Workspace"
          />
        </div>

        {/* Description */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
          <div className="space-y-1">
            <Typography variant="titleSmall">Description</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Optional workspace description
            </Typography>
          </div>
          <TextField
            label="Description"
            multiline
            rows={3}
            value={form.value.description}
            onChange={(e) => form.setValue("description", e.target.value)}
            placeholder="A brief description of what this workspace is for..."
          />
        </div>
      </Card.Content>

      <div className="flex justify-end gap-2 px-5 py-4 border-t border-outline-variant/50">
        {form.hasChanges && (
          <Button
            type="button"
            variant="text"
            onClick={form.reset}
            disabled={patch.isPending}
          >
            Discard
          </Button>
        )}
        <Button
          disabled={patch.isPending || !form.hasChanges}
          onClick={handleSave}
        >
          Save changes
        </Button>
      </div>
    </Card>
  );
}
