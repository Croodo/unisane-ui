"use client";

import React from "react";
import { SidebarTrigger } from "@unisane/ui/components/sidebar";
import { Divider } from "@unisane/ui/components/divider";
import { Text } from "@unisane/ui/primitives/text";
import { usePageHeader } from "@/src/context/usePageHeader";
import { useSession } from "@/src/hooks/use-session";
import { NotificationBell } from "@/src/components/notifications/NotificationBell";

function NotificationBellWrapper() {
  const { me } = useSession();
  return <NotificationBell tenantId={me?.scopeId ?? undefined} />;
}

export function HeaderBar({ defaultTitle }: { defaultTitle: React.ReactNode }) {
  const title = usePageHeader((s) => s.title);
  const subtitle = usePageHeader((s) => s.subtitle);
  const actions = usePageHeader((s) => s.actions);

  return (
    <header className="sticky top-0 z-20 flex h-12 md:h-14 shrink-0 items-center gap-2 border-b border-outline-variant bg-surface/80 backdrop-blur-md px-4 md:px-6 min-w-0">
      <SidebarTrigger />
      <Divider orientation="vertical" className="mr-2 h-4" />
      <div className="min-w-0">
        <Text as="h1" variant="titleSmall" className="truncate sm:text-base">
          {title ?? defaultTitle}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" color="onSurfaceVariant" className="truncate">
            {subtitle}
          </Text>
        ) : null}
      </div>
      <div className="ml-auto" />
      <NotificationBellWrapper />
      {actions ? (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export default HeaderBar;
