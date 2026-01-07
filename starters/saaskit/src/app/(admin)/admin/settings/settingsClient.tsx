"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { hooks } from "@/src/sdk/hooks/generated/hooks";
import { SettingCard } from "./components/SettingCard";
import { SettingsSearch } from "./components/SettingsSearch";
import { MaintenanceBannerCard } from "./components/MaintenanceBannerCard";
import { getSettingsByCategory, searchSettings } from "./config";
import type { SettingCategory, SettingConfig } from "./types";

interface PendingChange {
  config: SettingConfig;
  value: unknown;
  version?: number;
}

export default function AdminSettingsClient() {
  const [env, setEnv] = useState<string>("dev");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SettingCategory>("runtime");
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Mutations
  const { mutateAsync: patchSetting } = hooks.settings.admin.patch();

  // Get settings to display based on search or active tab
  const displaySettings = searchQuery
    ? searchSettings(searchQuery)
    : getSettingsByCategory(activeTab);

  const handleSaveSetting = useCallback(
    async (config: SettingConfig, value: unknown, version?: number) => {
      try {
        await patchSetting({
          body: {
            namespace: config.namespace,
            key: config.key,
            env,
            value,
            expectedVersion: version,
          },
        });
        toast.success(`${config.label} updated for ${env}`);

        // Remove from pending changes after successful save
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(`${config.namespace}.${config.key}`);
          return next;
        });
      } catch (e) {
        const msg = (e as Error)?.message ?? `Failed to update ${config.label}`;
        toast.error(msg);
        throw e;
      }
    },
    [env, patchSetting]
  );

  const handleBulkSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsBulkSaving(true);
    const changes = Array.from(pendingChanges.values());
    let successCount = 0;
    let failCount = 0;

    for (const change of changes) {
      try {
        await handleSaveSetting(change.config, change.value, change.version);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsBulkSaving(false);

    if (failCount === 0) {
      toast.success(`All ${successCount} settings saved successfully`);
    } else {
      toast.warning(`Saved ${successCount} settings, ${failCount} failed`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage environment-specific platform configuration
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingChanges.size > 0 && (
            <Button
              onClick={handleBulkSave}
              disabled={isBulkSaving}
              variant="default"
            >
              {isBulkSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Changes ({pendingChanges.size})
                </>
              )}
            </Button>
          )}
          <div className="w-[180px]">
            <Select value={env} onValueChange={setEnv}>
              <SelectTrigger>
                <SelectValue placeholder="Select Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="stage">Staging</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Search */}
      <SettingsSearch onSearch={setSearchQuery} />

      {/* Tabs */}
      {!searchQuery ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SettingCategory)}
        >
          <TabsList>
            <TabsTrigger value="runtime">Runtime</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="runtime" className="space-y-4 mt-6">
            <SettingsGrid
              category="runtime"
              env={env}
              onSave={handleSaveSetting}
            />
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-6">
            <SettingsGrid
              category="billing"
              env={env}
              onSave={handleSaveSetting}
            />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4 mt-6">
            <SettingsGrid
              category="auth"
              env={env}
              onSave={handleSaveSetting}
            />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4 mt-6">
            <SettingsGrid
              category="webhooks"
              env={env}
              onSave={handleSaveSetting}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4 mt-6">
          {displaySettings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No settings found matching {searchQuery}
            </div>
          ) : (
            displaySettings.map((config) => (
              <SettingItem
                key={`${config.namespace}.${config.key}`}
                config={config}
                env={env}
                onSave={handleSaveSetting}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Grid component for a category
function SettingsGrid({
  category,
  env,
  onSave,
}: {
  category: SettingCategory;
  env: string;
  onSave: (
    config: SettingConfig,
    value: unknown,
    version?: number
  ) => Promise<void>;
}) {
  const settings = getSettingsByCategory(category);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {settings.map((config) => (
        <SettingItem
          key={`${config.namespace}.${config.key}`}
          config={config}
          env={env}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

// Individual setting item with its own data fetching
function SettingItem({
  config,
  env,
  onSave,
}: {
  config: SettingConfig;
  env: string;
  onSave: (
    config: SettingConfig,
    value: unknown,
    version?: number
  ) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState<unknown>(config.defaultValue);
  const [saving, setSaving] = useState(false);

  // The hook already unwraps the response and returns the data directly
  const {
    data: settingData,
    isLoading,
    error,
  } = hooks.settings.admin.get({ env, ns: config.namespace, key: config.key });

  useEffect(() => {
    console.log(`[SettingItem:${config.key}] Hook State:`, {
      isLoading,
      hasData: !!settingData,
      settingData,
      error,
      env,
      namespace: config.namespace,
      localValue,
      defaultValue: config.defaultValue,
    });
  }, [
    isLoading,
    settingData,
    error,
    env,
    config.key,
    config.namespace,
    localValue,
    config.defaultValue,
  ]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config, localValue, settingData?.version);
    } finally {
      setSaving(false);
    }
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
        onChange={setLocalValue}
        onSave={handleSave}
        loading={showLoading}
        saving={saving}
      />
    );
  }

  return (
    <SettingCard
      config={config}
      value={localValue}
      onChange={setLocalValue}
      onSave={handleSave}
      loading={showLoading}
      saving={saving}
    />
  );
}
