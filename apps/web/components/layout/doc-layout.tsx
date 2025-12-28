"use client";

import React from "react";
import { Typography, Surface } from "@unisane/ui";
import { TableOfContents } from "./table-of-contents";

export interface TocItem {
  id: string;
  label: string;
}

interface DocLayoutProps {
  title: string;
  description: string;
  heroContent?: React.ReactNode;
  toc?: TocItem[];
  children: React.ReactNode;
}

export function DocLayout({
  title,
  description,
  heroContent,
  toc,
  children,
}: DocLayoutProps) {
  return (
    <div className="animate-slide-up w-full pb-16 @3xl:pb-32 overflow-x-clip">
      {/* Header Section - Stacked on mobile, side-by-side on tablet+ */}
      <header className="mb-12 @3xl:mb-20 flex flex-col @3xl:flex-row gap-6 @3xl:gap-8 items-stretch @3xl:min-h-80 @5xl:min-h-[480px]">
        {/* Text Content - 50% on tablet, 40% on desktop */}
        <div className="@3xl:w-[50%] @5xl:w-[40%] shrink-0 flex flex-col justify-center order-2 @3xl:order-1">
          <h1 className="text-[2.5rem] @2xl:text-[3.5rem] @4xl:text-[5.5rem] leading-none font-semibold @3xl:font-medium mb-4 @3xl:mb-6 tracking-tight wrap-break-word text-on-surface">
            {title}
          </h1>
          <Typography variant="titleMedium" className="text-on-surface-variant leading-relaxed @3xl:text-title-large">
            {description}
          </Typography>
        </div>

        {/* Hero Visual - 50% on tablet, 60% on desktop, full width on mobile */}
        {heroContent && (
          <Surface elevation={0} className="w-full @3xl:w-[50%] @5xl:w-[60%] h-60 @2xl:h-72 @3xl:h-auto @3xl:min-h-full rounded-xl overflow-hidden bg-surface-container order-1 @3xl:order-2">
            {heroContent}
          </Surface>
        )}
      </header>

      {/* Content Area with TOC - TOC aligns with content sections only */}
      <div className="flex flex-col @5xl:flex-row gap-12 @3xl:gap-16 w-full max-w-7xl mx-auto">
        {/* Main Content Column */}
        <div className="flex-1 min-w-0">
          {/* Page Content */}
          <div className="flex flex-col gap-16 @3xl:gap-24">{children}</div>
        </div>

        {/* Right Sidebar (Table of Contents) - Sticky, aligned with content sections */}
        {toc && toc.length > 0 && (
          <TableOfContents title={title} items={toc} />
        )}
      </div>
    </div>
  );
}

interface DocSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DocSection({ id, title, description, children }: DocSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <Typography variant="headlineLarge" component="h2" className="mb-6">
        {title}
      </Typography>
      {description && (
        <Typography variant="bodyLarge" component="p" className="text-on-surface-variant mb-8 max-w-4xl leading-relaxed">
          {description}
        </Typography>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}
