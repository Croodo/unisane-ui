"use client";

import { useState } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { IconButton } from "@unisane/ui";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

interface CliCommandProps {
  /** The package/command to run (e.g., "@unisane/cli add button") */
  command: string;
  className?: string;
}

const PACKAGE_MANAGERS: { id: PackageManager; label: string; runner: string }[] = [
  { id: "pnpm", label: "pnpm", runner: "pnpm dlx" },
  { id: "npm", label: "npm", runner: "npx" },
  { id: "yarn", label: "yarn", runner: "yarn dlx" },
  { id: "bun", label: "bun", runner: "bunx" },
];

export function CliCommand({ command, className }: CliCommandProps) {
  const [activeManager, setActiveManager] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);

  const getFullCommand = (manager: PackageManager) => {
    const pm = PACKAGE_MANAGERS.find((p) => p.id === manager);
    return `${pm?.runner} ${command}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFullCommand(activeManager));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg overflow-hidden border border-outline-variant/15", className)}>
      {/* Package Manager Tabs */}
      <div className="flex bg-surface-container-low border-b border-outline-variant/15">
        {PACKAGE_MANAGERS.map((pm) => (
          <button
            key={pm.id}
            onClick={() => setActiveManager(pm.id)}
            className={cn(
              "px-4u py-2.5u text-label-medium font-medium transition-colors relative",
              activeManager === pm.id
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {pm.label}
            {activeManager === pm.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5u bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Command Display */}
      <div className="flex items-center justify-between gap-4u p-4u bg-surface-container-low font-mono">
        <code className="text-body-medium text-on-surface overflow-x-auto">
          {getFullCommand(activeManager)}
        </code>
        <IconButton
          variant="standard"
          size="sm"
          ariaLabel={copied ? "Copied!" : "Copy command"}
          onClick={handleCopy}
          className="shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            {copied ? "check" : "content_copy"}
          </span>
        </IconButton>
      </div>
    </div>
  );
}
