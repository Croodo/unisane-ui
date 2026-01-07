"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "@/src/hooks/useSession";
import { PageHeader } from "@/src/context/usePageHeader";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { KeyRound, Webhook, FileText, Settings2 } from "lucide-react";
import {
  BannerSettingsCard,
  WorkspaceProfileCard,
  DeveloperLinkCard,
} from "./components";

/**
 * SettingsClient — Workspace settings with tabs
 *
 * Structure:
 * - General tab: Workspace banner, advanced settings
 * - Developer tab: Links to API keys, webhooks, audit
 */
export function SettingsClient() {
  const { me } = useSession();
  const tenantId = me?.tenantId ?? undefined;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab = searchParams.get("tab") ?? "general";
  const slug = pathname.split("/")[2] ?? "";
  const base = `/w/${slug}`;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "general") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Workspace configuration and developer tools."
      />
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="developer" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Developer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <WorkspaceProfileCard tenantId={tenantId} />
          <BannerSettingsCard tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="developer" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DeveloperLinkCard
              href={`${base}/apikeys`}
              icon={KeyRound}
              title="API Keys"
              description="Manage API keys for programmatic access"
            />
            <DeveloperLinkCard
              href={`${base}/webhooks`}
              icon={Webhook}
              title="Webhooks"
              description="View inbound and outbound webhook events"
            />
            <DeveloperLinkCard
              href={`${base}/audit`}
              icon={FileText}
              title="Audit Log"
              description="Review activity and changes in your workspace"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Access developer tools and integrations for your workspace.
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default SettingsClient;
