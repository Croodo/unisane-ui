"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  useSidebar,
  SidebarRail,
  SidebarRailItem,
  SidebarDrawer,
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarBackdrop,
  SidebarInset,
  TopAppBar,
  IconButton,
} from "@unisane/ui";
import { NAV_DATA, getActiveCategoryId } from "@/lib/docs/navigation";
import { AppHeader } from "./app-header";

interface DocsShellProps {
  children: React.ReactNode;
}

// Inner component that uses the sidebar context
function DocsShellContent({ children }: DocsShellProps) {
  const {
    activeId,
    effectiveItem,
    mobileOpen,
    toggleMobile,
    isMobile,
  } = useSidebar();

  // Get title for mobile top bar
  const title =
    activeId === "home"
      ? "Unisane UI"
      : NAV_DATA.find((c) => c.id === activeId)?.label || "Unisane UI";

  return (
    <div className="flex w-full min-h-screen bg-surface-container isolate">
      {/* Mobile Top Bar */}
      {isMobile && (
        <TopAppBar
          className="fixed top-0 left-0 right-0 z-50"
          title={title}
          variant="small"
          navigationIcon={
            <IconButton variant="standard" ariaLabel="Open menu" onClick={toggleMobile}>
              <span className="material-symbols-outlined">menu</span>
            </IconButton>
          }
          actions={
            <>
              <IconButton variant="standard" ariaLabel="Search">
                <span className="material-symbols-outlined">search</span>
              </IconButton>
              <a
                href="https://github.com/anthropics/unisane-ui"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
              >
                <IconButton variant="standard" ariaLabel="GitHub">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </IconButton>
              </a>
            </>
          }
        />
      )}

      {/* Navigation Rail (Desktop only) */}
      <SidebarRail>
        <div className="flex flex-col items-center gap-3u w-full flex-1 pt-2u">
          {NAV_DATA.map((item) => (
            <SidebarRailItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon || "circle"}
              href={item.href}
            />
          ))}
        </div>
      </SidebarRail>

      {/* Navigation Drawer */}
      <SidebarDrawer>
        {mobileOpen ? (
          // Mobile: Show all categories as accordion
          <SidebarContent className="pt-4u pb-20u">
            <SidebarGroupLabel>Unisane UI</SidebarGroupLabel>
            <SidebarMenu>
              {NAV_DATA.map((category) => (
                <React.Fragment key={category.id}>
                  <SidebarMenuItem
                    id={category.id}
                    icon={category.icon}
                    label={category.label}
                    href={category.href}
                  />
                  {category.items && category.items.length > 0 && (
                    <div className="pl-6u">
                      {category.items.map((item) => (
                        <SidebarMenuItem
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          href={item.href}
                        />
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarContent>
        ) : effectiveItem && effectiveItem.items && effectiveItem.items.length > 0 ? (
          // Desktop: Show active category's sub-items
          <SidebarContent className="pt-4u pb-20u animate-content-enter" key={effectiveItem.id}>
            <SidebarGroupLabel>{effectiveItem.label}</SidebarGroupLabel>
            <SidebarMenu>
              {effectiveItem.items.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                />
              ))}
            </SidebarMenu>
          </SidebarContent>
        ) : (
          <SidebarContent className="pt-4u animate-content-enter">
            <p className="text-body-medium text-on-surface-variant px-4u">
              Select a category to view items.
            </p>
          </SidebarContent>
        )}
      </SidebarDrawer>

      {/* Main Content */}
      <SidebarInset>
        {/* Desktop Header */}
        <AppHeader />

        {/* Content Container */}
        <div className="px-6u py-4u md:px-12u md:py-6u container mx-auto max-w-[1600px] @container flex-1">
          {children}
        </div>
      </SidebarInset>

      {/* Backdrop */}
      <SidebarBackdrop />
    </div>
  );
}

// Main export with provider wrapper
export function DocsShell({ children }: DocsShellProps) {
  const pathname = usePathname();
  const defaultActiveId = getActiveCategoryId(pathname);

  return (
    <SidebarProvider
      items={NAV_DATA}
      defaultActiveId={defaultActiveId}
      persist={true}
      storageKey="unisane-docs-sidebar"
      railWidth={96}
      drawerWidth={220}
    >
      <DocsShellContent>{children}</DocsShellContent>
    </SidebarProvider>
  );
}
