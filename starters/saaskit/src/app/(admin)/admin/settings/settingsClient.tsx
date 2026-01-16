"use client";

import { useState, useCallback, useEffect } from "react";
import { Select } from "@unisane/ui/components/select";
import { Button } from "@unisane/ui/components/button";
import { toast } from "@unisane/ui/components/toast";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import { PageLayout } from "@/src/context/usePageLayout";
import { EmptyState } from "@/src/components/feedback/EmptyState";
import { hooks } from "@/src/sdk/hooks/generated/hooks";
import { SettingCard } from "./components/SettingCard";
import { SettingsSearch } from "./components/SettingsSearch";
import { MaintenanceBannerCard } from "./components/MaintenanceBannerCard";
import { getSettingsByCategory, searchSettings } from "./config";
import type { SettingCategory, SettingConfig } from "./types";

interface PendingChange {
  config: SettingConfig;
  value: unknown;
  version: number | undefined;
}

const CATEGORIES: SettingCategory[] = ["runtime", "billing", "auth", "webhooks"];

export default function AdminSettingsClient() {
  const [env, setEnv] = useState<string>("dev");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Mutations
  const { mutateAsync: patchSetting } = hooks.settings.admin.patch();

  // Get settings to display based on search
  const displaySettings = searchQuery ? searchSettings(searchQuery) : [];

  const handleChange = useCallback(
    (config: SettingConfig, value: unknown, version?: number) => {
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(`${config.namespace}.${config.key}`, { config, value, version });
        return next;
      });
    },
    []
  );

  const handleDiscard = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    const changes = Array.from(pendingChanges.values());
    let successCount = 0;
    let failCount = 0;

    for (const change of changes) {
      try {
        await patchSetting({
          body: {
            namespace: change.config.namespace,
            key: change.config.key,
            env,
            value: change.value,
            expectedVersion: change.version,
          },
        });
        successCount++;
      } catch (e) {
        const msg = (e as Error)?.message ?? `Failed to update ${change.config.label}`;
        toast.error(msg);
        failCount++;
      }
    }

    setIsSaving(false);

    if (failCount === 0) {
      toast.success(`Settings saved for ${env}`);
      setPendingChanges(new Map());
    } else {
      toast.warning(`Saved ${successCount} settings, ${failCount} failed`);
    }
  };

  return (
    <>
      <PageLayout
        subtitle="Manage environment-specific platform configuration"
        actions={
          <div className="w-[180px]">
            <Select
              value={env}
              onChange={setEnv}
              placeholder="Select Environment"
              options={[
                { value: "dev", label: "Development" },
                { value: "stage", label: "Staging" },
                { value: "prod", label: "Production" },
              ]}
            />
          </div>
        }
      />

      <div className="space-y-8">
        {/* Search */}
        <SettingsSearch onSearch={setSearchQuery} />

        {/* Settings Content */}
        {searchQuery ? (
          // Search Results
          <div>
            {displaySettings.length === 0 ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <EmptyState
                  icon="search_off"
                  title="No settings found"
                  description={`No settings match "${searchQuery}". Try a different search term.`}
                  size="sm"
                />
              </div>
            ) : (
              <section>
                <div className="mb-8">
                  <Typography variant="titleLarge">Search Results</Typography>
                  <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
                    {displaySettings.length} setting{displaySettings.length !== 1 ? "s" : ""} matching &quot;{searchQuery}&quot;
                  </Typography>
                </div>
                <div className="divide-y divide-outline-variant">
                  {displaySettings.map((config) => (
                    <SettingItem
                      key={`${config.namespace}.${config.key}`}
                      config={config}
                      env={env}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          // All Settings by Category
          <div className="space-y-12">
            {CATEGORIES.map((category) => (
              <SettingsSection
                key={category}
                category={category}
                env={env}
                onChange={handleChange}
              />
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-outline-variant">
          {pendingChanges.size > 0 && (
            <>
              <Typography variant="bodySmall" className="text-on-surface-variant mr-auto">
                {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? "s" : ""}
              </Typography>
              <Button
                type="button"
                variant="text"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                Discard
              </Button>
            </>
          )}
          <Button
            disabled={isSaving || pendingChanges.size === 0}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}

// Section component for a category - displays settings in row layout
function SettingsSection({
  category,
  env,
  onChange,
}: {
  category: SettingCategory;
  env: string;
  onChange: (config: SettingConfig, value: unknown, version?: number) => void;
}) {
  const settings = getSettingsByCategory(category);

  const categoryInfo: Partial<Record<SettingCategory, { title: string; description: string }>> = {
    runtime: {
      title: "Runtime Settings",
      description: "Configure application behavior and feature toggles",
    },
    billing: {
      title: "Billing Settings",
      description: "Payment processing and subscription configuration",
    },
    auth: {
      title: "Authentication Settings",
      description: "Security and access control configuration",
    },
    webhooks: {
      title: "Webhook Settings",
      description: "Configure outbound event notifications",
    },
    branding: {
      title: "Branding Settings",
      description: "Customize your application appearance",
    },
    general: {
      title: "General Settings",
      description: "General application configuration",
    },
  };

  const info = categoryInfo[category] ?? {
    title: category.charAt(0).toUpperCase() + category.slice(1) + " Settings",
    description: `Configure ${category} settings`,
  };

  return (
    <section>
      <div className="mb-8">
        <Typography variant="titleLarge">{info.title}</Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant mt-1">
          {info.description}
        </Typography>
      </div>
      <div className="divide-y divide-outline-variant">
        {settings.map((config) => (
          <SettingItem
            key={`${config.namespace}.${config.key}`}
            config={config}
            env={env}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

// Individual setting item with its own data fetching
function SettingItem({
  config,
  env,
  onChange,
}: {
  config: SettingConfig;
  env: string;
  onChange: (config: SettingConfig, value: unknown, version?: number) => void;
}) {
  const [localValue, setLocalValue] = useState<unknown>(config.defaultValue);

  // The hook already unwraps the response and returns the data directly
  const {
    data: settingData,
    isLoading,
  } = hooks.settings.admin.get({ env, ns: config.namespace, key: config.key });

  // Update local value when data changes or when loading completes
  useEffect(() => {
    if (isLoading) return; // Don't update while loading

    if (settingData && "value" in settingData) {
      // Setting exists in database (value could be anything including null, [], false, 0, "")
      setLocalValue(settingData.value);
    } else if (settingData === null) {
      // Setting doesn't exist yet, use default
      setLocalValue(config.defaultValue);
    }
  }, [settingData, isLoading, config.defaultValue]);

  const handleChange = (value: unknown) => {
    setLocalValue(value);
    onChange(config, value, settingData?.version);
  };

  // Show loading only on initial load, not when data is null
  const showLoading = isLoading && localValue === undefined;

  // Handle custom components
  if (
    config.type === "custom" &&
    config.customComponent === "MaintenanceBannerCard"
  ) {
    return (
      <MaintenanceBannerCard
        namespace={config.namespace}
        settingKey={config.key}
        value={localValue}
        onChange={handleChange}
        loading={showLoading}
      />
    );
  }

  return (
    <SettingCard
      config={config}
      value={localValue}
      onChange={handleChange}
      loading={showLoading}
    />
  );
}
