"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  AppLayout,
  Icon,
  IconButton,
  Pane,
  PaneLayout,
  SearchBar,
  Typography,
  cn,
  NavigationRail,
  type RailItem,
} from "@unisane/ui";
import { DocsSidebar } from "./DocsSidebar";
import { docsNav, componentsNav, type NavGroup } from "./nav";

// Mobile Drawer Component
const MobileDrawer = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const [rendered, setRendered] = useState(open);

  useEffect(() => {
    if (open) setRendered(true);
    else {
      const timer = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!rendered && !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className={cn(
          "absolute inset-0 bg-scrim/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative h-full bg-surface shadow-5 transition-transform duration-300 ease-emphasized",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface DocsShellProps {
  children: React.ReactNode;
}

export const DocsShell: React.FC<DocsShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previewValue, setPreviewValue] = useState<string | null>(null);

  // Close drawer on path change
  useEffect(() => {
    setMobileOpen(false);
    setPreviewValue(null);
  }, [pathname]);

  const railItemsData: RailItem[] = [
    { value: "/docs", label: "Docs", icon: <Icon symbol="description" /> },
    {
      value: "/components",
      label: "Components",
      icon: <Icon symbol="widgets" />,
    },
    {
      value: "/docs/theming",
      label: "Theming",
      icon: <Icon symbol="palette" />,
    },
  ];

  const isRailActive = (href: string) => {
    if (href === "/docs/theming") return pathname.startsWith("/docs/theming");
    if (href === "/docs")
      return (
        pathname === "/docs" ||
        (pathname.startsWith("/docs/") && !pathname.startsWith("/docs/theming"))
      );
    if (href === "/components")
      return pathname === "/components" || pathname.startsWith("/components/");
    return pathname.startsWith(href);
  };

  const activeValue =
    railItemsData.find((item) => isRailActive(item.value))?.value || "";

  const navMap: Record<string, NavGroup[]> = {
    "/docs": [docsNav],
    "/components": [componentsNav],
    "/docs/theming": [],
  };

  // Determine what to show: Preview value (if valid) or Active value
  const displayValue = previewValue || activeValue;
  const currentNavGroups = navMap[displayValue] || [];

  // Logic: Show pane if displayValue has items.
  // Exception: If we are previewing (hovering), and the preview has NO items,
  // we fallback to the active state's visibility to prevent collapse.
  // BUT: "make sure it doesnt collapse when has no content on hover"
  // So if I hover "Theming" (no content), previewValue becomes "Theming".
  // currentNavGroups is empty. Pane would hide.
  // We need to NOT set previewValue if the target has no content.

  const handleItemHover = (value: string) => {
    const groups = navMap[value] || [];
    if (groups.length > 0) {
      setPreviewValue(value);
    }
  };

  const handleRailLeave = () => {
    setPreviewValue(null);
  };

  const showPane = currentNavGroups.length > 0;

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const handleRailChange = (value: string) => {
    handleNavClick();
    router.push(value);
  };

  const RailHeader = (
    <Link
      href="/docs"
      className="w-10u h-10u rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm"
      onClick={handleNavClick}
      aria-label="Unisane UI Docs"
    >
      UN
    </Link>
  );

  const RailFooter = (
    <Link
      href="/docs"
      aria-label="Settings"
      className="w-10u h-10u rounded-full flex items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-variant/60 hover:text-on-surface"
      onClick={handleNavClick}
    >
      <Icon symbol="settings" />
    </Link>
  );

  const NavigationRailContent = (
    <NavigationRail
      items={railItemsData}
      value={activeValue}
      onChange={handleRailChange}
      onItemHover={handleItemHover}
      onMouseLeave={handleRailLeave}
      header={RailHeader}
      footer={RailFooter}
      className="bg-surface-container-low border-r border-outline-variant/20 h-full w-[120px]"
    />
  );

  const ListContent = (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6u py-5u border-b border-outline-variant/30 shrink-0 h-[72px]">
        <div className="flex flex-col">
          <Typography variant="titleMedium" className="font-black">
            Unisane UI
          </Typography>
          <Typography variant="labelSmall" className="text-on-surface-variant">
            Documentation
          </Typography>
        </div>
      </div>
      <div className="px-4u flex-1 overflow-y-auto pt-4u">
        <DocsSidebar onSelect={handleNavClick} groups={currentNavGroups} />
      </div>
    </div>
  );

  // Combined Sidebar for Mobile
  const MobileSidebar = (
    <div
      className={cn(
        "h-full bg-surface-container-low flex transition-[width] duration-500 ease-emphasized overflow-hidden",
        showPane ? "w-[calc(120px+var(--width-pane-list))]" : "w-[120px]"
      )}
    >
      {NavigationRailContent}
      <div
        className={cn(
          "flex-1 overflow-hidden bg-surface-container-low transition-opacity duration-300",
          showPane ? "opacity-100 delay-200" : "opacity-0"
        )}
      >
        <div className="w-[var(--width-pane-list)] h-full">{ListContent}</div>
      </div>
    </div>
  );

  return (
    <AppLayout
      className="[--width-pane-list:280px]"
      topBar={
        <header className="h-16u px-4u flex items-center gap-4u border-b border-outline-variant/20 bg-surface medium:hidden sticky top-0 z-20">
          <IconButton
            icon={<Icon symbol="menu" />}
            ariaLabel="Open navigation"
            onClick={() => setMobileOpen(true)}
          />
          <Typography variant="titleMedium" className="font-black">
            Unisane UI
          </Typography>
        </header>
      }
      navigation={NavigationRailContent}
      mobileNavigation={
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {MobileSidebar}
        </MobileDrawer>
      }
      disableScroll={true} // Enable pane scrolling
    >
      <PaneLayout orientation="horizontal">
        <Pane
          role="list"
          width={showPane ? "var(--width-pane-list)" : 0}
          className={cn(
            "bg-surface-container-low transition-[width,opacity] duration-500 ease-emphasized shrink-0",
            showPane
              ? "opacity-100 border-r border-outline-variant/30"
              : "opacity-0 border-none"
          )}
        >
          <div className="w-[var(--width-pane-list)] h-full">{ListContent}</div>
        </Pane>
        <Pane role="main" className="bg-surface relative flex flex-col">
          {/* Main Inset Header */}
          <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-outline-variant/10 px-6u py-3u flex items-center gap-4u shrink-0">
            <div className="flex-1 max-w-[640px]">
              <SearchBar
                placeholder="Search docs, components, tokens..."
                className="w-full bg-surface-container-low border-transparent hover:bg-surface-container hover:shadow-1 focus-within:bg-surface-container focus-within:shadow-2 focus-within:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="max-w-[840px] mx-auto min-h-full w-full p-6u">
            {children}
          </div>
        </Pane>
      </PaneLayout>
    </AppLayout>
  );
};
