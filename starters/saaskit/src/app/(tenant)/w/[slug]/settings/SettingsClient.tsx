"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/src/hooks/use-session";
import { PageLayout } from "@/src/context/usePageLayout";
import { TextField } from "@unisane/ui/components/text-field";
import { Typography } from "@unisane/ui/components/typography";
import { Button } from "@unisane/ui/components/button";
import { Select } from "@unisane/ui/components/select";
import { Icon } from "@unisane/ui/primitives/icon";
import { toast } from "@unisane/ui/components/toast";
import { hooks } from "@/src/sdk/hooks";
import type { SettingsGetResponse as SettingsGet } from "@/src/sdk/types";
import { normalizeError } from "@/src/sdk/errors";
import { useFormCard } from "@/src/hooks/use-form-card";

interface WorkspaceSettings extends Record<string, unknown> {
  name: string;
  description: string;
  bannerMessage: string;
  bannerVariant: "info" | "warning" | "success";
}

function normalizeSettings(
  profile: unknown,
  banner: unknown
): WorkspaceSettings {
  const p =
    profile && typeof profile === "object"
      ? (profile as { name?: unknown; description?: unknown })
      : {};
  const b =
    banner && typeof banner === "object"
      ? (banner as { message?: unknown; variant?: unknown })
      : typeof banner === "string"
        ? { message: banner, variant: "info" }
        : {};

  return {
    name: typeof p.name === "string" ? p.name : "",
    description: typeof p.description === "string" ? p.description : "",
    bannerMessage: typeof b.message === "string" ? b.message : "",
    bannerVariant:
      b.variant === "warning" || b.variant === "success" || b.variant === "info"
        ? (b.variant as "info" | "warning" | "success")
        : "info",
  };
}

/**
 * SettingsClient — Workspace settings
 */
export function SettingsClient() {
  const { me } = useSession();
  const tenantId = me?.scopeId ?? undefined;
  const pathname = usePathname();
  const slug = pathname.split("/")[2] ?? "";
  const base = `/w/${slug}`;

  const queryEnabled = Boolean(tenantId);

  // Fetch profile settings
  const profileQ = hooks.settings.get(
    tenantId
      ? { params: { tenantId }, query: { ns: "workspace", key: "profile" } }
      : undefined,
    { enabled: queryEnabled }
  );
  const profileData = profileQ.data as SettingsGet | undefined;

  // Fetch banner settings
  const bannerQ = hooks.settings.get(
    tenantId
      ? { params: { tenantId }, query: { ns: "app", key: "banner" } }
      : undefined,
    { enabled: queryEnabled }
  );
  const bannerData = bannerQ.data as SettingsGet | undefined;

  const serverSettings = useMemo(
    () => normalizeSettings(profileData?.value, bannerData?.value),
    [profileData?.value, bannerData?.value]
  );

  const form = useFormCard({
    serverValue: serverSettings,
    serverVersion: profileData?.version,
  });

  const profilePatch = hooks.settings.patch({
    onSuccess: () => {
      toast.success("Settings saved");
    },
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to save settings", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const bannerPatch = hooks.settings.patch({
    onError: (e: unknown) => {
      const ne = normalizeError(e);
      toast.error("Failed to save banner", {
        description: ne.rawMessage ?? ne.message,
      });
    },
  });

  const handleSave = async () => {
    if (!tenantId) return;

    // Save profile
    await profilePatch.mutateAsync({
      params: { tenantId },
      body: {
        namespace: "workspace",
        key: "profile",
        value: {
          name: form.value.name,
          description: form.value.description,
        },
        ...(profileData?.version !== undefined
          ? { expectedVersion: profileData.version }
          : {}),
      },
    });

    // Save banner
    await bannerPatch.mutateAsync({
      params: { tenantId },
      body: {
        namespace: "app",
        key: "banner",
        value: {
          message: form.value.bannerMessage,
          variant: form.value.bannerVariant,
        },
        ...(bannerData?.version !== undefined
          ? { expectedVersion: bannerData.version }
          : {}),
      },
    });

    form.markSaved(profileData?.version);
  };

  const isSaving = profilePatch.isPending || bannerPatch.isPending;

  return (
    <>
      <PageLayout subtitle="Configure your workspace profile and settings." />
      <div className="space-y-12">
        {/* Workspace Settings */}
        <section>
          <div className="mb-8">
            <Typography variant="titleLarge">Workspace Settings</Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
              Configure your workspace profile and announcements
            </Typography>
          </div>
          <div className="divide-y divide-outline-variant">
            {/* Workspace Name */}
            <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
              <div className="space-y-1">
                <Typography variant="titleMedium">Name</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  Displayed in sidebar and switcher
                </Typography>
              </div>
              <div className="sm:max-w-sm">
                <TextField
                  label=""
                  labelClassName="sr-only"
                  value={form.value.name}
                  onChange={(e) => form.setValue("name", e.target.value)}
                  placeholder="My Workspace"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
              <div className="space-y-1">
                <Typography variant="titleMedium">Description</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  Optional workspace description
                </Typography>
              </div>
              <div className="sm:max-w-md">
                <TextField
                  label=""
                  labelClassName="sr-only"
                  multiline
                  rows={2}
                  value={form.value.description}
                  onChange={(e) => form.setValue("description", e.target.value)}
                  placeholder="A brief description..."
                />
              </div>
            </div>

            {/* Banner Message */}
            <div className="grid gap-4 py-6 sm:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] sm:items-start">
              <div className="space-y-1">
                <Typography variant="titleMedium">Banner</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  Announcement at top of workspace
                </Typography>
              </div>
              <div className="space-y-4 sm:max-w-md">
                <TextField
                  label=""
                  labelClassName="sr-only"
                  value={form.value.bannerMessage}
                  onChange={(e) => form.setValue("bannerMessage", e.target.value)}
                  placeholder="Welcome to your workspace!"
                />
                <div className="sm:max-w-[200px]">
                  <Select
                    label="Style"
                    value={form.value.bannerVariant}
                    onChange={(v: string) =>
                      form.setValue("bannerVariant", v as "success" | "warning" | "info")
                    }
                    options={[
                      { value: "info", label: "Info" },
                      { value: "success", label: "Success" },
                      { value: "warning", label: "Warning" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-outline-variant">
            {form.hasChanges && (
              <Button
                type="button"
                variant="text"
                onClick={form.reset}
                disabled={isSaving}
              >
                Discard
              </Button>
            )}
            <Button
              disabled={isSaving || !form.hasChanges}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </section>

        {/* Developer Tools */}
        <section>
          <div className="mb-8">
            <Typography variant="titleLarge">Developer Tools</Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
              API keys, webhooks, and activity logs
            </Typography>
          </div>
          <div className="divide-y divide-outline-variant rounded-lg border border-outline-variant overflow-hidden">
            <Link
              href={`${base}/apikeys`}
              className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-container">
                <Icon symbol="key" size="sm" className="text-on-surface-variant" />
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="titleMedium">API Keys</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  Manage API keys for programmatic access
                </Typography>
              </div>
              <Icon symbol="chevron_right" size="sm" className="text-on-surface-variant" />
            </Link>

            <Link
              href={`${base}/webhooks`}
              className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-container">
                <Icon symbol="webhook" size="sm" className="text-on-surface-variant" />
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="titleMedium">Webhooks</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  View inbound and outbound webhook events
                </Typography>
              </div>
              <Icon symbol="chevron_right" size="sm" className="text-on-surface-variant" />
            </Link>

            <Link
              href={`${base}/audit`}
              className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-container">
                <Icon symbol="history" size="sm" className="text-on-surface-variant" />
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="titleMedium">Audit Log</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  Review activity and changes in your workspace
                </Typography>
              </div>
              <Icon symbol="chevron_right" size="sm" className="text-on-surface-variant" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export default SettingsClient;
