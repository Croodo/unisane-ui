"use client";

import React from "react";
import Link from "next/link";
import { Typography, SearchBar, IconButton } from "@unisane/ui";
import { UnisaneLogo } from "@/components/ui/unisane-logo";

export function AppHeader() {
  return (
    // Show only on expanded screens (840px+) where rail is visible
    <header className="hidden expanded:block w-full">
      {/* Inner Container: h-[80px], responsive padding */}
      <div className="h-20 flex items-center justify-between gap-6 px-6 expanded:px-12 container mx-auto max-w-[1600px]">
        {/* Leading Section: Logo & Title */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 select-none cursor-pointer group"
        >
          {/* Logo Mark */}
          <UnisaneLogo
            size={32}
            className="transition-transform duration-300 group-hover:scale-110"
          />

          {/* App Bar Title */}
          <Typography variant="titleLarge" component="span">
            <span className="font-bold">Unisane</span>
            <span className="font-normal text-on-surface-variant ml-1">UI</span>
          </Typography>
        </Link>

        {/* Center Section: Search Bar (fills remaining width) */}
        <div className="flex-1 min-w-0 px-4">
          <SearchBar
            placeholder="Search components"
            className="w-full rounded-full"
          />
        </div>

        {/* Trailing Section: GitHub Icon */}
        <div className="flex items-center gap-1 shrink-0">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <IconButton
              variant="standard"
              size="lg"
              ariaLabel="View on GitHub"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </IconButton>
          </a>
        </div>
      </div>
    </header>
  );
}
