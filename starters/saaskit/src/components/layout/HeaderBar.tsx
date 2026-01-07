"use client";

import React from "react";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Separator } from "@/src/components/ui/separator";
import { usePageHeader } from "@/src/context/usePageHeader";
import { useSession } from "@/src/hooks/useSession";
import { NotificationBell } from "@/src/components/notifications/NotificationBell";

function NotificationBellWrapper() {
  const { me } = useSession();
  return <NotificationBell tenantId={me?.tenantId ?? undefined} />;
}

export function HeaderBar({ defaultTitle }: { defaultTitle: React.ReactNode }) {
  const title = usePageHeader((s) => s.title);
  const subtitle = usePageHeader((s) => s.subtitle);
  const actions = usePageHeader((s) => s.actions);

  return (
    <header className="sticky top-0 z-20 flex h-12 md:h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 md:px-6 min-w-0">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="min-w-0">
        <h1 className="truncate text-sm font-medium sm:text-base">
          {title ?? defaultTitle}
        </h1>
        {subtitle ? (
          <div className="text-xs text-muted-foreground truncate">
            {subtitle}
          </div>
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
