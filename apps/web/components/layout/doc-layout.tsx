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
    <div className="animate-slide-up flex flex-col @4xl:flex-row gap-16u w-full pb-32u">
      {/* Main Content Column */}
      <div className="flex-1 min-w-0">
        {/* Header Section */}
        <header className="mb-20u flex flex-col @5xl:flex-row gap-12u items-start">
          {/* Text Content */}
          <div className="flex-1 pt-4u">
            <Typography variant="displayLarge" component="h1" className="mb-8u tracking-tight wrap-break-word">
              {title}
            </Typography>
            <Typography variant="titleLarge" component="p" className="text-on-surface-variant leading-relaxed max-w-2xl">
              {description}
            </Typography>
          </div>

          {/* Hero Visual */}
          {heroContent && (
            <Surface elevation={0} className="w-full @5xl:w-[600px] @5xl:h-[400px] h-[300px] rounded-lg overflow-hidden shrink-0 bg-surface-container border border-outline-variant/30">
              {heroContent}
            </Surface>
          )}
        </header>

        {/* Page Content */}
        <div className="flex flex-col gap-24u">{children}</div>
      </div>

      {/* Right Sidebar (Table of Contents) - Sticky */}
      {toc && toc.length > 0 && (
        <TableOfContents title={title} items={toc} />
      )}
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
    <section id={id} className="scroll-mt-24u">
      <Typography variant="headlineLarge" component="h2" className="mb-6u">
        {title}
      </Typography>
      {description && (
        <Typography variant="bodyLarge" component="p" className="text-on-surface-variant mb-8u max-w-4xl leading-relaxed">
          {description}
        </Typography>
      )}
      <div className="mt-8u">{children}</div>
    </section>
  );
}
